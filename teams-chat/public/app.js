import { unreadMessages, notificationTitle } from './notifications.js';
const $ = (s) => document.querySelector(s);
const icons = {
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
 message:'<path d="M21 11a8 8 0 0 1-8 8H5l-4 3V11a10 10 0 0 1 20 0Z"/><path d="M7 8h8M7 12h5"/>',
 folder:'<path d="M3 5h6l2 3h10v12H3Z"/>',users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 8.5a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16h.01"/>',edit:'<path d="M20 13v7H4V4h8M14 5l5 5M10 14l-1 4 4-1L22 8l-4-4Z"/>',layers:'<path d="m12 3 10 5-10 5L2 8Zm-9 9 9 5 9-5M3 17l9 5 9-5"/>',chevron:'<path d="m8 10 4 4 4-4"/>',sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4M18 4h4"/>',palette:'<path d="M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4 2 2 0 0 1 0-4h3a4 4 0 0 0 4-4c0-4-5-6-9-6Z"/><path d="M7 8h.01M12 6h.01M17 8h.01M5 13h.01"/>',coffee:'<path d="M3 8h13v7a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5ZM16 9h2a3 3 0 0 1 0 6h-2M6 2v3M10 2v3M14 2v3"/>',hash:'<path d="M10 3 6 21M18 3l-4 18M4 9h17M3 15h17"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',paperclip:'<path d="m8 13 6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l9-9a6 6 0 0 1 9 9l-9 9"/>',smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14a4 4 0 0 0 8 0M8 9h.01M16 9h.01"/>',send:'<path d="m21 3-7 18-4-7-7-4ZM10 14 21 3"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>',x:'<path d="m6 6 12 12M18 6 6 18"/>',reply:'<path d="m9 4-6 6 6 6M3 10h10a7 7 0 0 1 7 7v3"/>',trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',file:'<path d="M5 3h9l5 5v13H5ZM14 3v6h5M9 13h6M9 17h6"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>'
};
const icon=(name)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]||icons.hash}</svg>`;
for(const el of document.querySelectorAll('[data-icon]')) el.innerHTML=icon(el.dataset.icon);
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={user:null,users:[],rooms:[],messages:[]};
let roomId=localStorage.getItem('together-room')||'general',tab='chat',filter='all',replyTo=null,editing=null,attachment=null,events=null,dialogAction=null,sending=false;
let seen = {};
let seenOwner = null;
let drafts={};let toastTimer;let refreshVersion=0;
const person=id=>state.users.find(u=>u.id===id)||{name:'未知成員',color:'#9e95ab'};
const avatar=(user,extra='')=>`<span class="avatar ${extra}" style="background:${/^#[0-9a-f]{6}$/i.test(user.color)?user.color:'#9e95ab'}">${esc(user.name.slice(-2))}</span>`;
const size=n=>n>=1048576?`${(n/1048576).toFixed(1)} MB`:`${Math.max(1,Math.round(n/1024))} KB`;
const stamp=d=>new Date(d).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false});
const day=d=>new Date(d).toLocaleDateString('zh-TW',{month:'long',day:'numeric',weekday:'long'});
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4000);}
async function api(path,method='GET',data){const res=await fetch('/api'+path,{method,headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const result=await res.json();if(!res.ok){if(res.status===401&&!['/login','/register'].includes(path))signedOut();const error=new Error(result.error||'連線失敗。');error.status=res.status;throw error;}return result;}
function loadReadState() {
 if(seenOwner===state.user.id)return;
 seenOwner=state.user.id;
 try {seen=JSON.parse(localStorage.getItem('together-read-'+seenOwner)||'null');} catch {seen=null;}
 if(!seen||typeof seen!=='object'||Array.isArray(seen)) {
   seen=Object.fromEntries(state.rooms.map(room=>[room.id,state.messages.filter(m=>m.roomId===room.id).map(m=>m.id)]));
 }
}
function markSeen(){
 if(document.hidden||!document.hasFocus()||!state.user||tab!=='chat'||$('#search').value.trim())return;
 seen[roomId]=state.messages.filter(m=>m.roomId===roomId).map(m=>m.id);
 localStorage.setItem('together-read-'+seenOwner,JSON.stringify(seen));
}
function unread(id){return unreadMessages(state.messages,state.users,state.user?.id,id,Array.isArray(seen[id])?seen[id]:[]);}
function updateNotification(){
 const total=state.user?state.rooms.reduce((sum,room)=>sum+unread(room.id),0):0;
 document.title=notificationTitle(total);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#6260ad"/><text x="10" y="25" font-family="sans-serif" font-size="27" font-weight="bold" fill="white">t</text>${total?'<circle cx="25" cy="7" r="6" fill="#e65464" stroke="white" stroke-width="2"/>':''}</svg>`;
 $('#notification-icon').href='data:image/svg+xml,'+encodeURIComponent(svg);
}
function signedOut(){
 refreshVersion++;events?.close();events=null;state={user:null,users:[],rooms:[],messages:[]};seenOwner=null;seen={};drafts={};replyTo=null;editing=null;attachment=null;
 $('#messages').innerHTML='';$('#files-view').innerHTML='';$('#room-list').innerHTML='';$('#details').innerHTML='';$('#member-stack').innerHTML='';$('#message-input').value='';$('#search').value='';$('#file-input').value='';$('#attachment-preview').hidden=true;$('#reply-banner').hidden=true;
 document.body.classList.add('signed-out');updateNotification();authDialog();
}
function renderRooms(){
 const rooms=state.rooms.filter(r=>filter!=='unread'||unread(r.id));
 $('#room-list').innerHTML=rooms.map(r=>{const msgs=state.messages.filter(m=>m.roomId===r.id),last=msgs.at(-1),count=unread(r.id);return `<button class="room ${r.id===roomId?'selected':''}" data-room="${r.id}"><span class="room-symbol">${icon(r.icon)}</span><span class="room-info"><strong>${esc(r.name)}</strong><small>${last?esc(person(last.userId).name+'：'+(last.text||last.attachment?.name||'附件')):'讓第一段對話開始吧'}</small></span>${count?`<span class="unread-badge">${count}</span>`:''}</button>`;}).join('')||'<div class="empty">沒有未讀訊息<br>所有對話都跟上了。</div>';
 const count=state.rooms.reduce((a,r)=>a+unread(r.id),0);$('#unread-count').textContent=count?` ${count}`:'';updateNotification();
}
function renderDetails(){const room=state.rooms.find(r=>r.id===roomId);$('#details').innerHTML=`<div class="details-heading"><strong>頻道資訊</strong><button class="icon-button" data-close-details aria-label="關閉資訊">${icon('x')}</button></div><h4>${esc(room.name)}</h4><p>${esc(room.description||'在這裡，讓對話開始。')}</p><p>${icon('globe')} 所有工作區成員皆可加入與閱讀</p><h4>工作區成員 · ${state.users.filter(u=>!u.deleted).length}</h4>${state.users.filter(u=>!u.deleted).map(u=>`<div class="member-row">${avatar(u)}<div>${esc(u.name)}${u.id===state.user?.id?'（你）':''}<small>${u.demo?'示範成員':u.online?'在線上':'離線'}</small></div>${u.online?'<span class="member-online"></span>':''}</div>`).join('')}`;}
function renderMessages(scroll=false){const container=$('#messages');const nearBottom=container.scrollHeight-container.scrollTop-container.clientHeight<90;const oldTop=container.scrollTop;
 const query=$('#search').value.trim().toLocaleLowerCase();const all=state.messages.filter(m=>m.roomId===roomId);const messages=all.filter(m=>!query||(m.text+' '+person(m.userId).name+' '+(m.attachment?.name||'')).toLocaleLowerCase().includes(query));
 const room=state.rooms.find(r=>r.id===roomId);
 $('#search-summary').hidden=!query;$('#search-summary').innerHTML=`<span>在「${esc(room.name)}」找到 ${messages.length} 則訊息</span><button id="clear-search" aria-label="清除搜尋">${icon('x')}</button>`;
 let previousDay='';let html=!query?`<div class="welcome"><span class="welcome-symbol">${icon(room.icon)}</span><div><h3>一起聊聊，${esc(room.name==='general'?'把好點子變成日常。':room.name+'。')}</h3><p>${esc(room.description||'新的頻道、新的開始。分享你的第一個想法。')}</p></div></div>`:'';
 for(const m of messages){const user=person(m.userId),own=m.userId===state.user?.id;const date=day(m.createdAt);if(date!==previousDay){html+=`<div class="date-divider">${date}</div>`;previousDay=date;}
 const quote=state.messages.find(x=>x.id===m.replyTo);
 html+=`<article class="message ${own?'own':''}" data-message="${m.id}">${avatar(user)}<div class="message-body"><div class="message-meta"><strong>${esc(user.name)}${own?' <small>你</small>':''}</strong><time>${stamp(m.createdAt)}</time>${user.demo?'<span class="demo-label">示範</span>':user.deleted?'<span class="demo-label">帳號已刪除</span>':''}${m.edited?'<small>已編輯</small>':''}</div><div class="bubble">${m.replyTo?`<div class="quoted">${quote?esc(person(quote.userId).name+'：'+(quote.text||quote.attachment?.name||'附件')):'原訊息已刪除'}</div>`:''}${esc(m.text)}${m.attachment?`<a class="attachment" href="/api/messages/${m.id}/attachment" download>${icon('file')}<span>${esc(m.attachment.name)}<small>${size(m.attachment.size)} · 下載附件</small></span>${icon('download')}</a>`:''}</div><div class="reactions">${Object.entries(m.reactions).filter(([,ids])=>ids.length).map(([emoji,ids])=>`<button class="reaction ${ids.includes(state.user?.id)?'mine':''}" data-react="${emoji}" data-id="${m.id}" aria-label="${emoji} 反應，${ids.length} 人" aria-pressed="${ids.includes(state.user?.id)}">${emoji} ${ids.length}</button>`).join('')}</div></div><div class="message-actions"><button data-react="👍" data-id="${m.id}" title="讚" aria-label="對訊息按讚">👍</button><button data-reply="${m.id}" title="回覆" aria-label="回覆訊息">${icon('reply')}</button>${own?`<button data-edit="${m.id}" title="編輯" aria-label="編輯訊息">${icon('edit')}</button><button data-delete="${m.id}" title="刪除" aria-label="刪除訊息">${icon('trash')}</button>`:''}</div></article>`;
 }
 if(!messages.length)html+=`<div class="empty">${icon(query?'search':'message')}${query?'沒有找到相符的訊息，試試其他關鍵字。':'這裡還很安靜，來當第一個開口的人吧。'}</div>`;
 container.innerHTML=html;if(scroll||nearBottom)container.scrollTop=container.scrollHeight;else container.scrollTop=oldTop;
 const files=all.filter(m=>m.attachment);$('#files-view').innerHTML=`<h3>共用檔案 <span class="demo-label">${files.length}</span></h3><p style="font-size:11px;color:#a79caf">對話中的附件，都整理在這裡。</p>${files.length?files.map(m=>`<a class="file-row" href="/api/messages/${m.id}/attachment" download>${icon('file')}<div><strong>${esc(m.attachment.name)}</strong><small>${esc(person(m.userId).name)} · ${day(m.createdAt)} · ${size(m.attachment.size)}</small></div>${icon('download')}</a>`).join(''):`<div class="empty">${icon('folder')}目前沒有共用檔案<br>點選輸入框的迴紋針，分享第一份檔案。</div>`}`;
}
function render(scroll=false){if(!state.user)return;loadReadState();document.body.classList.remove('signed-out');if(!state.rooms.some(r=>r.id===roomId))roomId=state.rooms[0].id;const room=state.rooms.find(r=>r.id===roomId);$('#channel-name').textContent=room.name;$('#channel-description').textContent=room.description;$('#channel-icon').innerHTML=icon(room.icon);$('#member-stack').innerHTML=state.users.filter(u=>!u.deleted).slice(0,3).map(u=>avatar(u)).join('')+`<span class="avatar">${state.users.filter(u=>!u.deleted).length}</span>`;if(state.user){$('#profile').textContent=state.user.name.slice(-2);$('#profile').title=state.user.name;}$('#manage-accounts').hidden=!state.capabilities?.canManageAccounts;markSeen();renderRooms();renderMessages(scroll);renderDetails();refreshRegistrations().catch(()=>{});}
async function refresh(scroll=false){const version=++refreshVersion;const next=await api('/state');if(version!==refreshVersion)return;state=next;render(scroll);}
function connect(){events?.close();events=new EventSource('/api/events');events.onopen=()=>{$('#connection').textContent='即時同步已連線';refresh().catch(()=>{});};events.onerror=()=>{$('#connection').textContent='連線中斷，正在重連…';refresh().catch(()=>{});};events.addEventListener('signed-out',signedOut);events.addEventListener('registrations',()=>refreshRegistrations().catch(()=>{}));events.addEventListener('change',()=>refresh().catch(e=>toast(e.message)));events.addEventListener('presence',()=>refresh().catch(()=>{}));}
function setTab(value){tab=value;$('#messages').hidden=tab!=='chat';$('#files-view').hidden=tab!=='files';$('.composer-area').hidden=tab!=='chat';document.querySelectorAll('[data-tab]').forEach(el=>el.classList.toggle('active',el.dataset.tab===tab));$('#nav-chat').classList.toggle('active',tab==='chat');$('#nav-files').classList.toggle('active',tab==='files');markSeen();renderRooms();}
function switchRoom(id){if(sending)return;drafts[roomId]=$('#message-input').value;roomId=id;localStorage.setItem('together-room',id);$('#message-input').value=drafts[id]||'';replyTo=null;editing=null;attachment=null;$('#attachment-preview').hidden=true;$('#reply-banner').hidden=true;$('#search').value='';setTab('chat');render(true);$('.sidebar').classList.remove('open');}
function dialog(content,action,label='儲存',dismissible=true){$('#dialog').classList.toggle('accounts-dialog',content.includes('id="accounts-panel"'));$('#dialog-content').innerHTML=content;$('#dialog-submit').textContent=label;$('#dialog-error').textContent='';$('#close-dialog').hidden=!dismissible;dialogAction=action;$('#dialog').dataset.required=String(!dismissible);if(!$('#dialog').open)$('#dialog').showModal();setTimeout(()=>$('#dialog input')?.focus(),50);}
function authDialog(register=false){
 dialog(`<div class="auth-switch"><button type="button" data-auth-mode="login" class="${!register?'selected':''}">登入</button><button type="button" data-auth-mode="register" class="${register?'selected':''}">建立帳號</button></div><h2>${register?'一起加入工作區':'歡迎回來'}</h2><p>${register?'建立自己的帳號，所有成員都能使用相同的聊天功能。':'登入後，即可查看團隊對話與傳送訊息。'}</p>${register?'<label for="account-name">顯示名稱</label><input id="account-name" autocomplete="nickname" maxlength="30" required>':''}<label for="username">帳號</label><input id="username" autocomplete="username" autocapitalize="none" spellcheck="false" pattern="[a-zA-Z0-9_.\\-]{3,32}" minlength="3" maxlength="32" placeholder="英文、數字或 _ . -" required><label for="password">密碼</label><input id="password" type="password" autocomplete="${register?'new-password':'current-password'}" minlength="10" maxlength="128" placeholder="至少 10 個字元" required>${register?'<label for="confirm-password">確認密碼</label><input id="confirm-password" type="password" autocomplete="new-password" minlength="10" maxlength="128" required>':''}<p>新帳號需經本機管理者核准。主機首次建立的帳號會直接啟用；舊版名稱與訊息會保留。</p>`,async()=>{
   const password=$('#password').value;
   if(register&&password!==$('#confirm-password').value)throw new Error('兩次輸入的密碼不一致。');
   const result=await api(register?'/register':'/login','POST',{username:$('#username').value,password,...(register?{name:$('#account-name').value}:{})});
   if(result.pending){authDialog();$('#dialog-error').textContent='申請已送出。請通知主機管理者核准，再使用帳號與密碼登入。';return false;}
   await refresh(true);connect();
 },register?'送出帳號申請':'登入工作區',false);
 $('#dialog-content').querySelectorAll('[data-auth-mode]').forEach(button=>button.onclick=()=>authDialog(button.dataset.authMode==='register'));
}
function profile(initial=false){
 if(initial||!state.user)return authDialog();
 dialog(`<h2>讓大家認識你</h2><p>帳號：${esc(state.user.username)}。更新名稱後，工作區中的訊息會一起更新。</p><label for="display-name">顯示名稱</label><input id="display-name" value="${esc(state.user.name)}" maxlength="30" required>`,async()=>{await api('/session','POST',{name:$('#display-name').value});await refresh();},'儲存名稱');
}
let managedAccounts=[];
let accountsQuery='',accountsFilter='all',accountsVersion=0;
async function refreshRegistrations(){
 if(!state.user||!state.capabilities?.canManageAccounts)return;
 const owner=state.user.id,version=++accountsVersion;
 const result=await api('/accounts');
 if(version!==accountsVersion||state.user?.id!==owner)return;
 managedAccounts=result.accounts;
 const count=managedAccounts.filter(account=>account.status==='pending').length;
 $('#manage-accounts').textContent=count?`使用者管理（${count} 待審）`:'使用者管理';
 if($('#dialog').open&&$('#accounts-list'))renderAccounts();
}
function renderAccounts(){
 const list=$('#accounts-list');if(!list)return;
 const query=accountsQuery.trim().toLocaleLowerCase();
 const accounts=managedAccounts.filter(account=>(accountsFilter==='all'||account.status===accountsFilter)&&(!query||(account.name+' '+account.username).toLocaleLowerCase().includes(query)));
 const labels={active:'已啟用',pending:'待審核',rejected:'已拒絕'};
 $('#accounts-summary').textContent=`共 ${managedAccounts.length} 個帳號，${managedAccounts.filter(a=>a.status==='pending').length} 個待審核`;
 list.innerHTML=accounts.length?accounts.map(account=>`<div class="account-row" data-account-row="${account.id}"><div class="account-identity">${avatar(account)}<div><strong>${esc(account.name)}${account.isSelf?' <small>（你）</small>':''}</strong><span class="account-username">${esc(account.username)}</span><small>${account.requestedAt?new Date(account.requestedAt).toLocaleDateString('zh-TW'):'—'} 建立${account.online?' · 線上':''}</small></div></div><span class="account-status ${account.status}">${labels[account.status]||'未知'}</span><div class="account-actions">${account.status!=='active'?`<button type="button" data-approve="${account.id}">核准</button>`:''}${account.status==='pending'?`<button type="button" data-reject="${account.id}">拒絕</button>`:''}<button type="button" class="danger-link" data-delete-account="${account.id}" ${account.isSelf?'disabled title="無法刪除目前登入的帳號"':''}>刪除</button></div></div>`).join(''):'<p class="empty">沒有符合條件的帳號。</p>';
 list.onclick=async event=>{
   const approve=event.target.closest('[data-approve]'),reject=event.target.closest('[data-reject]'),remove=event.target.closest('[data-delete-account]');
   if(remove){const account=managedAccounts.find(a=>a.id===remove.dataset.deleteAccount);if(account&&!account.isSelf)deleteAccountDialog(account);return;}
   if(!approve&&!reject)return;
   const button=approve||reject;button.disabled=true;
   try{await api('/registrations/'+(approve?.dataset.approve||reject.dataset.reject),'POST',{action:approve?'approve':'reject'});await refreshRegistrations();toast(approve?'已核准，對方現在可以登入。':'已拒絕此帳號申請。');}catch(error){toast(error.message);}finally{button.disabled=false;}
 };
}
async function showAccounts(){
 await refreshRegistrations();
 dialog('<div id="accounts-panel"><div class="accounts-title"><div><h2>使用者管理</h2><p id="accounts-summary"></p></div><button type="button" id="add-account" class="account-add">＋ 新增使用者</button></div><p>管理所有註冊帳號。此功能僅供主機本機使用，示範與舊版未註冊名稱不列入。</p><div class="accounts-tools"><input id="accounts-search" aria-label="搜尋使用者" placeholder="搜尋名稱或帳號"><select id="accounts-filter" aria-label="帳號狀態"><option value="all">全部狀態</option><option value="active">已啟用</option><option value="pending">待審核</option><option value="rejected">已拒絕</option></select></div><div id="accounts-list"></div></div>',()=>{},'完成');
 $('#accounts-search').value=accountsQuery;$('#accounts-filter').value=accountsFilter;
 $('#accounts-search').oninput=event=>{accountsQuery=event.target.value;renderAccounts();};
 $('#accounts-filter').onchange=event=>{accountsFilter=event.target.value;renderAccounts();};
 $('#add-account').onclick=addAccountDialog;renderAccounts();
}
function addAccountDialog(){
 dialog('<h2>新增使用者</h2><p>由本機建立的帳號會立即啟用。請將設定的帳號與密碼交給使用者。</p><label for="new-account-name">顯示名稱</label><input id="new-account-name" maxlength="30" autocomplete="off" required><label for="new-account-username">帳號</label><input id="new-account-username" minlength="3" maxlength="32" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="英文、數字或 _ . -" required><label for="new-account-password">密碼</label><input id="new-account-password" type="password" minlength="10" maxlength="128" autocomplete="new-password" required><label for="new-account-confirm">確認密碼</label><input id="new-account-confirm" type="password" minlength="10" maxlength="128" autocomplete="new-password" required><button type="button" id="back-to-accounts" class="account-back">返回使用者清單</button>',async()=>{
   const password=$('#new-account-password').value;if(password!==$('#new-account-confirm').value)throw new Error('兩次輸入的密碼不一致。');
   await api('/accounts','POST',{name:$('#new-account-name').value,username:$('#new-account-username').value,password});
   accountsQuery='';accountsFilter='all';await showAccounts();toast('使用者已新增，可立即登入。');return false;
 },'新增並啟用');
 $('#back-to-accounts').onclick=()=>showAccounts().catch(error=>toast(error.message));
}
function deleteAccountDialog(account){
 dialog(`<h2>刪除這個使用者？</h2><p><strong>${esc(account.name)}（${esc(account.username)}）</strong></p><p>對方所有裝置將立即登出，原密碼失效。既有訊息與附件會保留。</p><p>刪除無法復原。之後可重新建立同名帳號，但不會繼承舊帳號的訊息編輯權。</p><button type="button" id="back-to-accounts" class="account-back">取消並返回清單</button>`,async()=>{
   await api('/accounts/'+account.id,'DELETE');await showAccounts();toast('帳號已刪除，登入已撤銷。');return false;
 },'確認刪除帳號');
 $('#back-to-accounts').onclick=()=>showAccounts().catch(error=>toast(error.message));
}
$('#manage-accounts').onclick=()=>showAccounts().catch(error=>toast(error.message));
function newRoom(){dialog('<h2>開啟新的對話</h2><p>給這個頻道一個主題，讓相關的討論聚在一起。</p><label for="room-name">頻道名稱</label><input id="room-name" maxlength="40" placeholder="例如：新學期備課" required><label for="room-description">頻道說明（選填）</label><textarea id="room-description" maxlength="200" rows="3" placeholder="這裡適合聊些什麼？"></textarea>',async()=>{const room=await api('/rooms','POST',{name:$('#room-name').value,description:$('#room-description').value});await refresh();switchRoom(room.id);},'建立頻道');}
$('#dialog-form').addEventListener('submit',async e=>{e.preventDefault();$('#dialog-submit').disabled=true;try{const close=await dialogAction?.();if(close!==false)$('#dialog').close();}catch(error){$('#dialog-error').textContent=error.message;}finally{$('#dialog-submit').disabled=false;}});
$('#close-dialog').onclick=()=>$('#dialog').close();$('#dialog').addEventListener('cancel',e=>{if($('#dialog').dataset.required==='true')e.preventDefault();});
$('#logout').onclick=async()=>{try{await api('/logout','POST',{});signedOut();}catch(error){if(error.status!==401)toast(error.message);}};
$('#new-room').onclick=$('#add-channel').onclick=newRoom;$('#profile').onclick=()=>profile();
$('#room-list').onclick=e=>{const button=e.target.closest('[data-room]');if(button)switchRoom(button.dataset.room);};
for(const button of document.querySelectorAll('[data-filter]'))button.onclick=()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('selected',b===button));renderRooms();};
for(const button of document.querySelectorAll('[data-tab]'))button.onclick=()=>setTab(button.dataset.tab);
$('#nav-chat').onclick=()=>setTab('chat');$('#nav-files').onclick=()=>setTab('files');
function toggleDetails(){$('#details').hidden=!$('#details').hidden;$('#nav-members').classList.toggle('active',!$('#details').hidden);}
$('#details-toggle').onclick=$('#nav-members').onclick=toggleDetails;$('#details').onclick=e=>{if(e.target.closest('[data-close-details]'))toggleDetails();};
$('#mobile-menu').onclick=()=>$('.sidebar').classList.toggle('open');
$('#search').addEventListener('input',()=>{setTab('chat');renderMessages();});$('#search-summary').onclick=e=>{if(e.target.closest('#clear-search')){$('#search').value='';renderMessages();}};
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();$('#search').focus();}});
function readVisibleRoom(){if(!document.hidden&&state.user){markSeen();renderRooms();}}
document.addEventListener('visibilitychange',readVisibleRoom);window.addEventListener('focus',readVisibleRoom);
window.addEventListener('storage',event=>{if(event.key==='together-read-'+seenOwner&&state.user){try{seen=JSON.parse(event.newValue)||{};}catch{seen={};}renderRooms();}});
$('#messages').onclick=async e=>{try{
 const reaction=e.target.closest('[data-react]');if(reaction){await api(`/messages/${reaction.dataset.id}/reaction`,'POST',{emoji:reaction.dataset.react});await refresh();return;}
 const reply=e.target.closest('[data-reply]'),edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');
 if(reply||edit){const m=state.messages.find(m=>m.id===(reply?.dataset.reply||edit?.dataset.edit));editing=edit?m.id:null;replyTo=reply?m.id:null;$('#reply-banner').hidden=false;$('#reply-banner').innerHTML=`<span>${edit?'編輯訊息':'回覆 '+esc(person(m.userId).name)}：${esc(m.text||m.attachment?.name||'附件')}</span><button id="cancel-reply" aria-label="取消">${icon('x')}</button>`;if(edit){drafts[roomId]=$('#message-input').value;$('#message-input').value=m.text;}$('#message-input').focus();}
 if(del)dialog('<h2>刪除這則訊息？</h2><p>訊息及其附件將從工作區中移除，此操作無法復原。</p>',async()=>{await api('/messages/'+del.dataset.delete,'DELETE');await refresh();},'刪除訊息');
 }catch(error){toast(error.message);}};
$('#reply-banner').onclick=e=>{if(e.target.closest('#cancel-reply')){if(editing)$('#message-input').value=drafts[roomId]||'';replyTo=null;editing=null;$('#reply-banner').hidden=true;}};
$('#composer').addEventListener('submit',async e=>{e.preventDefault();if(sending)return;const text=$('#message-input').value.trim();if(!text&&!attachment)return;if(!state.user){profile(true);return;}sending=true;$('#send').disabled=true;$('#message-input').disabled=true;
 try{if(editing)await api('/messages/'+editing,'PATCH',{text});else await api('/messages','POST',{roomId,text,replyTo,attachment});$('#message-input').value='';drafts[roomId]='';replyTo=null;editing=null;attachment=null;$('#file-input').value='';$('#attachment-preview').hidden=true;$('#reply-banner').hidden=true;await refresh(true);}catch(error){toast(error.message);}finally{sending=false;$('#send').disabled=false;$('#message-input').disabled=false;$('#message-input').focus();}});
$('#message-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('#composer').requestSubmit();}});
$('#attach').onclick=()=>{if(editing)return toast('編輯訊息時無法變更附件，請另傳新訊息。');$('#file-input').click();};
$('#file-input').onchange=async()=>{const file=$('#file-input').files[0];if(!file)return;if(file.size>5*1024*1024){$('#file-input').value='';return toast('附件最大為 5 MB。');}try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(new Error('檔案讀取失敗。'));reader.readAsDataURL(file);});attachment={name:file.name,data};$('#attachment-preview').hidden=false;$('#attachment-preview').innerHTML=`${icon('file')} ${esc(file.name)} · ${size(file.size)}<button id="remove-file" type="button" aria-label="移除附件">×</button>`;}catch(error){toast(error.message);}};
$('#attachment-preview').onclick=e=>{if(e.target.closest('#remove-file')){attachment=null;$('#file-input').value='';$('#attachment-preview').hidden=true;}};
$('#emoji-picker').innerHTML=['👍','❤️','🎉','👋','✅','☕','😊','💡'].map(e=>`<button type="button" data-emoji="${e}" aria-label="插入 ${e}">${e}</button>`).join('');$('#emoji').onclick=()=>$('#emoji-picker').hidden=!$('#emoji-picker').hidden;$('#emoji-picker').onclick=e=>{const b=e.target.closest('[data-emoji]');if(b){const input=$('#message-input');input.setRangeText(b.dataset.emoji,input.selectionStart,input.selectionEnd,'end');input.focus();$('#emoji-picker').hidden=true;}};
$('#help').onclick=()=>dialog('<h2>讓合作更靠近</h2><div class="help-copy"><p>Together 是受 Teams 介面啟發的本機聊天軟體。</p><ul><li>建立頻道，依主題整理討論。</li><li>訊息支援回覆、按讚、編輯與刪除。</li><li>分享 5 MB 以內的附件，在「共用檔案」下載。</li><li>使用不同瀏覽器加入，可驗證即時同步。</li></ul><p>資料保存在伺服器的 data 資料夾。使用帳號與密碼登入，所有成員功能相同。新申請需經本機管理者核准，附件可供所有已核准成員分享。未讀訊息會顯示於分頁標題與圖示；此版尚無私訊、音視訊通話或 Microsoft Teams 整合。</p></div>',()=>{},'知道了');
updateNotification();
try{await refresh(true);connect();}catch(error){if(error.status!==401){$('#connection').textContent='無法連線';authDialog();toast('無法連線至伺服器，請執行 start.sh 後重新整理。');}}
