import http from 'node:http';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomBytes } from 'node:crypto';

const root = dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || join(root, 'data');
await mkdir(dataDir, { recursive: true });
const dbPath = join(dataDir, 'workspace.json');
const now = Date.now();
const people = [ ['demo-lin', '林子晴', '#ca8265'], ['demo-chen', '陳柏宇', '#568a97'], ['demo-huang', '黃品蓉', '#a87bba'] ].map(([id,name,color]) => ({ id,name,color,demo:true }));
const rooms = [
  {id:'general',name:'團隊大廳',description:'讓好點子在這裡相遇。分享近況、交換靈感，一起把事情做好。',icon:'sparkles'},
  {id:'design',name:'設計與靈感',description:'設計討論、視覺提案，以及值得收藏的靈感。',icon:'palette'},
  {id:'project',name:'專案討論',description:'一起追蹤進度、解決問題，讓計畫往前走。',icon:'layers'},
  {id:'random',name:'茶水間',description:'工作之外，也聊聊生活。',icon:'coffee'}
];
let db;
try { db = JSON.parse(await readFile(dbPath,'utf8')); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  db = {users:people, sessions:{}, rooms, messages:[
    {id:randomUUID(),roomId:'general',userId:'demo-lin',text:'早安，大家！歡迎來到我們的新工作區。\n以後的點子、進度和好消息，都可以在這裡分享。',createdAt:new Date(now-3600000).toISOString(),reactions:{'👋':['demo-chen','demo-huang']}},
    {id:randomUUID(),roomId:'general',userId:'demo-chen',text:'把溝通放在一起，合作就簡單多了。\n我已經建好「專案討論」頻道，可以依主題分開聊。',createdAt:new Date(now-3300000).toISOString(),reactions:{}},
    {id:randomUUID(),roomId:'general',userId:'demo-huang',text:'也別忘了茶水間！今天的咖啡很好喝 ☕\n有什麼新點子，隨時丟上來一起討論吧。',createdAt:new Date(now-2900000).toISOString(),reactions:{'❤️':['demo-lin']}}
  ]};
  await writeFile(dbPath,JSON.stringify(db,null,2),{mode:0o600});
}
let writeQueue = Promise.resolve();
function save() { const snapshot = JSON.stringify(db,null,2); const task = writeQueue.then(async()=>{ await writeFile(dbPath+'.tmp',snapshot,{mode:0o600}); await rename(dbPath+'.tmp',dbPath); }); writeQueue=task.catch(()=>{}); return task; }
const clients = new Map();
const publicUsers = () => db.users.map(({id,name,color,demo})=>({id,name,color,demo,online:clients.has(id)}));
function broadcast(event='change') { for(const streams of clients.values()) for(const stream of streams) stream.write(`event: ${event}\ndata: {}\n\n`); }
const send = (res,status,body) => {res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
function fail(message,status=400) {const e=new Error(message);e.status=status;throw e;}
async function body(req) { let bytes=0;const chunks=[]; for await(const chunk of req) {bytes+=chunk.length;if(bytes>8*1024*1024) fail('附件太大，請選擇 5 MB 以下的檔案。',413);chunks.push(chunk);} try{return JSON.parse(Buffer.concat(chunks).toString()||'{}');}catch{fail('無效的請求格式。');} }
const clean = (v,max,label) => {if(typeof v!=='string'||!v.trim()||v.trim().length>max) fail(`${label}需介於 1 至 ${max} 個字。`);return v.trim();};
function currentUser(req) {const token=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('together_session='))?.slice(17); return db.users.find(u=>u.id===db.sessions[token]);}
const server = http.createServer(async(req,res)=>{
  try {
    const url = new URL(req.url,'http://localhost');
    if(req.method!=='GET' && req.headers.origin && req.headers.origin!==`http://${req.headers.host}`) fail('不允許此來源的請求。',403);
    if(url.pathname==='/api/session' && req.method==='POST') {
      const data=await body(req);const name=clean(data.name,30,'顯示名稱');
      let user=currentUser(req);
      if(user) user.name=name;
      else {user={id:randomUUID(),name,color:['#7474bd','#438b82','#b67d54','#688db0'][db.users.length%4]}; db.users.push(user);}
      const token=randomBytes(32).toString('hex');db.sessions[token]=user.id;await save();
      res.setHeader('Set-Cookie',`together_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`);broadcast();return send(res,200,{user});
    }
    if(url.pathname==='/api/state') return send(res,200,{user:currentUser(req)||null,users:publicUsers(),rooms:db.rooms,messages:db.messages.map(({attachment,...m})=>({...m,attachment:attachment?{name:attachment.name,size:attachment.size}:null}))});
    if(url.pathname.startsWith('/api/')) {
      const user=currentUser(req);if(!user) fail('請先輸入名稱，加入工作區。',401);
      if(url.pathname==='/api/events' && req.method==='GET') {
        res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(': connected\n\n');
        if(!clients.has(user.id))clients.set(user.id,new Set());clients.get(user.id).add(res);broadcast('presence');
        const heartbeat=setInterval(()=>res.write(': heartbeat\n\n'),20000);
        req.on('close',()=>{clearInterval(heartbeat);clients.get(user.id)?.delete(res);if(!clients.get(user.id)?.size)clients.delete(user.id);broadcast('presence');});return;
      }
      if(url.pathname==='/api/rooms' && req.method==='POST') {
        const data=await body(req);const name=clean(data.name,40,'頻道名稱');
        if(db.rooms.some(r=>r.name===name))fail('已經有同名頻道。');
        const room={id:randomUUID(),name,description:typeof data.description==='string'?data.description.trim().slice(0,200):'',icon:'hash'};db.rooms.push(room);await save();broadcast();return send(res,201,room);
      }
      if(url.pathname==='/api/messages' && req.method==='POST') {
        const data=await body(req);if(!db.rooms.some(r=>r.id===data.roomId))fail('找不到頻道。',404);
        const text=typeof data.text==='string'?data.text.trim():'';if(text.length>5000)fail('訊息最多 5000 個字。');
        let attachment;
        if(data.attachment) {const a=data.attachment;const name=clean(a.name,180,'檔名');if(typeof a.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(a.data))fail('無效的附件。');const size=Buffer.from(a.data,'base64').length;if(size>5*1024*1024)fail('附件上限為 5 MB。',413);attachment={name,data:a.data,size};}
        if(!text&&!attachment)fail('請輸入訊息或選擇附件。');
        if(data.replyTo&&!db.messages.some(m=>m.id===data.replyTo&&m.roomId===data.roomId))fail('找不到回覆的訊息。');
        const message={id:randomUUID(),roomId:data.roomId,userId:user.id,text,createdAt:new Date().toISOString(),reactions:{},replyTo:data.replyTo||null,...(attachment?{attachment}:{})};db.messages.push(message);await save();broadcast();return send(res,201,{id:message.id});
      }
      const match=url.pathname.match(/^\/api\/messages\/([^/]+)(?:\/(reaction|attachment))?$/);
      if(match) {
        const message=db.messages.find(m=>m.id===match[1]);if(!message)fail('找不到訊息。',404);
        if(match[2]==='attachment'&&req.method==='GET') {if(!message.attachment)fail('找不到附件。',404);res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(message.attachment.name).replace(/'/g,'%27')}`,'X-Content-Type-Options':'nosniff'});return res.end(Buffer.from(message.attachment.data,'base64'));}
        if(match[2]==='reaction'&&req.method==='POST') {const {emoji}=await body(req);if(!['👍','❤️','🎉','👋','✅','☕'].includes(emoji))fail('不支援的表情。');const list=message.reactions[emoji]||[];message.reactions[emoji]=list.includes(user.id)?list.filter(id=>id!==user.id):[...list,user.id];}
        else if(!match[2]&&req.method==='DELETE') {if(message.userId!==user.id)fail('只能刪除自己的訊息。',403);db.messages=db.messages.filter(m=>m.id!==message.id);}
        else if(!match[2]&&req.method==='PATCH') {if(message.userId!==user.id)fail('只能編輯自己的訊息。',403);message.text=clean((await body(req)).text,5000,'訊息');message.edited=true;}
        else fail('不支援的操作。',405);
        await save();broadcast();return send(res,200,{ok:true});
      }
      fail('找不到此功能。',404);
    }
    const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};
    if(!files[url.pathname]||req.method!=='GET')fail('找不到頁面。',404);
    const content=await readFile(join(root,'public',files[url.pathname]));
    res.writeHead(200,{'Content-Type':url.pathname.endsWith('.js')?'text/javascript; charset=utf-8':url.pathname.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(content);
  } catch(error) {if(!res.headersSent)send(res,error.status||500,{error:error.status?error.message:'伺服器發生錯誤，請稍後重試。'});else res.end();if(!error.status)console.error(error);}
});
server.listen(Number(process.env.PORT||4310),process.env.HOST||'127.0.0.1',()=>console.log(`Together is running at http://${process.env.HOST||'127.0.0.1'}:${server.address().port}`));
