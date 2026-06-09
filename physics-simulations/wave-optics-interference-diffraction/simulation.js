const canvas = document.querySelector("#opticsCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  doubleBtn: document.querySelector("#doubleBtn"),
  singleBtn: document.querySelector("#singleBtn"),
  experimentBtn: document.querySelector("#experimentBtn"),
  theoryBtn: document.querySelector("#theoryBtn"),
  modeChip: document.querySelector("#modeChip"),
  resultChip: document.querySelector("#resultChip"),
  wavelength: document.querySelector("#wavelength"),
  slitWidth: document.querySelector("#slitWidth"),
  slitSeparation: document.querySelector("#slitSeparation"),
  screenDistance: document.querySelector("#screenDistance"),
  wavelengthOut: document.querySelector("#wavelengthOut"),
  slitWidthOut: document.querySelector("#slitWidthOut"),
  slitSeparationOut: document.querySelector("#slitSeparationOut"),
  screenDistanceOut: document.querySelector("#screenDistanceOut"),
  centralWidth: document.querySelector("#centralWidth"),
  fringeSpacing: document.querySelector("#fringeSpacing"),
  firstMinimum: document.querySelector("#firstMinimum"),
  peakIntensity: document.querySelector("#peakIntensity"),
  formulaText: document.querySelector("#formulaText"),
  modelNote: document.querySelector("#modelNote"),
};

let mode = "double";
let resultMode = "experiment";
let pixelRatio = 1;
let drawQueued = false;

function readParams() {
  return {
    wavelength: Number(ui.wavelength.value) * 1e-9,
    slitWidth: Number(ui.slitWidth.value) * 1e-6,
    slitSeparation: Number(ui.slitSeparation.value) * 1e-6,
    screenDistance: Number(ui.screenDistance.value),
  };
}

function sinc(value) {
  if (Math.abs(value) < 1e-8) return 1;
  return Math.sin(value) / value;
}

function theoreticalIntensityAt(y, p) {
  const sinTheta = y / Math.sqrt(p.screenDistance * p.screenDistance + y * y);
  const alpha = (Math.PI * p.slitWidth * sinTheta) / p.wavelength;
  const envelope = sinc(alpha) ** 2;
  if (mode === "single") return envelope;

  const beta = (Math.PI * p.slitSeparation * sinTheta) / p.wavelength;
  return Math.cos(beta) ** 2 * envelope;
}

function experimentalIntensityAt(y, p) {
  const sample = 0.00042;
  const blurred =
    theoreticalIntensityAt(y - sample, p) * 0.2 +
    theoreticalIntensityAt(y, p) * 0.6 +
    theoreticalIntensityAt(y + sample, p) * 0.2;
  const background = 0.045;
  const contrast = mode === "double" ? 0.82 : 0.86;
  const unevenIllumination = 1 + 0.035 * Math.sin(y * 410 + 0.7);
  const noise = (pseudoNoise(y * 100000) - 0.5) * 0.045;
  return clamp(background + contrast * blurred * unevenIllumination + noise, 0, 1);
}

function displayedIntensityAt(y, p) {
  return resultMode === "theory" ? theoreticalIntensityAt(y, p) : experimentalIntensityAt(y, p);
}

function pseudoNoise(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function wavelengthToRgb(wavelengthNm) {
  let r = 0;
  let g = 0;
  let b = 0;

  if (wavelengthNm >= 380 && wavelengthNm < 440) {
    r = -(wavelengthNm - 440) / (440 - 380);
    b = 1;
  } else if (wavelengthNm < 490) {
    g = (wavelengthNm - 440) / (490 - 440);
    b = 1;
  } else if (wavelengthNm < 510) {
    g = 1;
    b = -(wavelengthNm - 510) / (510 - 490);
  } else if (wavelengthNm < 580) {
    r = (wavelengthNm - 510) / (580 - 510);
    g = 1;
  } else if (wavelengthNm < 645) {
    r = 1;
    g = -(wavelengthNm - 645) / (645 - 580);
  } else {
    r = 1;
  }

  const edge =
    wavelengthNm < 420
      ? 0.3 + (0.7 * (wavelengthNm - 380)) / 40
      : wavelengthNm > 645
        ? 0.3 + (0.7 * (700 - wavelengthNm)) / 55
        : 1;

  return {
    r: Math.round(255 * r * edge),
    g: Math.round(255 * g * edge),
    b: Math.round(255 * b * edge),
  };
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * pixelRatio);
  canvas.height = Math.round(rect.height * pixelRatio);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function queueDraw() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(() => {
    drawQueued = false;
    draw();
  });
}

function syncReadouts() {
  const p = readParams();
  ui.wavelengthOut.textContent = `${ui.wavelength.value} nm`;
  ui.slitWidthOut.textContent = `${ui.slitWidth.value} um`;
  ui.slitSeparationOut.textContent = `${ui.slitSeparation.value} um`;
  ui.screenDistanceOut.textContent = `${p.screenDistance.toFixed(2)} m`;

  const centralWidth = (2 * p.wavelength * p.screenDistance) / p.slitWidth;
  const fringeSpacing = (p.wavelength * p.screenDistance) / p.slitSeparation;
  const firstMinimum = (p.wavelength * p.screenDistance) / p.slitWidth;
  const peak = estimatePeakIntensity(p);
  ui.centralWidth.textContent = `${(centralWidth * 1000).toFixed(2)} mm`;
  ui.fringeSpacing.textContent = mode === "double" ? `${(fringeSpacing * 1000).toFixed(2)} mm` : "N/A";
  ui.firstMinimum.textContent = `±${(firstMinimum * 1000).toFixed(2)} mm`;
  ui.peakIntensity.textContent = resultMode === "theory" ? "1.00" : `≈${peak.toFixed(2)}`;
  ui.formulaText.textContent =
    mode === "double" ? "I = cos²(beta) · sinc²(alpha)" : "I = sinc²(alpha)";
  ui.modelNote.textContent =
    resultMode === "theory"
      ? "理想遠場近似：sin(theta) 約等於 y / L。"
      : "含有限對比、背景光與微小量測雜訊。";
}

function estimatePeakIntensity(p) {
  let peak = 0;
  const halfMeters = 0.032;
  for (let i = 0; i <= 240; i += 1) {
    const y = ((i / 240) * 2 - 1) * halfMeters;
    peak = Math.max(peak, displayedIntensityAt(y, p));
  }
  return peak;
}

function setMode(nextMode) {
  mode = nextMode;
  const isDouble = mode === "double";
  ui.doubleBtn.classList.toggle("active", isDouble);
  ui.singleBtn.classList.toggle("active", !isDouble);
  ui.modeChip.textContent = isDouble ? "Double slit" : "Single slit";
  document.body.classList.toggle("single-mode", !isDouble);
  syncReadouts();
  queueDraw();
}

function setResultMode(nextMode) {
  resultMode = nextMode;
  const isExperiment = resultMode === "experiment";
  ui.experimentBtn.classList.toggle("active", isExperiment);
  ui.theoryBtn.classList.toggle("active", !isExperiment);
  ui.resultChip.textContent = isExperiment ? "Experiment" : "Theory";
  document.body.classList.toggle("theory-mode", !isExperiment);
  syncReadouts();
  queueDraw();
}

function draw() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const p = readParams();
  const color = wavelengthToRgb(Number(ui.wavelength.value));
  const light = `rgb(${color.r}, ${color.g}, ${color.b})`;
  const sourceX = Math.max(76, width * 0.11);
  const barrierX = Math.max(220, width * 0.31);
  const screenX = width - Math.max(112, width * 0.12);
  const midY = height * 0.5;
  const top = 44;
  const bottom = height - 44;
  const slitGapPx = Math.min(190, Math.max(74, Number(ui.slitSeparation.value) / 3.2));
  const slitHeightPx = Math.min(74, Math.max(22, Number(ui.slitWidth.value) / 2.6));
  const slitYs = mode === "double" ? [midY - slitGapPx / 2, midY + slitGapPx / 2] : [midY];
  const screenHalfMeters = 0.032;

  ctx.clearRect(0, 0, width, height);
  drawOpticalBench(width, height, sourceX, barrierX, screenX, midY);
  drawIncidentWave(sourceX, barrierX, top, bottom, light);
  drawBarrier(barrierX, top, bottom, slitYs, slitHeightPx);
  drawDiffractedWaves(barrierX, screenX, slitYs, light);
  drawScreenPattern(screenX, top, bottom, screenHalfMeters, p, color);
  drawIntensityGraph(screenX, top, bottom, screenHalfMeters, p, light);
  drawLabels(sourceX, barrierX, screenX, midY);
}

function drawOpticalBench(width, height, sourceX, barrierX, screenX, midY) {
  ctx.save();
  ctx.strokeStyle = "rgba(23, 32, 42, 0.14)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, midY);
  ctx.lineTo(width - 30, midY);
  ctx.stroke();

  ctx.fillStyle = "#17202a";
  ctx.beginPath();
  ctx.arc(sourceX, midY, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = "rgba(94, 104, 116, 0.35)";
  for (const x of [barrierX, screenX]) {
    ctx.beginPath();
    ctx.moveTo(x, 42);
    ctx.lineTo(x, height - 42);
    ctx.stroke();
  }
  ctx.restore();
}

function drawIncidentWave(sourceX, barrierX, top, bottom, light) {
  ctx.save();
  ctx.strokeStyle = light;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  const spacing = 24;
  for (let x = sourceX + 28; x < barrierX - 14; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, top + 14);
    ctx.lineTo(x, bottom - 14);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBarrier(x, top, bottom, slitYs, slitHeight) {
  ctx.save();
  ctx.fillStyle = "#24303c";
  const segments = [];
  let cursor = top;
  for (const y of slitYs) {
    const slitTop = y - slitHeight / 2;
    const slitBottom = y + slitHeight / 2;
    segments.push([cursor, slitTop]);
    cursor = slitBottom;
  }
  segments.push([cursor, bottom]);

  for (const [start, end] of segments) {
    if (end <= start) continue;
    ctx.fillRect(x - 8, start, 16, end - start);
  }
  ctx.restore();
}

function drawDiffractedWaves(barrierX, screenX, slitYs, light) {
  ctx.save();
  ctx.strokeStyle = light;
  ctx.lineWidth = 2;
  for (const slitY of slitYs) {
    for (let r = 34; barrierX + r < screenX + 34; r += 34) {
      ctx.globalAlpha = Math.max(0.08, 0.46 - r / 720);
      ctx.beginPath();
      ctx.arc(barrierX, slitY, r, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawScreenPattern(screenX, top, bottom, halfMeters, p, color) {
  const imageWidth = 38;
  const patternX = screenX - imageWidth / 2;
  const height = bottom - top;
  const bitmapWidth = Math.max(1, Math.round(imageWidth * pixelRatio));
  const bitmapHeight = Math.max(1, Math.round(height * pixelRatio));
  const image = ctx.createImageData(bitmapWidth, bitmapHeight);

  for (let row = 0; row < image.height; row += 1) {
    const y = ((row / (image.height - 1)) * 2 - 1) * halfMeters;
    const intensity = Math.min(1, displayedIntensityAt(y, p));
    const glow = Math.pow(intensity, 0.55);
    for (let col = 0; col < image.width; col += 1) {
      const idx = (row * image.width + col) * 4;
      image.data[idx] = Math.round(10 + color.r * glow);
      image.data[idx + 1] = Math.round(12 + color.g * glow);
      image.data[idx + 2] = Math.round(16 + color.b * glow);
      image.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(image, Math.round(patternX * pixelRatio), Math.round(top * pixelRatio));
  ctx.save();
  ctx.strokeStyle = "rgba(23, 32, 42, 0.28)";
  ctx.lineWidth = 1;
  ctx.strokeRect(patternX, top, imageWidth, height);
  ctx.restore();
}

function drawIntensityGraph(screenX, top, bottom, halfMeters, p, light) {
  const graphLeft = screenX - 220;
  const graphWidth = 160;
  const height = bottom - top;
  ctx.save();
  ctx.strokeStyle = "rgba(23, 32, 42, 0.28)";
  ctx.lineWidth = 1;
  ctx.strokeRect(graphLeft, top, graphWidth, height);

  ctx.strokeStyle = light;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let row = 0; row <= height; row += 1) {
    const yMeters = ((row / height) * 2 - 1) * halfMeters;
    const intensity = displayedIntensityAt(yMeters, p);
    const x = graphLeft + intensity * graphWidth;
    const y = top + row;
    if (row === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = "#5e6874";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("I / Imax", graphLeft, top - 10);
  ctx.restore();
}

function drawLabels(sourceX, barrierX, screenX, midY) {
  ctx.save();
  ctx.fillStyle = "#5e6874";
  ctx.font = "13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("光源", sourceX, midY + 32);
  ctx.fillText("狹縫", barrierX, 28);
  ctx.fillText("螢幕", screenX, 28);
  ctx.restore();
}

for (const input of [ui.wavelength, ui.slitWidth, ui.slitSeparation, ui.screenDistance]) {
  input.addEventListener("input", () => {
    syncReadouts();
    queueDraw();
  });
}

ui.doubleBtn.addEventListener("click", () => setMode("double"));
ui.singleBtn.addEventListener("click", () => setMode("single"));
ui.experimentBtn.addEventListener("click", () => setResultMode("experiment"));
ui.theoryBtn.addEventListener("click", () => setResultMode("theory"));
window.addEventListener("resize", () => {
  resizeCanvas();
  queueDraw();
});

resizeCanvas();
setMode("double");
setResultMode("experiment");
requestAnimationFrame(() => requestAnimationFrame(draw));
