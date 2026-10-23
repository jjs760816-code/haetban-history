import assert from 'node:assert/strict';
import {initial,reduce,score,publicState} from '../lib/game.ts';
const s=initial('테스트'),teacher={role:'teacher'};
for(let i=0;i<25;i++)reduce(s,{type:'register',name:'학생'+i,studentNo:i+1,secret:'hidden',nationId:'n'+i%5,job:i%5,studentId:'p'+i},{});
const actor={role:'student',studentId:'p0'};
for(const a of [{source:'record',kind:'resource',resource:1,qty:4},{source:'history',name:'왕건',qty:2},{source:'coins',qty:10}]){reduce(s,{type:'request',note:'활동 확인',...a},actor);reduce(s,{type:'review',id:s.pending[0].id,approve:true},teacher);}
assert.equal(score(s.students[0],s),12);assert.equal(s.students[0].coins,10);
assert.throws(()=>reduce(s,{type:'review',id:s.pending[0].id,approve:true},teacher));
reduce(s,{type:'support',candidate:'p0'},actor);reduce(s,{type:'elect'},teacher);assert.equal(s.leaderId,'p0');assert.equal(s.students[0].cards.length,2);
reduce(s,{type:'transfer',to:'p1',cardId:s.students[0].cards[0].id,qty:1,price:0},actor);
const trade=s.pending[0].id;assert.throws(()=>reduce(s,{type:'review',id:trade,approve:true},teacher));
reduce(s,{type:'tradeAccept',id:trade,accept:true},{role:'student',studentId:'p1'});reduce(s,{type:'review',id:trade,approve:true},teacher);
assert.equal(s.students[0].cards[0].qty,3);assert.equal(s.students[1].cards[0].qty,1);assert.throws(()=>reduce(s,{type:'review',id:trade,approve:true},teacher));
assert.throws(()=>reduce(s,{type:'settings'},actor));
const before=score(s.students[0],s);reduce(s,{type:'era',era:'occupation'},teacher);assert.equal(s.leaderId,null);assert.equal(s.students[0].support,null);assert.equal(score(s.students[0],s),before);assert.equal(s.students[0].coins,10);assert.equal(s.snapshots.length,1);assert.equal(publicState(s).students[0].secret,undefined);
console.log('PASS: 25명 등록 · 카드 승인 · 중복 승인 차단 · 온 점수 제외 · 지지 소유권 보존 · 쌍방 확인 거래 · 권한 분리 · 시대 전환 보존');
