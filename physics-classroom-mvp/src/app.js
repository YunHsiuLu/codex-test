import './style.css';
import { createScene } from './scene.js';
import { connectStore } from './store.js';
import { roomId, validateVector, magnitude, MAX_VECTORS } from './model.js';
const teacher = document.body.dataset.role === 'teacher';
const $ = selector => document.querySelector(selector);
let room;
try { room = roomId(new URLSearchParams(location.search).get('room') || 'PHYS01'); }
catch (error) { $('#app').textContent = error.message; throw error; }
$('#app').innerHTML = `
<header class="topbar"><a class="brand" href="/">向量教室<span>3D PHYSICS CLASSROOM</span></a><div class="room-badge">教室 <strong id="room-name"></strong></div><span class="role">${teacher ? '老師端' : '學生端・只讀'}</span><span id="connection" role="status">連線中…</span></header>
<main class="classroom"><section class="stage"><div class="stage-heading"><div class="eyebrow">SHARED SCENE</div><h1>每個角度，都看得懂。</h1><p>${teacher ? '建立向量，讓全班同步觀察。' : '場景由老師更新，視角由你決定。'}</p></div><div id="viewport"></div><div class="stage-toolbar"><span>拖曳旋轉 · 雙指縮放／平移</span><button class="secondary compact" id="reset-camera">重設視角</button></div><div class="axis-key"><span class="x">● X</span><span class="y">● Y</span><span class="z">● Z</span><span>網格間距：１</span></div></section>
<aside class="sidebar"><div class="section-title"><h2>場景向量</h2><span id="count">０個</span></div><div id="vector-list" aria-label="場景向量清單"></div>
${teacher ? `<button id="add" class="wide" disabled>＋ 新增向量</button><form id="editor" hidden><div class="section-title"><h2>編輯向量</h2></div><label for="label">名稱</label><input id="label" maxlength="24" required autocomplete="off"><div class="color-row"><label for="color">顏色</label><input id="color" type="color" value="#57dfc2"></div><fieldset><legend>起點座標</legend><div class="coordinates">${inputs('origin')}</div></fieldset><fieldset><legend>向量分量</legend><div class="coordinates">${inputs('components')}</div></fieldset><p class="hint">終點＝起點＋分量。改起點可平移向量。</p><button id="save" type="submit" class="wide">儲存並同步</button><button id="delete" type="button" class="danger wide">刪除此向量</button></form><section class="share"><h2>邀請學生</h2><a id="student-link" target="_blank" rel="noopener">開啟學生端 ↗</a><button id="copy-link" class="secondary wide">複製學生網址</button><p id="share-hint" class="hint"></p></section>` : '<section class="student-note"><h2>你的觀察席</h2><p>自由旋轉、縮放或平移。老師更新向量時，你的視角會保留。</p></section>'}
<p id="message" role="status" aria-live="polite"></p><details class="notice"><summary>關於這個測試版本</summary><p>本版未啟用登入。學生頁面沒有編輯功能，但知道教室代碼的人仍可開啟老師端或直接寫入資料庫。請勿存放個資。</p></details></aside></main>`;
$('#room-name').textContent = room;
function inputs(prefix) {
  return ['x', 'y', 'z'].map(axis => `<label>${axis.toUpperCase()}<input aria-label="${prefix === 'origin' ? '起點' : '分量'} ${axis.toUpperCase()}" id="${prefix}-${axis}" type="number" min="-100" max="100" step="any" required></label>`).join('');
}
let scene;
try { scene = createScene($('#viewport')); }
catch { $('#message').textContent = '無法啟動３Ｄ畫面。請開啟瀏覽器硬體加速，或改用支援 WebGL ２的瀏覽器。'; }
$('#reset-camera').onclick = () => scene?.reset();
let vectors = {}, selected = null, store, online = false, pending = false, dirty = false, ready = false;
const colors = ['#57dfc2', '#ffba69', '#a894ff', '#ff829d'];
function message(text, isError = false) { $('#message').textContent = text; $('#message').classList.toggle('error', isError); }
function controls() {
  if (!teacher) return;
  $('#add').disabled = !ready || !online || pending || Object.keys(vectors).length >= MAX_VECTORS;
  $('#save').disabled = !ready || !online || pending;
  $('#delete').disabled = !ready || !online || pending;
  $('#editor').querySelectorAll('input').forEach(input => { input.disabled = pending; });
}
function populate() {
  if (!teacher) return;
  $('#editor').hidden = !selected || !vectors[selected];
  if ($('#editor').hidden) return;
  const vector = vectors[selected];
  $('#label').value = vector.label; $('#color').value = vector.color;
  for (const field of ['origin', 'components']) for (const axis of ['x', 'y', 'z']) $(`#${field}-${axis}`).value = vector[field][axis];
  dirty = false;
}
function renderList() {
  $('#count').textContent = `${Object.keys(vectors).length} 個`;
  $('#vector-list').replaceChildren();
  if (!Object.keys(vectors).length) {
    const empty = document.createElement('p'); empty.className = 'empty';
    empty.textContent = teacher ? '目前沒有向量。新增第一支，開始探索。' : '等待老師新增向量…';
    $('#vector-list').append(empty);
  }
  for (const [id, v] of Object.entries(vectors)) {
    const row = document.createElement(teacher ? 'button' : 'div');
    row.className = `vector-row ${selected === id ? 'selected' : ''}`; row.dataset.id = id;
    row.style.setProperty('--vector-color', v.color);
    const title = document.createElement('strong'); title.textContent = v.label;
    const detail = document.createElement('small');
    detail.textContent = `（${v.components.x}，${v.components.y}，${v.components.z}）　｜v｜＝${magnitude(v).toFixed(2)}`;
    row.append(title, detail);
    if (teacher) { row.disabled = pending; row.onclick = () => { selected = id; populate(); renderList(); }; }
    $('#vector-list').append(row);
  }
}
async function mutate(operation, success) {
  if (pending || !online) return;
  pending = true; controls(); renderList(); message('同步中…');
  try { await operation(); dirty = false; populate(); message(success); }
  catch (error) { message(`未能儲存：${error.message}`, true); }
  finally { pending = false; controls(); renderList(); }
}
if (teacher) {
  const studentURL = new URL('student.html', location.href); studentURL.search = location.search;
  if (!studentURL.searchParams.has('room')) studentURL.searchParams.set('room', room);
  $('#student-link').href = studentURL.href;
  $('#share-hint').textContent = studentURL.searchParams.get('emulator') === '1' ? '本機網址僅供這台電腦測試；部署後再分享給學生。' : '分享此網址，學生即可加入同一場景。';
  $('#copy-link').onclick = async () => {
    try { await navigator.clipboard.writeText(studentURL.href); message('已複製學生網址。'); }
    catch { message('請長按或右鍵複製上方學生端連結。'); }
  };
  $('#editor').addEventListener('input', () => { dirty = true; });
  $('#add').onclick = () => mutate(async () => {
    const count = Object.keys(vectors).length;
    selected = await store.create({ label: `向量 ${count + 1}`, color: colors[count % colors.length], origin: { x: 0, y: 0, z: 0 }, components: { x: 3, y: 2, z: 1 } });
  }, '已新增向量。');
  $('#editor').onsubmit = event => {
    event.preventDefault();
    const vector = { label: $('#label').value.trim(), color: $('#color').value };
    for (const field of ['origin', 'components']) vector[field] = Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, $(`#${field}-${axis}`).valueAsNumber]));
    try { validateVector(vector); } catch (error) { message(error.message, true); return; }
    const id = selected;
    mutate(() => store.write(id, vector), '已同步至教室。');
  };
  $('#delete').onclick = () => { const id = selected; mutate(() => store.delete(id), '已刪除向量。'); };
}
try {
  store = await connectStore(room, {
    onScene: data => {
      vectors = data; ready = true;
      if (selected && !vectors[selected]) { selected = null; dirty = false; }
      scene?.update(vectors); renderList();
      if (!dirty) populate();
      controls();
    },
    onConnection: (connected, emulator) => {
      online = connected;
      $('#connection').textContent = connected ? (emulator ? '本機模擬器・已連線' : '已連線') : '離線・等待重新連線';
      $('#connection').classList.toggle('connected', connected); controls();
    },
    onError: error => { ready = false; message(`讀取失敗：${error.message}`, true); controls(); }
  });
} catch (error) { $('#connection').textContent = '尚未連線'; message(error.message, true); }
window.addEventListener('beforeunload', event => {
  if (teacher && (dirty || pending)) { event.preventDefault(); event.returnValue = ''; }
});
