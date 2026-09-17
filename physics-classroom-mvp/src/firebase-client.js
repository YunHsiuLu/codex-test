import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, connectAuthEmulator, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, get, ref } from 'firebase/database';
import { roomId } from './model.js';
const clients = new Map();
export function firebaseClient(useEmulator = ['localhost','127.0.0.1','[::1]'].includes(location.hostname) && new URLSearchParams(location.search).get('emulator') === '1') {
  if (!clients.has(useEmulator)) clients.set(useEmulator, createClient(useEmulator).catch(error => {clients.delete(useEmulator);throw error;}));
  return clients.get(useEmulator);
}
async function createClient(useEmulator) {
  let config;
  if(useEmulator) config={projectId:'demo-physics-classroom',apiKey:'demo-key',appId:'demo-app',databaseURL:'https://demo-physics-classroom-default-rtdb.firebaseio.com'};
  else {
    const response=await fetch('/firebase-config.json',{cache:'no-store'});
    try {config=response.ok?await response.json():null;} catch {config=null;}
    if(!config?.databaseURL||!config?.apiKey) throw new Error('尚未設定 Firebase，請查看 README。');
  }
  const app=initializeApp(config,useEmulator ? 'emulator' : 'production'),db=getDatabase(app),auth=getAuth(app);
  if(useEmulator){connectDatabaseEmulator(db,'127.0.0.1',9000);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});}
  await setPersistence(auth,browserSessionPersistence);
  return {auth,db,config,useEmulator};
}
export async function loginTeacher(client, room, password) {
  room=roomId(room);
  await signInWithEmailAndPassword(client.auth,client.config.teacherEmail||'cow3690m@gmail.com',password);
  try {await get(ref(client.db,`rooms/${room}/teacherAccess`));}
  catch(error) {await signOut(client.auth);throw error;}
}
