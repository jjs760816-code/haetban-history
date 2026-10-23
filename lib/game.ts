export const RES = ['토지','인구','군사력','기술력','식량'];
export const ICONS = ['🗺️','👥','🛡️','⚙️','🌾'];
export const COLORS=['#277c72','#d7a340','#8a75b2','#d27a58','#5e88b1'];
export const ERAS:any={
 founding:{name:'국가 건설',label:'국가',leader:'왕',regions:['새빛국','푸른국','해솔국','온누리국','다온국'],jobs:['개척자','마을지기','군인','장인','농민'],note:'여러 국가를 세우고 교역하는 수업용 단계입니다.'},
 goryeo:{name:'고려',label:'지역',leader:'왕',regions:['서해도','양광도','교주도','경상도','전라도'],jobs:['개척자','마을지기','군인','장인','농민'],note:'5도 중심의 수업용 배치입니다. 경기·양계는 지도에서 생략하며, 실제 경계·특산물과 다릅니다.'},
 joseon:{name:'조선',label:'지역',leader:'왕',regions:['황해·평안','경기·충청','강원·함경','경상','전라'],jobs:['토지 조사원','마을지기','군인','장인','농민'],note:'실제 조선의 8도를 다섯 모둠으로 묶었습니다. 자원 배정과 직업은 게임 규칙입니다.'},
 occupation:{name:'일제강점기',label:'공동체',leader:'독립운동 대표',regions:['황해·평안 공동체','경기·충청 공동체','강원·함경 공동체','경상 공동체','전라 공동체'],jobs:['생활 터전 지킴이','연대 활동가','독립군','기술·교육 활동가','농민'],note:'왕이 없는 시대입니다. 공동체가 협력하여 독립운동·교육·생활을 지킵니다. 군사력은 독립운동력으로 표시합니다.'}
};
export const rid=()=>crypto.randomUUID();
export function initial(title:string){return {schemaVersion:1,title,era:'goryeo',round:1,students:[],pending:[],logs:[],snapshots:[],leaderId:null,threshold:10,historyMin:1,populationMin:2,stampValue:1,eraValues:{paleolithic:1,neolithic:2,founding:3,goryeo:4,joseon:5,occupation:6},nations:ERAS.goryeo.regions.map((name:string,i:number)=>({id:'n'+i,name,resource:i,issued:0})),missions:[{id:rid(),title:'역사 카드 설명하기',desc:'카드 속 인물·유물·유적·사건을 친구에게 설명하세요.'},{id:rid(),title:'우리 지역 협력 미션',desc:'우리 지역에 부족한 자원과 교역 계획을 설명하세요.'}]};}
export function cardScore(c:any,s:any){return c.kind==='resource'?c.qty:c.qty*((s.eraValues[c.era]||1)+(c.stamps||0)*s.stampValue);}
export function score(p:any,s:any){return p.cards.reduce((a:number,c:any)=>a+cardScore(c,s),0);}
export function eligible(p:any,s:any){return p.cards.filter((c:any)=>c.kind==='resource'&&c.resource===1).reduce((a:number,c:any)=>a+c.qty,0)>=s.populationMin&&p.cards.filter((c:any)=>c.kind==='history').reduce((a:number,c:any)=>a+c.qty,0)>=s.historyMin&&score(p,s)>=s.threshold;}
export function publicState(s:any){return {...s,students:s.students.map(({secret,...p}:any)=>p)};}
const fail=(m:string):never=>{throw new Error(m);};
const num=(x:any,max=999)=>{if(!Number.isInteger(x)||x<0||x>max)fail('수량은 0~'+max+' 사이의 정수로 입력하세요.');return x;};
const str=(x:any,n=80)=>{if(typeof x!=='string'||!x.trim()||x.trim().length>n)fail('내용을 1~'+n+'자로 입력하세요.');return x.trim();};
export function reduce(s:any,a:any,actor:any){
 const teacher=actor.role==='teacher';const me=s.students.find((p:any)=>p.id===actor.studentId);const isTeacher=()=>{if(!teacher)fail('교사만 할 수 있습니다.');};
 const log=(text:string)=>{s.logs.unshift({id:rid(),text,at:new Date().toISOString()});s.logs=s.logs.slice(0,500);};
 const find=(id:string)=>s.students.find((p:any)=>p.id===id)||fail('학생을 찾을 수 없습니다.');
 if(a.type==='register'){if(s.students.length>=60)fail('한 방에 60명까지 참여할 수 있습니다.');if(s.students.some((p:any)=>p.name===a.name))fail('이미 사용 중인 별명입니다. 로그인해 주세요.');if(!s.nations.some((n:any)=>n.id===a.nationId))fail('지역을 선택하세요.');num(a.job,4);s.students.push({id:a.studentId,name:str(a.name,16),secret:a.secret,nationId:a.nationId,job:a.job,cards:[],coins:0,support:null});log(a.name+' 님이 참여했어요.');return s;}
 if(a.type==='request'){
  if(!me)fail('학생으로 접속하세요.');const source=a.source;if(!['record','job','region','history','stamp','coins'].includes(source))fail('기록 종류를 확인하세요.');
  let proposal:any={id:rid(),studentId:me.id,source,note:str(a.note,160),status:'pending',round:s.round,at:new Date().toISOString()};
  if(source==='stamp'){const c=me.cards.find((c:any)=>c.id===a.cardId);if(!c||c.kind==='resource')fail('도장을 추가할 카드를 선택하세요.');proposal.cardId=c.id;proposal.qty=num(a.qty,100);}
  else if(source==='coins'){proposal.qty=num(a.qty,9999);proposal.direction=a.direction===-1?-1:1;}
  else {const qty=num(a.qty,100);if(qty<1)fail('1장 이상 입력하세요.');const kind=source==='job'||source==='region'?'resource':source==='history'?'history':a.kind;if(!['resource','history','artifact'].includes(kind))fail('카드 종류를 확인하세요.');let resource=source==='job'?me.job:source==='region'?s.nations.find((n:any)=>n.id===me.nationId).resource:a.resource;if(kind==='resource')num(resource,4);if(!Object.keys(s.eraValues).includes(a.era||s.era))fail('시대를 선택하세요.');proposal.card={id:rid(),kind,name:kind==='resource'?RES[resource]:str(a.name,40),resource:kind==='resource'?resource:null,era:a.era||s.era,stamps:num(a.stamps||0,100),qty};}
  s.pending.unshift(proposal);log(me.name+' 님이 기록 확인을 요청했어요.');
 }
 else if(a.type==='transfer'){
  if(!me)fail('학생으로 접속하세요.');const recipient=find(a.to);if(recipient.id===me.id)fail('다른 학생을 선택하세요.');const c=me.cards.find((c:any)=>c.id===a.cardId);const qty=num(a.qty,100),price=num(a.price,9999);if(!c||qty<1||c.qty<qty)fail('보유한 카드 수량을 확인하세요.');s.pending.unshift({id:rid(),studentId:me.id,to:recipient.id,source:'trade',cardId:c.id,qty,price,note:str(a.note||'카드 거래',160),status:'waiting',round:s.round,at:new Date().toISOString()});log(me.name+' → '+recipient.name+' 거래 확인 요청');
 }
 else if(a.type==='tradeAccept'){const p=s.pending.find((p:any)=>p.id===a.id);if(!p||p.source!=='trade'||p.status!=='waiting'||p.to!==me?.id)fail('확인할 거래가 없습니다.');p.status=a.accept?'pending':'rejected';log(me.name+' 님이 거래를 '+(a.accept?'확인':'거절')+'했어요.');}
 else if(a.type==='review'){
  isTeacher();const p=s.pending.find((p:any)=>p.id===a.id);if(!p||p.status!=='pending')fail('이미 처리되었거나 상대방 확인이 필요한 기록입니다.');if(p.round!==s.round)fail('지난 시대의 요청입니다.');
  if(a.approve){const student=find(p.studentId);if(p.source==='trade'){const to=find(p.to),c=student.cards.find((c:any)=>c.id===p.cardId);if(!c||c.qty<p.qty||to.coins<p.price)fail('현재 카드 또는 온이 부족합니다. 거래를 다시 요청하세요.');c.qty-=p.qty;to.cards.push({...c,id:rid(),qty:p.qty});student.coins+=p.price;to.coins-=p.price;student.cards=student.cards.filter((c:any)=>c.qty>0);}
   else if(p.source==='stamp'){const c=student.cards.find((c:any)=>c.id===p.cardId);if(!c)fail('카드를 찾을 수 없습니다.');c.stamps+=p.qty;}
   else if(p.source==='coins'){if(student.coins+p.qty*p.direction<0)fail('온 잔액이 부족합니다.');student.coins+=p.qty*p.direction;}
   else {student.cards.push({...p.card});if(p.source==='region')s.nations.find((n:any)=>n.id===student.nationId).issued+=p.card.qty;}
  }p.status=a.approve?'approved':'rejected';p.reviewedAt=new Date().toISOString();log(find(p.studentId).name+' 기록 '+(a.approve?'승인':'반려'));
 }
 else if(a.type==='support'){if(!me)fail('학생으로 접속하세요.');if(a.candidate!==null){const c=find(a.candidate);if(!eligible(c,s))fail('아직 후보 자격을 채우지 못했습니다.');}me.support=a.candidate;log(me.name+' 님의 지지가 기록됐어요. 카드 소유권은 그대로입니다.');}
 else if(a.type==='elect'){
  isTeacher();const candidates=s.students.filter((p:any)=>eligible(p,s));if(!candidates.length)fail('자격을 갖춘 후보가 없습니다.');const tally=(p:any)=>s.students.filter((x:any)=>x.support===p.id).reduce((sum:number,x:any)=>sum+score(x,s),0);candidates.sort((a:any,b:any)=>tally(b)-tally(a));if(tally(candidates[0])===0)fail('지지 점수를 먼저 모아 주세요.');if(candidates[1]&&tally(candidates[0])===tally(candidates[1]))fail('지지 점수가 같습니다. 지지 변경이나 재투표 후 결정하세요.');s.leaderId=candidates[0].id;log(ERAS[s.era].leader+' 선출: '+candidates[0].name);
 }
 else if(a.type==='era'){
  isTeacher();if(!ERAS[a.era]||a.era===s.era)fail('다른 시대를 선택하세요.');s.snapshots=s.snapshots.slice(0,19);s.snapshots.unshift({id:rid(),era:s.era,round:s.round,at:new Date().toISOString(),students:s.students.map(({secret,...p}:any)=>p),nations:structuredClone(s.nations),leaderId:s.leaderId});s.era=a.era;s.round++;s.nations=s.nations.map((n:any,i:number)=>({...n,name:ERAS[a.era].regions[i],issued:0}));s.students.forEach((p:any)=>p.support=null);s.leaderId=null;s.pending.forEach((p:any)=>{if(['pending','waiting'].includes(p.status))p.status='expired';});log(ERAS[a.era].name+' 시대로 이동! 카드·직업·온은 보존됐어요.');
 }
 else if(a.type==='adjust'){isTeacher();const student=find(a.studentId);if(a.cardId){const c=student.cards.find((c:any)=>c.id===a.cardId);if(!c)fail('카드를 찾을 수 없습니다.');c.qty=num(a.qty,1000);student.cards=student.cards.filter((c:any)=>c.qty>0);}else student.coins=num(a.coins,99999);log(student.name+' 보유 기록을 교사가 정정했어요.');}
 else if(a.type==='assign'){isTeacher();const p=find(a.studentId);if(!s.nations.some((n:any)=>n.id===a.nationId))fail('지역을 선택하세요.');p.nationId=a.nationId;p.job=num(a.job,4);log(p.name+' 소속·직업을 교사가 변경했어요.');}
 else if(a.type==='settings'){isTeacher();s.title=str(a.title,40);s.threshold=num(a.threshold,9999);s.historyMin=num(a.historyMin,100);s.populationMin=num(a.populationMin,100);s.stampValue=num(a.stampValue,100);if(!Array.isArray(a.nations)||a.nations.length!==5)fail('다섯 지역을 입력하세요.');s.nations=s.nations.map((n:any,i:number)=>({...n,name:str(a.nations[i].name,24),resource:num(a.nations[i].resource,4)}));log('게임 규칙이 변경됐어요.');}
 else if(a.type==='profile'){if(!me)fail('학생으로 접속하세요.');if(!s.nations.some((n:any)=>n.id===a.nationId))fail('지역을 선택하세요.');if(me.cards.length&&!teacher)fail('카드가 있는 학생의 소속 변경은 교사에게 요청하세요.');me.nationId=a.nationId;me.job=num(a.job,4);}
 else fail('지원하지 않는 요청입니다.');
 return s;
}
