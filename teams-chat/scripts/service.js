import {spawn, execFileSync} from 'node:child_process';
import {mkdir, readFile, writeFile, unlink, open, rmdir, rename} from 'node:fs/promises';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {networkInterfaces} from 'node:os';
import net from 'node:net';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const entry = join(root, 'server.js');
const runDir = resolve(process.env.RUNTIME_DIR || join(root, '.run'));
const recordPath = join(runDir, 'service.json');
const logPath = join(runDir, 'server.log');
const lockPath = join(runDir, 'service.lock');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const exists = pid => {try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }};
const psOptions = {encoding:'utf8', env:{...process.env, LC_ALL:'C', LANG:'C'}};
function normalizedStart(value) {
  // Old records made by a Chinese terminal used e.g. 二 9月/29 10:41:07 2026.
  const chinese = value?.match(/^\S+\s+(\d{1,2})月\/(\d{1,2})\s+(\d{2}:\d{2}:\d{2})\s+(\d{4})$/);
  if (chinese) return `${chinese[4]}-${Number(chinese[1])}-${Number(chinese[2])} ${chinese[3]}`;
  const english = value?.match(/^\S+\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{2}:\d{2}:\d{2})\s+(\d{4})$/);
  if (english) return `${english[4]}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(english[1])+1}-${Number(english[2])} ${english[3]}`;
  return null;
}
function identity(pid) {
  try {
    return {
      started: execFileSync('ps', ['-p', String(pid), '-o', 'lstart='], psOptions).trim(),
      command: execFileSync('ps', ['-p', String(pid), '-o', 'args='], psOptions).trim()
    };
  } catch { return null; }
}
function owned(record) {
  if (!record || !Number.isInteger(record.pid) || record.pid <= 1 || record.entry !== entry) return false;
  const actual = identity(record.pid);
  const sameStart = actual && (actual.started === record.started ||
    (normalizedStart(record.started) && normalizedStart(actual.started) === normalizedStart(record.started)));
  return sameStart && actual.command === record.command && actual.command.endsWith(entry);
}
async function readRecord() {try{return JSON.parse(await readFile(recordPath, 'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw Error('程序記錄損毀；請檢查 .run/service.json，未停止任何程序。');}}
async function portFree(port, host) {
  const probe = net.createServer();
  await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(port,host,resolve);});
  await new Promise(resolve=>probe.close(resolve));
}
function urls(host, port) {
  console.log(`本機入口：http://127.0.0.1:${port}`);
  if(host === '0.0.0.0' || host === '::') {
    for(const info of Object.values(networkInterfaces()).flat()) {
      if(info.family==='IPv4'&&!info.internal) console.log(`區網入口：http://${info.address}:${port}`);
    }
  } else if (host !== '127.0.0.1') console.log(`指定位址：http://${host}:${port}`);
}
async function start() {
  const record = await readRecord();
  if(owned(record)){console.log(`Together 已在執行，PID：${record.pid}`);urls(record.host,record.port);return;}
  if(record && exists(record.pid))throw Error('記錄的 PID 已屬於其他程序，為避免誤判，請人工確認 .run/service.json。');
  if(record)await unlink(recordPath);
  const host = process.env.HOST || '0.0.0.0';
  const port = Number(process.env.PORT || 4310);
  if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT 必須介於 1 與 65535。');
  await portFree(port,host).catch(()=>{throw Error(`無法監聽 ${host}:${port}；可能已有服務使用此連接埠。未停止任何既有程序。`);});
  // Rotate only our own runtime log, keeping one previous copy.
  await rename(logPath,logPath+'.previous').catch(e=>{if(e.code!=='ENOENT')throw e;});
  const log = await open(logPath,'a',0o600);
  const instance = randomUUID();
  const child = spawn(process.execPath,[entry],{cwd:root,detached:true,stdio:['ignore',log.fd,log.fd],env:{...process.env,HOST:host,PORT:String(port),SERVICE_INSTANCE:instance}});
  let error;
  child.once('error',e=>error=e);
  child.unref();
  await log.close();
  const current = child.pid && identity(child.pid);
  if(!current)throw Error('無法啟動伺服器，請查看 .run/server.log。');
  const next = {pid:child.pid,entry,...current,host,port};
  await writeFile(recordPath,JSON.stringify(next,null,2),{mode:0o600});
  const probeHost = host==='0.0.0.0'?'127.0.0.1':host==='::'?'[::1]':host;
  for(let i=0;i<60;i++){
    if(error || child.exitCode!==null || !exists(child.pid))break;
    try {
      const response = await fetch(`http://${probeHost}:${port}/api/health`,{signal:AbortSignal.timeout(300)});
      if((await response.json()).instance===instance){console.log(`Together 已啟動，PID：${child.pid}`);urls(host,port);console.log(`紀錄：${logPath}\n停止：./stop.sh`);return;}
    } catch {}
    await delay(100);
  }
  if(owned(next))process.kill(child.pid,'SIGTERM');
  throw Error('啟動未完成，請查看 .run/server.log；程序記錄保留供 stop.sh 核對。');
}
async function stop() {
  const record = await readRecord();
  if(!record){console.log('沒有由 start.sh 管理的服務；未停止任何其他程序。');return;}
  if(!exists(record.pid)){await unlink(recordPath);console.log('服務已停止，已清除過期記錄。');return;}
  if(!owned(record))throw Error('程序身分與記錄不符，拒絕停止，以免影響其他程式。');
  process.kill(record.pid,'SIGTERM');
  for(let i=0;i<80;i++){
    if(!owned(record)){await unlink(recordPath);console.log('Together 已停止。');return;}
    await delay(100);
  }
  throw Error('服務仍在停止中；未強制終止，請查看紀錄後重試。');
}
let locked = false;
try {
  await mkdir(runDir,{recursive:true,mode:0o700});
  try {await mkdir(lockPath);locked=true;}catch {throw Error('另一個啟停操作尚未完成。若先前操作中斷，請確認後移除 .run/service.lock。');}
  if(process.argv[2]==='start')await start();
  else if(process.argv[2]==='stop')await stop();
  else throw Error('請使用 start.sh 或 stop.sh。');
} catch(error) {console.error(error.message);process.exitCode=1;}
finally {if(locked)await rmdir(lockPath);}
