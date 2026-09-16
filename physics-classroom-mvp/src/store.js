import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, connectAuthEmulator, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, ref, onValue, set, get, update, remove, runTransaction, serverTimestamp } from 'firebase/database';
import { roomId, validateVector } from './model.js';
import { validateSnapshot } from './snapshots.js';
import { DEFAULT_LAB, validateLab } from './physics.js';

export async function connectStore(room, { onScene, onConnection, onError, onAuth, onLab }) {
  room=roomId(room);
  const useEmulator=['localhost','127.0.0.1','[::1]'].includes(location.hostname) && new URLSearchParams(location.search).get('emulator')==='1';
  let config;
  if(useEmulator) config={projectId:'demo-physics-classroom',apiKey:'demo-key',appId:'demo-app',databaseURL:'https://demo-physics-classroom-default-rtdb.firebaseio.com'};
  else {
    const response=await fetch('/firebase-config.json',{cache:'no-store'});
    try {config=response.ok?await response.json():null;} catch {config=null;}
    if(!config?.databaseURL||!config?.apiKey) throw new Error('尚未設定 Firebase，請查看 README。');
  }
  const app=initializeApp(config),db=getDatabase(app),auth=getAuth(app);
  if(useEmulator){connectDatabaseEmulator(db,'127.0.0.1',9000);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});}
  await setPersistence(auth,browserSessionPersistence);
  const base=`rooms/${room}`;
  let connected=false,canWrite=false,offset=0,authGeneration=0;
  const subscriptions=[
    onAuthStateChanged(auth,async user=>{
      const generation=++authGeneration;canWrite=false;onAuth?.(user,false);
      if(user) {
        try {await get(ref(db,base+'/teacherAccess'));if(generation===authGeneration){canWrite=true;onAuth?.(user,true);}}
        catch {if(generation===authGeneration)onAuth?.(user,false);}
      }
    }),
    onValue(ref(db,'.info/connected'),s=>{connected=s.val()===true;onConnection(connected,useEmulator);}),
    onValue(ref(db,'.info/serverTimeOffset'),s=>{offset=s.val()||0;}),
    onValue(ref(db,base+'/vectors'),s=>{
      const data=s.val()||{};
      try{Object.values(data).forEach(validateVector);onScene(data);}catch{onError(new Error('向量資料格式錯誤。'));}
    },onError),
    onValue(ref(db,base+'/lab'),s=>{
      try {onLab?.(validateLab(s.val()||structuredClone(DEFAULT_LAB)));}catch(e){onError(e);}
    },onError)
  ];
  function requireTeacher(){if(!canWrite)throw new Error('只有授權老師能修改教室。');if(!connected)throw new Error('目前離線，請重新連線後再試。');}
  return {
    now:()=>Date.now()+offset,
    login:password=>signInWithEmailAndPassword(auth,config.teacherEmail||'cow3690m@gmail.com',password),
    logout:()=>signOut(auth),
    create:async vector=>{
      requireTeacher();validateVector(vector);
      for(let i=0;i<50;i++){
        const id='v'+i,result=await runTransaction(ref(db,base+'/vectors/'+id),current=>current===null?vector:undefined,{applyLocally:false});
        if(result.committed)return id;
      }
      throw new Error('每間教室最多５０支向量。');
    },
    write:(id,vector)=>{requireTeacher();return set(ref(db,base+'/vectors/'+id),validateVector(vector));},
    delete:id=>{requireTeacher();return remove(ref(db,base+'/vectors/'+id));},
    writeLab:lab=>{requireTeacher();validateLab(lab);return set(ref(db,base+'/lab'),{...lab,clock:{...lab.clock,startedAt:serverTimestamp()}});},
    loadScene:snapshot=>{
      requireTeacher();const checked=validateSnapshot(snapshot),changes={lab:{...checked.lab,clock:{playing:false,elapsed:0,startedAt:serverTimestamp()}}};
      for(let i=0;i<50;i++)changes['vectors/v'+i]=checked.vectors['v'+i]||null;
      return update(ref(db,base),changes);
    },
    dispose:()=>subscriptions.forEach(f=>f())
  };
}
