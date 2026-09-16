import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LAB, mechanicsAt, flightTime, vec, dot, add, mul, vectorRelation, simulationTime, simulationDuration, validateLab } from '../src/physics.js';
import { makeSnapshot, validateSnapshot } from '../src/snapshots.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('projectile range, landing time, derivatives and mechanical energy',()=>{
 const p={...DEFAULT_LAB.mechanics,height:0,speed:20,angle:30};
 near(flightTime(p),20/9.81);
 const last=mechanicsAt('projectile',p,flightTime(p));near(last.position.x,400*Math.sin(Math.PI/3)/9.81);near(last.position.z,0);
 for(const t of [.1,.5,1]){const s=mechanicsAt('projectile',p,t),h=1e-5,lo=mechanicsAt('projectile',p,t-h),hi=mechanicsAt('projectile',p,t+h);near((hi.position.z-lo.position.z)/(2*h),s.velocity.z);near(s.kinetic+s.potential,200);}
 assert.deepEqual(mechanicsAt('projectile',p,100),last);
 near(flightTime({...p,speed:0}),0);
 near(flightTime({...p,height:10,speed:0}),Math.sqrt(20/9.81));
 near(flightTime({...p,angle:-30}),0);
});
test('oscillator phase, period, acceleration, conserved energy',()=>{
 const p={...DEFAULT_LAB.mechanics,phase:90,mass:2};
 near(mechanicsAt('oscillator',p,0).position.x,0);near(mechanicsAt('oscillator',p,0).velocity.x,-6);
 for(const t of [0,.1,1,3,10]){const s=mechanicsAt('oscillator',p,t);near(s.acceleration.x,-(p.omega**2)*s.position.x);near(s.kinetic+s.potential,36);near(mechanicsAt('oscillator',p,t+Math.PI).position.x,s.position.x);}
});
test('projection residual orthogonal; angle parallel, opposite, zero',()=>{
 const a=vec(2,3,4),b=vec(-1,2,1),r=vectorRelation(a,b);near(dot(add(a,mul(r.projection,-1)),b),0);
 near(vectorRelation(vec(1),vec(0,1)).angle,90);near(vectorRelation(vec(1),vec(-1)).angle,180);near(vectorRelation(vec(1),vec(2)).angle,0);
 assert.equal(vectorRelation(vec(),b).angle,null);assert.equal(vectorRelation(a,vec()).defined,false);
});
test('mechanics clock clamps at landing and handles paused / zero-duration flight',()=>{
 const lab=structuredClone(DEFAULT_LAB);lab.mode='projectile';lab.clock={playing:true,elapsed:0,startedAt:1000};
 near(simulationTime(lab,1500),.5);near(simulationTime(lab,999999),flightTime(lab.mechanics));
 lab.clock.playing=false;near(simulationTime(lab,999999),0);
 lab.mechanics.height=0;lab.mechanics.speed=0;near(simulationDuration(lab),0);validateLab(lab);
 lab.mechanics.gravity=0;assert.throws(()=>validateLab(lab));
});
test('snapshot round-trip, old scenes, paused reset, rejects malformed inputs',()=>{
 const v={label:'A',color:'#57dfc2',origin:vec(),components:vec(1,2,3)},lab=structuredClone(DEFAULT_LAB);lab.mode='oscillator';lab.clock={playing:true,elapsed:2,startedAt:100};
 const snapshot=makeSnapshot('課堂',{v0:v},lab);assert.equal(snapshot.lab.clock.playing,false);assert.equal(snapshot.lab.clock.elapsed,0);
 assert.deepEqual(validateSnapshot(JSON.parse(JSON.stringify(snapshot))),snapshot);
 const old=structuredClone(snapshot);old.lab.mode='vectors';delete old.lab.mechanics;validateSnapshot(old);
 assert.throws(()=>makeSnapshot('bad',{v50:v},lab));assert.throws(()=>validateSnapshot({...snapshot,version:2}));
 const bad=structuredClone(snapshot);bad.lab.mechanics.omega=0;assert.throws(()=>validateSnapshot(bad));
 assert.throws(()=>makeSnapshot('bad',{v0:{...v,components:vec(Infinity)}},lab));
});
