import assert from 'node:assert/strict';
const base='http://terminal.local:4173/api/game';
async function call(body,token){const r=await fetch(base,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const j=await r.json();if(!r.ok)throw new Error(j.error);return j;}
const teacher=await call({type:'create',title:'25명 동시 입력 점검',password:'test-only-4821'});
const students=await Promise.all(Array.from({length:25},(_,i)=>call({type:'join',room:teacher.room,name:'점검'+i,password:'student4821',nationId:'n'+i%5,job:i%5})));
const before=await call(null,teacher.token);assert.equal(before.state.students.length,25);
await Promise.all(students.map((x,i)=>call({type:'request',source:'job',qty:2,note:'동시 입력 테스트'},x.token)));
let state=(await call(null,teacher.token)).state;assert.equal(state.pending.length,25);
await Promise.all(state.pending.map(p=>call({type:'review',id:p.id,approve:true},teacher.token)));
state=(await call(null,teacher.token)).state;assert.equal(state.students.length,25);assert.equal(state.students.reduce((a,p)=>a+p.cards.reduce((b,c)=>b+c.qty,0),0),50);
await assert.rejects(call({type:'review',id:state.pending[0].id,approve:true},teacher.token));
await assert.rejects(call({type:'era',era:'joseon'},students[0].token));
assert.equal(state.students.some(p=>'secret' in p),false);
const login=await call({type:'login',room:teacher.room,name:'점검0',password:'student4821',role:'student'});
assert.equal((await call(null,login.token)).state.students.length,25);
console.log('PASS: 25명 동시 서버 등록, 25건 동시 요청, 25건 동시 승인, 50장 보존, 중복 승인·권한 위반 차단, 재접속 보존. 점검 방: '+teacher.room);
await import('node:fs').then(fs=>fs.writeFileSync('.sites-runtime/qa-session.json',JSON.stringify(teacher)));
