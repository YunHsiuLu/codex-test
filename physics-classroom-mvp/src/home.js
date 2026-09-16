import './style.css';
import { roomId } from './model.js';

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

// Modal 密碼確認後跳轉
loginForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!pendingParams) return;

  const password = passwordInput.value.trim();
  if (password) {
    // 將密碼附帶在 URL 參數或交由 teacher.html 進行 Firebase 驗證
    pendingParams.set('pwd', password);
    location.href = `teacher.html?${pendingParams}`;
  }
});
