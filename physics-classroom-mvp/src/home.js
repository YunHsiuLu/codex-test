import './style.css';
import { roomId } from './model.js';
import {firebaseClient,loginTeacher} from './firebase-client.js';

const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
document.querySelector('#local-option').hidden = !local;
document.querySelector('#emulator').checked = local;

const modal = document.querySelector('#login-modal');
const loginForm = document.querySelector('#modal-login-form');
const passwordInput = document.querySelector('#modal-password');
let pendingParams = null;

// 表單提交處理
document.querySelector('#join').addEventListener('submit', event => {
  event.preventDefault();
  const room = roomId(document.querySelector('#room').value);
  const role = event.submitter.value;
  
  const params = new URLSearchParams({ room });
  if (local && document.querySelector('#emulator').checked) params.set('emulator', '1');

  if (role === 'teacher') {
    // 點擊老師端：暫存參數並跳出密碼 Modal
    pendingParams = params;
    passwordInput.value = '';
    modal.showModal();
  } else {
    // 學生端直接跳轉
    location.href = `student.html?${params}`;
  }
});

// 關閉 Modal 按鈕
document.querySelector('#close-modal').onclick = () => {
  modal.close();
  pendingParams = null;
};

// 密碼只傳給 Firebase Auth；導向網址只包含教室與模擬器設定。
let busy=false;
modal.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!pendingParams || busy) return;
  busy=true;
  const params=new URLSearchParams(pendingParams);
  const error=document.querySelector('#modal-error');
  error.hidden=true;
  let password=passwordInput.value;
  passwordInput.value='';
  loginForm.querySelectorAll('button,input').forEach(el=>el.disabled=true);
  try {
    const client=await firebaseClient(params.get('emulator')==='1');
    await loginTeacher(client,params.get('room'),password);
    location.assign(`teacher.html?${params}`);
  } catch {
    error.textContent='無法解鎖，請確認密碼、網路連線與老師權限後再試。';
    error.hidden=false;
  } finally {
    password='';busy=false;
    loginForm.querySelectorAll('button,input').forEach(el=>el.disabled=false);
  }
});
