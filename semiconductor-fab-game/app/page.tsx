"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  advanceProductionDay,
  activeDayCost,
  canPurchaseSource,
  calculateOrderPayment,
  createInitialMarket,
  createMarketOrder,
  equipmentCapacity,
  equipmentDefinitions,
  equipmentOutputCount,
  equipmentLevelProfile,
  equipmentLevelClass,
  equipmentLevelName,
  equipmentModeName,
  equipmentPurchasePrice,
  equipmentResearchPrice,
  equipmentResaleValue,
  fleetBestLevels,
  factoryMarketTier,
  initialTechnology,
  lotRevenue,
  marketRefreshCost,
  maxEquipmentLevel,
  maxSourceLevel,
  missingRequirements,
  planProduction,
  productionSpeed,
  processObjects,
  products,
  projectedYield,
  purchasableEquipmentLevels,
  sourceOutputCount,
  sourceLevelClass,
  sourceLevelName,
  sourcePurchasePrice,
  sourceSupplyIntervalMs,
  sourceUpgradePrice,
  orderTerminationFee,
  type DeliveredLot,
  type EquipmentKey,
  type EquipmentUnit,
  type MarketOrder,
  type ProcessObjectKey,
  type Product,
  type ProductionLot,
} from "./gameCore";

type Lot = ProductionLot;
type FactoryNode = { id: string; kind: "source" | "equipment" | "output"; equipmentKey?: EquipmentKey; equipmentLevel?: number; sourceLevel?: number; offerId?: string; purchaseCost?: number; x: number; y: number };
type PortRef = { nodeId: string; port: "in" | "out"; slot?: number };
type Connection = { id: number; from: PortRef; to: PortRef };
type Settlement = { product: string; lots: number; yield: number; payout: number; spent: number; profit: number; multiplier: number };
type LogEntry = { id: number; type: "info" | "alarm"; message: string };

const money = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;
const getDefinition = (key: EquipmentKey) => equipmentDefinitions.find((item) => item.key === key)!;
const nodeWidth = 165;
const nodeHeight = 122;
const canvasWidth = 1400;
const canvasHeight = 820;

const initialNodes: FactoryNode[] = [
  { id: "source-1", kind: "source", sourceLevel: 1, x: 48, y: 354 },
];
const initialMarket = createInitialMarket(products.filter((product) => product.marketTier === 1), 6);

export default function Home() {
  const [cash, setCash] = useState(3000);
  const [day, setDay] = useState(1);
  const [lots, setLots] = useState<Lot[]>([]);
  const [finished, setFinished] = useState(0);
  const [technology, setTechnology] = useState(initialTechnology);
  const [purchaseLevels, setPurchaseLevels] = useState(initialTechnology);
  const [quality, setQuality] = useState(58);
  const [marketOrders, setMarketOrders] = useState<MarketOrder[]>(initialMarket);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [activeOfferIds, setActiveOfferIds] = useState<string[]>([]);
  const [strikes, setStrikes] = useState<Record<string, number>>(() => Object.fromEntries(products.map((product) => [product.id, 0])));
  const [refreshCount, setRefreshCount] = useState(0);
  const [marketCountdown, setMarketCountdown] = useState(15);
  const [deliveryBuffers, setDeliveryBuffers] = useState<Record<string, DeliveredLot[]>>({});
  const [nodes, setNodes] = useState<FactoryNode[]>(initialNodes);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingPort, setPendingPort] = useState<PortRef | null>(null);
  const [layoutChecked, setLayoutChecked] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([{ id: 1, type: "info", message: "新廠啟用：工作區目前只有矽晶圓 SOURCE。" }]);
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [lastSettlement, setLastSettlement] = useState<Settlement | null>(null);
  const nextLot = useRef(101);
  const nextEquipment = useRef(1);
  const nextConnection = useRef(1);
  const draggedRef = useRef(false);
  const pendingPortRef = useRef<PortRef | null>(null);
  const sourceSupplyRef = useRef<(sourceId: string) => void>(() => undefined);
  const sourceScheduleRef = useRef<Record<string, number>>({});
  const sourceNodesRef = useRef<FactoryNode[]>(initialNodes);
  const sourceRoundRobinRef = useRef(0);
  const stateRef = useRef<{ cash: number; lots: Lot[]; units: EquipmentUnit[]; quality: number; strikes: Record<string, number> }>({ cash, lots, units: [], quality, strikes });
  const marketRef = useRef(marketOrders);
  const deliveryRef = useRef(deliveryBuffers);
  const catalogCursor = useRef(0);
  const nextOffer = useRef(7);
  const marketTierRef = useRef(1);

  const fleetUnits = useMemo<EquipmentUnit[]>(() => nodes.flatMap((node) => node.kind === "equipment" && node.equipmentKey && node.equipmentLevel && node.purchaseCost ? [{ id: node.id, key: node.equipmentKey, level: node.equipmentLevel, purchaseCost: node.purchaseCost }] : []), [nodes]);
  const selectedProduct = selectedOfferId ? marketOrders.find((item) => item.offerId === selectedOfferId) ?? null : null;
  const activeOrders = marketOrders.filter((order) => activeOfferIds.includes(order.offerId));
  const sourceNodes = nodes.filter((node) => node.kind === "source");
  const marketTier = factoryMarketTier(fleetUnits);
  const eligibleProducts = useMemo(() => products.filter((product) => product.marketTier <= marketTier), [marketTier]);
  function routeForOrder(product: MarketOrder, output: FactoryNode) {
    const follow = (currentId: string, step: number, used: Set<string>): EquipmentUnit[] | null => {
      const outgoing = connections.filter((connection) => connection.from.nodeId === currentId && connection.from.port === "out");
      if (step === product.recipe.length) return outgoing.some((connection) => connection.to.nodeId === output.id) ? [] : null;
      for (const connection of outgoing) {
        const next = nodes.find((node) => node.id === connection.to.nodeId);
        const expected = product.recipe[step];
        if (!next || next.kind !== "equipment" || next.equipmentKey !== expected || !next.equipmentLevel || !next.purchaseCost || used.has(next.id)) continue;
        if (next.equipmentLevel < (product.requirements[expected] ?? 1)) continue;
        const remaining = follow(next.id, step + 1, new Set([...used, next.id]));
        if (remaining) return [{ id: next.id, key: expected, level: next.equipmentLevel, purchaseCost: next.purchaseCost }, ...remaining];
      }
      return null;
    };
    for (const source of sourceNodes) {
      const route = follow(source.id, 0, new Set([source.id]));
      if (route) return route;
    }
    return null;
  }

  const routesByOffer = new Map(activeOrders.flatMap((order) => {
    const output = nodes.find((node) => node.kind === "output" && node.offerId === order.offerId);
    const route = output ? routeForOrder(order, output) : null;
    return route ? [[order.offerId, route] as const] : [];
  }));
  const routedUnits = Array.from(new Map(Array.from(routesByOffer.values()).flat().map((unit) => [unit.id, unit])).values());
  const configuredUnits = routedUnits.length ? routedUnits : fleetUnits;
  const bestEquipment = fleetBestLevels(configuredUnits);

  useEffect(() => {
    stateRef.current = { cash, lots, units: routedUnits, quality, strikes };
  }, [cash, lots, routedUnits, quality, strikes]);

  useEffect(() => {
    marketRef.current = marketOrders;
  }, [marketOrders]);

  useEffect(() => {
    deliveryRef.current = deliveryBuffers;
  }, [deliveryBuffers]);

  useEffect(() => {
    sourceNodesRef.current = sourceNodes;
    const activeIds = new Set(sourceNodes.map((node) => node.id));
    sourceScheduleRef.current = Object.fromEntries(Object.entries(sourceScheduleRef.current).filter(([id]) => activeIds.has(id)));
  }, [sourceNodes]);

  const predicted = selectedProduct ? projectedYield(selectedProduct, configuredUnits, quality) : 0;

  function note(message: string, type: LogEntry["type"] = "info") {
    setLog((items) => items[0]?.message === message && items[0]?.type === type ? items : [{ id: Date.now() + Math.random(), type, message }, ...items].slice(0, 8));
  }

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function raiseAlarm(message: string) {
    note(`ALARM｜${message}`, "alarm");
    flash(message);
  }

  function productForOutput(node: FactoryNode) {
    return node.offerId ? marketOrders.find((order) => order.offerId === node.offerId) ?? null : null;
  }

  function nodePortTypes(node: FactoryNode, port: "in" | "out") {
    if (node.kind === "source") return port === "out" ? ["silicon-wafer" as ProcessObjectKey] : [];
    if (node.kind === "output") {
      const product = productForOutput(node);
      return product && port === "in" ? [product.objects[product.objects.length - 1]] : [];
    }
    const types = activeOrders.flatMap((product) => product.recipe.flatMap((key, step) => key === node.equipmentKey ? [port === "in" ? product.objects[step] : product.objects[step + 1]] : []));
    return Array.from(new Set(types));
  }

  function nodePortType(node: FactoryNode, port: "in" | "out"): ProcessObjectKey | null {
    const types = nodePortTypes(node, port);
    return types.length === 1 ? types[0] : null;
  }

  function nodePortLabel(node: FactoryNode, port: "in" | "out") {
    const type = nodePortType(node, port);
    return type ? processObjects[type].code : nodePortTypes(node, port).length > 1 ? "MULTI" : "N/A";
  }

  function portLimit(node: FactoryNode, port: "in" | "out") {
    if (node.kind === "source") return port === "out" ? sourceOutputCount(node.sourceLevel ?? 1) : 0;
    if (node.kind !== "equipment") return 1;
    const definition = getDefinition(node.equipmentKey!);
    const level = node.equipmentLevel ?? 1;
    const added = Math.floor(Math.max(0, level - 1) / 2);
    return port === "in" ? definition.inputPorts + added : equipmentOutputCount(definition, level);
  }

  function connectionError(connection: Connection) {
    const fromNode = nodes.find((item) => item.id === connection.from.nodeId);
    const toNode = nodes.find((item) => item.id === connection.to.nodeId);
    if (!fromNode || !toNode) return "節點不存在";
    if (connection.from.port !== "out" || connection.to.port !== "in") return "產線方向錯誤：必須由 OUT 指向 IN";
    const outputTypes = nodePortTypes(fromNode, "out");
    const inputTypes = nodePortTypes(toNode, "in");
    if (!outputTypes.length || !inputTypes.length) return "此設備不屬於任何已承接訂單配方";
    if (!outputTypes.some((type) => inputTypes.includes(type))) return `物件錯誤：${processObjects[outputTypes[0]].name} 無法輸入 ${processObjects[inputTypes[0]].name} 接口`;
    const outgoing = connections.filter((item) => item.from.nodeId === fromNode.id && item.from.port === "out").length;
    const incoming = connections.filter((item) => item.to.nodeId === toNode.id && item.to.port === "in").length;
    if (fromNode.kind === "source" || fromNode.kind === "equipment") {
      const sameOutputPort = connections.filter((item) => item.from.nodeId === fromNode.id && item.from.port === "out" && (item.from.slot ?? 0) === (connection.from.slot ?? 0)).length;
      if (sameOutputPort > 1) return `${fromNode.kind === "source" ? "SOURCE" : getDefinition(fromNode.equipmentKey!).name} OUT ${(connection.from.slot ?? 0) + 1} 已連接產線`;
    }
    if (outgoing > portLimit(fromNode, "out")) return `${fromNode.kind === "equipment" ? getDefinition(fromNode.equipmentKey!).name : "SOURCE"} 的 OUT 接口已超載`;
    if (incoming > portLimit(toNode, "in")) return `${toNode.kind === "equipment" ? getDefinition(toNode.equipmentKey!).name : "OUTPUT"} 的 IN 接口已超載`;
    return null;
  }

  const layoutValidation = (() => {
    if (!activeOrders.length) return { valid: false, message: "尚未承接訂單" };
    const invalid = connections.map((item) => connectionError(item)).filter(Boolean);
    const running = routesByOffer.size;
    const waiting = activeOrders.length - running;
    if (!running) return { valid: false, message: invalid[0] ?? "尚未有完成接線且設備等級足夠的訂單產線" };
    const warning = invalid.length ? `；另有 ${invalid.length} 條錯誤接線` : "";
    return { valid: true, message: `運轉中：${running} 筆訂單可生產${waiting ? `；${waiting} 筆等待接線` : ""}${warning}` };
  })();

  const estimate = (() => {
    if (!selectedProduct) return null;
    let operating = 0;
    selectedProduct.recipe.forEach((key, step) => {
      const level = Math.max(1, bestEquipment[key]);
      const speed = productionSpeed(key, level, quality);
      const estimateLot: Lot = { id: step + 1, offerId: selectedProduct.offerId, step, productId: selectedProduct.id, progress: 0, yield: 99.5, targetYield: predicted, spent: 0 };
      operating += activeDayCost([estimateLot], configuredUnits) * Math.ceil(100 / speed);
    });
    const { goodDies, revenue } = lotRevenue(selectedProduct, predicted);
    const totalOperating = operating * selectedProduct.requiredLots;
    const totalMaterial = selectedProduct.materialCost * selectedProduct.requiredLots;
    const payment = calculateOrderPayment(selectedProduct, Array.from({ length: selectedProduct.requiredLots }, (_, index) => ({ lotId: index, yield: predicted, goodDies, baseRevenue: revenue, spent: selectedProduct.materialCost + operating })));
    return { operating: totalOperating, material: totalMaterial, goodDies: goodDies * selectedProduct.requiredLots, revenue: payment.payout, multiplier: payment.multiplier, total: totalMaterial + totalOperating };
  })();

  function selectOrder(product: MarketOrder) {
    if ((strikes[product.id] ?? 0) >= 3) return raiseAlarm("此客戶已終止合作");
    setSelectedOfferId(product.offerId);
    if (activeOfferIds.includes(product.offerId)) return flash(`${product.name} 已在工作區中`);
    const outputCount = nodes.filter((node) => node.kind === "output").length;
    setActiveOfferIds((items) => [...items, product.offerId]);
    setNodes((items) => [...items, { id: `output-${product.offerId}`, kind: "output", offerId: product.offerId, x: 1160, y: 90 + (outputCount % 5) * 145 }]);
    note(`已承接 ${product.customer} 的 ${product.name} 訂單；OUTPUT 等待接線。`);
  }

  function cancelOrder(node: FactoryNode, event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const product = productForOutput(node);
    if (!product) return;
    const fee = orderTerminationFee(product);
    if (cash < fee) return raiseAlarm(`資金不足，違約 ${product.name} 需要 ${money(fee)}`);
    const abandoned = lots.filter((lot) => lot.offerId === product.offerId).length;
    setCash((value) => value - fee);
    setLots((items) => items.filter((lot) => lot.offerId !== product.offerId));
    setDeliveryBuffers((buffers) => {
      const next = { ...buffers };
      delete next[product.offerId];
      deliveryRef.current = next;
      return next;
    });
    setActiveOfferIds((items) => items.filter((id) => id !== product.offerId));
    setNodes((items) => items.filter((item) => item.id !== node.id));
    setConnections((items) => items.filter((connection) => connection.from.nodeId !== node.id && connection.to.nodeId !== node.id));
    if (selectedOfferId === product.offerId) setSelectedOfferId(null);
    note(`已違約 ${product.customer} 的 ${product.name}，支出 ${money(fee)}${abandoned ? `；撤除 ${abandoned} 批在製 LOTS` : ""}。`);
  }

  function handlePort(nodeId: string, port: "in" | "out", slot = 0) {
    const selected: PortRef = { nodeId, port, slot };
    const firstPort = pendingPortRef.current;
    if (!firstPort) {
      pendingPortRef.current = selected;
      setPendingPort(selected);
      return;
    }
    if (firstPort.nodeId === nodeId && firstPort.port === port && (firstPort.slot ?? 0) === slot) {
      pendingPortRef.current = null;
      setPendingPort(null);
      return;
    }
    if (connections.some((item) => item.from.nodeId === firstPort.nodeId && item.from.port === firstPort.port && (item.from.slot ?? 0) === (firstPort.slot ?? 0) && item.to.nodeId === nodeId && item.to.port === port && (item.to.slot ?? 0) === slot)) {
      pendingPortRef.current = null;
      setPendingPort(null);
      return flash("這條連線已存在");
    }
    const candidate = { id: nextConnection.current++, from: firstPort, to: selected };
    const fromNode = nodes.find((item) => item.id === firstPort.nodeId);
    const toNode = nodes.find((item) => item.id === selected.nodeId);
    if (firstPort.port !== "out" || selected.port !== "in") {
      raiseAlarm("產線方向錯誤：接線必須由 OUT 指向 IN");
    } else if (!fromNode || !toNode || !nodePortTypes(fromNode, "out").length || !nodePortTypes(toNode, "in").length) {
      raiseAlarm("設備不屬於目前訂單，無法接入產線");
    } else if (!nodePortTypes(fromNode, "out").some((type) => nodePortTypes(toNode, "in").includes(type))) {
      raiseAlarm(`物件錯誤：${processObjects[nodePortTypes(fromNode, "out")[0]].name} 無法輸入 ${processObjects[nodePortTypes(toNode, "in")[0]].name} 接口`);
    }
    setConnections((items) => [...items, candidate]);
    pendingPortRef.current = null;
    setPendingPort(null);
    setLayoutChecked(true);
  }

  function clearWiring() {
    if (lots.length) return raiseAlarm("產線運轉中，無法清除接線");
    setConnections([]);
    pendingPortRef.current = null;
    setPendingPort(null);
    setLayoutChecked(false);
  }

  function checkLayout() {
    setLayoutChecked(true);
    if (!layoutValidation.valid) raiseAlarm(layoutValidation.message);
    else note(layoutValidation.message);
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>, nodeId: string) {
    if ((event.target as HTMLElement).closest("button")) return;
    const node = nodes.find((item) => item.id === nodeId);
    if (!node) return;
    const startX = event.clientX;
    const startY = event.clientY;
    draggedRef.current = false;
    const move = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) draggedRef.current = true;
      setNodes((items) => items.map((item) => item.id === nodeId ? { ...item, x: Math.max(0, Math.min(canvasWidth - nodeWidth, node.x + dx)), y: Math.max(0, Math.min(canvasHeight - nodeHeight, node.y + dy)) } : item));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function purchaseEquipment(key: EquipmentKey) {
    const definition = getDefinition(key);
    const level = purchaseLevels[key];
    if (level > technology[key]) return raiseAlarm("尚未研發到此設備等級");
    const price = equipmentPurchasePrice(definition, level);
    if (cash < price) return raiseAlarm("資金不足，無法購置這台設備");
    setCash((value) => value - price);
    const installedCount = nodes.filter((item) => item.kind === "equipment").length;
    const id = `equipment-${key}-${nextEquipment.current++}`;
    setNodes((items) => [...items, { id, kind: "equipment", equipmentKey: key, equipmentLevel: level, purchaseCost: price, x: 250 + (installedCount % 4) * 230, y: 135 + Math.floor(installedCount / 4) * 190 }]);
    note(`購置 ${equipmentLevelName(level)} ${definition.name}，支出 ${money(price)}；可隨時選購已研發的舊型機。`);
  }

  function researchEquipment(key: EquipmentKey) {
    const definition = getDefinition(key);
    const currentLevel = technology[key];
    if (currentLevel >= maxEquipmentLevel) return flash(`${definition.name} 技術已達 MAX`);
    const price = equipmentResearchPrice(definition, currentLevel);
    if (cash < price) return raiseAlarm(`資金不足，研發下一代 ${definition.name} 需要 ${money(price)}`);
    setCash((value) => value - price);
    setTechnology((value) => ({ ...value, [key]: currentLevel + 1 }));
    note(`${definition.name} 採購上限已研發至 ${equipmentLevelName(currentLevel + 1)}；既有舊機不會升級，舊型仍可購買。`);
  }

  function sellEquipment(node: FactoryNode, event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!node.equipmentKey || !node.purchaseCost) return;
    const occupied = lots.some((lot) => products.find((product) => product.id === lot.productId)?.recipe[lot.step] === node.equipmentKey);
    if (occupied) return raiseAlarm("此類設備仍有晶圓加工或排隊，暫時不能變賣");
    const resale = equipmentResaleValue(node.purchaseCost);
    setCash((value) => value + resale);
    setNodes((items) => items.filter((item) => item.id !== node.id));
    setConnections((items) => items.filter((connection) => connection.from.nodeId !== node.id && connection.to.nodeId !== node.id));
    setLayoutChecked(false);
    note(`已折價出售 ${equipmentLevelName(node.equipmentLevel ?? 1)} ${getDefinition(node.equipmentKey).name}，回收 ${money(resale)}。`);
  }

  function upgradeSource(node: FactoryNode, event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const level = node.sourceLevel ?? 1;
    if (level >= maxSourceLevel) return flash("此 SOURCE 已達 MAX");
    const price = sourceUpgradePrice(level);
    if (cash < price) return raiseAlarm("資金不足，無法升級 SOURCE");
    setCash((value) => value - price);
    const nextLevel = level + 1;
    setNodes((items) => items.map((item) => item.id === node.id ? { ...item, sourceLevel: nextLevel } : item));
    note(`${node.id.toUpperCase()} 升級至 ${sourceLevelName(nextLevel)}：${sourceOutputCount(nextLevel)} 個 OUT，每 ${sourceSupplyIntervalMs(nextLevel) / 1000} 秒自動供料，支出 ${money(price)}。`);
  }

  function purchaseSource() {
    const levels = sourceNodes.map((node) => node.sourceLevel ?? 1);
    if (!canPurchaseSource(levels)) return raiseAlarm("必須讓場上所有 SOURCE 都達 MAX，才能購入下一個 SOURCE");
    const price = sourcePurchasePrice(sourceNodes.length);
    if (cash < price) return raiseAlarm(`資金不足，購入下一個 SOURCE 需要 ${money(price)}`);
    const id = `source-${sourceNodes.length + 1}`;
    setCash((value) => value - price);
    setNodes((items) => [...items, { id, kind: "source", sourceLevel: 1, x: 48, y: 70 + ((sourceNodes.length - 1) % 5) * 145 }]);
    note(`購入 ${id.toUpperCase()}，初始 LV1・1 OUT・每 5 秒自動供料，支出 ${money(price)}。`);
  }

  function pullMarketOrders(targetCount = 6, replaceCount = 0) {
    let current = marketRef.current;
    if (replaceCount > 0) {
      const replaceable = current.filter((order) => !activeOfferIds.includes(order.offerId)).slice(-replaceCount);
      const replaceIds = new Set(replaceable.map((order) => order.offerId));
      current = current.filter((order) => !replaceIds.has(order.offerId));
    }
    const added: MarketOrder[] = [];
    let attempts = 0;
    while (current.length + added.length < targetCount && attempts < products.length * 3) {
      const product = products[catalogCursor.current % products.length];
      catalogCursor.current += 1;
      attempts += 1;
      if (!eligibleProducts.some((item) => item.id === product.id)) continue;
      if ([...current, ...added].some((order) => order.id === product.id)) continue;
      added.push(createMarketOrder(product, nextOffer.current++));
    }
    const next = [...current, ...added];
    marketRef.current = next;
    setMarketOrders(next);
    return added;
  }

  function refreshMarket() {
    const price = marketRefreshCost(refreshCount);
    if (cash < price) return raiseAlarm(`資金不足，刷新市場需要 ${money(price)}`);
    const replaceCount = marketRef.current.length >= 6 ? 2 : 0;
    const added = pullMarketOrders(6, replaceCount);
    setCash((value) => value - price);
    setRefreshCount((value) => value + 1);
    note(`市場已付費刷新，支出 ${money(price)}；載入 ${added.length} 筆新訂單。`);
  }

  function addWaferFromSource(sourceId: string, automatic = false) {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    if (!automatic) setLayoutChecked(true);
    const source = sourceNodes.find((node) => node.id === sourceId);
    if (!source) return;
    if (!activeOrders.length) return automatic ? undefined : raiseAlarm("尚未接單：請先建立訂單 OUTPUT");
    const routable = activeOrders.filter((order) => routesByOffer.has(order.offerId));
    if (!routable.length) return automatic ? undefined : raiseAlarm("尚未有可運轉的訂單產線；其他未完成接線的訂單不會影響已完成產線");
    const reserved = Object.fromEntries(activeOrders.map((order) => [order.offerId, lots.filter((lot) => lot.offerId === order.offerId).length]));
    const staged: Lot[] = [];
    let availableCash = cash;
    const lanes = sourceOutputCount(source.sourceLevel ?? 1);
    for (let lane = 0; lane < lanes; lane += 1) {
      const candidates = routable.filter((order) => {
        if (order.contractsRemaining === null) return availableCash >= order.materialCost;
        const used = (deliveryRef.current[order.offerId]?.length ?? 0) + (reserved[order.offerId] ?? 0);
        return used < order.contractsRemaining * order.requiredLots && availableCash >= order.materialCost;
      });
      if (!candidates.length) continue;
      const product = candidates[sourceRoundRobinRef.current % candidates.length];
      sourceRoundRobinRef.current += 1;
      const id = nextLot.current++;
      const processVariation = ((id * 37) % 25) / 10 - 1.2;
      const target = product.baseYield + (quality - 50) * 0.055 + processVariation;
      staged.push({ id, offerId: product.offerId, productId: product.id, step: 0, progress: 0, yield: 99.5, targetYield: Math.max(52, Math.min(99, target)), spent: product.materialCost });
      reserved[product.offerId] = (reserved[product.offerId] ?? 0) + 1;
      availableCash -= product.materialCost;
    }
    if (!staged.length) return automatic ? undefined : raiseAlarm("資金不足或訂單額度已滿，SOURCE 無法補料");
    const cost = staged.reduce((sum, lot) => sum + lot.spent, 0);
    setCash((value) => value - cost);
    setLots((items) => [...items, ...staged]);
    note(`${automatic ? "SOURCE AUTO" : "SOURCE"} ${source.id.toUpperCase()}｜平均分配輸出 ${staged.map((lot) => `W${lot.id}`).join("、")}，材料支出 ${money(cost)}。`);
  }

  useEffect(() => {
    sourceSupplyRef.current = (sourceId) => addWaferFromSource(sourceId, true);
  });

  function settleLot(lot: Lot, product: Product) {
    const finalYield = Number(lot.yield.toFixed(1));
    const sale = lotRevenue(product, finalYield);
    const delivered: DeliveredLot = { lotId: lot.id, yield: finalYield, goodDies: sale.goodDies, baseRevenue: sale.revenue, spent: lot.spent };
    setFinished((value) => value + 1);
    const currentBuffer = deliveryRef.current[lot.offerId] ?? [];
    const combined = [...currentBuffer, delivered];
    if (combined.length < product.requiredLots) {
      const nextBuffers = { ...deliveryRef.current, [lot.offerId]: combined };
      deliveryRef.current = nextBuffers;
      setDeliveryBuffers(nextBuffers);
      note(`OUTPUT HALT｜W${lot.id} 已送達，交貨槽 ${combined.length}／${product.requiredLots} LOTS；尚未付款。`);
      flash(`OUTPUT HALT ${combined.length}／${product.requiredLots} LOTS`);
      return;
    }

    const contractLots = combined.slice(0, product.requiredLots);
    const remainder = combined.slice(product.requiredLots);
    const nextBuffers = { ...deliveryRef.current, [lot.offerId]: remainder };
    deliveryRef.current = nextBuffers;
    setDeliveryBuffers(nextBuffers);
    const payment = calculateOrderPayment(product, contractLots);
    setCash((value) => value + payment.payout);
    setLastSettlement({ product: product.name, lots: contractLots.length, yield: payment.averageYield, payout: payment.payout, spent: payment.totalSpent, profit: payment.profit, multiplier: payment.multiplier });
    const adjustment = Math.round((payment.multiplier - 1) * 100);
    const adjustmentText = adjustment > 0 ? `良率 BONUS +${adjustment}%` : adjustment < 0 ? `低良率折扣 ${adjustment}%` : "標準價格";
    note(`訂單 PAY｜${contractLots.length} LOTS，平均良率 ${payment.averageYield}%，${adjustmentText}，付款 ${money(payment.payout)}。`);
    flash(`訂單付款 ${money(payment.payout)}・${adjustmentText}`);
    if (payment.averageYield < product.minYield - 6) setStrikes((value) => ({ ...value, [product.id]: (value[product.id] ?? 0) + 1 }));

    const nextMarket = marketRef.current.flatMap((order) => {
      if (order.offerId !== lot.offerId || order.contractsRemaining === null) return [order];
      const remaining = order.contractsRemaining - 1;
      return remaining > 0 ? [{ ...order, contractsRemaining: remaining }] : [];
    });
    marketRef.current = nextMarket;
    setMarketOrders(nextMarket);
  }

  function advance() {
    const state = stateRef.current;
    if (!state.lots.length) return;
    const result = advanceProductionDay(state.lots, state.units, state.quality);
    if (state.cash < result.dayCost) return raiseAlarm(`現金不足以支付今日營運費 ${money(result.dayCost)}`);
    setCash((value) => value - result.dayCost);
    setDay((value) => value + 1);
    setLots(result.nextLots);
    result.completed.forEach((lot) => settleLot(lot, products.find((item) => item.id === lot.productId)!));
  }

  useEffect(() => {
    const timer = window.setInterval(advance, 1200);
    return () => window.clearInterval(timer);
    // advance intentionally reads current state through stateRef, so this timer is installed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      sourceNodesRef.current.forEach((source) => {
        const interval = sourceSupplyIntervalMs(source.sourceLevel ?? 1);
        const due = sourceScheduleRef.current[source.id] ?? now + interval;
        if (now < due) {
          sourceScheduleRef.current[source.id] = due;
          return;
        }
        sourceScheduleRef.current[source.id] = now + interval;
        sourceSupplyRef.current(source.id);
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (marketTier <= marketTierRef.current) return;
    marketTierRef.current = marketTier;
    const timer = window.setTimeout(() => {
      const added = pullMarketOrders(6, 2);
      if (added.length) note(`工廠成熟度提升至市場等級 ${marketTier}；市場已輪替 ${added.length} 筆更高階訂單。`);
    }, 0);
    return () => window.clearTimeout(timer);
    // The market rotation is triggered only when the derived market tier rises.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketTier, eligibleProducts]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMarketCountdown((value) => {
        if (value > 1) return value - 1;
        const added = marketRef.current.length < 6 ? pullMarketOrders(6) : [];
        if (added.length) note(`後台訂單服務載入 ${added.length} 筆新訂單。`);
        return 15;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // This is the slow background market clock; it reads the latest market through marketRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const completedOffers = activeOfferIds.filter((offerId) => !marketOrders.some((order) => order.offerId === offerId));
    if (!completedOffers.length) return;
    const timer = window.setTimeout(() => {
      const completed = new Set(completedOffers);
      if (completed.has(selectedOfferId ?? "")) setSelectedOfferId(null);
      setActiveOfferIds((ids) => ids.filter((id) => !completed.has(id)));
      setNodes((items) => items.filter((item) => item.kind !== "output" || !completed.has(item.offerId ?? "")));
      setConnections((items) => items.filter((connection) => !completed.has(connection.from.nodeId.replace("output-", "")) && !completed.has(connection.to.nodeId.replace("output-", ""))));
      setLayoutChecked(false);
      note(`限定批次訂單已全數交付，${completedOffers.length} 個 OUTPUT 已自動撤除；請等待或刷新市場。`);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeOfferIds, marketOrders, selectedOfferId]);

  function connectionStyle(connection: Connection) {
    const fromNode = nodes.find((item) => item.id === connection.from.nodeId)!;
    const toNode = nodes.find((item) => item.id === connection.to.nodeId)!;
    const sourcePortY = (node: FactoryNode, port: PortRef) => node.kind === "source" && port.port === "out" ? node.y + 20 + (port.slot ?? 0) * 23 : node.y + nodeHeight / 2;
    const start = { x: fromNode.x + (connection.from.port === "out" ? nodeWidth : 0), y: sourcePortY(fromNode, connection.from) };
    const end = { x: toNode.x + (connection.to.port === "out" ? nodeWidth : 0), y: sourcePortY(toNode, connection.to) };
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return { left: start.x, top: start.y, width: Math.hypot(dx, dy), transform: `rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)` };
  }

  function connectionDeleteStyle(connection: Connection) {
    const fromNode = nodes.find((item) => item.id === connection.from.nodeId)!;
    const toNode = nodes.find((item) => item.id === connection.to.nodeId)!;
    const startX = fromNode.x + (connection.from.port === "out" ? nodeWidth : 0);
    const startY = fromNode.kind === "source" && connection.from.port === "out" ? fromNode.y + 20 + (connection.from.slot ?? 0) * 23 : fromNode.y + nodeHeight / 2;
    const endX = toNode.x + (connection.to.port === "out" ? nodeWidth : 0);
    const endY = toNode.kind === "source" && connection.to.port === "out" ? toNode.y + 20 + (connection.to.slot ?? 0) * 23 : toNode.y + nodeHeight / 2;
    return { left: (startX + endX) / 2 - 9, top: (startY + endY) / 2 - 9 };
  }

  const productionPlan = planProduction(lots, routedUnits);
  const queuedLotIds = new Set(productionPlan.queuedIds);

  return <main>
    <header className="topbar">
      <div className="brand"><span className="brandMark">SF</span><div><strong>晶圓帝國</strong><small>FAB CIRCUIT LAB</small></div></div>
      <button className="helpButton" aria-label="開啟玩家製造指南" onClick={() => setGuideOpen(true)}>？</button>
      <div className="stats"><div><span>生產日</span><b>DAY {String(day).padStart(3, "0")}</b></div><div><span>可用資金</span><b className={cash < 1000 ? "danger" : ""}>{money(cash)}</b></div><div><span>在製批次</span><b>{lots.length} LOTS</b></div><div><span>累計出貨</span><b>{finished} BATCHES</b></div></div>
      <div className="runButton autoRun"><span className="livePulse" />產線自動運轉</div>
    </header>

    <section className={`gameGrid layoutGameGrid ${workspaceExpanded ? "workspaceExpanded" : ""}`}>
      <aside className="leftPanel panel">
        <div className="sectionTitle"><span>01</span><div><b>設備採購</b><small>FACILITY PROCUREMENT</small></div></div>
        <p className="helper starterHint">新廠沒有任何機台。購買後設備會放入工作區，再由玩家配置位置與接線。</p>
        <div className="levelLegend" aria-label="設備等級顏色"><span className="level-1">1</span><span className="level-2">2</span><span className="level-3">3</span><span className="level-4">4</span><span className="level-5">5</span><span className="level-6">6</span><span className="level-max">MAX</span></div>
        <div className="equipmentList">{equipmentDefinitions.map((item) => {
          const technologyLevel = technology[item.key];
          const selectedLevel = purchaseLevels[item.key];
          const selectedProfile = equipmentLevelProfile(item, selectedLevel);
          const atMax = technologyLevel >= maxEquipmentLevel;
          const installed = fleetUnits.filter((unit) => unit.key === item.key).length;
          return <div className={`equipment generationCard ${equipmentLevelClass(selectedLevel)} ${installed ? "" : "notInstalled"}`} key={item.key}><div className="equipIcon"><span>{item.short}</span></div><div className="equipInfo"><b>{item.name}</b><small>{equipmentModeName(selectedProfile.mode)}・容量 {selectedProfile.capacity}・速度 {Math.round(selectedProfile.speed)}</small><span className="portSummary">上限 {equipmentLevelName(technologyLevel)}・已持有 {installed} 台・運轉 ${Math.round(item.upkeep * selectedProfile.upkeepMultiplier)}／日</span></div><div className="equipmentActions"><span className={`levelSwatch ${equipmentLevelClass(selectedLevel)}`} title={equipmentLevelName(selectedLevel)} /><select aria-label={`選擇 ${item.name} 購買等級`} value={selectedLevel} onChange={(event) => setPurchaseLevels((levels) => ({ ...levels, [item.key]: Number(event.target.value) }))}>{purchasableEquipmentLevels(technologyLevel).map((level) => <option key={level} value={level}>{equipmentLevelName(level)}</option>)}</select><button aria-label={`購買 ${equipmentLevelName(selectedLevel)} ${item.name}`} onClick={() => purchaseEquipment(item.key)}>購買 {money(equipmentPurchasePrice(item, selectedLevel))}</button><button aria-label={`研發下一代 ${item.name}`} disabled={atMax} onClick={() => researchEquipment(item.key)}>{atMax ? "上限 MAX" : `研發上限 ${money(equipmentResearchPrice(item, technologyLevel))}`}</button></div></div>;
        })}</div>
      </aside>

      <section className="fabArea layoutFabArea">
        <div className="workspaceHeader"><div><p className="eyebrow">FAB LAYOUT / ROUTING CONSOLE</p><h1>製程佈局工作區</h1><p>可同時承接多筆訂單；每個接線正確的 SOURCE 都會依自身等級自動平均補料。</p></div><div className={`layoutStatus ${layoutValidation.valid ? "valid" : layoutChecked ? "invalid" : ""}`}><span>{layoutValidation.valid ? "PRODUCTION READY" : "LAYOUT CHECK"}</span><b>{layoutValidation.message}</b></div></div>
        <div className="workspaceToolbar"><span>接線狀態：{pendingPort ? `已選擇 ${pendingPort.port.toUpperCase()}，請選擇第二個接口` : "等待選擇接口"}</span><div><button onClick={purchaseSource} disabled={!canPurchaseSource(sourceNodes.map((node) => node.sourceLevel ?? 1))}>購入 SOURCE {money(sourcePurchasePrice(sourceNodes.length))}</button><button onClick={() => setWorkspaceExpanded((value) => !value)}>{workspaceExpanded ? "顯示側欄" : "擴大工作區"}</button><button onClick={checkLayout}>檢查設備佈局</button><button onClick={clearWiring}>清除接線</button></div></div>
        <div className="layoutViewport"><div className="layoutCanvas" style={{ width: canvasWidth, height: canvasHeight }}>
          <div className="pcbGrid" />
          {connections.map((connection) => {
            const error = connectionError(connection);
            return <div key={connection.id}><div data-from={`${connection.from.nodeId}:${connection.from.port}`} data-to={`${connection.to.nodeId}:${connection.to.port}`} title={`${connection.from.nodeId}:${connection.from.port} → ${connection.to.nodeId}:${connection.to.port}｜${error ?? "連線正確"}`} className={`connectionLine ${error ? "connectionError" : "connectionValid"}`} style={connectionStyle(connection)}><i /><span>{error ? "!" : "›"}</span></div><button aria-label={`刪除連線 ${connection.id}`} className={`connectionDelete ${error ? "deleteError" : ""}`} style={connectionDeleteStyle(connection)} onClick={() => setConnections((items) => items.filter((item) => item.id !== connection.id))}>×</button></div>;
          })}
          {nodes.map((node) => {
            const definition = node.equipmentKey ? getDefinition(node.equipmentKey) : null;
            const level = node.equipmentLevel ?? 0;
            const nodeSourceLevel = node.sourceLevel ?? 1;
            const outputProduct = node.kind === "output" ? productForOutput(node) : null;
            const inputType = nodePortType(node, "in");
            const outputType = nodePortType(node, "out");
            const assignedHere = new Set(productionPlan.assignments.filter((assignment) => assignment.unitId === node.id).map((assignment) => assignment.lotId));
            const isActive = assignedHere.size > 0;
            const firstUnitOfType = node.equipmentKey ? fleetUnits.find((unit) => unit.key === node.equipmentKey)?.id === node.id : false;
            const activeHere = lots.filter((lot) => assignedHere.has(lot.id));
            const queuedHere = node.equipmentKey && firstUnitOfType ? lots.filter((lot) => queuedLotIds.has(lot.id) && products.find((product) => product.id === lot.productId)?.recipe[lot.step] === node.equipmentKey) : [];
            const stationLots = [...activeHere, ...queuedHere];
            const outputIncoming = node.kind === "output" ? connections.filter((item) => item.to.nodeId === node.id) : [];
            const outputConnectionErrors = outputIncoming.map((item) => connectionError(item)).filter(Boolean);
            const outputError = node.kind === "output" ? (!outputIncoming.length ? "等待產線接入" : outputConnectionErrors.find((message) => message!.includes("方向錯誤") || message!.includes("物件錯誤")) ?? outputConnectionErrors[0] ?? null) : null;
            return <div aria-label={node.kind === "equipment" ? `${definition!.name} ${equipmentLevelName(level)}` : node.kind === "source" ? `${node.id.toUpperCase()} ${sourceLevelName(nodeSourceLevel)}` : undefined} title={node.kind === "equipment" ? `${definition!.name}｜${equipmentModeName(equipmentLevelProfile(definition!, level).mode)}｜容量 ${equipmentCapacity(definition!, level)}｜速度 ${Math.round(equipmentLevelProfile(definition!, level).speed)}` : undefined} className={`factoryNode ${node.kind} ${node.kind === "equipment" ? equipmentLevelClass(level) : node.kind === "source" ? sourceLevelClass(nodeSourceLevel) : ""} ${isActive ? "nodeActive" : ""}`} style={{ left: node.x, top: node.y }} key={node.id} onPointerDown={(event) => startDrag(event, node.id)} onClick={node.kind === "source" ? () => addWaferFromSource(node.id) : undefined}>
              <div className="nodeHead"><span>{node.kind === "source" ? "SOURCE" : node.kind === "output" ? "ORDER OUTPUT" : "EQUIPMENT"}</span><i /></div>
              <strong>{node.kind === "source" ? node.id.toUpperCase() : node.kind === "output" ? outputProduct?.customer ?? "等待訂單" : definition!.short}</strong>
              <small>{node.kind === "source" ? `${sourceLevelName(nodeSourceLevel)}・OUT × ${sourceOutputCount(nodeSourceLevel)}・每 ${sourceSupplyIntervalMs(nodeSourceLevel) / 1000} 秒` : node.kind === "output" ? outputProduct?.name ?? "未指定產品" : stationLots.length ? `RUN ${activeHere.length}・WAIT ${queuedHere.length}` : "IDLE"}</small>
              {node.kind === "source" && nodeSourceLevel < maxSourceLevel && <button className="sourceUpgrade" aria-label={`升級 ${node.id.toUpperCase()} 至 ${sourceLevelName(nodeSourceLevel + 1)}`} onClick={(event) => upgradeSource(node, event)}>升級 {money(sourceUpgradePrice(nodeSourceLevel))}</button>}
              {node.kind !== "source" && <button aria-label={`${node.id} IN ${inputType ? processObjects[inputType].name : nodePortLabel(node, "in")}`} className={`portButton portInput ${pendingPort?.nodeId === node.id && pendingPort.port === "in" ? "selectedPort" : ""}`} onClick={(event) => { event.stopPropagation(); handlePort(node.id, "in"); }}><i />IN<span>{nodePortLabel(node, "in")}</span></button>}
              {node.kind === "source" && Array.from({ length: sourceOutputCount(nodeSourceLevel) }, (_, slot) => <button key={slot} style={{ top: 10 + slot * 23 }} aria-label={`${node.id} OUT ${slot + 1} 矽晶圓`} className={`portButton portOutput sourcePort ${pendingPort?.nodeId === node.id && pendingPort.port === "out" && (pendingPort.slot ?? 0) === slot ? "selectedPort" : ""}`} onClick={(event) => { event.stopPropagation(); handlePort(node.id, "out", slot); }}>OUT<span>{slot + 1}</span><i /></button>)}
              {node.kind === "equipment" && Array.from({ length: portLimit(node, "out") }, (_, slot) => <button key={slot} style={{ top: 43 + slot * 23 }} aria-label={`${node.id} OUT ${slot + 1} ${outputType ? processObjects[outputType].name : nodePortLabel(node, "out")}`} className={`portButton portOutput ${pendingPort?.nodeId === node.id && pendingPort.port === "out" && (pendingPort.slot ?? 0) === slot ? "selectedPort" : ""}`} onClick={(event) => { event.stopPropagation(); handlePort(node.id, "out", slot); }}>OUT<span>{slot + 1}</span><i /></button>)}
              {node.kind === "equipment" && <button className="sellEquipment" aria-label={`折價出售 ${node.id}`} onClick={(event) => sellEquipment(node, event)}>售 {money(equipmentResaleValue(node.purchaseCost ?? 0))}</button>}
              {node.kind === "output" && outputProduct && <><button className="cancelOrder" aria-label={`違約 ${outputProduct.name}`} onClick={(event) => cancelOrder(node, event)}>違約 {money(orderTerminationFee(outputProduct))}</button><em className={outputError ? "outputError" : (deliveryBuffers[outputProduct.offerId]?.length ?? 0) ? "outputHalt" : "outputReady"}>{outputError ?? ((deliveryBuffers[outputProduct.offerId]?.length ?? 0) ? `HALT ${deliveryBuffers[outputProduct.offerId].length}／${outputProduct.requiredLots} LOTS` : `READY 0／${outputProduct.requiredLots} LOTS`)}</em></>}
              {node.kind === "equipment" && stationLots.slice(0, 3).map((lot, index) => <div className={`nodeWafer ${queuedLotIds.has(lot.id) ? "queued" : ""}`} style={{ right: 9 + index * 30 }} key={lot.id}>{queuedLotIds.has(lot.id) ? "Q" : `${Math.round(lot.progress)}%`}</div>)}
            </div>;
          })}
        </div></div>
        <div className="controlDeck layoutControls"><div className="recipe"><div><b>製程策略</b><span>{quality >= 72 ? "良率優先" : quality >= 45 ? "平衡生產" : "速度優先"}</span></div><input aria-label="製程品質與速度平衡" type="range" min="20" max="90" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /><div className="rangeLabels"><small>速度優先</small><small>良率優先</small></div></div><div className="actionButtons"><button className="secondary" onClick={advance}>立即推進一日<small>{lots.length ? `預計支出 ${money(activeDayCost(lots, routedUnits))}` : "產線持續待命"}</small></button></div></div>
      </section>

      <aside className="rightPanel">
        <section className="panel contracts"><div className="sectionTitle"><span>02</span><div><b>訂單市場</b><small>CONTRACT & OUTPUT</small></div></div><p className="helper">可同時承接多筆訂單；點擊訂單即在工作區建立專屬 OUTPUT。若要退出，可在該 OUTPUT 支付違約金。</p><div className="marketControls"><span>市場等級 {marketTier}・進行中 {activeOrders.length} 筆・目前 {marketOrders.length}／6 筆・下次同步 {marketCountdown}s</span><button onClick={refreshMarket}>立即刷新 {money(marketRefreshCost(refreshCount))}</button></div><div className="customerList">{marketOrders.map((product) => {
          const productMissing = missingRequirements(product, fleetUnits);
          const profile = product.requiredLots >= 5 ? "量產型" : product.minYield >= 90 ? "高良率型" : "平衡型";
          const active = activeOfferIds.includes(product.offerId);
          return <button className={`customer ${active ? "selected" : ""}`} key={product.offerId} onClick={() => selectOrder(product)}><span className="customerLogo" style={{ background: product.color }}>{product.name.slice(0, 1)}</span><span className="customerText"><b>{product.name}</b><small>{product.description}｜{product.customer}</small></span><span className="customerTerms"><b>目標良率 {product.minYield}%</b><small>${product.unitPrice}／單位</small></span><span className={`contractBadge ${product.contractType}`}>{active ? "進行中・工作區已建立 OUTPUT" : product.contractType === "permanent" ? `永久・每單 ${product.requiredLots} LOTS` : `剩餘 ${product.contractsRemaining} 單・每單 ${product.requiredLots} LOTS`}</span><span className="requirementLine">{profile}｜{productMissing.length ? `待建置：${productMissing.map((item) => `${getDefinition(item.key).name} Lv.${item.level}`).join("、")}` : `交貨槽 ${deliveryBuffers[product.offerId]?.length ?? 0}／${product.requiredLots} LOTS`}</span></button>;
        })}{!marketOrders.length && <div className="emptyMarket">目前沒有可承接的訂單，請等待後台同步或付費刷新。</div>}</div>{selectedProduct && estimate && <div className="economyCard"><div><span>整單材料</span><b>-{money(estimate.material)}</b></div><div><span>整單營運</span><b>-{money(estimate.operating)}</b></div><div><span>預估付款</span><b className="income">+{money(estimate.revenue)}</b></div><div><span>良率係數</span><b className={estimate.multiplier >= 1 ? "income" : "danger"}>{estimate.multiplier.toFixed(2)}×</b></div><div className="profitRow"><span>湊齊 {selectedProduct.requiredLots} LOTS 後付款</span><b className="income">預估損益 {money(estimate.revenue - estimate.total)}</b></div></div>}</section>
        <section className="panel objectPanel"><div className="sectionTitle"><span>03</span><div><b>物件資料庫</b><small>PROCESS OBJECT DATA</small></div></div>{selectedProduct ? <div className="objectFlow">{selectedProduct.objects.map((key, index) => <div key={`${key}-${index}`}><span>{index === 0 ? "SOURCE" : index === selectedProduct.objects.length - 1 ? "OUTPUT" : String(index).padStart(2, "0")}</span><b>{processObjects[key].name}</b><small>{processObjects[key].code}</small></div>)}</div> : <p className="helper">選擇訂單後顯示各站 INPUT／OUTPUT 物件。</p>}</section>
        <section className="panel activity"><div className="sectionTitle"><span>04</span><div><b>營運與警報紀錄</b><small>FAB ACTIVITY / ALARM</small></div>{log.some((item) => item.type === "alarm") && <em className="alarmCount">ALARM {log.filter((item) => item.type === "alarm").length}</em>}</div>{lastSettlement && <div className="lastResult"><span>最近訂單付款・{lastSettlement.lots} LOTS</span><b>{lastSettlement.product}・平均良率 {lastSettlement.yield}%</b><div><small>價格係數 {lastSettlement.multiplier.toFixed(2)}×・付款 {money(lastSettlement.payout)}</small><strong className={lastSettlement.profit >= 0 ? "income" : "danger"}>損益 {money(lastSettlement.profit)}</strong></div></div>}<div className="logList">{log.map((item, index) => <div className={item.type === "alarm" ? "alarmLog" : ""} key={item.id}><span>{item.type === "alarm" ? "ALARM" : index ? `-${index}` : "NOW"}</span><p>{item.message}</p></div>)}</div></section>
      </aside>
    </section>
    <footer><span>FAB STATUS: <b className="online">AUTO RUN / {lots.length ? "PROCESSING" : "IDLE"}</b></span><span>承接多筆訂單 → 自動分流補料 → 湊齊 LOTS → 依平均良率付款</span><span>V0.9 LOCAL</span></footer>
    {toast && <div className="toast">{toast}</div>}
    {guideOpen && <div className="guideOverlay" role="presentation" onClick={() => setGuideOpen(false)}><section className="guidePanel" role="dialog" aria-modal="true" aria-label="玩家製造指南" onClick={(event) => event.stopPropagation()}><button className="guideClose" aria-label="關閉玩家製造指南" onClick={() => setGuideOpen(false)}>×</button><p className="eyebrow">PLAYER RECIPE GUIDE</p><h2>產品製造指南</h2><p>先承接訂單，再依配方購買設備並由 SOURCE 的 OUT 依序接到每一站，最後接入該訂單 OUTPUT。未接好的訂單會顯示 ALARM，但不會停止其他已完成的產線。</p><div className="guideProducts">{products.map((product) => <article key={product.id}><div><span style={{ background: product.color }}>市場 {product.marketTier}</span><b>{product.name}</b><small>{product.customer}・{product.contractType === "permanent" ? "永久訂單" : "短期訂單"}</small></div><p>需求設備：{product.recipe.map((key, index) => `${index + 1}.${getDefinition(key).short}`).join(" → ")}</p><small>設備門檻：{Object.entries(product.requirements).map(([key, level]) => `${getDefinition(key as EquipmentKey).name} LV${level}`).join("、")}</small></article>)}</div><p className="guideNote">含有重複步驟的配方，需在工作區建立對應的連續設備節點與接線；所有成品訂單的最後兩站均為「封裝 → 測試」。</p></section></div>}
  </main>;
}
