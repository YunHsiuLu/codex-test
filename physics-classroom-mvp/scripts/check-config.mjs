import { readFileSync } from 'node:fs';
try {
  const c = JSON.parse(readFileSync('public/firebase-config.json', 'utf8'));
  for (const k of ['apiKey', 'projectId', 'databaseURL', 'appId']) {
    if (typeof c[k] !== 'string' || !c[k].trim() || /YOUR_|demo-/.test(c[k])) throw new Error(`請填寫 ${k}`);
  }
  if (!/^https:\/\/[a-z0-9.-]+\.(firebaseio\.com|firebasedatabase\.app)\/?$/.test(c.databaseURL)) throw new Error('databaseURL 必須是 Firebase 正式資料庫網址');
  console.log('Firebase 網頁設定格式通過；請確認部署目標與 projectId 一致。');
} catch (error) {
  console.error(`尚無有效的正式 Firebase 設定：${error.message}\n請依 README.md 完成設定。`);
  process.exit(1);
}
