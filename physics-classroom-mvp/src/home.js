import './style.css';
import { roomId } from './model.js';
const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
document.querySelector('#local-option').hidden = !local;
document.querySelector('#emulator').checked = local;
document.querySelector('#join').addEventListener('submit', event => {
  event.preventDefault();
  const room = roomId(document.querySelector('#room').value);
  const params = new URLSearchParams({ room });
  if (local && document.querySelector('#emulator').checked) params.set('emulator', '1');
  location.href = `${event.submitter.value}.html?${params}`;
});
