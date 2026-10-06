import test from 'node:test';import assert from 'node:assert/strict';
import {motionComponents} from '../src/motion-components.js';
const v=(x,y,z)=>({x,y,z});
test('tangential and normal components reconstruct acceleration, perpendicular and scale by mass',()=>{
 const d=motionComponents(v(3,0,4),v(0,0,-10),2);
 for(const k of ['x','y','z']){assert.ok(Math.abs(d.at[k]+d.an[k]-d.a[k])<1e-12);assert.equal(d.Ft[k],2*d.at[k]);assert.equal(d.Fn[k],2*d.an[k]);}
 assert.ok(Math.abs(d.an.x*3+d.an.z*4)<1e-12);assert.equal(d.tangential,-8);assert.ok(Math.abs(d.normal-6)<1e-12);
});
test('circle, straight line, apex, rest and tiny physical forces',()=>{
 assert.equal(motionComponents(v(10,0,0),v(0,0,-10),1).tangential,0);
 assert.equal(motionComponents(v(0,0,-10),v(0,0,-10),1).normal,0);
 assert.equal(motionComponents(v(0,0,0),v(0,0,-10),1).defined,false);
 const d=motionComponents(v(1,0,0),v(0,2,0),1e-30);assert.equal(d.Fn.y,2e-30);assert.equal(d.Ft.x,0);
});
