import test from 'node:test';import assert from 'node:assert/strict';
import {comparisonPreset,comparisonFrameState,comparisonDuration,comparisonFromProjectile} from '../src/comparison.js';
import {DEFAULT_LAB} from '../src/physics.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('moving frame origin and same-gravity constant relative velocity',()=>{
 const c=comparisonPreset('complement');
 for(const t of [.1,.4,1]){const self=comparisonFrameState(c,'p0',t,'p0');for(const v of [self.position,self.velocity,self.acceleration])for(const k of ['x','y','z'])near(v[k],0);}
 const first=comparisonFrameState(c,'p1',.1,'p0'),next=comparisonFrameState(c,'p1',1,'p0');
 for(const k of ['x','y','z']){near(first.velocity[k],next.velocity[k]);near(next.position[k]-first.position[k],first.velocity[k]*.9);near(first.acceleration[k],0);}
});
test('relative samples subtract reference at matching historical times and obey landing/delay',()=>{
 const c=comparisonPreset('drop'),t=.6;
 const s=comparisonFrameState(c,'p1',t,'p0');near(s.position.x,15*t);near(s.position.z,0);near(s.velocity.z,0);
 c.objects.p1.delay=1;
 const waiting=comparisonFrameState(c,'p1',t,'p0');assert.equal(waiting.phase,'waiting');near(waiting.acceleration.z,c.gravity);near(waiting.velocity.z,c.gravity*t);
 const end=comparisonFrameState(c,'p1',comparisonDuration(c),'p0');near(end.velocity.x,0);near(end.velocity.z,0);
});
test('switching reference reverses relative vectors; conversion preserves applied projectile',()=>{
 const c=comparisonFromProjectile(DEFAULT_LAB.mechanics);assert.equal(c.objects.p0.speed,DEFAULT_LAB.mechanics.speed);assert.equal(c.objects.p0.angle,DEFAULT_LAB.mechanics.angle);assert.equal(c.objects.p1.angle,60);
 const a=comparisonFrameState(c,'p0',.3,'p1'),b=comparisonFrameState(c,'p1',.3,'p0');for(const field of ['position','velocity','acceleration'])for(const k of ['x','y','z'])near(a[field][k],-b[field][k]);
});
