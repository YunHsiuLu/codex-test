const state = { activeTask: null, tasks: [] };
const $ = (selector) => document.querySelector(selector);

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "發生未知錯誤。");
  return data;
}

function displayName(speaker) {
  return ({ Codex: "Codex｜實作規劃", AGY: "AGY｜風險審查", "你": "你", "系統": "系統" })[speaker] || speaker;
}

function renderTasks() {
  const list = $("#taskList");
  list.innerHTML = "";
  if (!state.tasks.length) { list.innerHTML = '<p class="empty-list">尚未建立任務</p>'; return; }
  state.tasks.forEach((task) => {
    const button = document.createElement("button");
    button.className = `task-item ${state.activeTask?.id === task.id ? "active" : ""}`;
    button.innerHTML = `<span>${escapeHtml(task.goal.slice(0, 30))}${task.goal.length > 30 ? "…" : ""}</span><small>${statusLabel(task.status)}</small>`;
    button.onclick = () => loadTask(task.id);
    list.append(button);
  });
}

function statusLabel(status) { return ({ queued: "等待開始", running: "協作進行中", ready: "等待開始／繼續", completed: "專案已完成", blocked: "等待你的決定", stopped: "已停止", error: "本輪出現問題" })[status] || status; }
function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }

function renderTask(task) {
  state.activeTask = task;
  $("#emptyState").classList.add("hidden");
  $("#conversation").classList.remove("hidden");
  $("#taskTitle").textContent = statusLabel(task.status);
  $("#goalText").textContent = task.goal;
  $("#workspaceText").textContent = task.workspace;
  $("#roundText").textContent = `已完成 ${task.build_round || 0}／${task.max_rounds || 8} 個協作循環`;
  $("#modeText").textContent = task.agy_disabled ? "降級模式：Codex 自我審查" : "雙代理專案協作";
  const messages = $("#messages");
  messages.innerHTML = "";
  task.messages.forEach((message) => {
    const node = $("#messageTemplate").content.firstElementChild.cloneNode(true);
    const type = message.speaker === "你" ? "you" : message.speaker.toLowerCase();
    node.classList.add(type, message.kind);
    node.querySelector(".avatar").textContent = message.speaker === "系統" ? "" : message.speaker.slice(0, 1);
    node.querySelector("strong").textContent = displayName(message.speaker);
    node.querySelector("time").textContent = message.time;
    node.querySelector(".message-content").textContent = message.content;
    messages.append(node);
  });
  const busy = task.status === "running" || task.status === "queued";
  $("#followUp").disabled = busy;
  $("#followUpForm button").disabled = busy;
  const build = $("#buildButton");
  build.disabled = busy || task.status === "completed";
  build.textContent = task.build_round ? "繼續專案協作 ↗" : "開始專案協作 ↗";
  $("#stopButton").disabled = !busy;
  renderTasks();
}

async function refreshTasks() {
  try { state.tasks = (await api("/api/tasks")).tasks; renderTasks(); } catch (_) { /* server may still be starting */ }
}

async function loadTask(id) {
  try { renderTask(await api(`/api/tasks/${id}`)); }
  catch (error) {
    if (error.message === "找不到任務。") {
      state.activeTask = null;
      $("#emptyState").classList.remove("hidden");
      $("#conversation").classList.add("hidden");
      $("#taskTitle").textContent = "建立一場討論";
      renderTasks();
      return;
    }
    alert(error.message);
  }
}

$("#taskForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = event.currentTarget.querySelector("button");
  submit.disabled = true;
  try {
    const task = await api("/api/tasks", { method: "POST", body: JSON.stringify({ goal: $("#goal").value, project_name: $("#projectName").value, max_rounds: Number($("#roundLimit").value) }) });
    state.tasks.unshift(task); renderTask(task); $("#goal").value = "";
    await api(`/api/tasks/${task.id}/build`, { method: "POST", body: JSON.stringify({}) });
    await loadTask(task.id);
  } catch (error) { alert(error.message); }
  finally { submit.disabled = false; }
});

$("#followUpForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = $("#followUp").value.trim();
  if (!message || !state.activeTask) return;
  try {
    await api(`/api/tasks/${state.activeTask.id}/build`, { method: "POST", body: JSON.stringify({ instruction: message }) });
    $("#followUp").value = "";
    await loadTask(state.activeTask.id);
  } catch (error) { alert(error.message); }
});

$("#buildButton").addEventListener("click", async () => {
  if (!state.activeTask) return;
  try {
    await api(`/api/tasks/${state.activeTask.id}/build`, { method: "POST", body: JSON.stringify({}) });
    await loadTask(state.activeTask.id);
  } catch (error) { alert(error.message); }
});

$("#stopButton").addEventListener("click", async () => {
  if (!state.activeTask) return;
  try { await api(`/api/tasks/${state.activeTask.id}/stop`, { method: "POST", body: JSON.stringify({}) }); }
  catch (error) { alert(error.message); }
});

$("#newTaskButton").onclick = () => { $("#emptyState").classList.remove("hidden"); $("#conversation").classList.add("hidden"); $("#taskTitle").textContent = "建立一場討論"; $("#goal").focus(); };

async function checkHealth() {
  try {
    const health = await api("/api/health");
    const status = $("#agentStatus");
    const okay = health.codex && health.agy;
    status.classList.toggle("offline", !okay);
    status.lastChild.textContent = okay ? "Codex 與 AGY 均可使用" : "找不到其中一個 CLI";
  } catch (_) { $("#agentStatus").classList.add("offline"); $("#agentStatus").lastChild.textContent = "尚未連上本機服務"; }
}

setInterval(async () => { await refreshTasks(); if (state.activeTask) await loadTask(state.activeTask.id); }, 2500);
refreshTasks(); checkHealth();
