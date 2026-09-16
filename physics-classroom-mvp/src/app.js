import './style.css';
import QRCode from 'qrcode';
import {mountLibrary} from './library-ui.js';
import {createScene} from './scene.js';
import {connectStore} from './store.js';
import {roomId,validateVector,magnitude,MAX_VECTORS} from './model.js';
import {DEFAULT_LAB} from './physics.js';
import {mountLab} from './lab-ui.js';

const teacher=document.body.dataset.role==='teacher',$=s=>document.querySelector(s);
let room;
const urlParams=new URLSearchParams(location.search);
try{room=roomId(urlParams.get('room')||'PHYS01');}catch(e){$('#app').textContent=e.message;throw e;}

const inputs=prefix=>['x','y','z'].map(axis=>`<label>${axis.toUpperCase()}<input aria-label="${prefix==='origin'?'起點':'分量'} ${axis.toUpperCase()}" id="${prefix}-${axis}" type="number" min="-100" max="100" step="any" required></label>`).join('');

$('#app').innerHTML=`<header class="topbar"><a class="brand" href="/">向量教室<span>3D PHYSICS CLASSROOM</span></a><div class="room-badge">教室 <strong id="room-name"></strong></div><span class="role">${teacher?'老師端':'學生端・只讀'}</span><span id="connection" role="status">連線中…</span></header>
<main class="classroom"><section class="stage"><div class="stage-heading"><div class="eyebrow">PHYSICS LAB</div><h1>讓向量，開始運動。</h1><p>${teacher?'從向量運算，走進電磁場。':'場景由老師更新，視角由你決定。'}</p></div><div id="viewport"></div><div class="stage-toolbar"><div class="view-controls"><button data-view="3d" class="secondary compact active">3D 視角</button><button data-view="2d-top" class="secondary compact">2D Top (XY)</button><button data-view="2d-front" class="secondary compact">2D Front (XZ)</button><button data-view="2d-side" class="secondary compact">2D Side (YZ)</button></div><div><button id="fit-scene" class="secondary compact">看完整場景</button> <button id="reset-camera" class="secondary compact">重設視角</button></div></div><div class="axis-key"><span class="x">● X</span><span class="y">● Y</span><span class="z">● Z</span><span>網格間距：１</span></div></section>
<aside class="sidebar">
${teacher?`<section class="auth-card"><h2>老師操作權限</h2><p id="auth-status" class="hint">請輸入老師密碼，解鎖編輯。</p><form id="login-form"><label for="teacher-password">老師密碼</label><input id="teacher-password" type="password" autocomplete="current-password" required minlength="6"><button id="login" class="wide" disabled>解鎖老師端</button></form><button id="logout" class="secondary wide" hidden>鎖定老師端</button><a id="watch-link" class="hint">切換學生觀看模式</a></section>`:''}
<p id="message" role="status" aria-live="polite"></p><section id="lab-panel"></section><section id="vector-section"><div class="section-title"><h2>場景向量</h2><span id="count">０個</span></div><div id="vector-list" aria-label="場景向量清單"></div>
${teacher?`<button id="add" class="wide" disabled>＋ 新增向量</button><form id="editor" hidden><div class="section-title"><h2>編輯向量</h2></div><label for="label">名稱</label><input id="label" maxlength="24" required autocomplete="off"><div class="color-row"><label for="color">顏色</label><input id="color" type="color" value="#57dfc2"></div><fieldset><legend>起點座標</legend><div class="coordinates">${inputs('origin')}</div></fieldset><fieldset><legend>向量分量</legend><div class="coordinates">${inputs('components')}</div></fieldset><p class="hint">終點＝起點＋分量。改起點可平移向量。</p><label>三軸拖曳把手<select id="drag-part"><option value="off">關閉拖曳</option><option value="components">拖曳終點（改變分量）</option><option value="origin">拖曳起點（平移向量）</option></select></label><p class="hint">先選取向量，再拖曳畫面中的紅／綠／藍軸。放開後同步到學生，精度為０．０１。</p><button id="save" type="submit" class="wide">儲存並同步</button><button id="delete" type="button" class="danger wide">刪除此向量</button></form>`:''}</section>
${teacher?'<section id="scene-library" class="share"></section><section class="share"><h2>邀請學生</h2><canvas id="student-qr" aria-label="學生加入教室 QR code"></canvas><a id="student-link" target="_blank" rel="noopener">開啟學生端 ↗</a><button id="copy-link" class="secondary wide">複製學生網址</button><p id="share-hint" class="hint"></p></section>':'<section class="student-note"><h2>你的觀察席</h2><p>自由旋轉、縮放或平移。老師更新模型時，你的視角會保留。</p></section>'}
<details class="notice"><summary>模型與權限說明</summary><p>只有通過老師密碼驗證的指定帳號可修改資料。學生免登入觀看。電磁模型假設場均勻且固定，採非相對論運動方程；粒子由原點出發。</p></details></aside></main>`;
$('#room-name').textContent=room;

let scene,store,vectors={},selected=null,online=false,authorized=false,ready=false,pending=false,dirty=false,labUI,libraryUI;
function message(text,error=false){$('#message').textContent=text;$('#message').classList.toggle('error',error);}

try{scene=createScene($('#viewport'));}catch{message('無法啟動３Ｄ畫面。請使用支援 WebGL ２的瀏覽器。',true);}
$('#reset-camera').onclick=()=>{
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('active'));
  $('[data-view="3d"]')?.classList.add('active');
  scene?.reset();
};
$('#fit-scene').onclick=()=>scene?.fit();

document.querySelectorAll('[data-view]').forEach(btn=>{
  btn.onclick=e=>{
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    scene?.setView(e.target.dataset.view);
  };
});

function controls(){
  libraryUI?.setAccess(teacher&&authorized&&ready&&online&&!pending);
  syncDrag();
  labUI?.setAccess(authorized&&ready&&online&&!pending);
  if(!teacher)return;
  $('#add').disabled=!authorized||!ready||!online||pending||Object.keys(vectors).length>=MAX_VECTORS;
  $('#save').disabled=$('#delete').disabled=!authorized||!ready||!online||pending;
  $('#editor').querySelectorAll('input').forEach(i=>i.disabled=!authorized||pending);
}

function syncDrag(){
  const part=teacher?$('#drag-part').value:'off';
  scene?.setDrag(selected,part,teacher&&part!=='off'&&authorized&&ready&&online&&!pending,async(id,v)=>{
    try{await mutate(()=>store.write(id,v),'拖曳結果已同步。');}catch{scene?.update(vectors);}
  });
}
function populate(){
  if(!teacher)return;$('#editor').hidden=!authorized||!selected||!vectors[selected];
  if($('#editor').hidden)return;const v=vectors[selected];$('#label').value=v.label;$('#color').value=v.color;
  for(const field of ['origin','components'])for(const axis of ['x','y','z'])$(`#${field}-${axis}`).value=v[field][axis];dirty=false;
}

function renderList(){
  $('#count').textContent=`${Object.keys(vectors).length} 個`;$('#vector-list').replaceChildren();
  if(!Object.keys(vectors).length){const e=document.createElement('p');e.className='empty';e.textContent=teacher?'尚無向量，老師解鎖後可新增。':'等待老師新增向量…';$('#vector-list').append(e);}
  for(const [id,v]of Object.entries(vectors)){
    const row=document.createElement(teacher?'button':'div');row.className=`vector-row ${selected===id?'selected':''}`;row.dataset.id=id;row.style.setProperty('--vector-color',v.color);
    const title=document.createElement('strong');title.textContent=v.label;const detail=document.createElement('small');detail.textContent=`（${v.components.x}，${v.components.y}，${v.components.z}） ｜v｜＝${magnitude(v).toFixed(2)}`;row.append(title,detail);
    if(teacher){row.disabled=!authorized||pending;row.onclick=()=>{selected=id;populate();renderList();syncDrag();};}$('#vector-list').append(row);
  }
}

async function mutate(operation,success){
  if(pending||!online||!authorized)throw new Error('請先解鎖老師端並確認連線。');
  pending=true;controls();renderList();message('同步中…');
  try{await operation();dirty=false;populate();message(success);}catch(e){message(`未能儲存：${e.message}`,true);throw e;}finally{pending=false;controls();renderList();}
}

const safely=p=>p.catch(()=>{});
labUI=mountLab({teacher,scene,getNow:()=>store?.now()??Date.now(),report:message,write:lab=>mutate(()=>store.writeLab(lab),'模型已同步。')});
labUI.setLab(structuredClone(DEFAULT_LAB));controls();

if(teacher){
  libraryUI=mountLibrary({container:$('#scene-library'),getScene:()=>({vectors,lab:labUI.getLab()}),load:snapshot=>mutate(()=>store.loadScene(snapshot),'場景已載入並同步。'),report:message});
  $('#drag-part').onchange=syncDrag;
  const url=new URL('student.html',location.href);url.searchParams.set('room',room);if(urlParams.get('emulator')==='1')url.searchParams.set('emulator','1');
  url.searchParams.delete('pwd');
  QRCode.toCanvas($('#student-qr'),url.href,{width:240,margin:4,errorCorrectionLevel:'M',color:{dark:'#0b1220',light:'#ffffff'}}).catch(()=>message('QR code 產生失敗，請使用學生網址。',true));
  $('#student-link').href=$('#watch-link').href=url.href;
  $('#share-hint').textContent=url.searchParams.get('emulator')==='1'?'本機模式僅供這台電腦測試。':'分享給學生即可觀看，不需要老師密碼。';
  $('#copy-link').onclick=async()=>{try{await navigator.clipboard.writeText(url.href);message('已複製學生網址。');}catch{message('請長按或右鍵複製學生端連結。');}};
  $('#login-form').onsubmit=async event=>{
    event.preventDefault();$('#login').disabled=true;let password=$('#teacher-password').value;$('#teacher-password').value='';
    try{await store.login(password);password='';message('老師密碼驗證成功。');}
    catch(e){message(e.code==='auth/too-many-requests'?'嘗試次數過多，請稍後再試。':e.code==='auth/network-request-failed'?'登入連線失敗，請檢查網路。':'密碼不正確或帳號未啟用。',true);}
    finally{password='';$('#login').disabled=false;}
  };
  $('#logout').onclick=async()=>{try{await store.logout();dirty=false;message('老師端已鎖定。');}catch(e){message(e.message,true);}};
  $('#editor').oninput=event=>{if(event.target.id!=='drag-part')dirty=true;};
  $('#add').onclick=()=>safely(mutate(async()=>{const n=Object.keys(vectors).length;selected=await store.create({label:`向量 ${n+1}`,color:['#57dfc2','#ffba69','#a894ff','#ff829d'][n%4],origin:{x:0,y:0,z:0},components:{x:3,y:2,z:1}});},'已新增向量。'));
  $('#editor').onsubmit=event=>{event.preventDefault();const v={label:$('#label').value.trim(),color:$('#color').value};for(const field of ['origin','components'])v[field]=Object.fromEntries(['x','y','z'].map(k=>[k,$(`#${field}-${k}`).valueAsNumber]));try{validateVector(v);}catch(e){message(e.message,true);return;}const id=selected;safely(mutate(()=>store.write(id,v),'已同步向量。'));};
  $('#delete').onclick=()=>{const id=selected;safely(mutate(()=>store.delete(id),'已刪除向量。'));};
}

try{
  store=await connectStore(room,{
    onAuth:async(user,allowed)=>{
      authorized=allowed;
      if(teacher){$('#auth-status').textContent=allowed?'已解鎖，只有你能修改教室。':user?'此帳號沒有老師權限，請鎖定後重新輸入老師密碼。':'請輸入老師密碼，解鎖編輯。';$('#login-form').hidden=allowed;$('#logout').hidden=!user;}
      if(!allowed){dirty=false;selected=null;}controls();populate();renderList();
    },
    onScene:data=>{vectors=data;ready=true;if(selected&&!vectors[selected]){selected=null;dirty=false;}scene?.update(vectors);labUI.setVectors(vectors);renderList();if(!dirty)populate();controls();},
    onLab:data=>labUI.setLab(data),
    onConnection:async(connected,emulator)=>{
      online=connected;$('#connection').textContent=connected?(emulator?'本機模擬器・已連線':'已連線'):'離線・等待重新連線';
      $('#connection').classList.toggle('connected',connected);controls();
      
      const pwd=urlParams.get('pwd');
      if(teacher&&pwd&&connected&&!authorized){
        try{
          await store.login(pwd);
          message('老師自動驗證成功。');
          urlParams.delete('pwd');
          history.replaceState({},'',`${location.pathname}?${urlParams.toString()}`);
        }catch{
          message('自動驗證失敗，請輸入密碼解鎖。',true);
        }
      }
    },
    onError:e=>{ready=false;message(`讀取失敗：${e.message}`,true);controls();}
  });
  if(teacher)$('#login').disabled=false;
}catch(e){$('#connection').textContent='尚未連線';message(e.message,true);}

window.addEventListener('beforeunload',event=>{if(teacher&&(dirty||pending||labUI.isDirty())){event.preventDefault();event.returnValue='';}});
