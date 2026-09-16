import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {ref,set,get,remove,update} from 'firebase/database';
import fs from 'node:fs';
import {DEFAULT_LAB} from '../src/physics.js';
const env=await initializeTestEnvironment({projectId:'demo-physics-classroom',database:{host:'127.0.0.1',port:9000,rules:fs.readFileSync('database.rules.json','utf8')}});
const claims={email:'cow3690m@gmail.com',email_verified:true,firebase:{sign_in_provider:'password'}};
const teacher=env.authenticatedContext('sjOawvV1pKTvH9xcwKfpQg0Vc2C3',claims).database();
const guest=env.unauthenticatedContext().database();
const student=env.authenticatedContext('student',{...claims,email:'student@example.com'}).database();
const unverified=env.authenticatedContext('unverified',{...claims,email_verified:false}).database();
const fakeProvider=env.authenticatedContext('sjOawvV1pKTvH9xcwKfpQg0Vc2C3',{...claims,firebase:{sign_in_provider:'google.com'}}).database();
const path='rooms/TEST01';
const v={label:'F',color:'#57dfc2',origin:{x:0,y:0,z:0},components:{x:3,y:4,z:0}};
let count=0;
async function pass(p){await assertSucceeds(p);count++;}
async function fail(p){await assertFails(p);count++;}
try {
 await env.clearDatabase();
 await pass(set(ref(teacher,path+'/vectors/v0'),v));
 for(const db of [guest,student,unverified,fakeProvider]) {
  await pass(get(ref(db,path+'/vectors')));
  await fail(set(ref(db,path+'/vectors/v0'),v));
  await fail(remove(ref(db,path+'/vectors/v0')));
  await fail(set(ref(db,path+'/lab'),DEFAULT_LAB));
  await fail(get(ref(db,path+'/teacherAccess')));
 }
 await pass(get(ref(teacher,path+'/teacherAccess')));
 await fail(set(ref(guest,'permissions/student'),true));
 await fail(set(ref(student,path+'/teacherAccess'),true));
 await fail(update(ref(guest,path),{'vectors/v0/label':'hacked'}));
 await fail(set(ref(teacher,path+'/camera'),{x:1}));
 await fail(set(ref(teacher,path+'/vectors/v0'),{...v,camera:{x:1}}));
 await fail(set(ref(teacher,path+'/vectors/v0'),{...v,origin:{x:101,y:0,z:0}}));
 await fail(set(ref(teacher,path+'/vectors/v50'),v));
 await fail(set(ref(teacher,'rooms/bad/vectors/v0'),v));
 await pass(set(ref(teacher,path+'/lab'),DEFAULT_LAB));
 await pass(get(ref(guest,path+'/lab')));
 await fail(set(ref(teacher,path+'/lab'),{...DEFAULT_LAB,particle:{...DEFAULT_LAB.particle,mass:0}}));
 await fail(set(ref(teacher,path+'/lab'),{...DEFAULT_LAB,clock:{...DEFAULT_LAB.clock,elapsed:21}}));
 await fail(set(ref(teacher,path+'/lab'),{...DEFAULT_LAB,admin:true}));
 await pass(update(ref(teacher,path+'/lab/clock'),{playing:true,startedAt:Date.now()}));
 await pass(remove(ref(teacher,path+'/vectors/v0')));
 await fail(get(ref(guest,'rooms')));
 for(const mode of ['projectile','oscillator']) {
  const lab={...DEFAULT_LAB,mode};
  await pass(set(ref(teacher,path+'/lab'),lab));
  await pass(get(ref(guest,path+'/lab')));
  for(const db of [guest,student])await fail(set(ref(db,path+'/lab'),lab));
  const missing={...lab};delete missing.mechanics;await fail(set(ref(teacher,path+'/lab'),missing));
 }
 await fail(set(ref(teacher,path+'/lab'),{...DEFAULT_LAB,mechanics:{...DEFAULT_LAB.mechanics,gravity:0}}));
 await fail(set(ref(teacher,path+'/lab'),{...DEFAULT_LAB,mechanics:{...DEFAULT_LAB.mechanics,admin:true}}));
 for(const operation of ['angle','projection'])await pass(set(ref(teacher,path+'/lab'),{...DEFAULT_LAB,operation}));
 // Loading is one atomic multi-location update; visitors cannot partially replace a scene.
 const sceneUpdate={'vectors/v0':v,'vectors/v1':null,lab:{...DEFAULT_LAB,mode:'projectile'}};
 await pass(update(ref(teacher,path),sceneUpdate));
 await fail(update(ref(guest,path),sceneUpdate));
 await fail(update(ref(student,path),sceneUpdate));
 const before=(await get(ref(teacher,path+'/vectors/v0'))).val();
 await fail(update(ref(teacher,path),{'vectors/v0':{...v,label:'must not apply'},lab:{...DEFAULT_LAB,mechanics:{...DEFAULT_LAB.mechanics,mass:0}}}));
 if(JSON.stringify((await get(ref(teacher,path+'/vectors/v0'))).val())!==JSON.stringify(before))throw new Error('Atomic scene update changed data after rejection');
 console.log(`Security rules：${count} assertions passed (including guest / wrong teacher / unverified / forged provider).`);
} finally {await env.cleanup();}
