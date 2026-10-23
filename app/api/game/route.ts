import { env } from 'cloudflare:workers';
import { initial,publicState,reduce,rid } from '../../../lib/game';
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
async function secret(password:string,salt=rid()){const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const bytes=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},material,256);return salt+':'+Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');}
const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(obj:any,status=200)=>new Response(JSON.stringify(obj),{status,headers});
const db=()=>{if(!env.DB)throw new Error('서버 저장소 연결을 확인하고 있습니다. 잠시 후 다시 접속하세요.');return env.DB;};
async function session(req:Request){const token=req.headers.get('authorization')?.replace(/^Bearer /,'');if(!token)return null;return await db().prepare('SELECT * FROM sessions WHERE token=? AND expires>?').bind(await hash(token),Date.now()).first();}
async function token(room:string,role:string,studentId:string|null){const raw=rid()+rid();await db().prepare('INSERT INTO sessions(token,room,role,student_id,expires) VALUES(?,?,?,?,?)').bind(await hash(raw),room,role,studentId,Date.now()+86400000*30).run();return raw;}
async function mutate(code:string,fn:(s:any)=>any){for(let i=0;i<40;i++){const row:any=await db().prepare('SELECT * FROM rooms WHERE code=?').bind(code).first();if(!row)throw new Error('방 코드를 확인하세요.');const s=fn(JSON.parse(row.data));const result=await db().prepare('UPDATE rooms SET data=?,version=version+1 WHERE code=? AND version=?').bind(JSON.stringify(s),code,row.version).run();if(result.meta.changes)return s;await new Promise(r=>setTimeout(r,5+Math.random()*25));}throw new Error('동시에 많은 기록이 들어왔어요. 잠시 후 다시 눌러 주세요.');}
export async function GET(req:Request){try{const auth:any=await session(req);if(!auth)return reply({error:'다시 로그인하세요.'},401);const row:any=await db().prepare('SELECT data,version FROM rooms WHERE code=?').bind(auth.room).first();if(!row)return reply({error:'방을 찾을 수 없습니다.'},404);const s=publicState(JSON.parse(row.data));return reply({state:s,version:row.version,role:auth.role,studentId:auth.student_id,room:auth.room});}catch(e:any){return reply({error:e.message},400);}}
export async function POST(req:Request){try{const body=await req.json() as any;
 if(body.type==='create'){
  if(typeof body.password!=='string'||body.password.length<8||body.password.length>100)throw new Error('교사 비밀번호는 8~100자로 입력하세요.');if(typeof body.title!=='string'||!body.title.trim()||body.title.length>40)throw new Error('학급 이름을 1~40자로 입력하세요.');
  const code=Array.from(crypto.getRandomValues(new Uint8Array(8))).map(x=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x%32]).join('');const s=initial(body.title.trim());await db().prepare('INSERT INTO rooms(code,secret,data,version) VALUES(?,?,?,0)').bind(code,await secret(body.password),JSON.stringify(s)).run();return reply({token:await token(code,'teacher',null),room:code});
 }
 if(['join','login'].includes(body.type)){
  const code=String(body.room||'').trim().toUpperCase();const row:any=await db().prepare('SELECT * FROM rooms WHERE code=?').bind(code).first();if(!row)throw new Error('방 코드나 로그인 정보를 확인하세요.');
  const s=JSON.parse(row.data);if(body.role==='teacher'){if(await secret(String(body.password),row.secret.split(':')[0])!==row.secret)throw new Error('방 코드나 로그인 정보를 확인하세요.');return reply({token:await token(code,'teacher',null),room:code});}
  const name=String(body.name||'').trim();const password=String(body.password||'');if(password.length<6||password.length>100)throw new Error('개인 비밀번호는 6~100자로 입력하세요.');let p=s.students.find((p:any)=>p.name===name);
  if(body.type==='join'){if(p)throw new Error('이미 등록한 별명입니다. 학생 로그인으로 들어오세요.');const studentId=rid(),sec=await secret(password);await mutate(code,x=>reduce(x,{type:'register',name,secret:sec,nationId:body.nationId,job:body.job,studentId},{}));p={id:studentId};}
  else if(!p||await secret(password,p.secret.split(':')[0])!==p.secret)throw new Error('별명이나 개인 비밀번호를 확인하세요.');return reply({token:await token(code,'student',p.id),room:code});
 }
 if(body.type==='info'){const code=String(body.room||'').trim().toUpperCase();const row:any=await db().prepare('SELECT data FROM rooms WHERE code=?').bind(code).first();if(!row)throw new Error('방 코드를 확인하세요.');const s=JSON.parse(row.data);return reply({title:s.title,era:s.era,nations:s.nations});}
 const auth:any=await session(req);if(!auth)return reply({error:'다시 로그인하세요.'},401);
 if(body.type==='register')throw new Error('등록은 처음 참여 메뉴를 이용하세요.');const actor={role:auth.role,studentId:auth.student_id};const s=await mutate(auth.room,x=>reduce(x,body,actor));return reply({state:publicState(s)});
 }catch(e:any){return reply({error:e.message||'기록에 실패했습니다. 다시 확인하세요.'},400);}}
