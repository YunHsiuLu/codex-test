import test from 'node:test';import assert from 'node:assert/strict';
import {segmentHitsRect} from '../src/label-layout.js';
test('label exclusion detects crossing paths and projected zero-length arrows',()=>{
 const r={left:10,top:10,right:30,bottom:30};
 assert.equal(segmentHitsRect({x:20,y:-100},{x:20,y:100},r),true);
 assert.equal(segmentHitsRect({x:-100,y:20},{x:100,y:20},r),true);
 assert.equal(segmentHitsRect({x:20,y:20},{x:20,y:20},r),true);
 assert.equal(segmentHitsRect({x:0,y:0},{x:1,y:1},r),false);
 assert.equal(segmentHitsRect({x:35,y:0},{x:35,y:40},r),true);
 assert.equal(segmentHitsRect({x:39,y:0},{x:39,y:40},r),false);
});
