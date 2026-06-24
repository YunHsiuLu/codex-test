import { lines } from './metro-map-data.js';

const NS = 'http://www.w3.org/2000/svg';
const routeLayer = document.querySelector('#route-layer');
const stationLayer = document.querySelector('#station-layer');
const badgeLayer = document.querySelector('#badge-layer');
const popup = document.querySelector('#station-popup');
const legend = document.querySelector('#legend');
const stations = new Map();

function svg(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

for (const line of lines) {
  for (const path of line.paths) {
    routeLayer.append(svg('polyline', {
      class: 'route', stroke: line.color,
      points: path.map(({ x, y }) => `${x},${y}`).join(' ')
    }));
    for (const point of path) {
      const current = stations.get(point.key) || { ...point, lines: [] };
      if (!current.lines.some(({ id }) => id === line.id)) current.lines.push(line);
      stations.set(point.key, current);
    }
  }
  const item = document.createElement('span');
  item.innerHTML = `<i style="background:${line.color}"></i>${line.code} ${line.name}`;
  legend.append(item);
}

for (const station of stations.values()) {
  const group = svg('g', {
    class: `station${station.lines.length > 1 ? ' transfer' : ''}`,
    tabindex: '0', role: 'button',
    'data-station': station.key,
    'aria-label': `${station.name}站${station.lines.length > 1 ? '，轉乘站' : ''}`,
    transform: `translate(${station.x} ${station.y})`
  });
  group.append(svg('circle', { class: 'hit-area', r: 20 }));
  group.append(svg('circle', { class: 'dot', r: 12 }));
  const label = svg('text', { x: station.dx, y: station.dy });
  label.textContent = station.name;
  group.append(label);
  group.addEventListener('click', event => showStation(station, event));
  group.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); showStation(station, event);
    }
  });
  stationLayer.append(group);
}

for (const line of lines) {
  const first = line.paths[0][0];
  const badge = svg('g', { class: 'line-badge', transform: `translate(${first.x - 44} ${first.y - 17})` });
  badge.append(svg('rect', { width: line.code === 'BR' || line.code === 'BL' ? 38 : 34, height: 34, fill: line.color }));
  const text = svg('text', { x: line.code === 'BR' || line.code === 'BL' ? 19 : 17, y: 17 });
  text.textContent = line.code;
  badge.append(text); badgeLayer.append(badge);
}

async function stationInfo(station) {
  for (const line of station.lines) {
    try {
      const module = await import(`./metroLines/${line.id}/${station.key}.js`);
      return module.default || module;
    } catch (_) { /* 沒有專屬資料時使用下方通用資訊。 */ }
  }
  return {
    title: `${station.name}站`,
    description: `${station.lines.map(line => line.name).join('、')}的車站。詳細站點資訊建置中。`
  };
}

async function showStation(station, event) {
  event.stopPropagation();
  popup.querySelector('h2').textContent = `${station.name}站`;
  popup.querySelector('p').textContent = '正在載入站點資訊⋯⋯';
  popup.hidden = false;
  const anchor = event.currentTarget.getBoundingClientRect();
  const width = Math.min(320, window.innerWidth - 28);
  popup.style.left = `${Math.max(14, Math.min(anchor.left + 18, window.innerWidth - width - 14))}px`;
  popup.style.top = `${Math.max(14, Math.min(anchor.top + 22, window.innerHeight - popup.offsetHeight - 14))}px`;
  const info = await stationInfo(station);
  popup.querySelector('h2').textContent = info.title || `${station.name}站`;
  popup.querySelector('p').textContent = info.description || '詳細站點資訊建置中。';
}

function hidePopup() { popup.hidden = true; }
popup.querySelector('button').addEventListener('click', hidePopup);
document.addEventListener('click', event => {
  if (!popup.hidden && !popup.contains(event.target)) hidePopup();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') hidePopup();
});

// 支援以 ?station=Taipei 直接開啟指定站點，也方便自動化驗證互動視窗。
const requestedStation = new URLSearchParams(location.search).get('station');
if (requestedStation && stations.has(requestedStation)) {
  const target = stationLayer.querySelector(`[data-station="${CSS.escape(requestedStation)}"]`);
  requestAnimationFrame(() => showStation(stations.get(requestedStation), {
    stopPropagation() {}, currentTarget: target
  }));
}
