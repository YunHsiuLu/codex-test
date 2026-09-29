import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { networkInterfaces } from 'node:os';
import { localRequest } from '../auth.js';
import { unreadMessages, notificationTitle } from '../public/notifications.js';
const root=dirname(dirname(fileURLToPath(import.meta.url)));

test('Together 工作區完整流程',async t=>{
 const dir=await mkdtemp(join(root,'data-test-'));
 let child;let base;
 async function start(){child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:'0',HOST:'0.0.0.0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});const output=await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Server exited');})]);base=String(output[0]).trim().split(' ').at(-1).replace('0.0.0.0','127.0.0.1');}
 async function stop(){if(!child||child.exitCode!==null)return;const closed=once(child,'exit');child.kill();await closed;}
 t.after(async()=>{await stop();await rm(dir,{recursive:true,force:true});});
 await start();
 const request=async(path,method='GET',data,cookie,extra={})=>{const res=await fetch(base+'/api'+path,{method,headers:{...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...extra},body:data?JSON.stringify(data):undefined});return {status:res.status,cookie:res.headers.get('set-cookie')?.split(';')[0],data:await res.json()};};
 let alice,bob,messageId,room;
 await t.test('未登入不可查看訊息、成員或發話',async()=>{assert.equal((await request('/state')).status,401);assert.equal((await request('/messages','POST',{roomId:'general',text:'x'})).status,401);});
 await t.test('建立兩個獨立身分，Cookie 可恢復身分',async()=>{alice=await request('/register','POST',{username:'alice',password:'alice-test-password',name:'Alice'});const pending=await request('/register','POST',{username:'bob',password:'bob-test-password',name:'Bob'});assert.equal(pending.status,202);assert.equal((await request('/login','POST',{username:'bob',password:'bob-test-password'})).status,403);const requests=await request('/registrations','GET',null,alice.cookie);await request('/registrations/'+requests.data.requests.find(u=>u.username==='bob').id,'POST',{action:'approve'},alice.cookie);bob=await request('/login','POST',{username:'bob',password:'bob-test-password'});assert.notEqual(alice.data.user.id,bob.data.user.id);assert.equal((await request('/state','GET',null,alice.cookie)).data.user.name,'Alice');});
 await t.test('密碼與帳號核准流程，後端與資料檔不洩漏秘密',async()=>{
   assert.equal((await request('/login','POST',{username:'alice',password:'incorrect-password'})).status,401);
   assert.equal((await request('/register','POST',{username:'ALICE',password:'duplicate-password',name:'Other'})).status,409);
   const state=(await request('/state','GET',null,alice.cookie)).data;
   assert.equal(state.user.password,undefined);assert.ok(state.users.every(u=>!u.password));
   const disk=await readFile(join(dir,'workspace.json'),'utf8');assert.ok(!disk.includes('alice-test-password'));assert.ok(!disk.includes(alice.cookie.split('=')[1]));
   for(const path of ['/server.js','/auth.js','/data/workspace.json','/start.sh','/../data/workspace.json'])assert.equal((await fetch(base+path)).status,404);
 });
 await t.test('遠端須待本機核准，偽造來源標頭不能審核帳號',async t=>{
   const address=Object.values(networkInterfaces()).flat().find(info=>info.family==='IPv4'&&!info.internal)?.address;
   if(!address){t.skip('沒有可測的區网介面');return;}
   const remoteBase=base.replace('127.0.0.1',address);
   const remote=async(path,method='GET',data,cookie)=>{const r=await fetch(remoteBase+'/api'+path,{method,headers:{'Content-Type':'application/json','X-Forwarded-For':'127.0.0.1',...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json()};};
   const pending=await remote('/register','POST',{username:'remote-member',password:'remote-test-password',name:'Remote'});assert.equal(pending.status,202);
   const requests=(await request('/registrations','GET',null,alice.cookie)).data.requests;
   const applicant=requests.find(u=>u.username==='remote-member');
   assert.equal((await remote('/registrations','GET',null,alice.cookie)).status,403);
   assert.equal((await remote('/registrations/'+applicant.id,'POST',{action:'approve'},alice.cookie)).status,403);
   await request('/registrations/'+applicant.id,'POST',{action:'reject'},alice.cookie);
   assert.equal((await remote('/login','POST',{username:'remote-member',password:'remote-test-password'})).status,403);
   await request('/registrations/'+applicant.id,'POST',{action:'approve'},alice.cookie);
   const login=await fetch(remoteBase+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'remote-member',password:'remote-test-password'})});
   assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
   assert.equal((await remote('/state','GET',null,cookie)).data.capabilities.canManageAccounts,false);
   const message=await remote('/messages','POST',{roomId:'general',text:'remote attachment',attachment:{name:'remote.txt',data:Buffer.from('remote file').toString('base64')}},cookie);assert.equal(message.status,201);
   const download=await fetch(remoteBase+'/api/messages/'+message.data.id+'/attachment',{headers:{Cookie:cookie}});assert.equal(await download.text(),'remote file');
 });
 await t.test('建立頻道與重複名稱檢查',async()=>{room=(await request('/rooms','POST',{name:'測試頻道',description:'驗收'},alice.cookie)).data;assert.equal((await request('/rooms','POST',{name:'測試頻道'},alice.cookie)).status,400);});
 await t.test('跨用戶 SSE 即時通知、發送訊息與附件下載',async()=>{const controller=new AbortController();const response=await fetch(base+'/api/events',{headers:{Cookie:bob.cookie},signal:controller.signal});const reader=response.body.getReader();try{await reader.read();const sent=await request('/messages','POST',{roomId:room.id,text:'Hello <script>alert(1)</script>',attachment:{name:'測試.txt',data:Buffer.from('Hello Together').toString('base64')}},alice.cookie);assert.equal(sent.status,201);messageId=sent.data.id;let received='';while(!received.includes('event: change')){const chunk=await Promise.race([reader.read(),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('SSE timed out')),3000);timer.unref();})]);received+=new TextDecoder().decode(chunk.value);}const state=(await request('/state','GET',null,bob.cookie)).data;assert.equal(state.messages.find(m=>m.id===messageId).text,'Hello <script>alert(1)</script>');assert.equal(state.messages.find(m=>m.id===messageId).attachment.data,undefined);const file=await fetch(base+`/api/messages/${messageId}/attachment`,{headers:{Cookie:bob.cookie}});assert.equal(await file.text(),'Hello Together');assert.match(file.headers.get('content-disposition'),/attachment/);}finally{controller.abort();await reader.cancel().catch(()=>{});}});
 await t.test('回覆與反應可以新增和取消',async()=>{assert.equal((await request('/messages','POST',{roomId:room.id,text:'收到',replyTo:messageId},bob.cookie)).status,201);await request(`/messages/${messageId}/reaction`,'POST',{emoji:'👍'},bob.cookie);let state=(await request('/state','GET',null,alice.cookie)).data;assert.deepEqual(state.messages.find(m=>m.id===messageId).reactions['👍'],[bob.data.user.id]);await request(`/messages/${messageId}/reaction`,'POST',{emoji:'👍'},bob.cookie);state=(await request('/state','GET',null,alice.cookie)).data;assert.deepEqual(state.messages.find(m=>m.id===messageId).reactions['👍'],[]);});
 await t.test('只能編輯與刪除自己的訊息',async()=>{assert.equal((await request(`/messages/${messageId}`,'PATCH',{text:'竄改'},bob.cookie)).status,403);assert.equal((await request(`/messages/${messageId}`,'DELETE',null,bob.cookie)).status,403);assert.equal((await request(`/messages/${messageId}`,'PATCH',{text:'已更新'},alice.cookie)).status,200);});
 await t.test('拒絕跨來源、空白、超長與不存在的回覆',async()=>{assert.equal((await request('/messages','POST',{roomId:room.id,text:'x'},alice.cookie,{Origin:'http://evil.example'})).status,403);assert.equal((await request('/messages','POST',{roomId:room.id,text:' '},alice.cookie)).status,400);assert.equal((await request('/messages','POST',{roomId:room.id,text:'a'.repeat(5001)},alice.cookie)).status,400);assert.equal((await request('/messages','POST',{roomId:room.id,text:'x',replyTo:'missing'},alice.cookie)).status,400);const oversized=Buffer.alloc(5*1024*1024+1).toString('base64');assert.equal((await request('/messages','POST',{roomId:room.id,attachment:{name:'big.bin',data:oversized}},alice.cookie)).status,413);});
 await t.test('伺服器重新啟動後訊息、附件與身分仍保留',async()=>{await stop();await start();const state=(await request('/state','GET',null,alice.cookie)).data;assert.equal(state.user.name,'Alice');assert.equal(state.messages.find(m=>m.id===messageId).text,'已更新');const file=await fetch(base+`/api/messages/${messageId}/attachment`,{headers:{Cookie:alice.cookie}});assert.equal(await file.text(),'Hello Together');});
 await t.test('刪除訊息也移除附件下載',async()=>{assert.equal((await request(`/messages/${messageId}`,'DELETE',null,alice.cookie)).status,200);assert.equal((await request(`/messages/${messageId}/attachment`,'GET',null,alice.cookie)).status,404);});
 await t.test('登出撤銷 Cookie，必須重新登入',async()=>{
   assert.equal((await request('/logout','POST',{},bob.cookie)).status,200);
   assert.equal((await request('/state','GET',null,bob.cookie)).status,401);
   assert.equal((await request('/login','POST',{username:'bob',password:'bob-test-password'})).status,200);
 });

});

test('本機判斷不信任可偽造標頭',()=>{
 assert.equal(localRequest({socket:{remoteAddress:'192.168.0.10'},headers:{host:'localhost','x-forwarded-for':'127.0.0.1'}}),false);
 assert.equal(localRequest({socket:{remoteAddress:'::ffff:127.0.0.1'}}),true);
});
test('分頁未讀計數排除自己、示範與已讀；同一毫秒的不同訊息仍可區分',()=>{
 const users=[{id:'demo',demo:true},{id:'alice'},{id:'bob'}];
 const messages=[{id:'1',roomId:'r',userId:'alice'},{id:'2',roomId:'r',userId:'bob'},{id:'3',roomId:'r',userId:'demo'},{id:'4',roomId:'else',userId:'bob'},{id:'5',roomId:'r',userId:'bob'}];
 assert.equal(unreadMessages(messages,users,'alice','r',['2']),1);
 assert.equal(unreadMessages(messages,users,'alice','r',['2','5']),0);
 assert.equal(notificationTitle(2),'（2）新訊息｜Together');
 assert.equal(notificationTitle(0),'Together｜讓合作更靠近');
});
