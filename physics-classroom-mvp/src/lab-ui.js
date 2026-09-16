import { DEFAULT_LAB, AXES, algebra, norm, vec, particleMetrics, validateLab, simulationTime, simulationDuration, simulationParameters, isMechanics, vectorRelation, flightTime } from './physics.js';
export const numberText=n=>n===null?'—':Math.abs(n)<1e-12&&n!==0||Math.abs(n)>=1e5? n.toExponential(3):Number(n.toPrecision(5)).toString();
const tuple=v=>`（${AXES.map(k=>numberText(v[k])).join('，')}）`;
const fields=(name,title,unit,limit)=>`<fieldset><legend>${title}（${unit}）</legend><div class="coordinates">${AXES.map(k=>`<label>${k.toUpperCase()}<input id="${name}-${k}" aria-label="${title} ${k.toUpperCase()}" type="number" step="any" min="-${limit}" max="${limit}" required></label>`).join('')}</div></fieldset>`;
export function mountLab({teacher,scene,write,getNow,report}) {
  const container=document.querySelector('#lab-panel');
  container.innerHTML=`<h2>教學模型</h2><label for="mode">場景模式</label><select id="mode" ${teacher?'':'disabled'}><option value="vectors">自由向量</option><option value="algebra">向量運算</option><option value="lorentz">帶電粒子・電磁場</option><option value="projectile">拋體運動</option><option value="oscillator">簡諧運動</option></select>
  <section id="algebra-panel" hidden><div class="pair"><label>A<select id="vector-a"></select></label><label>B<select id="vector-b"></select></label></div><label>運算<select id="operation"><option value="add">A＋B（首尾相接）</option><option value="subtract">A−B（加上負向量）</option><option value="cross">A×B（右手定則）</option><option value="angle">A、B 夾角</option><option value="projection">A 在 B 上的投影</option></select></label><p class="hint">採用向量分量，統一移到原點比較。</p><output id="algebra-result"></output>${teacher?'<button id="apply-algebra" class="wide">顯示運算結果</button>':''}</section>
  <section id="mechanics-panel" hidden><p id="mechanics-formula" class="formula"></p><p id="mechanics-assumptions" class="hint"></p><form id="mechanics-form">${[
    ['height','初始高度（m）',0,100,'projectile'],['speed','初速率（m/s）',0,100,'projectile'],['angle','仰角（度）',-90,90,'projectile'],['gravity','重力加速度（m/s²）',.01,100,'projectile'],
    ['amplitude','振幅（m）',0,100,'oscillator'],['omega','角頻率（rad/s）',.01,100,'oscillator'],['phase','初相位（度）',-360,360,'oscillator'],
    ['mass','質量（kg）',.001,1000,'both'],['duration','模擬總時間（s）',.01,1000,'both'],['rate','每秒播放的物理時間（s）',.001,100,'both'],['scale','顯示倍率',.001,10,'both']
  ].map(([key,title,min,max,mode])=>`<label data-mechanics-mode="${mode}">${title}<input id="mech-${key}" type="number" step="any" min="${min}" max="${max}" required></label>`).join('')}${teacher?'<button class="wide" type="submit">套用力學參數並歸零</button>':''}</form></section>
  <section id="particle-panel" hidden><p class="formula">F＝q（E＋v×B）</p><p class="hint">均勻、固定電磁場；忽略重力、輻射與相對論效應。所有數據採 SI 單位。</p>
  ${teacher?`<label>教學範例<select id="preset"><option value="helix">螺旋運動・純磁場</option><option value="circle">圓周運動</option><option value="electric">純電場加速</option><option value="drift">交叉電磁場漂移</option><option value="electron">電子・微秒尺度</option></select></label><button id="load-preset" class="secondary wide">載入範例到表單</button>`:''}
  <form id="particle-form"><div class="pair"><label>電荷 q（C）<input id="charge" type="number" step="any" min="-1000" max="1000" required></label><label>質量 m（kg）<input id="mass" type="number" step="any" min="1e-35" max="1e6" required></label></div>
  ${fields('velocity','初速度 v₀','m/s',1e7)}${fields('electric','電場 E','N/C',1000)}${fields('field','磁場 B','T',1000)}
  <label>模擬總時間（s）<input id="duration" type="number" step="any" min="1e-12" max="10000" required></label><label>每秒播放的物理時間（s）<input id="rate" type="number" step="any" min="1e-15" max="1000" required></label><label>顯示倍率（１ m 對應的網格數）<input id="scale" type="number" step="any" min="1e-9" max="1e12" required></label>
  ${teacher?'<button type="submit" id="apply-particle" class="wide">套用參數並歸零</button>':''}</form>
  ${teacher?'<div id="playback"><div class="actions"><button id="play">播放</button><button id="rewind" class="secondary">歸零</button></div><label>時間位置<input id="seek" type="range" min="0" max="1000" step="1" value="0"></label></div>':''}
  <p id="time-status" role="status"></p><div id="arrow-options" class="arrow-options">${['E','B','v','vxB','FE','FB','F'].map(key=>`<label><input type="checkbox" data-arrow="${key}" ${['E','B','v','F'].includes(key)?'checked':''}>${{vxB:'v×B',FE:'電力',FB:'磁力',F:'合力'}[key]||key}</label>`).join('')}</div><p id="arrow-hint" class="hint">箭頭顯示方向，不同比例的物理量不共用箭長尺度。淡線為預測軌跡，亮線為已走過路徑。</p><dl id="metrics"></dl></section>`;
  const $=id=>container.querySelector('#'+id);
  const panel=$('particle-panel');
  panel.insertBefore($('time-status'),panel.children[2]);
  if(teacher)panel.insertBefore($('playback'),$('time-status'));
  const transport=document.createElement('section');transport.id='simulation-controls';container.append(transport);
  if(teacher)transport.append($('playback'));
  transport.append($('time-status'),$('arrow-options'),$('arrow-hint'),$('metrics'));
  let lab=structuredClone(DEFAULT_LAB),vectors={},editable=false,dirty=false;
  const controls=()=>{
    for(const element of container.querySelectorAll('select,input:not([type="checkbox"]),button'))element.disabled=!editable;
    if(teacher){$('play').textContent=lab.clock.playing&&simulationTime(lab,getNow())<simulationDuration(lab)?'暫停':'播放';}
  };
  function populateParticle(p){for(const key of ['charge','mass','duration','rate','scale'])$(key).value=p[key];for(const key of ['velocity','electric','field'])for(const axis of AXES)$(key+'-'+axis).value=p[key][axis];}
  function options(){for(const key of ['a','b']){
    const select=$('vector-'+key),previous=select.value;select.replaceChildren();
    for(const [id,v]of Object.entries(vectors)){const option=document.createElement('option');option.value=id;option.textContent=v.label;select.append(option);}
    select.value=dirty&&vectors[previous]?previous:lab[key];
  }}
  function populateMechanics(p){for(const key of Object.keys(DEFAULT_LAB.mechanics))$('mech-'+key).value=p[key];}
  function result(){
    const a=vectors[lab.a],b=vectors[lab.b];
    if(!a||!b){$('algebra-result').textContent='請先在自由向量模式新增向量，再選擇 A、B。';return;}
    const relation=vectorRelation(a.components,b.components),op={add:'＋',subtract:'−',cross:'×'}[lab.operation];
    const lines=[`A＝${tuple(a.components)}`,`B＝${tuple(b.components)}`,`夾角 θ＝${relation.angle===null?'未定義（含零向量）':numberText(relation.angle)+'°'}`,`A 在 B 上的投影＝${relation.defined?tuple(relation.projection):'未定義（B 為零向量）'}`];
    if(op)lines.push(`A${op}B＝${tuple(algebra(a.components,b.components,lab.operation))}`);
    $('algebra-result').textContent=lines.join('\n');
  }
  async function save(next){try{validateLab(next);await write(next);dirty=false;}catch(e){report(e.message,true);}}
  const resetClock=()=>({playing:false,elapsed:0,startedAt:0});
  if(teacher){
    $('mode').onchange=()=>save({...lab,mechanics:lab.mechanics||structuredClone(DEFAULT_LAB.mechanics),mode:$('mode').value,clock:resetClock()});
    $('mechanics-form').oninput=()=>{dirty=true;report('力學參數尚未套用。');};
    $('mechanics-form').onsubmit=event=>{event.preventDefault();const mechanics=Object.fromEntries(Object.keys(DEFAULT_LAB.mechanics).map(k=>[k,$('mech-'+k).valueAsNumber]));save({...lab,mechanics,clock:resetClock()});};
    $('apply-algebra').onclick=()=>save({...lab,a:$('vector-a').value,b:$('vector-b').value,operation:$('operation').value});
    $('particle-form').oninput=()=>{dirty=true;report('參數尚未套用；目前畫面仍使用上次設定。');};
    $('particle-form').onsubmit=event=>{
      event.preventDefault();const particle={};for(const key of ['charge','mass','duration','rate','scale'])particle[key]=$(key).valueAsNumber;
      for(const key of ['velocity','electric','field'])particle[key]=Object.fromEntries(AXES.map(k=>[k,$(key+'-'+k).valueAsNumber]));
      save({...lab,particle,clock:resetClock()});
    };
    $('play').onclick=()=>{
      const t=simulationTime(lab,getNow()),atEnd=t>=simulationDuration(lab);
      save({...lab,clock:{playing:atEnd||!lab.clock.playing,elapsed:atEnd?0:t,startedAt:0}});
    };
    $('rewind').onclick=()=>save({...lab,clock:resetClock()});
    $('seek').onchange=()=>save({...lab,clock:{playing:false,elapsed:$('seek').valueAsNumber/1000*simulationDuration(lab),startedAt:0}});
    $('load-preset').onclick=()=>{
      const p=structuredClone(DEFAULT_LAB.particle);
      switch($('preset').value){
        case 'circle':p.velocity.y=0;break;
        case 'electric':p.field=vec();p.electric=vec(0,1,0);p.velocity=vec(1,0,0);p.duration=5;break;
        case 'drift':p.velocity=vec();p.electric=vec(1,0,0);break;
        case 'electron':p.charge=-1.602176634e-19;p.mass=9.1093837139e-31;p.velocity=vec(2e5,5e4,0);p.field=vec(0,.001,0);p.duration=2e-7;p.rate=1e-8;p.scale=1000;break;
      }
      populateParticle(p);dirty=true;report('範例已填入，按「套用參數並歸零」後全班才會更新。');
    };
  }
  container.querySelectorAll('[data-arrow]').forEach(input=>input.onchange=()=>scene?.show(input.dataset.arrow,input.checked));
  function tick(t,state){
    $('time-status').textContent=`t＝${numberText(t)} s　${t>=simulationDuration(lab)?(lab.mode==='projectile'&&flightTime(lab.mechanics)<=lab.mechanics.duration?'已落地（顯示碰地前瞬間速度）':'已結束'):lab.clock.playing?'播放中':'已暫停'}`;
    if(teacher&&document.activeElement!==$('seek'))$('seek').value=(simulationDuration(lab)?t/simulationDuration(lab):0)*1000;
    if(teacher)$('play').textContent=lab.clock.playing&&t<simulationDuration(lab)?'暫停':'播放';
    const p=simulationParameters(lab),metrics=isMechanics(lab)?null:particleMetrics(p);
    const rows=isMechanics(lab)?[['位置 r（m）',tuple(state.position)],['速度 v（m/s）',tuple(state.velocity)],['加速度 a（m/s²）',tuple(state.acceleration)],['合力 F（N）',tuple(state.force)],['動能（J）',numberText(state.kinetic)],['位能（J）',numberText(state.potential)],['總機械能（J）',numberText(state.kinetic+state.potential)],lab.mode==='projectile'?['落地時間（s）',numberText(flightTime(p))]:['週期（s）',numberText(2*Math.PI/p.omega)]]:[['位置 r（m）',tuple(state.position)],['速度 v（m/s）',tuple(state.velocity)],['電場 E（N/C）',tuple(p.electric)],['磁場 B（T）',tuple(p.field)],['v×B（N/C）',tuple(state.vxB)],['電力 qE（N）',tuple(state.electricForce)],['磁力 q（v×B）（N）',tuple(state.magneticForce)],['合力 F（N）',tuple(state.force)],['速率（m/s）',numberText(norm(state.velocity))],['動能（J）',numberText(.5*p.mass*norm(state.velocity)**2)]];
    if(!isMechanics(lab)&&norm(p.electric)===0)rows.push(['迴旋半徑（m）',numberText(metrics.radius)],['迴旋週期（s）',numberText(metrics.period)],['螺距（m）',numberText(metrics.pitch)]);
    $('metrics').replaceChildren(...rows.flatMap(([k,v])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;return[dt,dd];}));
  }
  return {
    setAccess:allowed=>{editable=teacher&&allowed;controls();},
    setVectors:data=>{vectors=data;options();result();},
    setLab:data=>{
      const changedParameters=JSON.stringify([lab.particle,lab.mechanics])!==JSON.stringify([data.particle,data.mechanics]);lab=data;
      $('mode').value=lab.mode;$('operation').value=lab.operation;
      $('algebra-panel').hidden=lab.mode!=='algebra';$('particle-panel').hidden=lab.mode!=='lorentz';
      document.querySelector('#vector-section').hidden=lab.mode==='lorentz'||isMechanics(lab);
      $('mechanics-panel').hidden=!isMechanics(lab);transport.hidden=!isMechanics(lab)&&lab.mode!=='lorentz';
      $('mechanics-formula').textContent=lab.mode==='projectile'?'z＝h＋v₀ sinθ t−½gt²':'x＝A cos（ωt＋φ）';
      $('mechanics-assumptions').textContent=lab.mode==='projectile'?'在 XZ 平面運動，Z 軸向上；忽略空氣阻力，落地即停止，不模擬反彈。':'沿 X 軸作無阻尼簡諧運動，平衡點為原點；k＝mω²。';
      container.querySelectorAll('[data-mechanics-mode]').forEach(e=>e.hidden=e.dataset.mechanicsMode!=='both'&&e.dataset.mechanicsMode!==lab.mode);
      container.querySelectorAll('[data-arrow]').forEach(e=>e.parentElement.hidden=isMechanics(lab)&&!['v','F'].includes(e.dataset.arrow));
      if(!dirty||changedParameters||!teacher){populateParticle(lab.particle);populateMechanics(lab.mechanics||DEFAULT_LAB.mechanics);dirty=false;}
      options();result();controls();scene?.setLab(lab,getNow,tick);
    },
    getLab:()=>structuredClone(lab),
    isDirty:()=>dirty
  };
}
