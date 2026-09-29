import http from 'node:http';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { getSession, issueSession, publicUser, hashPassword, checkPassword, allowAuth, localRequest } from './auth.js';

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
// Legacy display-name sessions cannot authenticate an account. Keep old messages intact.
if (db.authVersion !== 1) {
  await writeFile(join(dataDir, 'workspace-before-login.json'), JSON.stringify(db, null, 2), {mode: 0o600, flag: 'wx'}).catch(error => { if (error.code !== 'EEXIST') throw error; });
  db.sessions = {};
  db.authVersion = 1;
  await save();
}
const clients = new Map();
// Public workspace rooms include active accounts unless they leave or are removed.
// Legacy rooms have no recorded creator; only local administrators manage them.
if (db.roomAccessVersion !== 1) {
  for (const room of db.rooms) Object.assign(room, {creatorId:null, leftUserIds:[], removedUserIds:[]});
  db.roomAccessVersion = 1;
  await save();
}
const isMember = (room, id) => !room.leftUserIds.includes(id) && !room.removedUserIds.includes(id);
const canManageRoom = (req, room, user) => localRequest(req) || (room.creatorId === user.id && isMember(room, user.id));
function findRoom(id) {const room=db.rooms.find(r=>r.id===id);if(!room)fail('找不到頻道。',404);return room;}
function requireMember(room, user) {if(!isMember(room,user.id))fail('你已離開或被移除此聊天室，無法存取訊息與附件。',403);}
function roomView(req, room, user) {
  const manage=canManageRoom(req,room,user), member=isMember(room,user.id);
  return {id:room.id,name:room.name,description:room.description,icon:room.icon,creatorId:room.creatorId,
    isMember:member,isRemoved:room.removedUserIds.includes(user.id),canManageMembers:manage,
    canJoin:!room.removedUserIds.includes(user.id)||localRequest(req),canClearHistory:localRequest(req),
    memberIds:member||manage?db.users.filter(u=>u.password&&u.status==='active'&&isMember(room,u.id)).map(u=>u.id):[],
    removedUserIds:manage?room.removedUserIds.filter(id=>db.users.some(u=>u.id===id&&u.password&&u.status==='active')):[]};
}
const publicUsers = () => db.users.filter(u => !u.password || u.status === 'active').map(({id,name,color,demo,status})=>({id,name,color,demo,deleted:status==='deleted',online:clients.has(id)}));
function broadcast(event='change') { for(const streams of clients.values()) for(const stream of streams) stream.write(`event: ${event}\ndata: {}\n\n`); }
const send = (res,status,body) => {res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
function fail(message,status=400) {const e=new Error(message);e.status=status;throw e;}
async function body(req) { let bytes=0;const chunks=[]; for await(const chunk of req) {bytes+=chunk.length;if(bytes>8*1024*1024) fail('附件太大，請選擇 5 MB 以下的檔案。',413);chunks.push(chunk);} try{return JSON.parse(Buffer.concat(chunks).toString()||'{}');}catch{fail('無效的請求格式。');} }
const clean = (v,max,label) => {if(typeof v!=='string'||!v.trim()||v.trim().length>max) fail(`${label}需介於 1 至 ${max} 個字。`);return v.trim();};
const server = http.createServer(async(req,res)=>{
  try {
    const url = new URL(req.url,'http://localhost');
    if(req.method!=='GET' && req.headers.origin && req.headers.origin!==`http://${req.headers.host}`) fail('不允許此來源的請求。',403);
    if (url.pathname === '/api/health' && req.method === 'GET') return send(res, 200, {ok: true, instance: process.env.SERVICE_INSTANCE || null});
    if (['/api/login', '/api/register'].includes(url.pathname) && req.method === 'POST') {
      const data = await body(req);
      const username = typeof data.username === 'string' ? data.username.trim().toLowerCase() : '';
      if (!/^[a-z0-9_.-]{3,32}$/.test(username)) fail('帳號請使用 3 至 32 個英文字母、數字或 _ . -。');
      if (typeof data.password !== 'string' || data.password.length < 10 || data.password.length > 128) fail('密碼需介於 10 至 128 個字元。');
      if (!allowAuth(req.socket.remoteAddress, username)) fail('嘗試次數過多，請於十分鐘後再試。', 429);
      let user = db.users.find(u => u.username === username);
      if (url.pathname === '/api/register') {
        const name = clean(data.name, 30, '顯示名稱');
        if (user) fail('此帳號已被使用。', 409);
        const password = await hashPassword(data.password);
        // scrypt is asynchronous: recheck uniqueness after yielding.
        if (db.users.some(u => u.username === username)) fail('此帳號已被使用。', 409);
        const firstLocal = localRequest(req) && !db.users.some(u => u.password && u.status === 'active');
        user = {id: randomUUID(), username, name, password, status: firstLocal ? 'active' : 'pending', requestedAt: new Date().toISOString(), color: ['#7474bd','#438b82','#b67d54','#688db0'][db.users.length % 4]};
        db.users.push(user);
      } else if (!await checkPassword(data.password, user?.password)) {
        fail('帳號或密碼不正確。', 401);
      }
      if (user.status !== 'active') {
        if (url.pathname === '/api/register') {await save();broadcast('registrations');return send(res, 202, {pending: true});}
        fail(user.status === 'rejected' ? '此帳號申請未獲核准，請聯絡本機管理者。' : '帳號申請等待本機管理者核准，核准後即可登入。', 403);
      }
      issueSession(db, res, user);
      await save();
      broadcast();
      return send(res, 200, {user: publicUser(user)});
    }
    if(url.pathname.startsWith('/api/')) {
      const session = getSession(db, req);
      const user = session?.user;
      if (!user) fail('請先登入工作區。', 401);
      if (url.pathname === '/api/logout' && req.method === 'POST') {
        delete db.sessions[session.key];
        await save();
        for (const stream of clients.get(user.id) || []) if (stream.sessionKey === session.key) {
          stream.write('event: signed-out\ndata: {}\n\n');
          stream.end();
        }
        res.setHeader('Set-Cookie', 'together_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        return send(res, 200, {ok: true});
      }
      if (url.pathname === '/api/session' && req.method === 'POST') {
        user.name = clean((await body(req)).name, 30, '顯示名稱');
        await save(); broadcast();
        return send(res, 200, {user: publicUser(user)});
      }
      if (url.pathname === '/api/state' && req.method === 'GET') {
        const canManageAccounts = localRequest(req);
        return send(res, 200, {
          user: publicUser(user), users: publicUsers(), rooms: db.rooms.map(room=>roomView(req,room,user)),
          capabilities: {canManageAccounts},
          messages: db.messages.filter(message=>isMember(findRoom(message.roomId),user.id)).map(({attachment, ...message}) => ({
            ...message,
            attachment: attachment ? {name: attachment.name, size: attachment.size} : null
          }))
        });
      }
      if (url.pathname === '/api/registrations' && req.method === 'GET') {
        if (!localRequest(req)) fail('請在伺服器本機管理帳號申請。', 403);
        return send(res, 200, {requests: db.users.filter(u => u.password && u.status !== 'active').map(u => ({...publicUser(u), status:u.status, requestedAt:u.requestedAt}))});
      }
      if (url.pathname === '/api/accounts') {
        if (!localRequest(req)) fail('請在伺服器本機管理使用者。', 403);
        if (req.method === 'GET') {
          return send(res, 200, {accounts: db.users.filter(u => u.password).map(u => ({
            ...publicUser(u), status:u.status, requestedAt:u.requestedAt,
            online:clients.has(u.id), isSelf:u.id === user.id
          }))});
        }
        if (req.method === 'POST') {
          const data = await body(req);
          const username = typeof data.username === 'string' ? data.username.trim().toLowerCase() : '';
          if (!/^[a-z0-9_.-]{3,32}$/.test(username)) fail('帳號請使用 3 至 32 個英文字母、數字或 _ . -。');
          const name = clean(data.name, 30, '顯示名稱');
          if (typeof data.password !== 'string' || data.password.length < 10 || data.password.length > 128) fail('密碼需介於 10 至 128 個字元。');
          if (db.users.some(u => u.username === username)) fail('此帳號已被使用。', 409);
          const password = await hashPassword(data.password);
          if (!getSession(db, req)) fail('登入已失效，請重新登入。', 401);
          if (db.users.some(u => u.username === username)) fail('此帳號已被使用。', 409);
          const account = {id:randomUUID(), username, name, password, status:'active',
            requestedAt:new Date().toISOString(), color:['#7474bd','#438b82','#b67d54','#688db0'][db.users.length % 4]};
          db.users.push(account);
          await save();broadcast('registrations');broadcast();
          return send(res, 201, {user:publicUser(account)});
        }
        fail('不支援的操作。', 405);
      }
      const accountDeletion = url.pathname.match(/^\/api\/accounts\/([^/]+)$/);
      if (accountDeletion && req.method === 'DELETE') {
        if (!localRequest(req)) fail('請在伺服器本機管理使用者。', 403);
        const target = db.users.find(u => u.id === accountDeletion[1] && u.password);
        if (!target) fail('找不到此帳號。', 404);
        if (target.id === user.id) fail('無法刪除目前登入的帳號。', 409);
        // Keep only the author identity for existing messages; never transfer old ownership.
        target.status = 'deleted';target.deletedAt = new Date().toISOString();
        delete target.password;delete target.username;
        for (const [key, value] of Object.entries(db.sessions)) if (value.userId === target.id) delete db.sessions[key];
        await save();
        for (const stream of clients.get(target.id) || []) {
          stream.write('event: signed-out\ndata: {}\n\n');stream.end();
        }
        clients.delete(target.id);
        broadcast('registrations');broadcast();
        return send(res, 200, {ok:true});
      }
      const approval = url.pathname.match(/^\/api\/registrations\/([^/]+)$/);
      if (approval && req.method === 'POST') {
        if (!localRequest(req)) fail('請在伺服器本機管理帳號申請。', 403);
        const applicant = db.users.find(u => u.id === approval[1] && u.password && u.status !== 'active');
        if (!applicant) fail('找不到待處理的帳號申請。', 404);
        const {action} = await body(req);
        if (!['approve','reject'].includes(action)) fail('無效的審核操作。');
        applicant.status = action === 'approve' ? 'active' : 'rejected';
        applicant.reviewedAt = new Date().toISOString();
        await save();broadcast('registrations');broadcast();
        return send(res, 200, {ok:true});
      }
      if(url.pathname==='/api/events' && req.method==='GET') {
        res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(': connected\n\n');res.sessionKey=session.key;
        if(!clients.has(user.id))clients.set(user.id,new Set());clients.get(user.id).add(res);broadcast('presence');
        const heartbeat=setInterval(()=>{if(!getSession(db,req)){res.write('event: signed-out\ndata: {}\n\n');res.end();}else res.write(': heartbeat\n\n');},20000);
        req.on('close',()=>{clearInterval(heartbeat);clients.get(user.id)?.delete(res);if(!clients.get(user.id)?.size)clients.delete(user.id);broadcast('presence');});return;
      }
      if(url.pathname==='/api/rooms' && req.method==='POST') {
        const data=await body(req);const name=clean(data.name,40,'頻道名稱');
        if(db.rooms.some(r=>r.name===name))fail('已經有同名頻道。');
        const room={id:randomUUID(),name,description:typeof data.description==='string'?data.description.trim().slice(0,200):'',icon:'hash',creatorId:user.id,leftUserIds:[],removedUserIds:[]};db.rooms.push(room);await save();broadcast();return send(res,201,roomView(req,room,user));
      }
      const roomAction=url.pathname.match(/^\/api\/rooms\/([^/]+)\/(leave|join|members|history)(?:\/([^/]+))?$/);
      if(roomAction) {
        const data=req.method==='GET'?{}:await body(req);
        if(!getSession(db,req))fail('登入已失效，請重新登入。',401);
        const room=findRoom(roomAction[1]), action=roomAction[2], targetId=roomAction[3];
        if(action==='leave'&&req.method==='POST'&&!targetId) {
          if(!room.leftUserIds.includes(user.id))room.leftUserIds.push(user.id);
        } else if(action==='join'&&req.method==='POST'&&!targetId) {
          if(room.removedUserIds.includes(user.id)&&!localRequest(req))fail('你已被移除此聊天室，請聯絡建立者或本機管理者解除限制。',403);
          room.leftUserIds=room.leftUserIds.filter(id=>id!==user.id);
          room.removedUserIds=room.removedUserIds.filter(id=>id!==user.id);
        } else if(action==='members'&&targetId&&['DELETE','POST'].includes(req.method)) {
          if(!canManageRoom(req,room,user))fail('只有本機管理者或聊天室建立者可以管理成員。',403);
          if(targetId===user.id)fail('請使用「離開聊天室」退出。',409);
          if(!db.users.some(u=>u.id===targetId&&u.password&&u.status==='active'))fail('找不到此成員。',404);
          if(req.method==='DELETE') {
            if(!room.removedUserIds.includes(targetId))room.removedUserIds.push(targetId);
          } else {
            // Lift the removal without forcing someone who left voluntarily to rejoin.
            if(!room.removedUserIds.includes(targetId))fail('此成員未被移除。',409);
            room.removedUserIds=room.removedUserIds.filter(id=>id!==targetId);
            if(!room.leftUserIds.includes(targetId))room.leftUserIds.push(targetId);
          }
        } else if(action==='history'&&req.method==='DELETE'&&!targetId) {
          if(!localRequest(req))fail('只有本機管理者可以清除聊天室紀錄。',403);
          if(data.confirmName!==room.name)fail('請輸入完整聊天室名稱以確認清除。');
          db.messages=db.messages.filter(m=>m.roomId!==room.id);
        } else fail('不支援的操作。',405);
        await save();broadcast();return send(res,200,{ok:true});
      }
      if(url.pathname==='/api/messages' && req.method==='POST') {
        const data=await body(req);if(!getSession(db,req))fail('登入已失效，請重新登入。',401);requireMember(findRoom(data.roomId),user);
        const text=typeof data.text==='string'?data.text.trim():'';if(text.length>5000)fail('訊息最多 5000 個字。');
        let attachment;
        if(data.attachment) {const a=data.attachment;const name=clean(a.name,180,'檔名');if(typeof a.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(a.data))fail('無效的附件。');const size=Buffer.from(a.data,'base64').length;if(size>5*1024*1024)fail('附件上限為 5 MB。',413);attachment={name,data:a.data,size};}
        if(!text&&!attachment)fail('請輸入訊息或選擇附件。');
        if(data.replyTo&&!db.messages.some(m=>m.id===data.replyTo&&m.roomId===data.roomId))fail('找不到回覆的訊息。');
        const message={id:randomUUID(),roomId:data.roomId,userId:user.id,text,createdAt:new Date().toISOString(),reactions:{},replyTo:data.replyTo||null,...(attachment?{attachment}:{})};db.messages.push(message);await save();broadcast();return send(res,201,{id:message.id});
      }
      const match=url.pathname.match(/^\/api\/messages\/([^/]+)(?:\/(reaction|attachment))?$/);
      if(match) {
        const data=['POST','PATCH'].includes(req.method)?await body(req):{};
        if(!getSession(db,req))fail('登入已失效，請重新登入。',401);
        const message=db.messages.find(m=>m.id===match[1]);if(!message)fail('找不到訊息。',404);
        requireMember(findRoom(message.roomId),user);
        if(match[2]==='attachment'&&req.method==='GET') {if(!message.attachment)fail('找不到附件。',404);res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(message.attachment.name).replace(/'/g,'%27')}`,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});return res.end(Buffer.from(message.attachment.data,'base64'));}
        if(match[2]==='reaction'&&req.method==='POST') {const {emoji}=data;if(!['👍','❤️','🎉','👋','✅','☕'].includes(emoji))fail('不支援的表情。');const list=message.reactions[emoji]||[];message.reactions[emoji]=list.includes(user.id)?list.filter(id=>id!==user.id):[...list,user.id];}
        else if(!match[2]&&req.method==='DELETE') {if(message.userId!==user.id)fail('只能刪除自己的訊息。',403);db.messages=db.messages.filter(m=>m.id!==message.id);}
        else if(!match[2]&&req.method==='PATCH') {if(message.userId!==user.id)fail('只能編輯自己的訊息。',403);message.text=clean(data.text,5000,'訊息');message.edited=true;}
        else fail('不支援的操作。',405);
        await save();broadcast();return send(res,200,{ok:true});
      }
      fail('找不到此功能。',404);
    }
    const files={'/':'index.html','/app.js':'app.js','/notifications.js':'notifications.js','/style.css':'style.css'};
    if(!files[url.pathname]||req.method!=='GET')fail('找不到頁面。',404);
    const content=await readFile(join(root,'public',files[url.pathname]));
    res.writeHead(200,{'Content-Type':url.pathname.endsWith('.js')?'text/javascript; charset=utf-8':url.pathname.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(content);
  } catch(error) {if(!res.headersSent)send(res,error.status||500,{error:error.status?error.message:'伺服器發生錯誤，請稍後重試。'});else res.end();if(!error.status)console.error(error);}
});
server.listen(Number(process.env.PORT||4310),process.env.HOST||'127.0.0.1',()=>console.log(`Together is running at http://${process.env.HOST||'127.0.0.1'}:${server.address().port}`));

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close();
  for (const streams of clients.values()) for (const stream of streams) stream.end();
  await writeQueue;
  server.closeAllConnections();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
