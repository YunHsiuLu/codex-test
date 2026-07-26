const svg = document.querySelector("#circuitBoard");

const ui = {
  modeText: document.querySelector("#modeText"),
  messageText: document.querySelector("#messageText"),
  componentTools: document.querySelector("#componentTools"),
  wireBtn: document.querySelector("#wireBtn"),
  selectBtn: document.querySelector("#selectBtn"),
  deleteBtn: document.querySelector("#deleteBtn"),
  rotateBtn: document.querySelector("#rotateBtn"),
  runBtn: document.querySelector("#runBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  propertyPanel: document.querySelector("#propertyPanel"),
  propertyModal: document.querySelector("#propertyModal"),
  propertyModalTitle: document.querySelector("#propertyModalTitle"),
  closePropertyModal: document.querySelector("#closePropertyModal"),
  addScopeBtn: document.querySelector("#addScopeBtn"),
  scopePanels: document.querySelector("#scopePanels"),
  scopeEmpty: document.querySelector("#scopeEmpty"),
  meterMenu: document.querySelector("#meterMenu"),
  simTime: document.querySelector("#simTime"),
  timeStep: document.querySelector("#timeStep"),
};

const SVG_NS = "http://www.w3.org/2000/svg";
const GRID = 28;
const NODE_TOLERANCE = 16;
const AUTO_CONNECT_TOLERANCE = 10;
const colors = ["#1d6b5f", "#9a5f12", "#3269a8"];

const labels = {
  dc: "DC",
  ground: "GND",
  resistor: "R",
  capacitor: "C",
  inductor: "L",
  voltmeter: "V",
  ammeter: "A",
  label: "Text",
};

const defaults = {
  dc: { value: 5, unit: "V" },
  resistor: { value: 1000, unit: "ohm" },
  capacitor: { value: 0.000001, unit: "F" },
  inductor: { value: 0.01, unit: "H" },
  voltmeter: { value: 0, unit: "V" },
  ammeter: { value: 0, unit: "A" },
  ground: { value: 0, unit: "" },
  label: { value: 0, unit: "" },
};

const state = {
  mode: "select",
  components: [],
  wires: [],
  selected: null,
  selectedComponentIds: new Set(),
  selectionBox: null,
  lastComponentTap: null,
  wireStart: null,
  wireDraft: null,
  nextId: 1,
  traces: [],
  history: [],
  historyIndex: -1,
  scopes: [],
  nextScopeId: 1,
  meterTraces: new Map(),
  meterMenuTarget: null,
};

function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function snap(value) {
  return Math.round(value / GRID) * GRID;
}

function formatValue(component) {
  if (component.type === "label") return component.text || "Label";
  if (component.type === "ground") return "";
  const value = Number(component.value);
  if (!Number.isFinite(value)) return "";
  if (component.type === "resistor") return `${formatEngineering(value)}Ω`;
  if (component.type === "capacitor") return `${formatEngineering(value)}F`;
  if (component.type === "inductor") return `${formatEngineering(value)}H`;
  if (component.type === "dc") return `${formatEngineering(value)}V`;
  return component.measurement || "";
}

function formatEngineering(value) {
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  const units = [
    { factor: 1e-6, prefix: "µ" },
    { factor: 1e-3, prefix: "m" },
    { factor: 1, prefix: "" },
    { factor: 1e3, prefix: "k" },
    { factor: 1e6, prefix: "M" },
  ];
  let unit = units[2];
  for (const candidate of units) {
    if (abs >= candidate.factor) unit = candidate;
  }
  return `${(value / unit.factor).toFixed(abs / unit.factor >= 100 ? 0 : 2).replace(/\.?0+$/, "")}${unit.prefix}`;
}

function setMode(mode) {
  state.mode = mode;
  state.wireStart = null;
  state.wireDraft = null;
  document.querySelectorAll("button[data-tool], #wireBtn, #selectBtn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tool === mode || button.id === `${mode}Btn`);
  });
  const text = mode === "wire" ? "導線模式" : mode === "select" ? "選取模式" : `放置 ${labels[mode]}`;
  ui.modeText.textContent = text;
  ui.messageText.textContent =
    mode === "wire"
      ? "點端點開始拉線；點格線加入直角折點；點另一端點完成。"
      : mode === "select"
        ? "拖曳元件可移動；雙擊元件可調整數值與角度。"
        : "在格線上點一下放置零件。";
  render();
}

function getBoardPoint(event) {
  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const transformed = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: snap(transformed.x), y: snap(transformed.y) };
}

function addComponent(type, x, y, options = {}) {
  const component = {
    id: `c${state.nextId++}`,
    type,
    x,
    y,
    rotation: options.rotation || 0,
    scale: normalizeScale(options.scale),
    length: normalizeLength(type, options.length),
    value: options.value ?? defaults[type].value,
    text: options.text || (type === "label" ? "Label" : ""),
  };
  state.components.push(component);
  if (component.type === "voltmeter" || component.type === "ammeter") renderScopes();
  selectItem({ kind: "component", id: component.id });
  return component;
}

function defaultLength(type) {
  if (type === "voltmeter" || type === "ammeter") return 108;
  if (type === "ground" || type === "label") return 0;
  return 168;
}

function minimumLength(type) {
  if (type === "resistor" || type === "inductor") return 112;
  if (type === "voltmeter" || type === "ammeter") return 72;
  if (type === "capacitor") return 64;
  return 72;
}

function normalizeLength(type, value) {
  if (type === "ground" || type === "label") return 0;
  const length = Number(value);
  const fallback = defaultLength(type);
  return Number.isFinite(length) ? clamp(length, minimumLength(type), 420) : fallback;
}

function componentLength(component) {
  return normalizeLength(component.type, component.length);
}

function getTerminals(component) {
  if (component.type === "label") return [];
  if (component.type === "ground") {
    const terminal = transformLocalPoint(component, 0, -28);
    return [{ id: `${component.id}:0`, ...terminal }];
  }
  if (component.type === "voltmeter" || component.type === "ammeter") {
    return rotatedTerminals(component, componentLength(component) / 2);
  }
  return rotatedTerminals(component, componentLength(component) / 2);
}

function rotatedTerminals(component, halfLength) {
  const first = transformLocalPoint(component, -halfLength, 0);
  const second = transformLocalPoint(component, halfLength, 0);
  return [
    { id: `${component.id}:0`, ...first },
    { id: `${component.id}:1`, ...second },
  ];
}

function normalizeScale(value) {
  const scale = Number(value);
  return Number.isFinite(scale) ? clamp(scale, 0.25, 4) : 1;
}

function transformLocalPoint(component, localX, localY) {
  const angle = (component.rotation * Math.PI) / 180;
  const scale = normalizeScale(component.scale);
  const x = localX * scale;
  const y = localY * scale;
  return {
    x: component.x + x * Math.cos(angle) - y * Math.sin(angle),
    y: component.y + x * Math.sin(angle) + y * Math.cos(angle),
  };
}

function terminalById(id) {
  for (const component of state.components) {
    const terminal = getTerminals(component).find((item) => item.id === id);
    if (terminal) return { ...terminal, component };
  }
  return null;
}

function findTerminal(point) {
  for (const component of state.components) {
    for (const terminal of getTerminals(component)) {
      const distance = Math.hypot(terminal.x - point.x, terminal.y - point.y);
      if (distance <= NODE_TOLERANCE) return { ...terminal, component };
    }
  }
  return null;
}

function snapComponentToTerminal(component) {
  let nearest = null;
  for (const terminal of getTerminals(component)) {
    for (const other of state.components) {
      if (other.id === component.id) continue;
      for (const target of getTerminals(other)) {
        const distance = Math.hypot(target.x - terminal.x, target.y - terminal.y);
        if (distance <= GRID && (!nearest || distance < nearest.distance)) {
          nearest = { terminal, target, distance };
        }
      }
    }
  }
  if (!nearest) return false;
  component.x += nearest.target.x - nearest.terminal.x;
  component.y += nearest.target.y - nearest.terminal.y;
  return true;
}

function pointsEqual(a, b) {
  return a && b && a.x === b.x && a.y === b.y;
}

function compactRoute(points) {
  const withoutDuplicates = [];
  for (const point of points) {
    if (!pointsEqual(withoutDuplicates.at(-1), point)) withoutDuplicates.push(point);
  }
  const compacted = [];
  for (const point of withoutDuplicates) {
    const prev = compacted.at(-1);
    const prevPrev = compacted.at(-2);
    const isCollinear = prevPrev && prev && ((prevPrev.x === prev.x && prev.x === point.x) || (prevPrev.y === prev.y && prev.y === point.y));
    if (isCollinear) compacted[compacted.length - 1] = point;
    else compacted.push(point);
  }
  return compacted;
}

function buildOrthogonalRoute(start, bends, end) {
  const route = [start];
  for (const target of [...bends, end]) {
    const current = route.at(-1);
    if (!current) continue;
    if (current.x !== target.x && current.y !== target.y) route.push({ x: target.x, y: current.y });
    route.push(target);
  }
  return compactRoute(route);
}

function routeToPath(route) {
  if (!route.length) return "";
  const [first, ...rest] = route;
  return `M ${first.x} ${first.y} ${rest.map((point) => `L ${point.x} ${point.y}`).join(" ")}`;
}

function routeForWire(wire) {
  const from = terminalById(wire.from);
  const to = terminalById(wire.to);
  if (!from || !to) return [];
  return buildOrthogonalRoute(from, wire.points || [], to);
}

function draftRoute() {
  if (!state.wireDraft?.preview) return [];
  return buildOrthogonalRoute(state.wireDraft.from, state.wireDraft.points, state.wireDraft.preview);
}

function addWire(from, to, points = []) {
  if (!from || !to || from.id === to.id) return;
  const existing = state.wires.find((wire) => {
    return (wire.from === from.id && wire.to === to.id) || (wire.from === to.id && wire.to === from.id);
  });
  let selectedWireId = existing?.id;
  if (!existing) {
    const route = buildOrthogonalRoute(from, points, to);
    const bendPoints = compactRoute(route.slice(1, -1));
    const wire = { id: `w${state.nextId++}`, from: from.id, to: to.id, points: bendPoints };
    state.wires.push(wire);
    selectedWireId = wire.id;
  }
  state.wireStart = null;
  state.wireDraft = null;
  selectItem({ kind: "wire", id: selectedWireId });
}

function selectItem(item) {
  state.selected = item;
  state.selectedComponentIds = item?.kind === "component" ? new Set([item.id]) : new Set();
  render();
}

function openPropertyModal(component) {
  state.selected = { kind: "component", id: component.id };
  state.selectedComponentIds = new Set([component.id]);
  ui.propertyModalTitle.textContent = `${labels[component.type]} 屬性`;
  ui.propertyModal.hidden = false;
  renderProperties();
  render();
}

function closePropertyModal() {
  ui.propertyModal.hidden = true;
}

function selectedComponent() {
  if (!state.selected || state.selected.kind !== "component") return null;
  return state.components.find((component) => component.id === state.selected.id) || null;
}

function selectedWire() {
  if (!state.selected || state.selected.kind !== "wire") return null;
  return state.wires.find((wire) => wire.id === state.selected.id) || null;
}

function captureCircuitState() {
  return {
    components: state.components.map((component) => ({ ...component })),
    wires: state.wires.map((wire) => ({ ...wire, points: (wire.points || []).map((point) => ({ ...point })) })),
    nextId: state.nextId,
  };
}

function recordHistory() {
  const snapshot = captureCircuitState();
  const previous = state.history[state.historyIndex];
  if (previous && JSON.stringify(previous) === JSON.stringify(snapshot)) return;
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(snapshot);
  state.historyIndex = state.history.length - 1;
}

function resetHistory() {
  state.history = [];
  state.historyIndex = -1;
  recordHistory();
}

function restoreHistory(index) {
  const snapshot = state.history[index];
  if (!snapshot) return;
  state.components = snapshot.components.map((component) => ({ ...component }));
  state.wires = snapshot.wires.map((wire) => ({ ...wire, points: (wire.points || []).map((point) => ({ ...point })) }));
  state.nextId = snapshot.nextId;
  state.selected = null;
  state.selectedComponentIds = new Set();
  state.selectionBox = null;
  state.wireStart = null;
  state.wireDraft = null;
  state.traces = [];
  state.historyIndex = index;
  renderProperties();
  drawScope([]);
  render();
}

function undo() {
  if (state.historyIndex <= 0) return;
  restoreHistory(state.historyIndex - 1);
  ui.messageText.textContent = "已復原上一個操作。";
}

function redo() {
  if (state.historyIndex >= state.history.length - 1) return;
  restoreHistory(state.historyIndex + 1);
  ui.messageText.textContent = "已重做下一個操作。";
}

function render() {
  svg.replaceChildren();
  renderWires();
  renderWireDraft();
  renderComponents();
  renderSelectionBox();
}

function renderSelectionBox() {
  if (!state.selectionBox) return;
  const { start, end } = state.selectionBox;
  svg.append(
    createSvgElement("rect", {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
      class: "selection-box",
    }),
  );
}

function renderWires() {
  for (const wire of state.wires) {
    const route = routeForWire(wire);
    if (!route.length) continue;
    const path = createSvgElement("path", {
      d: routeToPath(route),
      class: `wire-path ${state.selected?.id === wire.id ? "is-selected" : ""}`,
      "data-wire": wire.id,
    });
    path.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      selectItem({ kind: "wire", id: wire.id });
    });
    svg.append(path);

    if (state.selected?.id === wire.id) {
      for (const point of wire.points || []) {
        svg.append(createSvgElement("circle", { cx: point.x, cy: point.y, r: 5, class: "wire-bend" }));
      }
    }
  }
}

function renderWireDraft() {
  const route = draftRoute();
  if (route.length < 2) return;
  const path = createSvgElement("path", {
    d: routeToPath(route),
    class: "wire-path wire-preview",
  });
  svg.append(path);
  for (const point of state.wireDraft.points) {
    svg.append(createSvgElement("circle", { cx: point.x, cy: point.y, r: 5, class: "wire-bend is-draft" }));
  }
}

function renderComponents() {
  for (const component of state.components) {
    const group = createSvgElement("g", {
      class: `component ${state.selectedComponentIds.has(component.id) ? "is-selected" : ""}`,
      "data-component": component.id,
      "data-component-type": component.type,
      transform: `translate(${component.x} ${component.y}) rotate(${component.rotation}) scale(${normalizeScale(component.scale)})`,
    });
    group.addEventListener("pointerdown", (event) => beginDrag(event, component));
    group.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openPropertyModal(component);
    });
    if (component.type === "voltmeter" || component.type === "ammeter") {
      group.addEventListener("contextmenu", (event) => openMeterMenu(event, component));
    }
    appendDragHitbox(group, component);
    drawSymbol(group, component);
    svg.append(group);

    for (const terminal of getTerminals(component)) {
      const circle = createSvgElement("circle", {
        cx: terminal.x,
        cy: terminal.y,
        r: 7,
        class: `terminal ${state.wireStart?.id === terminal.id ? "is-pending" : ""}`,
        "data-terminal": terminal.id,
      });
      circle.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        handleTerminalClick(terminal);
      });
      svg.append(circle);
    }
  }
}

function appendDragHitbox(group, component) {
  if (component.type === "label") return;
  const isMeter = component.type === "voltmeter" || component.type === "ammeter";
  const isGround = component.type === "ground";
  const length = componentLength(component);
  const halfLength = length / 2;
  const box = isGround
    ? { x: -34, y: -40, width: 68, height: 68 }
    : isMeter
      ? { x: -halfLength - 8, y: -38, width: length + 16, height: 76 }
      : { x: -halfLength - 8, y: -48, width: length + 16, height: 96 };
  group.append(createSvgElement("rect", { ...box, class: "component-hitbox" }));
}

function drawSymbol(group, component) {
  const label = labels[component.type];
  const halfLength = componentLength(component) / 2;
  if (component.type === "dc") {
    group.append(createSvgElement("line", { x1: -halfLength, y1: 0, x2: -34, y2: 0, class: "component-lead" }));
    group.append(createSvgElement("line", { x1: 34, y1: 0, x2: halfLength, y2: 0, class: "component-lead" }));
    group.append(createSvgElement("line", { x1: -16, y1: -28, x2: -16, y2: 28, class: "component-symbol" }));
    group.append(createSvgElement("line", { x1: 14, y1: -16, x2: 14, y2: 16, class: "component-symbol" }));
    appendText(group, "+", -28, -34, "component-label");
    appendText(group, formatValue(component), 0, 45, "component-value");
    return;
  }
  if (component.type === "resistor") {
    group.append(createSvgElement("line", { x1: -halfLength, y1: 0, x2: -42, y2: 0, class: "component-lead" }));
    group.append(createSvgElement("rect", { x: -42, y: -16, width: 84, height: 32, rx: 5, class: "component-body" }));
    group.append(createSvgElement("line", { x1: 42, y1: 0, x2: halfLength, y2: 0, class: "component-lead" }));
  } else if (component.type === "capacitor") {
    group.append(createSvgElement("line", { x1: -halfLength, y1: 0, x2: -14, y2: 0, class: "component-lead" }));
    group.append(createSvgElement("line", { x1: -14, y1: -28, x2: -14, y2: 28, class: "component-symbol" }));
    group.append(createSvgElement("line", { x1: 14, y1: -28, x2: 14, y2: 28, class: "component-symbol" }));
    group.append(createSvgElement("line", { x1: 14, y1: 0, x2: halfLength, y2: 0, class: "component-lead" }));
  } else if (component.type === "inductor") {
    group.append(createSvgElement("line", { x1: -halfLength, y1: 0, x2: -42, y2: 0, class: "component-lead" }));
    for (let i = 0; i < 4; i += 1) {
      group.append(createSvgElement("path", { d: `M ${-42 + i * 21} 0 A 10.5 16 0 0 1 ${-21 + i * 21} 0`, class: "component-symbol" }));
    }
    group.append(createSvgElement("line", { x1: 42, y1: 0, x2: halfLength, y2: 0, class: "component-lead" }));
  } else if (component.type === "ground") {
    group.append(createSvgElement("line", { x1: 0, y1: -28, x2: 0, y2: -4, class: "component-lead" }));
    group.append(createSvgElement("line", { x1: -24, y1: -4, x2: 24, y2: -4, class: "component-symbol" }));
    group.append(createSvgElement("line", { x1: -16, y1: 8, x2: 16, y2: 8, class: "component-symbol" }));
    group.append(createSvgElement("line", { x1: -8, y1: 20, x2: 8, y2: 20, class: "component-symbol" }));
  } else if (component.type === "voltmeter" || component.type === "ammeter") {
    group.append(createSvgElement("line", { x1: -halfLength, y1: 0, x2: -28, y2: 0, class: "component-lead" }));
    group.append(createSvgElement("circle", { cx: 0, cy: 0, r: 28, class: "component-body" }));
    group.append(createSvgElement("line", { x1: 28, y1: 0, x2: halfLength, y2: 0, class: "component-lead" }));
  } else if (component.type === "label") {
    appendText(group, component.text || "Label", 0, 0, "component-label");
    return;
  }
  appendText(group, label, 0, 0, "component-label");
  appendText(group, formatValue(component), 0, 42, "component-value");
}

function appendText(group, text, x, y, className) {
  const item = createSvgElement("text", { x, y, class: className });
  item.textContent = text;
  group.append(item);
}

function beginDrag(event, component) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  if (state.mode !== "select") {
    selectItem({ kind: "component", id: component.id });
    return;
  }
  const start = getBoardPoint(event);
  if (!state.selectedComponentIds.has(component.id)) {
    state.selectedComponentIds = new Set([component.id]);
  }
  state.selected = { kind: "component", id: component.id };
  const movingComponents = state.components.filter((item) => state.selectedComponentIds.has(item.id));
  const origins = new Map(movingComponents.map((item) => [item.id, { x: item.x, y: item.y }]));
  let hasMoved = false;
  svg.setPointerCapture(event.pointerId);

  function move(moveEvent) {
    const point = getBoardPoint(moveEvent);
    hasMoved ||= point.x !== start.x || point.y !== start.y;
    for (const item of movingComponents) {
      const origin = origins.get(item.id);
      item.x = origin.x + point.x - start.x;
      item.y = origin.y + point.y - start.y;
    }
    render();
  }

  function up(upEvent) {
    svg.releasePointerCapture(upEvent.pointerId);
    svg.removeEventListener("pointermove", move);
    svg.removeEventListener("pointerup", up);
    if (hasMoved && movingComponents.length === 1) snapComponentToTerminal(component);
    renderProperties();
    if (hasMoved) {
      recordHistory();
      render();
      return;
    }
    const now = Date.now();
    if (state.lastComponentTap?.id === component.id && now - state.lastComponentTap.time < 420) {
      state.lastComponentTap = null;
      openPropertyModal(component);
      return;
    }
    state.lastComponentTap = { id: component.id, time: now };
    render();
  }

  svg.addEventListener("pointermove", move);
  svg.addEventListener("pointerup", up);
}

function handleTerminalClick(terminal) {
  if (state.mode !== "wire") {
    selectItem({ kind: "component", id: terminal.component.id });
    return;
  }
  if (!state.wireDraft) {
    state.wireStart = terminal;
    state.wireDraft = { from: terminal, points: [], preview: terminal };
    ui.messageText.textContent = "已選取第一個端點；可點格線加入折點，或點另一端點完成。";
    render();
    return;
  }
  if (state.wireDraft.from.id === terminal.id) {
    ui.messageText.textContent = "起點與終點相同；請點另一個端點完成導線，或按 Esc 取消。";
    return;
  }
  addWire(state.wireDraft.from, terminal, state.wireDraft.points);
  recordHistory();
  ui.messageText.textContent = "導線已建立。";
  render();
}

function updateSelectionBoxSelection() {
  if (!state.selectionBox) return;
  const { start, end } = state.selectionBox;
  const left = Math.min(start.x, end.x);
  const right = Math.max(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const bottom = Math.max(start.y, end.y);
  const ids = state.components
    .filter((component) => component.x >= left && component.x <= right && component.y >= top && component.y <= bottom)
    .map((component) => component.id);
  state.selectedComponentIds = new Set(ids);
  state.selected = ids.length ? { kind: "component", id: ids.at(-1) } : null;
}

function beginSelectionBox(event) {
  if (event.button !== 0) return;
  event.preventDefault();
  const point = getBoardPoint(event);
  state.selected = null;
  state.selectedComponentIds = new Set();
  state.selectionBox = { start: point, end: point };
  svg.setPointerCapture(event.pointerId);
  render();

  function move(moveEvent) {
    state.selectionBox.end = getBoardPoint(moveEvent);
    updateSelectionBoxSelection();
    render();
  }

  function up(upEvent) {
    svg.releasePointerCapture(upEvent.pointerId);
    svg.removeEventListener("pointermove", move);
    svg.removeEventListener("pointerup", up);
    updateSelectionBoxSelection();
    const count = state.selectedComponentIds.size;
    state.selectionBox = null;
    if (count) ui.messageText.textContent = `已選取 ${count} 個元件；可一起拖曳、旋轉或刪除。`;
    renderProperties();
    render();
  }

  svg.addEventListener("pointermove", move);
  svg.addEventListener("pointerup", up);
}

function addWireBend(point) {
  if (!state.wireDraft) {
    ui.messageText.textContent = "請先點選一個端點開始拉導線。";
    return;
  }
  const last = state.wireDraft.points.at(-1) || state.wireDraft.from;
  if (!pointsEqual(last, point)) state.wireDraft.points.push(point);
  state.wireDraft.preview = point;
  ui.messageText.textContent = "已加入折點；可繼續點格線延伸，或點端點完成。";
  render();
}

function renderProperties() {
  const component = selectedComponent();
  const wire = selectedWire();
  ui.propertyPanel.replaceChildren();
  if (component) {
    const title = document.createElement("p");
    title.textContent = `${labels[component.type]}：${component.id}`;
    ui.propertyPanel.append(title);

    if (component.type === "label") {
      addTextField("文字", component.text || "", (value) => {
        component.text = value;
        render();
      });
    } else if (!["ground", "voltmeter", "ammeter"].includes(component.type)) {
      addNumberField("數值", component.value, (value) => {
        component.value = value;
        render();
      }, { onCommit: recordHistory });
    } else if (component.type === "voltmeter" || component.type === "ammeter") {
      const note = document.createElement("p");
      note.textContent = component.measurement || "執行模擬後顯示量測曲線。";
      ui.propertyPanel.append(note);
    }
    addNumberField("角度", component.rotation, (value) => {
      component.rotation = ((value % 360) + 360) % 360;
      render();
    }, { onCommit: recordHistory });
  } else if (wire) {
    const title = document.createElement("p");
    title.textContent = `導線：${wire.id}`;
    ui.propertyPanel.append(title);
    const detail = document.createElement("p");
    detail.textContent = `直角折點：${(wire.points || []).length} 個`;
    ui.propertyPanel.append(detail);
  } else {
    const text = document.createElement("p");
    text.textContent = "選取零件或導線端點後可調整數值。";
    ui.propertyPanel.append(text);
  }
}

function addNumberField(label, value, onInput, options = {}) {
  const row = document.createElement("label");
  row.className = "field-row";
  const span = document.createElement("span");
  span.textContent = label;
  const input = document.createElement("input");
  input.type = "number";
  input.step = options.step || "any";
  if (options.min !== undefined) input.min = options.min;
  if (options.max !== undefined) input.max = options.max;
  input.value = value;
  const unit = document.createElement("small");
  unit.textContent = options.unit || "";
  input.addEventListener("input", () => {
    onInput(Number(input.value));
    options.onCommit?.();
  });
  row.append(span, input, unit);
  ui.propertyPanel.append(row);
}

function addTextField(label, value, onInput) {
  const row = document.createElement("label");
  row.className = "field-row";
  const span = document.createElement("span");
  span.textContent = label;
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  const unit = document.createElement("small");
  input.addEventListener("input", () => onInput(input.value));
  row.append(span, input, unit);
  ui.propertyPanel.append(row);
}

function deleteSelected() {
  if (!state.selected && state.selectedComponentIds.size === 0) return;
  if (state.selectedComponentIds.size) {
    const componentIds = state.selectedComponentIds;
    state.components = state.components.filter((component) => !componentIds.has(component.id));
    state.wires = state.wires.filter((wire) => {
      return ![...componentIds].some((id) => wire.from.startsWith(`${id}:`) || wire.to.startsWith(`${id}:`));
    });
  } else {
    state.wires = state.wires.filter((wire) => wire.id !== state.selected.id);
  }
  state.selected = null;
  state.selectedComponentIds = new Set();
  renderProperties();
  render();
  renderScopes();
  drawScope(state.traces);
  recordHistory();
}

function rotateSelected() {
  const components = state.components.filter((component) => state.selectedComponentIds.has(component.id));
  if (!components.length) return;
  for (const component of components) component.rotation = (component.rotation + 90) % 360;
  renderProperties();
  render();
  recordHistory();
}

function clearAll(record = true) {
  state.components = [];
  state.wires = [];
  state.selected = null;
  state.selectedComponentIds = new Set();
  state.selectionBox = null;
  state.wireStart = null;
  state.wireDraft = null;
  state.scopes = [];
  state.meterTraces = new Map();
  renderProperties();
  state.traces = [];
  drawScope([]);
  render();
  renderScopes();
  if (record) recordHistory();
}

function buildCircuitModel() {
  const terminals = [];
  const terminalIndex = new Map();
  for (const component of state.components) {
    for (const terminal of getTerminals(component)) {
      terminalIndex.set(terminal.id, terminals.length);
      terminals.push({ ...terminal, componentId: component.id });
    }
  }

  const parent = terminals.map((_, index) => index);
  const find = (index) => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };
  const union = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootB] = rootA;
  };
  for (const wire of state.wires) {
    if (terminalIndex.has(wire.from) && terminalIndex.has(wire.to)) union(terminalIndex.get(wire.from), terminalIndex.get(wire.to));
  }
  for (let first = 0; first < terminals.length; first += 1) {
    for (let second = first + 1; second < terminals.length; second += 1) {
      const a = terminals[first];
      const b = terminals[second];
      if (a.componentId === b.componentId) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) <= AUTO_CONNECT_TOLERANCE) union(first, second);
    }
  }

  const nodeMap = new Map();
  let nextNode = 1;
  let groundNode = 0;
  for (const component of state.components) {
    if (component.type === "ground") {
      const terminal = getTerminals(component)[0];
      if (terminal) groundNode = find(terminalIndex.get(terminal.id));
    }
  }
  nodeMap.set(groundNode, 0);
  const getNode = (terminalId) => {
    const root = find(terminalIndex.get(terminalId));
    if (!nodeMap.has(root)) nodeMap.set(root, nextNode++);
    return nodeMap.get(root);
  };

  const elements = state.components
    .filter((component) => !["ground", "label"].includes(component.type))
    .map((component) => {
      const terms = getTerminals(component);
      return { component, a: getNode(terms[0].id), b: getNode(terms[1].id) };
    });
  return { elements, nodeCount: nextNode };
}

function simulate() {
  const model = buildCircuitModel();
  state.meterTraces = new Map();
  const dcSources = model.elements.filter((item) => item.component.type === "dc");
  const resistors = model.elements.filter((item) => item.component.type === "resistor");
  const capacitors = model.elements.filter((item) => item.component.type === "capacitor");
  const inductors = model.elements.filter((item) => item.component.type === "inductor");
  const voltmeters = model.elements.filter((item) => item.component.type === "voltmeter");
  const ammeters = model.elements.filter((item) => item.component.type === "ammeter");
  const totalTime = clamp(Number(ui.simTime.value) || 0.04, 0.001, 10);
  const dt = clamp(Number(ui.timeStep.value) || 0.00005, 0.000001, 0.01);

  const seriesCheck = validateSingleLoop(model.elements);
  if (!seriesCheck.valid) {
    ui.messageText.textContent = seriesCheck.message;
    drawScope([]);
    return;
  }
  if (dcSources.length !== 1) {
    ui.messageText.textContent = "請在單一迴路中放入一個 DC 電源。";
    drawScope([]);
    return;
  }

  const dc = dcSources[0];
  const resistor = resistors[0];
  const capacitor = capacitors[0];
  const inductor = inductors[0];
  const hasOnlyDcAndResistors = capacitors.length === 0 && inductors.length === 0;
  const hasSupportedTransientParts = resistors.length <= 1 && capacitors.length <= 1 && inductors.length <= 1;
  let traces = [];
  if (hasOnlyDcAndResistors && resistors.length) {
    traces = simulateDC(dc, resistors, ammeters, totalTime, dt);
  } else if (!hasSupportedTransientParts) {
    ui.messageText.textContent = "暫態模擬目前每種類型只支援一個元件；純電阻迴路可使用多個電阻。";
    drawScope([]);
    return;
  } else if (resistor && capacitor && !inductor) {
    traces = simulateRC(dc, resistor, capacitor, totalTime, dt);
  } else if (inductor && capacitor && !resistor) {
    traces = simulateLC(dc, inductor, capacitor, totalTime, dt);
  } else if (resistor && inductor && capacitor) {
    traces = simulateRLC(dc, resistor, inductor, capacitor, totalTime, dt);
  } else {
    ui.messageText.textContent = "此閉合迴路尚不支援。請使用 DC＋R、RC、LC 或 RLC 的單一串聯迴路。";
    drawScope([]);
    return;
  }

  attachMeterReadings(traces, model, dc, voltmeters, ammeters);
  state.traces = traces;
  drawScope(traces);
  ui.messageText.textContent = "模擬完成。";
}

function validateSingleLoop(elements) {
  const loopElements = elements.filter((item) => item.component.type !== "voltmeter");
  if (loopElements.length < 2) {
    return { valid: false, message: "請建立至少含電源與負載的閉合迴路。" };
  }

  const adjacency = new Map();
  const degree = new Map();
  for (const element of loopElements) {
    if (element.a === element.b) {
      return { valid: false, message: "有元件的兩端被短接到同一節點；請檢查導線。" };
    }
    if (!adjacency.has(element.a)) adjacency.set(element.a, new Set());
    if (!adjacency.has(element.b)) adjacency.set(element.b, new Set());
    adjacency.get(element.a).add(element.b);
    adjacency.get(element.b).add(element.a);
    degree.set(element.a, (degree.get(element.a) || 0) + 1);
    degree.set(element.b, (degree.get(element.b) || 0) + 1);
  }

  const visited = new Set();
  const pending = [loopElements[0].a];
  while (pending.length) {
    const node = pending.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    for (const neighbor of adjacency.get(node) || []) pending.push(neighbor);
  }
  if (visited.size !== adjacency.size || [...degree.values()].some((count) => count !== 2)) {
    return {
      valid: false,
      message: "尚未形成單一閉合迴路。每個元件端點都要以導線接到下一個元件的端點。",
    };
  }
  return { valid: true };
}

function simulateDC(dc, resistors, ammeters, totalTime, dt) {
  const vs = Number(dc.component.value) || 5;
  const resistance = resistors.reduce((total, item) => {
    return total + Math.max(Math.abs(Number(item.component.value)) || 1000, 1e-9);
  }, 0);
  const meterResistance = ammeters.length * 1e-3;
  const current = vs / (resistance + meterResistance);
  const vTrace = { label: "V_R", unit: "V", color: colors[0], data: [] };
  const iTrace = { label: "I", unit: "A", color: colors[1], data: [] };
  for (let t = 0; t <= totalTime; t += dt) {
    vTrace.data.push({ t, y: current * resistance });
    iTrace.data.push({ t, y: current });
  }
  return [vTrace, iTrace];
}

function simulateRC(dc, resistor, capacitor, totalTime, dt) {
  const vs = Math.abs(Number(dc.component.value)) || 5;
  const r = Math.max(Math.abs(Number(resistor.component.value)) || 1000, 1e-9);
  const c = Math.max(Math.abs(Number(capacitor.component.value)) || 1e-6, 1e-12);
  let vc = 0;
  const vTrace = { label: "Vc", unit: "V", color: colors[0], data: [] };
  const iTrace = { label: "I", unit: "A", color: colors[1], data: [] };
  for (let t = 0; t <= totalTime; t += dt) {
    const i = (vs - vc) / r;
    vTrace.data.push({ t, y: vc });
    iTrace.data.push({ t, y: i });
    vc = vs + (vc - vs) * Math.exp(-dt / (r * c));
  }
  return [vTrace, iTrace];
}

function simulateLC(dc, inductor, capacitor, totalTime, dt) {
  const vs = Math.abs(Number(dc.component.value)) || 5;
  const l = Math.max(Math.abs(Number(inductor.component.value)) || 0.01, 1e-12);
  const c = Math.max(Math.abs(Number(capacitor.component.value)) || 1e-6, 1e-12);
  let vc = vs;
  let i = 0;
  const vTrace = { label: "Vc", unit: "V", color: colors[0], data: [] };
  const iTrace = { label: "I", unit: "A", color: colors[1], data: [] };
  for (let t = 0; t <= totalTime; t += dt) {
    vTrace.data.push({ t, y: vc });
    iTrace.data.push({ t, y: i });
    const alpha = dt / (2 * c);
    const beta = dt / (2 * l);
    const p = vc + alpha * i;
    const q = i - beta * vc;
    const denominator = 1 + alpha * beta;
    vc = (p + alpha * q) / denominator;
    i = (q - beta * p) / denominator;
  }
  return [vTrace, iTrace];
}

function simulateRLC(dc, resistor, inductor, capacitor, totalTime, dt) {
  const vs = Math.abs(Number(dc.component.value)) || 5;
  const r = Math.max(Math.abs(Number(resistor.component.value)) || 1000, 1e-9);
  const l = Math.max(Math.abs(Number(inductor.component.value)) || 0.01, 1e-12);
  const c = Math.max(Math.abs(Number(capacitor.component.value)) || 1e-6, 1e-12);
  let vc = 0;
  let i = 0;
  const vTrace = { label: "Vc", unit: "V", color: colors[0], data: [] };
  const iTrace = { label: "I", unit: "A", color: colors[1], data: [] };
  for (let t = 0; t <= totalTime; t += dt) {
    vTrace.data.push({ t, y: vc });
    iTrace.data.push({ t, y: i });
    const alpha = dt / (2 * c);
    const beta = dt / (2 * l);
    const p = vc + alpha * i;
    const q = i + beta * (2 * vs - r * i - vc);
    const nextCurrent = (q - beta * p) / (1 + beta * r + alpha * beta);
    vc = p + alpha * nextCurrent;
    i = nextCurrent;
  }
  return [vTrace, iTrace];
}

function sourceVoltage(dc) {
  const value = Number(dc.component.value);
  return Number.isFinite(value) ? value : 5;
}

function currentFromTraces(traces) {
  return traces.find((trace) => trace.unit === "A")?.data.at(-1)?.y ?? 0;
}

function voltageDrop(element, traces) {
  const current = Math.abs(currentFromTraces(traces));
  const type = element.component.type;
  if (type === "resistor") return current * Math.max(Math.abs(Number(element.component.value)) || 1000, 1e-9);
  if (type === "capacitor") return Math.abs(traces.find((trace) => trace.unit === "V")?.data.at(-1)?.y ?? 0);
  if (type === "inductor") {
    const trace = traces.find((item) => item.unit === "A");
    const last = trace?.data.at(-1);
    const previous = trace?.data.at(-2);
    const slope = last && previous ? (last.y - previous.y) / Math.max(last.t - previous.t, 1e-12) : 0;
    return Math.abs((Math.abs(Number(element.component.value)) || 0.01) * slope);
  }
  if (type === "ammeter") return current * 1e-3;
  return 0;
}

function buildNodeVoltages(model, dc, traces) {
  const loopElements = model.elements.filter((element) => element.component.type !== "voltmeter");
  const adjacency = new Map();
  for (const element of loopElements) {
    if (!adjacency.has(element.a)) adjacency.set(element.a, []);
    if (!adjacency.has(element.b)) adjacency.set(element.b, []);
    adjacency.get(element.a).push(element);
    adjacency.get(element.b).push(element);
  }

  const nodeVoltages = new Map([[dc.b, 0]]);
  let node = dc.b;
  let previous = null;
  for (let step = 0; step <= loopElements.length; step += 1) {
    if (node === dc.a) break;
    const nextElement = (adjacency.get(node) || []).find((element) => element !== dc && element !== previous);
    if (!nextElement) break;
    const nextNode = nextElement.a === node ? nextElement.b : nextElement.a;
    nodeVoltages.set(nextNode, (nodeVoltages.get(node) || 0) + voltageDrop(nextElement, traces));
    previous = nextElement;
    node = nextNode;
  }
  nodeVoltages.set(dc.a, sourceVoltage(dc));
  return { nodeVoltages, loopNodes: new Set(adjacency.keys()) };
}

function attachMeterReadings(traces, model, dc, voltmeters, ammeters) {
  const current = currentFromTraces(traces);
  const { nodeVoltages, loopNodes } = buildNodeVoltages(model, dc, traces);
  for (const meter of voltmeters) {
    if (!loopNodes.has(meter.a) || !loopNodes.has(meter.b) || !nodeVoltages.has(meter.a) || !nodeVoltages.has(meter.b)) {
      meter.component.measurement = "未接入迴路";
      continue;
    }
    const voltage = nodeVoltages.get(meter.a) - nodeVoltages.get(meter.b);
    meter.component.measurement = `${voltage.toFixed(3)} V`;
  }
  for (const meter of ammeters) {
    const connected = loopNodes.has(meter.a) && loopNodes.has(meter.b) && meter.a !== meter.b;
    meter.component.measurement = connected ? `${current.toExponential(3)} A` : "未接入迴路";
  }
  state.meterTraces = buildMeterTraces(model, voltmeters, ammeters, traces);
  renderProperties();
  render();
}

function buildMeterTraces(model, voltmeters, ammeters, traces) {
  const meterTraces = new Map();
  const currentTrace = traces.find((trace) => trace.unit === "A");
  const voltageTrace = traces.find((trace) => trace.unit === "V");
  for (const meter of ammeters) {
    if (!currentTrace) continue;
    meterTraces.set(meter.component.id, {
      label: meterLabel(meter.component),
      unit: "A",
      color: colors[1],
      data: currentTrace.data.map((point) => ({ ...point })),
    });
  }
  for (const meter of voltmeters) {
    const target = model.elements.find((element) => {
      if (element === meter || element.component.type === "voltmeter" || element.component.type === "ammeter") return false;
      return (element.a === meter.a && element.b === meter.b) || (element.a === meter.b && element.b === meter.a);
    });
    if (!target) continue;
    const direction = meter.a === target.a ? 1 : -1;
    let data = [];
    if (target.component.type === "capacitor" && voltageTrace) {
      data = voltageTrace.data.map((point) => ({ t: point.t, y: direction * point.y }));
    } else if (target.component.type === "resistor" && currentTrace) {
      const resistance = Math.max(Math.abs(Number(target.component.value)) || 1000, 1e-9);
      data = currentTrace.data.map((point) => ({ t: point.t, y: direction * point.y * resistance }));
    } else if (target.component.type === "dc") {
      const voltage = direction * sourceVoltage(target);
      data = (currentTrace?.data || voltageTrace?.data || []).map((point) => ({ t: point.t, y: voltage }));
    } else if (target.component.type === "inductor" && currentTrace) {
      const inductance = Math.max(Math.abs(Number(target.component.value)) || 0.01, 1e-12);
      data = currentTrace.data.map((point, index, points) => {
        const previous = points[Math.max(0, index - 1)];
        const slope = index ? (point.y - previous.y) / Math.max(point.t - previous.t, 1e-12) : 0;
        return { t: point.t, y: direction * inductance * slope };
      });
    }
    if (data.length) {
      meterTraces.set(meter.component.id, {
        label: meterLabel(meter.component),
        unit: "V",
        color: colors[0],
        data,
      });
    }
  }
  return meterTraces;
}

function meterComponents() {
  return state.components.filter((component) => component.type === "voltmeter" || component.type === "ammeter");
}

function meterLabel(component) {
  const index = state.components.filter((item) => item.type === component.type).indexOf(component) + 1;
  return `${component.type === "voltmeter" ? "電壓計" : "安培計"} ${index}`;
}

function addScope(meterId = meterComponents()[0]?.id) {
  const meters = meterComponents();
  if (!meters.length) {
    ui.scopeEmpty.textContent = "無測量元件。請先放入 V meter 或 A meter。";
    return;
  }
  state.scopes.push({ id: `scope${state.nextScopeId++}`, meterIds: [meterId || meters[0].id] });
  renderScopes();
  drawScope(state.traces);
}

function removeScope(scopeId) {
  state.scopes = state.scopes.filter((scope) => scope.id !== scopeId);
  renderScopes();
}

function toggleMeterScope(component) {
  const scope = state.scopes.find((item) => item.meterIds.includes(component.id));
  if (scope && scope.meterIds.length > 1) {
    scope.meterIds = scope.meterIds.filter((id) => id !== component.id);
    drawScope(state.traces);
  } else if (scope) removeScope(scope.id);
  else addScope(component.id);
}

function openMeterMenu(event, component) {
  event.preventDefault();
  event.stopPropagation();
  state.meterMenuTarget = component.id;
  const isVisible = state.scopes.some((scope) => scope.meterIds.includes(component.id));
  ui.meterMenu.querySelector('[data-meter-action="scope"]').textContent = isVisible ? "關閉示波器" : "顯示示波器";
  ui.meterMenu.style.left = `${event.clientX}px`;
  ui.meterMenu.style.top = `${event.clientY}px`;
  ui.meterMenu.hidden = false;
}

function closeMeterMenu() {
  ui.meterMenu.hidden = true;
  state.meterMenuTarget = null;
}

function renderScopes() {
  const meters = meterComponents();
  state.scopes = state.scopes
    .map((scope) => ({ ...scope, meterIds: (scope.meterIds || [scope.meterId]).filter((id) => meters.some((meter) => meter.id === id)) }))
    .filter((scope) => scope.meterIds.length);
  ui.scopePanels.replaceChildren();
  ui.scopeEmpty.hidden = state.scopes.length > 0;
  if (!state.scopes.length) return;

  for (const scope of state.scopes) {
    const panel = document.createElement("section");
    panel.className = "scope-panel";
    const toolbar = document.createElement("div");
    toolbar.className = "scope-toolbar";
    const addOverlay = document.createElement("button");
    addOverlay.type = "button";
    addOverlay.className = "scope-overlay-add";
    addOverlay.textContent = "＋新增疊圖";
    addOverlay.disabled = scope.meterIds.length >= meters.length;
    addOverlay.addEventListener("click", () => addScopeOverlay(scope));
    const close = document.createElement("button");
    close.type = "button";
    close.className = "scope-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "關閉示波器");
    close.addEventListener("click", () => removeScope(scope.id));
    toolbar.append(addOverlay, close);
    const traceControls = document.createElement("div");
    traceControls.className = "scope-trace-controls";
    scope.meterIds.forEach((meterId, index) => {
      const traceControl = document.createElement("div");
      traceControl.className = "scope-trace-control";
      const select = document.createElement("select");
      select.setAttribute("aria-label", `選擇疊圖量測元件 ${index + 1}`);
      for (const meter of meters) {
        const option = document.createElement("option");
        option.value = meter.id;
        option.textContent = meterLabel(meter);
        option.selected = meter.id === meterId;
        select.append(option);
      }
      select.addEventListener("change", () => {
        if (scope.meterIds.some((id, itemIndex) => itemIndex !== index && id === select.value)) {
          select.value = meterId;
          return;
        }
        scope.meterIds[index] = select.value;
        drawScope(state.traces);
      });
      traceControl.append(select);
      if (scope.meterIds.length > 1) {
        const removeOverlay = document.createElement("button");
        removeOverlay.type = "button";
        removeOverlay.className = "scope-overlay-remove";
        removeOverlay.textContent = "×";
        removeOverlay.setAttribute("aria-label", "移除疊圖");
        removeOverlay.addEventListener("click", () => {
          scope.meterIds.splice(index, 1);
          drawScope(state.traces);
        });
        traceControl.append(removeOverlay);
      }
      traceControls.append(traceControl);
    });
    const canvas = document.createElement("canvas");
    canvas.className = "scope-canvas";
    canvas.dataset.scopeId = scope.id;
    const legend = document.createElement("div");
    legend.className = "scope-legend";
    legend.dataset.scopeLegend = scope.id;
    panel.append(toolbar, traceControls, canvas, legend);
    ui.scopePanels.append(panel);
  }
}

function drawScope(traces) {
  renderScopes();
  for (const scope of state.scopes) {
    const canvas = ui.scopePanels.querySelector(`[data-scope-id="${scope.id}"]`);
    const legend = ui.scopePanels.querySelector(`[data-scope-legend="${scope.id}"]`);
    if (!canvas || !legend) continue;
    drawSingleScope(canvas, legend, scope.meterIds.map((meterId) => state.meterTraces.get(meterId)).filter(Boolean));
  }
}

function addScopeOverlay(scope) {
  const meter = meterComponents().find((item) => !scope.meterIds.includes(item.id));
  if (!meter) return;
  scope.meterIds.push(meter.id);
  drawScope(state.traces);
}

function drawSingleScope(canvas, legend, traces) {
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const width = rect.width;
  const height = rect.height;
  ctx.clearRect(0, 0, width, height);
  const plot = { x: 42, y: 18, w: width - 58, h: height - 48 };
  ctx.strokeStyle = "rgba(47, 73, 65, 0.16)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = plot.y + (plot.h * i) / 4;
    ctx.beginPath();
    ctx.moveTo(plot.x, y);
    ctx.lineTo(plot.x + plot.w, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#60706b";
  ctx.strokeRect(plot.x, plot.y, plot.w, plot.h);
  legend.replaceChildren();
  const usableTraces = traces.filter((trace) => trace?.data?.some((point) => Number.isFinite(point.y)));
  if (!usableTraces.length) {
    ctx.fillStyle = "#66736f";
    ctx.font = "14px system-ui";
    ctx.fillText("請先執行模擬", plot.x + 12, plot.y + 28);
    return;
  }

  const finite = usableTraces.flatMap((trace) => trace.data.filter((point) => Number.isFinite(point.y)));
  const maxT = Math.max(...finite.map((point) => point.t)) || 1;
  const isNormalized = new Set(usableTraces.map((trace) => trace.unit)).size > 1;
  let minY = Math.min(...finite.map((point) => point.y));
  let maxY = Math.max(...finite.map((point) => point.y));
  if (Math.abs(maxY - minY) < 1e-12) {
    maxY += 1;
    minY -= 1;
  }
  const traceRanges = new Map(
    usableTraces.map((trace) => {
      const points = trace.data.filter((point) => Number.isFinite(point.y));
      let traceMin = Math.min(...points.map((point) => point.y));
      let traceMax = Math.max(...points.map((point) => point.y));
      if (Math.abs(traceMax - traceMin) < 1e-12) {
        traceMax += 1;
        traceMin -= 1;
      }
      return [trace, { min: traceMin, max: traceMax }];
    }),
  );
  if (isNormalized) {
    ctx.fillStyle = "#66736f";
    ctx.font = "11px system-ui";
    for (let tick = 0; tick <= 4; tick += 1) {
      const value = tick / 4;
      const y = plot.y + plot.h - value * plot.h;
      ctx.fillText(value.toFixed(2), 4, y + 4);
    }
    const note = document.createElement("span");
    note.className = "scope-normalized-note";
    note.textContent = "不同物理量已各自歸一化為 0～1，用於比較趨勢。";
    legend.append(note);
  }
  usableTraces.forEach((trace, traceIndex) => {
    const color = colors[traceIndex % colors.length];
    const points = trace.data.filter((point) => Number.isFinite(point.y));
    const range = traceRanges.get(trace);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = plot.x + (point.t / maxT) * plot.w;
      const normalizedY = (point.y - range.min) / (range.max - range.min);
      const y = isNormalized
        ? plot.y + plot.h - normalizedY * plot.h
        : plot.y + plot.h - ((point.y - minY) / (maxY - minY)) * plot.h;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    const item = document.createElement("span");
    item.className = "legend-item";
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.background = color;
    const label = document.createElement("span");
    label.textContent = `${trace.label}：${(points.at(-1)?.y ?? 0).toPrecision(4)} ${trace.unit}`;
    item.append(swatch, label);
    legend.append(item);
  });
  ctx.fillStyle = "#66736f";
  ctx.font = "12px system-ui";
  ctx.fillText("t", plot.x + plot.w - 8, plot.y + plot.h + 24);
  if (!isNormalized) {
    ctx.fillText(`${minY.toPrecision(3)}`, 4, plot.y + plot.h);
    ctx.fillText(`${maxY.toPrecision(3)}`, 4, plot.y + 10);
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function loadPreset(name) {
  clearAll(false);
  if (name === "rc") {
    const dc = addComponent("dc", 224, 300, { value: 5, rotation: 90 });
    const r = addComponent("resistor", 392, 216, { value: 1000 });
    const c = addComponent("capacitor", 560, 300, { value: 0.0000047, rotation: 90 });
    const g = addComponent("ground", 560, 412);
    const v = addComponent("voltmeter", 728, 300, { rotation: 90 });
    connect(dc, 0, r, 0);
    connect(r, 1, c, 0);
    connect(c, 1, dc, 1);
    connect(v, 0, c, 0);
    connect(v, 1, c, 1);
  } else if (name === "lc") {
    const dc = addComponent("dc", 224, 300, { value: 5, rotation: 90 });
    const l = addComponent("inductor", 392, 216, { value: 0.02 });
    const c = addComponent("capacitor", 560, 300, { value: 0.00001, rotation: 90 });
    const g = addComponent("ground", 560, 412);
    connect(dc, 0, l, 0);
    connect(l, 1, c, 0);
    connect(c, 1, dc, 1);
  } else if (name === "rlc") {
    const dc = addComponent("dc", 140, 300, { value: 5, rotation: 90 });
    const r = addComponent("resistor", 308, 216, { value: 80 });
    const l = addComponent("inductor", 476, 216, { value: 0.04 });
    const c = addComponent("capacitor", 644, 300, { value: 0.00001, rotation: 90 });
    const g = addComponent("ground", 644, 412);
    const a = addComponent("ammeter", 392, 384);
    connect(dc, 0, r, 0);
    connect(l, 1, c, 0);
    connect(c, 1, a, 1);
    connect(a, 0, dc, 1);
  }
  state.selected = null;
  state.selectedComponentIds = new Set();
  state.selectionBox = null;
  renderProperties();
  render();
  simulate();
  resetHistory();
}

function connect(a, terminalA, b, terminalB) {
  addWire(getTerminals(a)[terminalA], getTerminals(b)[terminalB]);
}

ui.componentTools.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-tool]");
  if (!button) return;
  setMode(button.dataset.tool);
});

ui.wireBtn.addEventListener("click", () => setMode("wire"));
ui.selectBtn.addEventListener("click", () => setMode("select"));
ui.deleteBtn.addEventListener("click", deleteSelected);
ui.rotateBtn.addEventListener("click", rotateSelected);
ui.resetBtn.addEventListener("click", clearAll);
ui.runBtn.addEventListener("click", simulate);
ui.addScopeBtn.addEventListener("click", () => addScope());
ui.closePropertyModal.addEventListener("click", closePropertyModal);
ui.propertyModal.addEventListener("pointerdown", (event) => {
  if (event.target === ui.propertyModal) closePropertyModal();
});
ui.meterMenu.addEventListener("click", (event) => {
  const action = event.target.closest("button[data-meter-action]")?.dataset.meterAction;
  const component = state.components.find((item) => item.id === state.meterMenuTarget);
  if (!action || !component) return;
  if (action === "scope") toggleMeterScope(component);
  if (action === "delete") {
    state.selected = { kind: "component", id: component.id };
    deleteSelected();
  }
  closeMeterMenu();
});
document.addEventListener("pointerdown", (event) => {
  if (!ui.meterMenu.hidden && !ui.meterMenu.contains(event.target)) closeMeterMenu();
});
window.addEventListener("resize", () => drawScope(state.traces));

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => loadPreset(button.dataset.preset));
});

svg.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  const point = getBoardPoint(event);
  if (state.mode === "select") {
    beginSelectionBox(event);
  } else if (state.mode === "wire") {
    const terminal = findTerminal(point);
    if (terminal) handleTerminalClick(terminal);
    else addWireBend(point);
  } else {
    addComponent(state.mode, point.x, point.y);
    setMode("select");
    recordHistory();
  }
});

svg.addEventListener("pointermove", (event) => {
  if (state.mode !== "wire" || !state.wireDraft) return;
  state.wireDraft.preview = getBoardPoint(event);
  render();
});

svg.addEventListener("contextmenu", (event) => {
  const componentElement = event.target.closest?.(".component");
  const terminalId = event.target.getAttribute?.("data-terminal");
  const componentId = componentElement?.getAttribute("data-component") || terminalId?.split(":")[0];
  const component = state.components.find((item) => item.id === componentId);
  if (component?.type === "voltmeter" || component?.type === "ammeter") openMeterMenu(event, component);
});

document.addEventListener("keydown", (event) => {
  const editable = event.target.matches("input, textarea, select, [contenteditable='true']");
  if (event.key === "Escape") {
    closePropertyModal();
    closeMeterMenu();
    setMode("select");
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) redo();
    else undo();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
    event.preventDefault();
    redo();
    return;
  }
  if (editable) return;
  if (event.key === "Delete" || event.key === "Backspace") deleteSelected();
  if (event.key.toLowerCase() === "r") rotateSelected();
  if (event.key.toLowerCase() === "w") setMode("wire");
});

setMode("select");
loadPreset("rc");
