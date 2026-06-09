const canvas = document.querySelector("#pendulumCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  angle1: document.querySelector("#angle1"),
  angle2: document.querySelector("#angle2"),
  angle1Out: document.querySelector("#angle1Out"),
  angle2Out: document.querySelector("#angle2Out"),
  applyBtn: document.querySelector("#applyBtn"),
  toggleBtn: document.querySelector("#toggleBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  stateChip: document.querySelector("#stateChip"),
  totalEnergy: document.querySelector("#totalEnergy"),
  k1: document.querySelector("#k1"),
  k2: document.querySelector("#k2"),
  u1: document.querySelector("#u1"),
  u2: document.querySelector("#u2"),
};

const params = {
  m1: 1,
  m2: 1,
  l1: 1.4,
  l2: 1.2,
  g: 9.81,
};

let state = horizontalDegToState(-70, -25);
let running = false;
let lastTime = performance.now();
let trail = [];

function horizontalDegToState(angle1, angle2) {
  return {
    theta1: degToRad(angle1) + Math.PI / 2,
    theta2: degToRad(angle2) + Math.PI / 2,
    omega1: 0,
    omega2: 0,
  };
}

function degToRad(value) {
  return (Number(value) * Math.PI) / 180;
}

function thetaToHorizontalDeg(theta) {
  return ((theta - Math.PI / 2) * 180) / Math.PI;
}

function accelerations(s) {
  const { m1, m2, l1, l2, g } = params;
  const delta = s.theta1 - s.theta2;
  const den = 2 * m1 + m2 - m2 * Math.cos(2 * delta);

  const alpha1 =
    (-g * (2 * m1 + m2) * Math.sin(s.theta1) -
      m2 * g * Math.sin(s.theta1 - 2 * s.theta2) -
      2 *
        Math.sin(delta) *
        m2 *
        (s.omega2 * s.omega2 * l2 + s.omega1 * s.omega1 * l1 * Math.cos(delta))) /
    (l1 * den);

  const alpha2 =
    (2 *
      Math.sin(delta) *
      (s.omega1 * s.omega1 * l1 * (m1 + m2) +
        g * (m1 + m2) * Math.cos(s.theta1) +
        s.omega2 * s.omega2 * l2 * m2 * Math.cos(delta))) /
    (l2 * den);

  return { alpha1, alpha2 };
}

function derivatives(s) {
  const { alpha1, alpha2 } = accelerations(s);
  return {
    theta1: s.omega1,
    theta2: s.omega2,
    omega1: alpha1,
    omega2: alpha2,
  };
}

function addState(s, d, scale) {
  return {
    theta1: s.theta1 + d.theta1 * scale,
    theta2: s.theta2 + d.theta2 * scale,
    omega1: s.omega1 + d.omega1 * scale,
    omega2: s.omega2 + d.omega2 * scale,
  };
}

function rk4Step(s, dt) {
  const k1 = derivatives(s);
  const k2 = derivatives(addState(s, k1, dt / 2));
  const k3 = derivatives(addState(s, k2, dt / 2));
  const k4 = derivatives(addState(s, k3, dt));

  return {
    theta1: s.theta1 + (dt / 6) * (k1.theta1 + 2 * k2.theta1 + 2 * k3.theta1 + k4.theta1),
    theta2: s.theta2 + (dt / 6) * (k1.theta2 + 2 * k2.theta2 + 2 * k3.theta2 + k4.theta2),
    omega1: s.omega1 + (dt / 6) * (k1.omega1 + 2 * k2.omega1 + 2 * k3.omega1 + k4.omega1),
    omega2: s.omega2 + (dt / 6) * (k1.omega2 + 2 * k2.omega2 + 2 * k3.omega2 + k4.omega2),
  };
}

function getPositions(s) {
  const x1 = params.l1 * Math.sin(s.theta1);
  const y1 = params.l1 * Math.cos(s.theta1);
  const x2 = x1 + params.l2 * Math.sin(s.theta2);
  const y2 = y1 + params.l2 * Math.cos(s.theta2);
  return { x1, y1, x2, y2 };
}

function getEnergy(s) {
  const { m1, m2, l1, l2, g } = params;
  const delta = s.theta1 - s.theta2;
  const y1Up = -l1 * Math.cos(s.theta1);
  const y2Up = y1Up - l2 * Math.cos(s.theta2);
  const k1 = 0.5 * m1 * l1 * l1 * s.omega1 * s.omega1;
  const k2 =
    0.5 *
    m2 *
    (l1 * l1 * s.omega1 * s.omega1 +
      l2 * l2 * s.omega2 * s.omega2 +
      2 * l1 * l2 * s.omega1 * s.omega2 * Math.cos(delta));
  const u1 = m1 * g * y1Up;
  const u2 = m2 * g * y2Up;
  return { k1, k2, u1, u2, total: k1 + k2 + u1 + u2 };
}

function formatJ(value) {
  return `${value.toFixed(3)} J`;
}

function updateEnergyReadout() {
  const energy = getEnergy(state);
  ui.totalEnergy.textContent = formatJ(energy.total);
  ui.k1.textContent = formatJ(energy.k1);
  ui.k2.textContent = formatJ(energy.k2);
  ui.u1.textContent = formatJ(energy.u1);
  ui.u2.textContent = formatJ(energy.u2);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function draw() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const origin = { x: width / 2, y: Math.max(92, height * 0.2) };
  const scale = Math.min(width * 0.32, height * 0.34) / Math.max(params.l1, params.l2);
  const pos = getPositions(state);
  const x1 = origin.x + pos.x1 * scale;
  const y1 = origin.y + pos.y1 * scale;
  const x2 = origin.x + pos.x2 * scale;
  const y2 = origin.y + pos.y2 * scale;

  ctx.clearRect(0, 0, width, height);
  drawReference(origin, width);
  drawTrail(x2, y2);

  ctx.lineCap = "round";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#38424d";
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  drawBob(x1, y1, 18, "#2e6fa7", "1");
  drawBob(x2, y2, 20, "#b77a16", "2");
  drawPivot(origin);
  drawAngleArc(origin, state.theta1, "#2e6fa7", 48, "θ1");
  drawAngleArc({ x: x1, y: y1 }, state.theta2, "#b77a16", 44, "θ2");
}

function drawReference(origin, width) {
  ctx.save();
  ctx.strokeStyle = "rgba(13, 79, 74, 0.32)";
  ctx.setLineDash([8, 8]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(28, origin.y);
  ctx.lineTo(width - 28, origin.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#5f6975";
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillText("水平 0°", 30, origin.y - 10);
  ctx.restore();
}

function drawTrail(x, y) {
  if (running) {
    trail.push({ x, y });
    if (trail.length > 180) trail.shift();
  }
  if (trail.length < 2) return;

  ctx.save();
  ctx.lineWidth = 2;
  for (let i = 1; i < trail.length; i += 1) {
    const alpha = i / trail.length;
    ctx.strokeStyle = `rgba(183, 122, 22, ${alpha * 0.45})`;
    ctx.beginPath();
    ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
    ctx.lineTo(trail[i].x, trail[i].y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBob(x, y, radius, color, label) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(24, 32, 42, 0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
  ctx.restore();
}

function drawPivot(origin) {
  ctx.save();
  ctx.fillStyle = "#18202a";
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAngleArc(origin, theta, color, radius, label) {
  const horizontalAngle = theta - Math.PI / 2;
  const start = 0;
  const end = -horizontalAngle;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, radius, start, end, end < start);
  ctx.stroke();
  const lx = origin.x + Math.cos(end / 2) * (radius + 16);
  const ly = origin.y + Math.sin(end / 2) * (radius + 16);
  ctx.font = "700 13px system-ui, sans-serif";
  ctx.fillText(label, lx, ly);
  ctx.restore();
}

function syncAngleOutputs() {
  ui.angle1Out.textContent = `${ui.angle1.value}°`;
  ui.angle2Out.textContent = `${ui.angle2.value}°`;
}

function applyAngles() {
  state = horizontalDegToState(ui.angle1.value, ui.angle2.value);
  trail = [];
  updateEnergyReadout();
  draw();
}

function resetAngles() {
  running = false;
  ui.toggleBtn.textContent = "開始";
  ui.stateChip.textContent = "Paused";
  ui.stateChip.classList.remove("running");
  ui.angle1.value = -70;
  ui.angle2.value = -25;
  syncAngleOutputs();
  applyAngles();
}

function setRunning(next) {
  running = next;
  ui.toggleBtn.textContent = running ? "暫停" : "開始";
  ui.stateChip.textContent = running ? "Running" : "Paused";
  ui.stateChip.classList.toggle("running", running);
  lastTime = performance.now();
}

function animate(now) {
  const elapsed = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (running) {
    const fixedDt = 1 / 240;
    let remaining = elapsed;
    while (remaining > 0) {
      const dt = Math.min(fixedDt, remaining);
      state = rk4Step(state, dt);
      remaining -= dt;
    }
    ui.angle1Out.textContent = `${thetaToHorizontalDeg(state.theta1).toFixed(1)}°`;
    ui.angle2Out.textContent = `${thetaToHorizontalDeg(state.theta2).toFixed(1)}°`;
  }

  updateEnergyReadout();
  draw();
  requestAnimationFrame(animate);
}

ui.angle1.addEventListener("input", () => {
  syncAngleOutputs();
  if (!running) applyAngles();
});
ui.angle2.addEventListener("input", () => {
  syncAngleOutputs();
  if (!running) applyAngles();
});
ui.applyBtn.addEventListener("click", applyAngles);
ui.toggleBtn.addEventListener("click", () => setRunning(!running));
ui.resetBtn.addEventListener("click", resetAngles);
window.addEventListener("resize", () => {
  resizeCanvas();
  draw();
});

resizeCanvas();
syncAngleOutputs();
updateEnergyReadout();
requestAnimationFrame(animate);
