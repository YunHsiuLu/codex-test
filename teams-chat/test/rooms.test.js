import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { networkInterfaces } from 'node:os';
const root=dirname(dirname(fileURLToPath(import.meta.url)));

test('聊天室管理、成員存取及紀錄清除',async t=>{
 const dir=await mkdtemp(join(root,'data-test-rooms-'));
 const address=Object.values(networkInterfaces()).flat().find(i=>i.family==='IPv4'&&!i.internal)?.address;
 assert.ok(address,'此整合測試需要區網介面以驗證遠端權限');
 let child,base,remote;
 async function start(){
  child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:'0',HOST:'0.0.0.0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
  const [output]=await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Server exited');})]);
  base=String(output).trim().split(' ').at(-1).replace('0.0.0.0','127.0.0.1');remote=base.replace('127.0.0.1',address);
 }
 async function stop(){if(child?.exitCode===null){const ended=once(child,'exit');child.kill();await ended;}}
 t.after(async()=>{await stop();await rm(dir,{recursive:true,force:true});});await start();
 async function request(path,method='GET',data,cookie,local=false){
  const res=await fetch((local?base:remote)+'/api'+path,{method,headers:{'Content-Type':'application/json','X-Forwarded-For':'127.0.0.1',...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined});
  return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};
 }
 const admin=await request('/register','POST',{username:'room-admin',password:'admin-test-password',name:'Admin'},null,true);
 async function account(username){const created=await request('/accounts','POST',{username,name:username,password:'room-test-password'},admin.cookie,true);const session=await request('/login','POST',{username,password:'room-test-password'});return {id:created.data.user.id,cookie:session.cookie};}
 const creator=await account('creator'),member=await account('member');
 const room=(await request('/rooms','POST',{name:'Room controls'},creator.cookie)).data;
 const state=async(who,local=false)=>(await request('/state','GET',null,who.cookie,local)).data;
 const view=async(who,local=false)=>(await state(who,local)).rooms.find(r=>r.id===room.id);
 const send=async(who,roomId=room.id)=>request('/messages','POST',{roomId,text:'保留與隔離測試',attachment:{name:'test.txt',data:Buffer.from('file').toString('base64')}},who.cookie);
 const message=(await send(member)).data.id;
 const other=(await send(member,'general')).data.id;
 await t.test('遠端建立者有成員管理權，一般成員無權，舊頻道無虛構建立者',async()=>{
  assert.equal(room.creatorId,creator.id);assert.equal((await view(creator)).canManageMembers,true);
  assert.equal((await view(member)).canManageMembers,false);assert.equal((await view(creator)).canClearHistory,false);
  assert.equal((await view(admin,true)).canClearHistory,true);
  assert.equal((await state(creator)).rooms.find(r=>r.id==='general').creatorId,null);
  assert.equal((await request('/rooms/'+room.id+'/members/'+creator.id,'DELETE',{},member.cookie)).status,403);
  assert.equal((await request('/rooms/'+room.id+'/members/'+creator.id,'DELETE',{},creator.cookie)).status,409);
 });
 await t.test('移除透過 SSE 即時通知，訊息、附件、反應與編輯均拒絕',async()=>{
  const controller=new AbortController();const response=await fetch(remote+'/api/events',{headers:{Cookie:member.cookie},signal:controller.signal});const reader=response.body.getReader();
  try{
   await reader.read();assert.equal((await request('/rooms/'+room.id+'/members/'+member.id,'DELETE',{},creator.cookie)).status,200);
   let output='';while(!output.includes('event: change')){const chunk=await Promise.race([reader.read(),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('SSE timeout')),3000);timer.unref();})]);output+=new TextDecoder().decode(chunk.value);}
  }finally{controller.abort();await reader.cancel().catch(()=>{});}
  const next=await state(member);assert.ok(!next.messages.some(m=>m.id===message));assert.ok(next.messages.some(m=>m.id===other));
  assert.equal((await view(member)).isRemoved,true);assert.deepEqual((await view(member)).memberIds,[]);
  assert.equal((await send(member)).status,403);
  for(const [suffix,method,data] of [['/attachment','GET'],['/reaction','POST',{emoji:'👍'}],['','PATCH',{text:'change'}],['','DELETE']])assert.equal((await request('/messages/'+message+suffix,method,data,member.cookie)).status,403);
  assert.equal((await request('/rooms/'+room.id+'/join','POST',{},member.cookie)).status,403);
  await request('/rooms/'+room.id+'/leave','POST',{},member.cookie);
  assert.equal((await request('/rooms/'+room.id+'/join','POST',{},member.cookie)).status,403,'leave cannot bypass removal');
 });
 await t.test('解除限制後自行加入，自行離開後可再加入，離開全部頻道不會洩漏訊息',async()=>{
  assert.equal((await request('/rooms/'+room.id+'/members/'+member.id,'POST',{},member.cookie)).status,403);
  assert.equal((await request('/rooms/'+room.id+'/members/'+member.id,'POST',{},creator.cookie)).status,200);
  assert.equal((await view(member)).isMember,false);assert.equal((await view(member)).canJoin,true);
  assert.equal((await request('/rooms/'+room.id+'/join','POST',{},member.cookie)).status,200);
  assert.equal((await request('/rooms/'+room.id+'/members/'+member.id,'POST',{},creator.cookie)).status,409);
  assert.ok((await state(member)).messages.some(m=>m.id===message));
  for(const r of (await state(member)).rooms)await request('/rooms/'+r.id+'/leave','POST',{},member.cookie);
  assert.equal((await state(member)).messages.length,0);assert.ok((await state(member)).rooms.every(r=>!r.isMember));
  await request('/rooms/'+room.id+'/join','POST',{},member.cookie);assert.equal((await send(member)).status,201);
 });
 await t.test('建立者離開後喪失管理權，本機可移除建立者，遠端無法繞過',async()=>{
  await request('/rooms/'+room.id+'/leave','POST',{},creator.cookie);
  assert.equal((await request('/rooms/'+room.id+'/members/'+member.id,'DELETE',{},creator.cookie)).status,403);
  await request('/rooms/'+room.id+'/join','POST',{},creator.cookie);
  assert.equal((await request('/rooms/'+room.id+'/members/'+creator.id,'DELETE',{},admin.cookie,true)).status,200);
  assert.equal((await view(creator)).canManageMembers,false);
  assert.equal((await request('/rooms/'+room.id+'/join','POST',{},creator.cookie)).status,403);
  assert.equal((await request('/rooms/'+room.id+'/members/'+member.id,'POST',{},creator.cookie)).status,403);
 });
 await t.test('管理狀態與歷史在重啟後保留，本機可解除限制',async()=>{
  await stop();await start();assert.equal((await view(creator)).isRemoved,true);assert.equal((await view(member)).isMember,true);
  assert.equal((await view(admin,true)).canManageMembers,true);
  await request('/rooms/'+room.id+'/members/'+creator.id,'POST',{},admin.cookie,true);
  await request('/rooms/'+room.id+'/join','POST',{},creator.cookie);assert.equal((await view(creator)).canManageMembers,true);
 });
 await t.test('只有本機可清除，名稱確認必填；只刪目標聊天室全部紀錄與附件',async()=>{
  assert.equal((await request('/rooms/'+room.id+'/history','DELETE',{confirmName:room.name},creator.cookie)).status,403);
  assert.equal((await request('/rooms/'+room.id+'/history','DELETE',{confirmName:room.name},admin.cookie)).status,403);
  assert.equal((await request('/rooms/'+room.id+'/history','DELETE',{confirmName:'wrong'},admin.cookie,true)).status,400);
  await request('/messages/'+message+'/reaction','POST',{emoji:'👍'},creator.cookie);
  await request('/messages','POST',{roomId:room.id,text:'reply',replyTo:message},creator.cookie);
  const before=await view(admin,true);
  assert.equal((await request('/rooms/'+room.id+'/history','DELETE',{confirmName:room.name},admin.cookie,true)).status,200);
  const next=await state(admin,true);assert.ok(!next.messages.some(m=>m.roomId===room.id));assert.ok(next.messages.some(m=>m.id===other));
  assert.deepEqual((await view(admin,true)).memberIds,before.memberIds);
  assert.equal((await request('/messages/'+message+'/attachment','GET',null,creator.cookie)).status,404);
  assert.equal((await request('/messages','POST',{roomId:room.id,text:'stale',replyTo:message},creator.cookie)).status,400);
  await stop();await start();assert.ok(!(await state(admin,true)).messages.some(m=>m.roomId===room.id));
  assert.equal((await send(creator)).status,201);
 });
 await t.test('舊資料升級保留帳號、登入與訊息，既有成員繼續存取',async()=>{
  await stop();const path=join(dir,'workspace.json');const old=JSON.parse(await readFile(path,'utf8'));
  delete old.roomAccessVersion;for(const r of old.rooms){delete r.creatorId;delete r.leftUserIds;delete r.removedUserIds;}
  await writeFile(path,JSON.stringify(old));await start();const disk=JSON.parse(await readFile(path,'utf8'));
  assert.deepEqual(disk.users,old.users);assert.deepEqual(disk.sessions,old.sessions);assert.deepEqual(disk.messages,old.messages);
  assert.equal(disk.roomAccessVersion,1);assert.ok((await state(member)).rooms.every(r=>r.isMember&&r.creatorId===null));
 });
});
