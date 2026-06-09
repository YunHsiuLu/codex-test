const canvas = document.querySelector("#collisionCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  digits: document.querySelector("#digits"),
  digitsOut: document.querySelector("#digitsOut"),
  speed: document.querySelector("#speed"),
  speedOut: document.querySelector("#speedOut"),
  toggleBtn: document.querySelector("#toggleBtn"),
  stepBtn: document.querySelector("#stepBtn"),
  finishBtn: document.querySelector("#finishBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  stateChip: document.querySelector("#stateChip"),
  targetChip: document.querySelector("#targetChip"),
  massReadout: document.querySelector("#massReadout"),
  targetReadout: document.querySelector("#targetReadout"),
  collisionCount: document.querySelector("#collisionCount"),
  piReadout: document.querySelector("#piReadout"),
  lastEvent: document.querySelector("#lastEvent"),
  doneReadout: document.querySelector("#doneReadout"),
  massFormula: document.querySelector("#massFormula"),
  formulaCount: document.querySelector("#formulaCount"),
};

const smallBlock = {
  mass: 1,
  size: 0.72,
  color: "#277a73",
  label: "m",
};

const largeBlock = {
  size: 1.28,
  color: "#b7682f",
  label: "M",
};

let model = createInitialModel(2);
let running = false;
let lastFrame = performance.now();
let flash = null;

function createInitialModel(digits) {
  const mass = 100 ** digits;
  return {
    digits,
    elapsed: 0,
    collisions: 0,
    done: false,
    lastEvent: "尚未碰撞",
    small: {
      x: 2.1,
      v: 0,
    },
    large: {
      x: 7.1,
      v: -1,
      mass,
    },
  };
}

function targetCollisionCount(digits) {
  return Math.floor(Math.PI * 10 ** digits);
}

function formatInteger(value) {
  return Math.round(value).toLocaleString("en-US");
}

function formatPiFromCount(count, digits) {
  if (digits === 0) return String(count);
  const raw = String(count).padStart(digits + 1, "0");
  return `${raw.slice(0, -digits)}.${raw.slice(-digits)}`;
}

function getNextEvent() {
  if (model.done) return null;

  const s = model.small;
  const l = model.large;
  const smallLeft = s.x;
  const smallRight = s.x + smallBlock.size;
  const largeLeft = l.x;

  let wallTime = Infinity;
  if (s.v < 0) {
    wallTime = smallLeft / -s.v;
  }

  let blockTime = Infinity;
  if (l.v < s.v) {
    const gap = largeLeft - smallRight;
    blockTime = gap / (s.v - l.v);
  }

  if (!Number.isFinite(wallTime) && !Number.isFinite(blockTime)) {
    return null;
  }

  if (wallTime <= blockTime) {
    return { kind: "wall", time: wallTime };
  }
  return { kind: "blocks", time: blockTime };
}

function advanceFreeMotion(dt) {
  model.small.x += model.small.v * dt;
  model.large.x += model.large.v * dt;
  model.elapsed += dt;
}

function processNextCollision() {
  const event = getNextEvent();
  if (!event || event.time < -1e-10) {
    model.done = true;
    model.lastEvent = "沒有後續碰撞";
    return false;
  }

  advanceFreeMotion(Math.max(0, event.time));

  if (event.kind === "wall") {
    model.small.x = Math.max(0, model.small.x);
    model.small.v *= -1;
    model.lastEvent = "小方塊撞牆";
    flash = { kind: "wall", age: 0 };
  } else {
    const m = smallBlock.mass;
    const bigM = model.large.mass;
    const u1 = model.small.v;
    const u2 = model.large.v;
    model.small.x = model.large.x - smallBlock.size;
    model.small.v = ((m - bigM) / (m + bigM)) * u1 + ((2 * bigM) / (m + bigM)) * u2;
    model.large.v = ((2 * m) / (m + bigM)) * u1 + ((bigM - m) / (m + bigM)) * u2;
    model.lastEvent = "兩方塊互撞";
    flash = { kind: "blocks", x: model.large.x, age: 0 };
  }

  model.collisions += 1;
  const next = getNextEvent();
  if (!next) {
    model.done = true;
    running = false;
  }
  return true;
}

function runEventBudget(maxEvents) {
  let processed = 0;
  while (processed < maxEvents && processNextCollision()) {
    processed += 1;
  }
  updateReadouts();
}

function animateSimulation(dt) {
  const speed = Number(ui.speed.value);
  const eventsPerFrame = [1, 2, 8, 48, 240][speed - 1];
  const visualTime = dt * [0.45, 0.8, 1.4, 2.2, 3.4][speed - 1];
  let remaining = visualTime;
  let guard = 0;

  while (running && remaining > 0 && guard < eventsPerFrame) {
    const event = getNextEvent();
    if (!event) {
      model.done = true;
      running = false;
      break;
    }

    if (event.time > remaining) {
      advanceFreeMotion(remaining);
      remaining = 0;
    } else {
      processNextCollision();
      remaining -= Math.max(0, event.time);
      guard += 1;
    }
  }

  if (running && guard >= eventsPerFrame) {
    updateReadouts();
  }
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  draw();
}

function worldToScreen(x, layout) {
  return layout.left + x * layout.scale;
}

function getLayout() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const left = Math.max(58, width * 0.08);
  const right = Math.max(32, width * 0.04);
  const floorY = Math.max(250, height * 0.72);
  const maxX = Math.max(10.5, model.large.x + largeBlock.size + 1.3);
  const scale = (width - left - right) / maxX;
  return { width, height, left, floorY, scale };
}

function draw() {
  const layout = getLayout();
  ctx.clearRect(0, 0, layout.width, layout.height);
  drawScene(layout);
  drawBlock(model.small, smallBlock, layout);
  drawBlock(model.large, largeBlock, layout);
  drawVelocityArrow(model.small, smallBlock, layout);
  drawVelocityArrow(model.large, largeBlock, layout);
  drawCollisionFlash(layout);
  drawCounterOverlay(layout);
}

function drawScene(layout) {
  ctx.save();
  ctx.fillStyle = "#25323b";
  ctx.fillRect(layout.left - 14, layout.floorY - 196, 14, 196);
  ctx.fillStyle = "#e6eaed";
  ctx.fillRect(layout.left - 14, layout.floorY, layout.width - layout.left + 2, 18);

  ctx.strokeStyle = "rgba(37, 50, 59, 0.22)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= 10; x += 1) {
    const sx = worldToScreen(x, layout);
    ctx.beginPath();
    ctx.moveTo(sx, layout.floorY);
    ctx.lineTo(sx, layout.floorY + 12);
    ctx.stroke();
  }

  ctx.fillStyle = "#5d6872";
  ctx.font = "13px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("牆", layout.left - 34, layout.floorY - 168);
  ctx.fillText("完全彈性碰撞", layout.left + 8, layout.floorY + 42);
  ctx.restore();
}

function drawBlock(body, block, layout) {
  const x = worldToScreen(body.x, layout);
  const size = block.size * layout.scale;
  const height = size;
  const y = layout.floorY - height;

  ctx.save();
  ctx.fillStyle = block.color;
  ctx.strokeStyle = "rgba(23, 29, 34, 0.26)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, size, height, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = `${Math.max(14, Math.min(22, size * 0.18))}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(block.label, x + size / 2, y + height / 2);

  ctx.fillStyle = "#171d22";
  ctx.font = "700 13px system-ui, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${formatInteger(body.mass || 1)} kg`, x + size / 2, y - 10);
  ctx.restore();
}

function drawVelocityArrow(body, block, layout) {
  if (Math.abs(body.v) < 0.005) return;

  const x = worldToScreen(body.x + block.size / 2, layout);
  const y = layout.floorY - block.size * layout.scale - 34;
  const direction = Math.sign(body.v);
  const length = Math.min(88, 34 + Math.abs(body.v) * 44);
  const endX = x + direction * length;

  ctx.save();
  ctx.strokeStyle = block.color;
  ctx.fillStyle = block.color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(endX, y);
  ctx.lineTo(endX - direction * 10, y - 6);
  ctx.lineTo(endX - direction * 10, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCollisionFlash(layout) {
  if (!flash) return;

  flash.age += 1 / 60;
  const alpha = Math.max(0, 1 - flash.age * 4);
  if (alpha <= 0) {
    flash = null;
    return;
  }

  const x = flash.kind === "wall" ? layout.left : worldToScreen(flash.x, layout);
  const y = layout.floorY - smallBlock.size * layout.scale * 0.55;
  ctx.save();
  ctx.strokeStyle = `rgba(183, 104, 47, ${alpha})`;
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const inner = 8;
    const outer = 24 + flash.age * 42;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
    ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCounterOverlay(layout) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  ctx.strokeStyle = "rgba(211, 219, 224, 0.96)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(layout.left + 18, 24, 260, 96, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#5d6872";
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillText("碰撞次數", layout.left + 38, 52);
  ctx.fillText("π 讀值", layout.left + 38, 94);

  ctx.fillStyle = "#171d22";
  ctx.font = "700 24px system-ui, sans-serif";
  ctx.fillText(formatInteger(model.collisions), layout.left + 128, 56);
  ctx.fillText(formatPiFromCount(model.collisions, model.digits), layout.left + 128, 98);
  ctx.restore();
}

function updateReadouts() {
  const digits = model.digits;
  const target = targetCollisionCount(digits);
  ui.digitsOut.textContent = String(digits);
  ui.speedOut.textContent = `${ui.speed.value}x`;
  ui.massReadout.textContent = `${formatInteger(model.large.mass)} kg`;
  ui.massFormula.textContent = `100${digits ? toSuperscript(digits) : "⁰"} kg`;
  ui.formulaCount.textContent = digits === 0 ? "⌊π⌋" : `⌊π × 10${toSuperscript(digits)}⌋`;
  ui.targetReadout.textContent = formatInteger(target);
  ui.collisionCount.textContent = formatInteger(model.collisions);
  ui.piReadout.textContent = formatPiFromCount(model.collisions, digits);
  ui.lastEvent.textContent = model.lastEvent;
  ui.targetChip.textContent = `π ≈ ${Math.PI.toFixed(Math.max(0, digits))}`;

  if (model.done) {
    ui.doneReadout.textContent =
      model.collisions === target ? "完成，碰撞數吻合" : "完成，請檢查數值誤差";
    ui.stateChip.textContent = "Done";
    ui.toggleBtn.textContent = "開始";
  } else if (running) {
    ui.doneReadout.textContent = "模擬中";
    ui.stateChip.textContent = "Running";
    ui.toggleBtn.textContent = "暫停";
  } else {
    ui.doneReadout.textContent = model.collisions ? "已暫停" : "等待開始";
    ui.stateChip.textContent = "Ready";
    ui.toggleBtn.textContent = "開始";
  }
}

function toSuperscript(value) {
  const map = {
    0: "⁰",
    1: "¹",
    2: "²",
    3: "³",
    4: "⁴",
    5: "⁵",
  };
  return String(value)
    .split("")
    .map((char) => map[char] || char)
    .join("");
}

function resetModel() {
  running = false;
  model = createInitialModel(Number(ui.digits.value));
  flash = null;
  updateReadouts();
  draw();
}

function finishSimulation() {
  running = false;
  const start = performance.now();
  while (!model.done && performance.now() - start < 1800) {
    runEventBudget(2000);
  }

  if (!model.done) {
    running = true;
    ui.doneReadout.textContent = "批次計算中";
  }
  updateReadouts();
  draw();
}

function frame(now) {
  const dt = Math.min(0.06, (now - lastFrame) / 1000);
  lastFrame = now;

  if (running) {
    animateSimulation(dt);
    if (model.done) running = false;
    updateReadouts();
  }

  draw();
  requestAnimationFrame(frame);
}

ui.digits.addEventListener("input", resetModel);
ui.speed.addEventListener("input", updateReadouts);
ui.toggleBtn.addEventListener("click", () => {
  if (model.done) resetModel();
  running = !running;
  updateReadouts();
});
ui.stepBtn.addEventListener("click", () => {
  running = false;
  processNextCollision();
  updateReadouts();
  draw();
});
ui.finishBtn.addEventListener("click", finishSimulation);
ui.resetBtn.addEventListener("click", resetModel);
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
updateReadouts();
requestAnimationFrame((now) => {
  lastFrame = now;
  requestAnimationFrame(frame);
});
