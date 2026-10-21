import {DEFAULT_COMPARISON,COMPARISON_PRESETS,comparisonPreset,comparisonMetrics,comparisonState,comparisonFrameState,BODY_COLORS,validateComparison} from './comparison.js';
const f=n=>Math.abs(n)<1e-10?'0':Number(n.toPrecision(5)).toString();
const fields=[['name','名稱','text'],['speed','初速（m/s）','number',0,100],['angle','仰角（°）','number',-90,90],['height','高度（m）','number',0,100],['x0','起點 X（m）','number',-100,100],['delay','延後發射（s）','number',0,30]];
export function mountComparison(root,{teacher,scene,apply,report}){
 root.innerHTML=`<h3>多物體拋體比較</h3><p class="hint">同一時鐘、同一重力、同一比例尺。Ｚ軸向上；忽略空氣阻力，落地後停住且速度顯示０，不模擬碰撞。</p>${teacher?`<label>教學範例<select id="compare-preset">${Object.entries(COMPARISON_PRESETS).map(([v,n])=>`<option value="${v}">${n}</option>`).join('')}</select></label><button type="button" id="compare-load" class="secondary wide">載入範例到表單</button>`:''}<p class="hint">等射程與互餘角範例假設同高度起落；改變高度後，不保證仍有相同射程。射程指相對起點的水平位移，落點 X 則是共同座標。</p>
 <form id="compare-form"><div class="coordinates"><label>重力（m/s²）<input id="compare-gravity" type="number" min="0.1" max="30" step="any" required></label><label>播放倍率<input id="compare-rate" type="number" min="0.05" max="10" step="any" required></label><label>顯示倍率<input id="compare-scale" type="number" min="0.01" max="10" step="any" required></label></div><div id="compare-bodies"></div>${teacher?'<button type="button" id="compare-add" class="secondary wide">＋ 加入物體（最多四個）</button><button type="submit" id="compare-apply" class="wide">套用比較並歸零</button>':''}</form>
 <section class="relative-panel"><label>參考系（只改變自己的觀察）<select id="compare-reference" data-local><option value="ground">地面參考系</option></select></label><p id="reference-description" class="hint"></p><output id="relative-values"></output><p class="hint">選物體後，以它為原點、座標軸保持平行。位置、速度及軌跡均換成相對量；不是單純移動攝影機。下方「飛行預測」仍採地面數據。發射與落地瞬間不模擬衝量。</p></section><label>觀察物體<select id="compare-focus" data-local></select></label><p class="hint">各色箭頭為各物體合速度；觀察物體另顯示橘色水平、藍色垂直分量。可在下方關閉箭頭或預測軌跡，先讓學生預測結果。</p><p id="compare-summary" class="hint"></p><label>比較欄位<select id="compare-columns" data-local><option value="live">同一時刻的位置與速度</option><option value="results">射程、最高點與飛行時間</option></select></label><div class="comparison-table" tabindex="0" aria-label="多物體比較數值表"><table><caption>同一時刻的位置與速度／完整飛行預測</caption><thead><tr>${['物體','狀態','X（m）','Z（m）','vₓ（m/s）','v_z（m/s）','射程（m）','最高高度（m）','飛行時間（s）','落地時刻（s）','落點 X（m）'].map(v=>`<th scope="col">${v}</th>`).join('')}</tr></thead><tbody></tbody></table></div>`;
 const conditions=document.createElement('details');conditions.innerHTML=`<summary>${teacher?'查看／編輯':'查看'}各物體發射條件</summary>`;root.querySelector('#compare-form').before(conditions);conditions.append(root.querySelector('#compare-form'));
 const $=id=>root.querySelector('#'+id);let reference='ground',data=structuredClone(DEFAULT_COMPARISON),draft=structuredClone(data),dirty=false,allowed=false,signature='';
 function controls(){root.querySelectorAll('input,button,select:not([data-local])').forEach(e=>e.disabled=!allowed);if(teacher)$('compare-add').disabled=!allowed||Object.keys(draft.objects).length>=4;}
 function capture(){for(const k of ['gravity','rate','scale'])draft[k]=$('compare-'+k).valueAsNumber;for(const [id,b] of Object.entries(draft.objects))for(const [key,,type] of fields){const e=root.querySelector(`[data-body="${id}"][data-key="${key}"]`);b[key]=type==='number'?e.valueAsNumber:e.value;}return structuredClone(draft);}
 function form(){
  for(const k of ['gravity','rate','scale'])$('compare-'+k).value=draft[k];
  $('compare-bodies').replaceChildren();
  for(const [id,b] of Object.entries(draft.objects)){
   const box=document.createElement('fieldset');box.style.borderColor=BODY_COLORS[id];
   box.innerHTML=`<legend>物體 ${id.slice(1)*1+1}</legend><div class="pair">${fields.map(([k,title,type,min,max])=>`<label>${title}<input data-body="${id}" data-key="${k}" type="${type}" ${type==='number'?`min="${min}" max="${max}" step="any"`:'maxlength="24"'} required></label>`).join('')}</div>${teacher&&!['p0','p1'].includes(id)?'<button type="button" class="secondary">移除此物體</button>':''}`;
   for(const [k] of fields)box.querySelector(`[data-key="${k}"]`).value=b[k];
   box.querySelector('button')?.addEventListener('click',()=>{capture();delete draft.objects[id];dirty=true;form();});$('compare-bodies').append(box);
  }controls();
 }
 function focus(){const select=$('compare-focus'),old=select.value;select.replaceChildren();for(const [id,b] of Object.entries(data.objects)){const o=document.createElement('option');o.value=id;o.textContent=b.name;select.append(o);}select.value=data.objects[old]?old:'p0';scene?.focusComparison(select.value);}
 function references(){
  if(!data.objects[reference])reference='ground';
  const select=$('compare-reference');select.replaceChildren();
  for(const [id,name] of [['ground','地面參考系'],...Object.entries(data.objects).map(([id,b])=>[id,`跟著 ${b.name}（相對參考系）`])]){const option=document.createElement('option');option.value=id;option.textContent=name;select.append(option);}select.value=reference;
 }
 $('compare-reference').onchange=()=>{reference=$('compare-reference').value;if($('compare-focus').value===reference){$('compare-focus').value=Object.keys(data.objects).find(id=>id!==reference);scene?.focusComparison($('compare-focus').value);}scene?.referenceComparison(reference);};
 $('compare-focus').onchange=()=>scene?.focusComparison($('compare-focus').value);
 if(teacher){
  $('compare-form').oninput=()=>{dirty=true;report('比較參數尚未套用；畫面仍使用上次設定。');};
  $('compare-load').onclick=()=>{draft=comparisonPreset($('compare-preset').value);dirty=true;conditions.open=true;form();report('範例已填入，按「套用比較並歸零」同步到全班。');};
  $('compare-add').onclick=()=>{capture();const id=['p0','p1','p2','p3'].find(k=>!draft.objects[k]);if(!id)return;draft.objects[id]={...draft.objects.p0,name:String.fromCharCode(65+Number(id.slice(1)))};dirty=true;form();};
  $('compare-form').onsubmit=async event=>{event.preventDefault();try{const next=validateComparison(capture());await apply(next);dirty=false;}catch(e){report(e.message,true);}};
 }
 return {
  setAccess(v){allowed=teacher&&v;controls();},isDirty:()=>dirty,
  setData(next){data=next||structuredClone(DEFAULT_COMPARISON);const sig=JSON.stringify(data);if(!dirty||sig!==signature||!teacher){draft=structuredClone(data);dirty=false;form();}signature=sig;focus();references();},
  tick(t){
   const anchor=data.objects[reference],focusId=$('compare-focus').value||'p0',selected=data.objects[focusId],relative=comparisonFrameState(data,focusId,t,reference);
   $('reference-description').textContent=anchor?`目前原點：${anchor.name}。所有箭頭顯示相對速度；Ｚ＝０是觀察物體的高度，不是地面。`:'目前為地面參考系，顯示對地位置與速度。';
   const tuple=v=>`（${f(v.x)}，${f(v.z)}）`;
   $('relative-values').textContent=`${selected.name}${anchor?' 相對 '+anchor.name:' 對地'}（Ｘ，Ｚ）\n位置＝${tuple(relative.position)} m\n速度＝${tuple(relative.velocity)} m/s\n加速度＝${tuple(relative.acceleration)} m/s²`+(anchor?`\n兩者距離＝${f(Math.hypot(relative.position.x,relative.position.z))} m\n`+(relative.phase==='flying'&&comparisonState(data,anchor,t).phase==='flying'?'兩者皆自由飛行：相對加速度為０。':'含等待或落地狀態：相對運動不一定等速。'):'');
   const rows=[],results=$('compare-columns').value==='results';
   const headings=results?['物體','射程（m）','最高高度（m）','飛行時間（s）','落地時刻（s）','落點 X（m）']:['物體','狀態','X（m）','Z（m）','vₓ（m/s）','v_z（m/s）'];
   const header=document.createElement('tr');for(const name of headings){const th=document.createElement('th');th.scope='col';th.textContent=name;header.append(th);}root.querySelector('thead').replaceChildren(header);
   root.querySelector('caption').textContent=results?'地面系完整飛行預測（與當前播放進度無關）':(anchor?'相對 '+anchor.name+' 的位置與速度':'同一時刻的對地位置與速度');
   for(const [id,b] of Object.entries(data.objects)){
    const m=comparisonMetrics(data,b),s=comparisonFrameState(data,id,t,reference),row=document.createElement('tr');
    const values=results?[b.name,m.range,m.peak,m.flight,m.arrival,m.landingX]:[b.name,{waiting:'待發射',flying:'飛行中',landed:'已落地'}[s.phase],s.position.x,s.position.z,s.velocity.x,s.velocity.z];
    for(const [i,v] of values.entries()){const td=document.createElement(i===0?'th':'td');td.textContent=typeof v==='number'?f(v):v;if(i===0){td.scope='row';td.style.color=BODY_COLORS[id];}row.append(td);}rows.push(row);
   }
   root.querySelector('tbody').replaceChildren(...rows);
   $('compare-summary').textContent=`共同時刻 t＝${f(t)} s。飛行時間從各自發射起算，落地時刻包含延後發射時間。`;
  }
 };
}
