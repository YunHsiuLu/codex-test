'use strict';
const $ = id => document.getElementById(id);
const experiment = $('experiment');
const ectx = experiment.getContext('2d');
const chart = $('chart');
const cctx = chart.getContext('2d');
const H = 6.62607015e-34;
const MASS_E = 9.1093837e-31;
const CHARGE_E = 1.602176634e-19;
const C = 299792458;
const bins = 360;
let intensity = new Float64Array(bins);
let counts = new Uint32Array(bins);
let particles = [];
let totalCount = 0;
let running = true;
let lastTime = 0;
let spawnCarry = 0;

const presets = {
  photon: { width: 15, separation: 45, span: 80, distance: 1, mode: 'wave' },
  electron: { width: 50, separation: 150, span: 4, distance: 1, mode: 'particle' }
};

function wavelength() {
  if ($('particleType').value === 'photon') return +$('wavelength').value * 1e-9;
  const volts = +$('voltage').value;
  const kinetic = CHARGE_E * volts;
  return H / Math.sqrt(2 * MASS_E * kinetic * (1 + kinetic / (2 * MASS_E * C * C)));
}

function lengthScale() { return $('particleType').value === 'photon' ? 1e-6 : 1e-9; }
function sinc(x) { return Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x; }

function calculateIntensity() {
  const lambda = wavelength();
  const a = Math.max(1e-15, +$('slitWidth').value * lengthScale());
  const d = Math.max(a, +$('slitSeparation').value * lengthScale());
  const L = Math.max(.001, +$('distance').value);
  const span = Math.max(1e-6, +$('screenSpan').value * 1e-3);
  const isDouble = $('slitType').value === 'double';
  let max = 0;
  for (let i = 0; i < bins; i++) {
    const y = ((i + .5) / bins - .5) * span;
    const sinTheta = y / Math.sqrt(L * L + y * y);
    const beta = Math.PI * a * sinTheta / lambda;
    const envelope = sinc(beta) ** 2;
    const interference = isDouble ? Math.cos(Math.PI * d * sinTheta / lambda) ** 2 : 1;
    intensity[i] = envelope * interference;
    max = Math.max(max, intensity[i]);
  }
  if (max > 0) for (let i = 0; i < bins; i++) intensity[i] /= max;
  updateReadouts(lambda, a, d, L);
}

function updateReadouts(lambda, a, d, L) {
  $('wavelengthOut').value = `${$('wavelength').value} nm`;
  $('voltageOut').value = `${$('voltage').value} V`;
  $('rateOut').value = ['','慢速','較慢','中速','快速','極快'][+$('rate').value];
  $('lambdaReadout').textContent = formatLength(lambda);
  const isDouble = $('slitType').value === 'double';
  const spacing = isDouble ? lambda * L / d : 2 * lambda * L / a;
  $('spacingLabel').textContent = isDouble ? '干涉條紋間距' : '中央亮紋寬度';
  $('spacingReadout').textContent = formatLength(spacing);
  $('countReadout').textContent = totalCount.toLocaleString('zh-TW');
  $('formula').textContent = isDouble
    ? 'I(θ) = I₀ sinc²(β) cos²(α)，β = πa sinθ／λ，α = πd sinθ／λ'
    : 'I(θ) = I₀ sinc²(β)，β = πa sinθ／λ';
}

function formatLength(value) {
  if (value >= 1e-3) return `${(value * 1e3).toPrecision(3)} mm`;
  if (value >= 1e-6) return `${(value * 1e6).toPrecision(3)} μm`;
  if (value >= 1e-9) return `${(value * 1e9).toPrecision(3)} nm`;
  return `${(value * 1e12).toPrecision(3)} pm`;
}

function wavelengthToRgb(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else r = 1;
  const factor = nm < 420 ? .45 + .55 * (nm - 380) / 40 : nm > 645 ? .45 + .55 * (700 - nm) / 55 : 1;
  return [r, g, b].map(v => Math.round(255 * Math.pow(Math.max(0, v * factor), .8)));
}

function color(alpha = 1) {
  const rgb = $('particleType').value === 'photon' ? wavelengthToRgb(+$('wavelength').value) : [70, 220, 255];
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function sampleBin() {
  for (;;) {
    const i = Math.floor(Math.random() * bins);
    if (Math.random() <= intensity[i]) return i;
  }
}

function emitParticles(amount) {
  for (let n = 0; n < amount; n++) {
    const bin = sampleBin();
    counts[bin]++;
    totalCount++;
    particles.push({ bin, x: .78 + Math.random() * .035, jitter: (Math.random() - .5) * .004, age: 0 });
  }
  if (particles.length > 1600) particles.splice(0, particles.length - 1600);
  $('countReadout').textContent = totalCount.toLocaleString('zh-TW');
}

function drawExperiment(time) {
  const w = experiment.width, h = experiment.height;
  ectx.clearRect(0, 0, w, h);
  const sourceX = w * .09, slitX = w * .43, screenX = w * .82;
  const top = h * .10, bottom = h * .90, mid = h / 2, screenH = bottom - top;
  const isDouble = $('slitType').value === 'double';
  const waveMode = $('displayMode').value === 'wave';

  const bg = ectx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#06101b'); bg.addColorStop(1, '#01050a');
  ectx.fillStyle = bg; ectx.fillRect(0, 0, w, h);
  ectx.strokeStyle = 'rgba(80,135,180,.12)'; ectx.lineWidth = 1;
  for (let x = 0; x < w; x += 48) { ectx.beginPath(); ectx.moveTo(x,0); ectx.lineTo(x,h); ectx.stroke(); }
  for (let y = 0; y < h; y += 48) { ectx.beginPath(); ectx.moveTo(0,y); ectx.lineTo(w,y); ectx.stroke(); }

  ectx.textAlign = 'center'; ectx.font = '15px system-ui'; ectx.fillStyle = '#9eb2c7';
  ectx.fillText($('particleType').value === 'photon' ? '單色光源' : '電子源', sourceX, top - 16);
  ectx.fillText(isDouble ? '雙狹縫' : '單狹縫', slitX, top - 16);
  ectx.fillText('偵測屏', screenX, top - 16);

  ectx.shadowBlur = 18; ectx.shadowColor = color(.8); ectx.fillStyle = color(1);
  ectx.beginPath(); ectx.arc(sourceX, mid, 8, 0, Math.PI * 2); ectx.fill(); ectx.shadowBlur = 0;

  const phase = (time / 1000 * 1.7) % 1;
  ectx.strokeStyle = color(.28); ectx.lineWidth = 2;
  for (let k = 0; k < 7; k++) {
    const radius = ((k + phase) / 7) * (slitX - sourceX);
    ectx.beginPath(); ectx.arc(sourceX, mid, radius, -Math.PI / 2, Math.PI / 2); ectx.stroke();
  }

  ectx.strokeStyle = '#9caec0'; ectx.lineWidth = 9;
  const gap = isDouble ? h * .09 : 0;
  const opening = isDouble ? 17 : 32;
  const openings = isDouble ? [mid-gap, mid+gap] : [mid];
  let cursor = top;
  openings.forEach(y => {
    ectx.beginPath(); ectx.moveTo(slitX, cursor); ectx.lineTo(slitX, y-opening/2); ectx.stroke();
    cursor = y + opening/2;
  });
  ectx.beginPath(); ectx.moveTo(slitX, cursor); ectx.lineTo(slitX, bottom); ectx.stroke();

  if (waveMode) {
    ectx.lineWidth = 1.2;
    for (let k = 0; k < 9; k++) {
      const radius = ((k + phase) / 9) * (screenX - slitX);
      openings.forEach(y => {
        ectx.strokeStyle = color(.14);
        ectx.beginPath(); ectx.arc(slitX, y, radius, -Math.PI/2, Math.PI/2); ectx.stroke();
      });
    }
  } else {
    ectx.fillStyle = color(.7);
    particles.forEach(p => {
      p.age += .016;
      const py = top + ((p.bin + .5) / bins) * screenH + p.jitter * h;
      ectx.fillRect(p.x * w, py, 2, 2);
    });
  }

  ectx.fillStyle = '#aebccc'; ectx.fillRect(screenX - 2, top, 4, screenH);
  for (let i = 0; i < bins; i++) {
    const y = top + i / bins * screenH;
    let brightness;
    if (waveMode) brightness = intensity[i];
    else {
      const maxCount = Math.max(1, ...counts);
      brightness = Math.min(1, counts[i] / Math.max(2, maxCount * .6));
    }
    ectx.fillStyle = color(brightness * .95);
    ectx.fillRect(screenX + 5, y, 34 * brightness + 2, screenH / bins + 1);
  }

  ectx.fillStyle = '#8fa6bd'; ectx.font = '13px system-ui';
  ectx.fillText(`L = ${+$('distance').value} m`, (slitX + screenX) / 2, bottom + 32);
  ectx.strokeStyle = '#496782'; ectx.beginPath(); ectx.moveTo(slitX, bottom+13); ectx.lineTo(screenX, bottom+13); ectx.stroke();
}

function drawChart() {
  const w = chart.width, h = chart.height;
  cctx.clearRect(0, 0, w, h); cctx.fillStyle = '#030912'; cctx.fillRect(0,0,w,h);
  const left = 52, right = 18, top = 18, bottom = 34, pw = w-left-right, ph = h-top-bottom;
  cctx.strokeStyle = '#29445f'; cctx.lineWidth = 1;
  cctx.beginPath(); cctx.moveTo(left,top); cctx.lineTo(left,h-bottom); cctx.lineTo(w-right,h-bottom); cctx.stroke();
  cctx.fillStyle = '#8fa6bd'; cctx.font = '12px system-ui'; cctx.textAlign = 'center';
  cctx.fillText(`屏幕位置（−${+$('screenSpan').value/2} mm 至 +${+$('screenSpan').value/2} mm）`, left+pw/2, h-9);
  cctx.save(); cctx.translate(15, top+ph/2); cctx.rotate(-Math.PI/2); cctx.fillText('相對強度',0,0); cctx.restore();

  if ($('displayMode').value === 'particle' && totalCount) {
    const maxCount = Math.max(1, ...counts);
    cctx.fillStyle = color(.24);
    for (let i = 0; i < bins; i++) {
      const bh = counts[i] / maxCount * ph;
      cctx.fillRect(left + i/bins*pw, top+ph-bh, Math.ceil(pw/bins), bh);
    }
  }
  cctx.strokeStyle = color(.95); cctx.lineWidth = 2; cctx.beginPath();
  for (let i = 0; i < bins; i++) {
    const x = left + i/(bins-1)*pw, y = top + (1-intensity[i])*ph;
    if (i === 0) cctx.moveTo(x,y); else cctx.lineTo(x,y);
  }
  cctx.stroke();
}

function reset(keepRunning = true) {
  counts.fill(0); particles = []; totalCount = 0; spawnCarry = 0;
  running = keepRunning;
  $('toggleButton').textContent = running ? '暫停' : '繼續';
  calculateIntensity();
  updateInterface();
  drawChart();
}

function updateInterface() {
  const electron = $('particleType').value === 'electron';
  const particleMode = $('displayMode').value === 'particle';
  $('wavelengthControl').hidden = electron;
  $('voltageControl').hidden = !electron;
  $('separationControl').style.opacity = $('slitType').value === 'double' ? '1' : '.45';
  $('slitSeparation').disabled = $('slitType').value !== 'double';
  $('rateControl').style.opacity = particleMode ? '1' : '.45';
  $('rate').disabled = !particleMode;
  $('toggleButton').disabled = !particleMode;
  document.querySelectorAll('.lengthUnit').forEach(el => el.textContent = electron ? 'nm' : 'μm');
  $('status').textContent = particleMode
    ? `${running ? '正在發射' : '已暫停'}・已偵測 ${totalCount.toLocaleString('zh-TW')} 顆`
    : '連續顯示理論強度';
}

function applyPreset() {
  const type = $('particleType').value, p = presets[type];
  $('slitWidth').value = p.width; $('slitSeparation').value = p.separation;
  $('screenSpan').value = p.span; $('distance').value = p.distance; $('displayMode').value = p.mode;
  reset();
}

function animate(time) {
  const dt = Math.min(.05, (time - lastTime) / 1000 || 0); lastTime = time;
  if (running && $('displayMode').value === 'particle') {
    const rates = [0, 8, 30, 100, 350, 1200];
    spawnCarry += rates[+$('rate').value] * dt;
    const amount = Math.floor(spawnCarry); spawnCarry -= amount;
    if (amount) emitParticles(amount);
  }
  drawExperiment(time); drawChart(); updateInterface();
  requestAnimationFrame(animate);
}

$('particleType').addEventListener('change', applyPreset);
['slitType','displayMode'].forEach(id => $(id).addEventListener('change', () => reset()));
['wavelength','voltage','slitWidth','slitSeparation','distance','screenSpan'].forEach(id => {
  $(id).addEventListener('input', () => reset());
});
$('rate').addEventListener('input', () => { calculateIntensity(); updateInterface(); });
$('resetButton').addEventListener('click', () => reset());
$('toggleButton').addEventListener('click', () => {
  running = !running; $('toggleButton').textContent = running ? '暫停' : '繼續'; updateInterface();
});

reset();
requestAnimationFrame(animate);
