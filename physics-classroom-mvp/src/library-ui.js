import { makeSnapshot, validateSnapshot } from './snapshots.js';
const KEY='physics-classroom-scenes-v1';
export function mountLibrary({container,getScene,load,report}) {
  container.innerHTML=`<h2>教學場景</h2><p class="hint">儲存在這台瀏覽器。跨電腦請匯出 JSON；載入後會取代本教室場景並歸零暫停，相機視角保留。</p><label>場景名稱<input id="scene-name" maxlength="60" placeholder="例如：拋體運動第一課"></label><button id="scene-save" class="secondary wide">儲存為新場景</button><label>本機場景<select id="scene-choice"></select></label><button id="scene-load" class="wide">載入所選場景到教室</button><button id="scene-export" class="secondary wide">匯出目前場景 JSON</button><label class="file-label">選擇場景 JSON<input id="scene-import" type="file" accept=".json,application/json"></label><p id="import-preview" class="hint"></p><button id="scene-apply-import" class="wide" disabled>套用匯入場景到教室</button>`;
  const $=id=>container.querySelector('#'+id);
  let saved=[],imported=null,allowed=false;
  try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(raw))throw new Error();saved=raw.map(validateSnapshot);}catch{report('無法讀取本機場景庫；仍可匯出目前場景。',true);}
  const controls=()=>{
    $('scene-load').disabled=!allowed||!saved.length;
    $('scene-apply-import').disabled=!allowed||!imported;
  };
  function options(){
    $('scene-choice').replaceChildren(...saved.map((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent=s.name;return o;}));controls();
  }
  function current(){const {vectors,lab}=getScene();return makeSnapshot($('scene-name').value.trim()||'未命名場景',vectors,lab);}
  const attempt=fn=>async()=>{try{await fn();}catch(e){report(e.message,true);}};
  $('scene-save').onclick=attempt(()=>{
    if(saved.length>=50)throw new Error('本機場景已達５０個；請先匯出備份。');
    const next=[...saved,current()];localStorage.setItem(KEY,JSON.stringify(next));saved=next;options();$('scene-choice').value=String(saved.length-1);report('場景已儲存到這台瀏覽器。');
  });
  async function apply(snapshot){
    if(!allowed)throw new Error('請先解鎖老師端並確認連線。');
    if(!confirm(`將「${snapshot.name}」載入本教室，取代目前向量與模型並歸零？`))return;
    await load(validateSnapshot(snapshot));
  }
  $('scene-load').onclick=attempt(()=>apply(saved[Number($('scene-choice').value)]));
  $('scene-export').onclick=attempt(()=>{
    const snapshot=current(),url=URL.createObjectURL(new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=snapshot.name.replace(/[^\p{L}\p{N}_-]/gu,'_')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);report('已匯出場景 JSON。');
  });
  $('scene-import').onchange=attempt(async()=>{
    imported=null;controls();$('import-preview').textContent='';const file=$('scene-import').files[0];if(!file)return;
    if(file.size>200000)throw new Error('場景檔案不可超過２００ kB。');
    imported=validateSnapshot(JSON.parse(await file.text()));
    $('import-preview').textContent=`待套用：${imported.name}，${Object.keys(imported.vectors).length} 支向量。`;controls();
  });
  $('scene-apply-import').onclick=attempt(()=>apply(imported));options();
  return {setAccess:value=>{allowed=value;controls();}};
}
