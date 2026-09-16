export const AXES = ['x', 'y', 'z'];
export const vec = (x=0,y=0,z=0) => ({x,y,z});
export const add = (a,b) => vec(a.x+b.x,a.y+b.y,a.z+b.z);
export const mul = (a,k) => vec(a.x*k,a.y*k,a.z*k);
export const dot = (a,b) => a.x*b.x+a.y*b.y+a.z*b.z;
export const cross = (a,b) => vec(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
export const norm = a => Math.hypot(a.x,a.y,a.z);
export const DEFAULT_LAB = {
  mechanics:{height:2,speed:10,angle:45,gravity:9.81,amplitude:3,omega:2,phase:0,mass:1,duration:10,rate:1,scale:1},
  mode:'vectors', operation:'add', a:'v0', b:'v1',
  particle:{charge:1,mass:1,velocity:vec(2,.6,0),electric:vec(),field:vec(0,1,0),duration:20,rate:1,scale:1},
  clock:{playing:false,elapsed:0,startedAt:0}
};
export function validateLab(lab) {
  if (!lab || !['vectors','algebra','lorentz','projectile','oscillator'].includes(lab.mode) || !['add','subtract','cross','projection','angle'].includes(lab.operation)) throw new Error('模型設定不正確。');
  for (const key of ['a','b']) if (!/^v([0-9]|[1-4][0-9])$/.test(lab[key])) throw new Error('請選擇有效向量。');
  const p=lab.particle;
  const bounded=(n,lo,hi)=>Number.isFinite(n)&&n>=lo&&n<=hi;
  if (!p || !bounded(p.charge,-1000,1000)||!bounded(p.mass,1e-35,1e6)||!bounded(p.duration,1e-12,1e4)||!bounded(p.rate,1e-15,1000)||!bounded(p.scale,1e-9,1e12)) throw new Error('請檢查電荷、正質量、時間、播放速率與顯示倍率。');
  for (const k of AXES) if (!bounded(p.velocity?.[k],-1e7,1e7)||!bounded(p.field?.[k],-1000,1000)||!bounded(p.electric?.[k],-1000,1000)) throw new Error('初速度或磁場超出範圍。');
  if (Math.abs(p.charge)*norm(p.field)/p.mass*p.duration>200*Math.PI) throw new Error('模擬區間超過１００圈，請縮短模擬時間或減小磁場。');
  for(let i=0;i<=24;i++){const state=particleAt(p,p.duration*i/24);if(norm(state.velocity)>3e7)throw new Error('速度超過光速的十分之一，已超出此非相對論模型；請調整參數。');if(norm(state.position)*p.scale>1000)throw new Error('軌跡超過顯示範圍，請縮短時間或減小顯示倍率。');}
  if (lab.mechanics || ['projectile','oscillator'].includes(lab.mode)) validateMechanics(lab.mechanics,lab.mode);
  const c=lab.clock;
  if (!c||typeof c.playing!=='boolean'||!bounded(c.elapsed,0,simulationDuration(lab))||!bounded(c.startedAt,0,1e15)) throw new Error('播放時間不正確。');
  return lab;
}
export function algebra(a,b,operation) { if(operation==='projection'||operation==='angle')return vectorRelation(a,b).projection; return operation==='cross'?cross(a,b):add(a,mul(b,operation==='subtract'?-1:1)); }
// Exact nonrelativistic solution for constant uniform E and B. Stable small-angle integrals.
export function particleAt(p,t) {
  const strength=norm(p.field), acceleration=mul(p.electric,p.charge/p.mass);
  let position,velocity;
  if (!strength || !p.charge) {
    position=add(mul(p.velocity,t),mul(acceleration,t*t/2));
    velocity=add(p.velocity,mul(acceleration,t));
  } else {
    const axis=mul(p.field,1/strength),omega=p.charge*strength/p.mass,theta=omega*t;
    const vp=mul(axis,dot(p.velocity,axis)), vt=add(p.velocity,mul(vp,-1)), vr=cross(vt,axis);
    const ap=mul(axis,dot(acceleration,axis)), at=add(acceleration,mul(ap,-1)), ar=cross(at,axis);
    const small=Math.abs(theta)<1e-3;
    const sinc=small?1-theta**2/6+theta**4/120:Math.sin(theta)/theta;
    const c2=small?.5-theta**2/24+theta**4/720:2*Math.sin(theta/2)**2/theta**2;
    const s2=small?theta/6-theta**3/120+theta**5/5040:(theta-Math.sin(theta))/theta**2;
    const cosc=theta*c2;
    position=add(add(mul(vp,t),mul(ap,t*t/2)),add(add(mul(vt,t*sinc),mul(vr,t*cosc)),add(mul(at,t*t*c2),mul(ar,t*t*s2))));
    velocity=add(add(vp,mul(ap,t)),add(add(mul(vt,Math.cos(theta)),mul(vr,Math.sin(theta))),add(mul(at,t*sinc),mul(ar,t*cosc))));
  }
  const vxB=cross(velocity,p.field),electricForce=mul(p.electric,p.charge),magneticForce=mul(vxB,p.charge);
  return {position,velocity,vxB,electricForce,magneticForce,force:add(electricForce,magneticForce)};
}
export function particleMetrics(p) {
  const b=norm(p.field),omega=Math.abs(p.charge)*b/p.mass;
  const parallel=b?dot(p.velocity,mul(p.field,1/b)):norm(p.velocity);
  const perpendicular=b?norm(add(p.velocity,mul(p.field,-parallel/b))):0;
  return {speed:norm(p.velocity),radius:omega?perpendicular/omega:null,period:omega?2*Math.PI/omega:null,pitch:omega?parallel*2*Math.PI/omega:null};
}
export function simulationTime(lab,now) {
  return Math.min(simulationDuration(lab),Math.max(0,lab.clock.elapsed+(lab.clock.playing?Math.max(0,now-lab.clock.startedAt)/1000*simulationParameters(lab).rate:0)));
}

export const isMechanics = lab => ['projectile','oscillator'].includes(lab.mode);
export const simulationParameters = lab => isMechanics(lab) ? lab.mechanics : lab.particle;
export function flightTime(p) {
  const vz=p.speed*Math.sin(p.angle*Math.PI/180);
  return (vz+Math.sqrt(vz*vz+2*p.gravity*p.height))/p.gravity;
}
export const simulationDuration = lab => lab.mode==='projectile' ? Math.min(lab.mechanics.duration,flightTime(lab.mechanics)) : simulationParameters(lab).duration;
export function validateMechanics(p,mode) {
  const ranges={height:[0,100],speed:[0,100],angle:[-90,90],gravity:[.01,100],amplitude:[0,100],omega:[.01,100],phase:[-360,360],mass:[.001,1000],duration:[.01,1000],rate:[.001,100],scale:[.001,10]};
  if(!p || Object.keys(p).some(k=>!ranges[k]))throw new Error('力學參數格式不正確。');
  for(const [k,[lo,hi]] of Object.entries(ranges))if(!Number.isFinite(p[k])||p[k]<lo||p[k]>hi)throw new Error(`力學參數 ${k} 超出範圍（${lo}～${hi}）。`);
  if(mode==='oscillator'&&p.omega*p.duration>200*Math.PI)throw new Error('簡諧運動最多１００週期，請縮短時間或減小角頻率。');
  const t=Math.min(p.duration,flightTime(p));
  if((mode==='projectile'?Math.max(p.height+(p.speed*Math.max(0,Math.sin(p.angle*Math.PI/180)))**2/(2*p.gravity),p.speed*t):mode==='oscillator'?p.amplitude:0)*p.scale>1000)throw new Error('力學軌跡超過顯示範圍，請減小顯示倍率或參數。');
  return p;
}
export function mechanicsAt(mode,p,t) {
  let position,velocity,acceleration;
  if(mode==='projectile') {
    t=Math.min(Math.max(0,t),flightTime(p));
    const a=p.angle*Math.PI/180,vx=p.speed*Math.cos(a),vz=p.speed*Math.sin(a);
    position=vec(vx*t,0,Math.max(0,p.height+vz*t-p.gravity*t*t/2));
    velocity=vec(vx,0,vz-p.gravity*t);acceleration=vec(0,0,-p.gravity);
  } else {
    const theta=p.omega*t+p.phase*Math.PI/180;
    position=vec(p.amplitude*Math.cos(theta),0,0);
    velocity=vec(-p.amplitude*p.omega*Math.sin(theta),0,0);
    acceleration=mul(position,-(p.omega**2));
  }
  const potential=mode==='projectile'?p.mass*p.gravity*position.z:.5*p.mass*p.omega**2*position.x**2;
  return {position,velocity,acceleration,force:mul(acceleration,p.mass),kinetic:.5*p.mass*norm(velocity)**2,potential};
}
export const stateAt=(lab,t)=>isMechanics(lab)?mechanicsAt(lab.mode,lab.mechanics,t):particleAt(lab.particle,t);
export function vectorRelation(a,b) {
  const na=norm(a),nb=norm(b),projection=nb?mul(b,dot(a,b)/(nb*nb)):vec();
  return {angle:na&&nb?Math.acos(Math.max(-1,Math.min(1,dot(a,b)/(na*nb))))*180/Math.PI:null,projection,defined:nb>0};
}
