import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import net from 'node:net';
const exec=promisify(execFile);
const root=dirname(dirname(fileURLToPath(import.meta.url)));

test('啟停腳本：重複操作、身分核對、衝突與重啟保存',async t=>{
 const dir=await mkdtemp(join(root,'data-test-service-'));
 const probe=net.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
 const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
 const runtime=join(dir,'runtime');
 const env={...process.env,HOST:'127.0.0.1',PORT:String(port),DATA_DIR:join(dir,'data'),RUNTIME_DIR:runtime};
 const run=action=>exec('/bin/sh',[join(root,action+'.sh')],{cwd:root,env,timeout:15000});
 t.after(async()=>{await run('stop').catch(()=>{});await rm(dir,{recursive:true,force:true});});
 await t.test('停止未啟動的服務不影響其他程序',async()=>assert.match((await run('stop')).stdout,/沒有由 start.sh/));
 await t.test('啟動後重複執行不產生第二份服務',async()=>{
   assert.match((await run('start')).stdout,/已啟動/);
   const before=JSON.parse(await readFile(join(runtime,'service.json'),'utf8'));
   assert.match((await run('start')).stdout,/已在執行/);
   assert.equal(JSON.parse(await readFile(join(runtime,'service.json'),'utf8')).pid,before.pid);
 });
 let cookie;
 await t.test('真正重啟後帳號及 Cookie 仍可使用',async()=>{
   const response=await fetch(`http://127.0.0.1:${port}/api/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'script-test',name:'Script',password:'isolated-script-test-password'})});
   assert.equal(response.status,200);cookie=response.headers.get('set-cookie').split(';')[0];
   assert.match((await run('stop')).stdout,/已停止/);await run('start');
   const state=await fetch(`http://127.0.0.1:${port}/api/state`,{headers:{Cookie:cookie}});
   assert.equal((await state.json()).user.username,'script-test');
 });
 await t.test('PID 記錄被換成其他程序時拒絕終止',async()=>{
   const path=join(runtime,'service.json');const saved=await readFile(path,'utf8');
   try {await writeFile(path,JSON.stringify({...JSON.parse(saved),pid:process.pid}));await assert.rejects(run('stop'),/程序身分與記錄不符/);process.kill(process.pid,0);}
   finally {await writeFile(path,saved);}
 });
 await t.test('其他連接埠占用時不誤認為自己的服務',async()=>{
   await run('stop');const blocker=net.createServer();await new Promise(resolve=>blocker.listen(port,'127.0.0.1',resolve));
   try {await assert.rejects(run('start'),/無法監聽/);assert.equal(blocker.listening,true);}
   finally {await new Promise(resolve=>blocker.close(resolve));}
 });
 await t.test('重複停止安全且可再次啟動',async()=>{await run('stop');await run('start');await run('stop');await run('stop');});
});
