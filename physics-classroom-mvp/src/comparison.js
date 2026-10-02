export const BODY_COLORS={p0:'#57dfc2',p1:'#ffba69',p2:'#b7a2ff',p3:'#ff7f91'};
const body=(name,speed,angle,height=0)=>({name,speed,angle,height,x0:0,delay:0});
export const DEFAULT_COMPARISON={gravity:9.81,rate:1,scale:1,objects:{p0:body('A',20,30),p1:body('B',20,60)}};
export const COMPARISON_PRESETS={
 speed:'同初速，不同仰角',complement:'互餘角：同初速、同射程',range:'射程皆為３０ m，比較所需初速',vx:'同水平初速度，不同鉛直分量',vz:'同鉛直初速度，比較飛行時間',drop:'同高度：自由落下與水平拋射'
};
export function comparisonPreset(key){
 const c=structuredClone(DEFAULT_COMPARISON),g=c.gravity;
 if(key==='speed')c.objects={p0:body('A',20,30),p1:body('B',20,45),p2:body('C',20,60)};

 if(key==='range')c.objects=Object.fromEntries([30,45,60].map((a,i)=>['p'+i,body('ABC'[i],Math.sqrt(30*g/Math.sin(2*a*Math.PI/180)),a)]));
 if(key==='vx')c.objects=Object.fromEntries([20,45,60].map((a,i)=>['p'+i,body('ABC'[i],10/Math.cos(a*Math.PI/180),a)]));
 if(key==='vz')c.objects=Object.fromEntries([30,45,60].map((a,i)=>['p'+i,body('ABC'[i],10/Math.sin(a*Math.PI/180),a)]));
 if(key==='drop')c.objects={p0:body('A 自由落下',0,0,20),p1:body('B 水平拋射',15,0,20)};
 return c;
}
export function comparisonMetrics(c,b){
 const a=b.angle*Math.PI/180,vx=b.speed*Math.cos(a),vz=b.speed*Math.sin(a),g=c.gravity;
 // The rationalized expression avoids cancellation for downward launch from a height.
 const root=Math.sqrt(vz*vz+2*g*b.height),flight=vz<0?2*b.height/(root-vz):(vz+root)/g;
 const range=vx*flight;
 return {vx,vz,flight,range,landingX:b.x0+range,arrival:b.delay+flight,peak:b.height+Math.max(0,vz)**2/(2*g)};
}
export const comparisonDuration=c=>Math.max(...Object.values(c.objects).map(b=>comparisonMetrics(c,b).arrival));
export function comparisonState(c,b,t){
 const m=comparisonMetrics(c,b),local=Math.max(0,Math.min(m.flight,t-b.delay));
 const phase=t<b.delay?'waiting':t-b.delay>=m.flight?'landed':'flying';
 return {phase,position:{x:b.x0+m.vx*local,y:0,z:Math.max(0,b.height+m.vz*local-c.gravity*local*local/2)},velocity:phase==='flying'?{x:m.vx,y:0,z:m.vz-c.gravity*local}:{x:0,y:0,z:0}};
}
export function validateComparison(c){
 const bounded=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
 if(!c||Object.keys(c).some(k=>!['gravity','rate','scale','objects'].includes(k))||!bounded(c.gravity,.1,30)||!bounded(c.rate,.05,10)||!bounded(c.scale,.01,10))throw new Error('比較模型的重力、播放速率或倍率不正確。');
 if(!c.objects||!c.objects.p0||!c.objects.p1||Object.keys(c.objects).some(k=>!/^p[0-3]$/.test(k)))throw new Error('請保留Ａ、Ｂ兩個物體，最多四個物體。');
 const ranges={speed:[0,100],angle:[-90,90],height:[0,100],x0:[-100,100],delay:[0,30]};
 for(const b of Object.values(c.objects)){
  if(!b||typeof b.name!=='string'||!b.name.trim()||b.name.length>24||Object.keys(b).some(k=>!['name',...Object.keys(ranges)].includes(k)))throw new Error('物體名稱或欄位不正確。');
  for(const [k,[lo,hi]] of Object.entries(ranges))if(!bounded(b[k],lo,hi))throw new Error(`物體 ${b.name} 的 ${k} 超出範圍。`);
  const m=comparisonMetrics(c,b);
  if(m.arrival>1000||Math.max(Math.abs(b.x0),Math.abs(m.landingX),m.peak)*c.scale>1000)throw new Error('比較軌跡超過１０００座標單位或１０００秒，請調整參數。');
 }
 return c;
}
