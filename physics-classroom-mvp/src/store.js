import { initializeApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator, ref, onValue, set, remove, runTransaction } from 'firebase/database';
import { roomId, validateVector } from './model.js';

export async function connectStore(room, { onScene, onConnection, onError }) {
  room = roomId(room);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const useEmulator = local && new URLSearchParams(location.search).get('emulator') === '1';
  let config;
  if (useEmulator) {
    config = { projectId: 'demo-physics-classroom', apiKey: 'demo-key', appId: 'demo-app', databaseURL: 'https://demo-physics-classroom-default-rtdb.firebaseio.com' };
  } else {
    const response = await fetch('/firebase-config.json', { cache: 'no-store' });
    try { config = response.ok ? await response.json() : null; } catch { config = null; }
    if (!config || !['apiKey', 'projectId', 'databaseURL', 'appId'].every(k => typeof config[k] === 'string' && config[k] && !config[k].includes('YOUR_'))) {
      throw new Error('尚未設定 Firebase。請依 README 填寫 firebase-config.json；本機測試請從首頁選擇「本機模擬器」。');
    }
  }
  const db = getDatabase(initializeApp(config));
  if (useEmulator) connectDatabaseEmulator(db, '127.0.0.1', 9000);
  const base = `rooms/${room}/vectors`;
  let connected = false;
  const unsubscribers = [
    onValue(ref(db, '.info/connected'), snap => { connected = snap.val() === true; onConnection(connected, useEmulator); }),
    onValue(ref(db, base), snap => {
      const vectors = snap.val() || {};
      try { Object.values(vectors).forEach(validateVector); onScene(vectors); } catch { onError(new Error('教室資料格式錯誤，請檢查資料庫規則。')); }
    }, onError)
  ];
  return {
    create: async vector => {
      validateVector(vector);
      if (!connected) throw new Error('目前離線，重新連線後再新增。');
      for (let slot = 0; slot < 50; slot++) {
        const id = 'v' + slot;
        const result = await runTransaction(ref(db, base + '/' + id), current => current === null ? vector : undefined, { applyLocally: false });
        if (result.committed) return id;
      }
      throw new Error('這間教室已達５０支向量上限。');
    },
    write: (id, vector) => {
      if (!connected) return Promise.reject(new Error('目前離線，重新連線後再儲存。'));
      return set(ref(db, `${base}/${id}`), validateVector(vector));
    },
    delete: id => {
      if (!connected) return Promise.reject(new Error('目前離線，重新連線後再刪除。'));
      return remove(ref(db, `${base}/${id}`));
    },
    dispose: () => unsubscribers.forEach(unsubscribe => unsubscribe())
  };
}
