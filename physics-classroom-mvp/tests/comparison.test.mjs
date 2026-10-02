import test from 'node:test';
import assert from 'node:assert/strict';
import {comparisonPreset,comparisonMetrics,comparisonState,comparisonDuration,validateComparison,COMPARISON_PRESETS} from '../src/comparison.js';
import {DEFAULT_LAB,simulationDuration,simulationTime,validateLab} from '../src/physics.js';
import {makeSnapshot,validateSnapshot} from '../src/snapshots.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('six classroom presets satisfy their stated physical constraints',()=>{
 for(const key of Object.keys(COMPARISON_PRESETS))validateComparison(comparisonPreset(key));
 const metrics=key=>{const c=comparisonPreset(key);return Object.values(c.objects).map(b=>comparisonMetrics(c,b));};
 const speed=comparisonPreset('speed');assert.equal(new Set(Object.values(speed.objects).map(b=>b.speed)).size,1);
 const s=metrics('speed');assert.ok(s[1].range>s[0].range);near(s[0].range,s[2].range);
 const c=metrics('complement');near(c[0].range,c[1].range);assert.ok(c[1].flight>c[0].flight);
 for(const m of metrics('range'))near(m.range,30);
 for(const m of metrics('vx'))near(m.vx,10);
 const v=metrics('vz');for(const m of v){near(m.vz,10);near(m.flight,v[0].flight);near(m.peak,v[0].peak);}
 const d=metrics('drop');near(d[0].flight,d[1].flight);near(d[0].range,0);assert.ok(d[1].range>0);
});
test('shared clock retains early landings and delays without restarting other bodies',()=>{
 const c=comparisonPreset('complement'),a=c.objects.p0,b=c.objects.p1;
 a.delay=2;b.x0=-4;
 const ma=comparisonMetrics(c,a),mb=comparisonMetrics(c,b);
 assert.equal(comparisonState(c,a,1).phase,'waiting');near(comparisonState(c,a,1).position.x,a.x0);
 assert.equal(comparisonState(c,b,1).phase,'flying');near(comparisonState(c,b,1).position.x,-4+mb.vx);
 const stopped=comparisonState(c,b,mb.arrival+1);assert.equal(stopped.phase,'landed');near(stopped.position.x,mb.landingX);assert.deepEqual(stopped.velocity,{x:0,y:0,z:0});
 near(comparisonDuration(c),Math.max(ma.arrival,mb.arrival));
 const lab={...structuredClone(DEFAULT_LAB),mode:'comparison',comparison:c,clock:{playing:true,elapsed:0,startedAt:1000}};validateLab(lab);near(simulationTime(lab,2000),1);near(simulationTime(lab,999999),simulationDuration(lab));
});
test('comparison rejects excess bodies and nonphysical inputs; snapshot preserves comparison',()=>{
 const c=comparisonPreset('speed'),lab={...structuredClone(DEFAULT_LAB),mode:'comparison',comparison:c};validateLab(lab);
 const snap=makeSnapshot('等初速',{},lab);assert.deepEqual(validateSnapshot(JSON.parse(JSON.stringify(snap))).lab.comparison,c);
 for(const mutate of [v=>v.objects.p4={...v.objects.p0},v=>delete v.objects.p1,v=>v.objects.p0.speed=-1,v=>v.objects.p0.angle=91,v=>v.objects.p0.delay=NaN,v=>v.gravity=0,v=>v.objects.p0.admin=true]){
  const bad=structuredClone(c);mutate(bad);assert.throws(()=>validateComparison(bad));
 }
 const old=makeSnapshot('舊版',{},DEFAULT_LAB);assert.equal(old.lab.comparison,undefined);
 const zero=comparisonPreset('drop');for(const b of Object.values(zero.objects)){b.height=0;b.speed=0;}near(comparisonDuration(zero),0);assert.equal(comparisonState(zero,zero.objects.p0,0).phase,'landed');
});
