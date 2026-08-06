import { orderCatalog } from "./orders/catalog.ts";

export type EquipmentKey = "clean" | "furnace" | "aligner" | "etch" | "deposition" | "implant" | "package" | "test" | "stepper";
export type ProcessObjectKey = "silicon-wafer" | "clean-wafer" | "doped-wafer" | "patterned-wafer" | "precision-patterned-wafer" | "deposited-wafer" | "implanted-wafer" | "etched-wafer" | "packaged-diode" | "packaged-logic" | "packaged-analog" | "packaged-mcu" | "tested-diode" | "tested-logic" | "tested-analog" | "tested-mcu";
export type ContractType = "permanent" | "limited";
export type EquipmentMode = "batch" | "serial" | "parallel";

export type Product = {
  id: string;
  name: string;
  customer: string;
  description: string;
  minYield: number;
  baseYield: number;
  materialCost: number;
  diesPerLot: number;
  unitPrice: number;
  color: string;
  recipe: EquipmentKey[];
  objects: ProcessObjectKey[];
  requirements: Partial<Record<EquipmentKey, number>>;
  contractType: ContractType;
  requiredLots: number;
  contractRuns?: number;
  marketTier: 1 | 2 | 3 | 4;
};

export type MarketOrder = Product & {
  offerId: string;
  contractsRemaining: number | null;
};

export type EquipmentUnit = {
  id: string;
  key: EquipmentKey;
  level: number;
  purchaseCost: number;
};

export type ProductionLot = {
  id: number;
  offerId: string;
  productId: string;
  step: number;
  progress: number;
  yield: number;
  targetYield: number;
  spent: number;
  machineId?: string;
  machineLevel?: number;
  outputSlot?: number;
};

export type DeliveredLot = {
  lotId: number;
  yield: number;
  goodDies: number;
  baseRevenue: number;
  spent: number;
};

export const processObjects: Record<ProcessObjectKey, { name: string; code: string; category: "wafer" | "package" | "product" }> = {
  "silicon-wafer": { name: "矽晶圓", code: "SI-WAFER", category: "wafer" },
  "clean-wafer": { name: "潔淨晶圓", code: "CLEAN-WAFER", category: "wafer" },
  "doped-wafer": { name: "摻雜晶圓", code: "DOPED-WAFER", category: "wafer" },
  "patterned-wafer": { name: "圖形化晶圓", code: "PATTERN-WAFER", category: "wafer" },
  "precision-patterned-wafer": { name: "精密圖形晶圓", code: "FINE-PATTERN", category: "wafer" },
  "deposited-wafer": { name: "薄膜晶圓", code: "FILM-WAFER", category: "wafer" },
  "implanted-wafer": { name: "佈植晶圓", code: "IMPLANT-WAFER", category: "wafer" },
  "etched-wafer": { name: "蝕刻晶圓", code: "ETCHED-WAFER", category: "wafer" },
  "packaged-diode": { name: "封裝二極體", code: "PKG-DIODE", category: "package" },
  "packaged-logic": { name: "封裝邏輯晶片", code: "PKG-LOGIC", category: "package" },
  "packaged-analog": { name: "封裝類比晶片", code: "PKG-ANALOG", category: "package" },
  "packaged-mcu": { name: "封裝微控制器", code: "PKG-MCU", category: "package" },
  "tested-diode": { name: "合格整流二極體", code: "GOOD-DIODE", category: "product" },
  "tested-logic": { name: "合格邏輯控制晶片", code: "GOOD-LOGIC", category: "product" },
  "tested-analog": { name: "合格類比控制晶片", code: "GOOD-ANALOG", category: "product" },
  "tested-mcu": { name: "合格微控制器", code: "GOOD-MCU", category: "product" },
};

export type EquipmentDefinition = {
  key: EquipmentKey;
  short: string;
  name: string;
  sub: string;
  baseCost: number;
  upkeep: number;
  tier: number;
  inputPorts: number;
  outputPorts: number;
  mode: EquipmentMode;
  baseCapacity: number;
};

export type EquipmentLevelProfile = {
  mode: EquipmentMode;
  capacity: number;
  speed: number;
  yieldBonus: number;
  upkeepMultiplier: number;
};

export const equipmentDefinitions: EquipmentDefinition[] = [
  { key: "clean", short: "洗", name: "濕式清洗槽", sub: "去除晶圓污染", baseCost: 1200, upkeep: 12, tier: 1, inputPorts: 1, outputPorts: 1, mode: "batch", baseCapacity: 2 },
  { key: "furnace", short: "爐", name: "擴散爐", sub: "氧化與摻雜", baseCost: 1600, upkeep: 18, tier: 1, inputPorts: 2, outputPorts: 1, mode: "batch", baseCapacity: 3 },
  { key: "aligner", short: "光", name: "光罩對準機", sub: "基礎圖形轉印", baseCost: 1800, upkeep: 16, tier: 1, inputPorts: 1, outputPorts: 1, mode: "serial", baseCapacity: 1 },
  { key: "etch", short: "蝕", name: "濕式蝕刻槽", sub: "移除指定薄膜", baseCost: 1400, upkeep: 14, tier: 1, inputPorts: 2, outputPorts: 1, mode: "batch", baseCapacity: 2 },
  { key: "package", short: "封", name: "打線封裝機", sub: "切割、打線與封裝", baseCost: 1200, upkeep: 12, tier: 1, inputPorts: 1, outputPorts: 2, mode: "parallel", baseCapacity: 2 },
  { key: "test", short: "測", name: "基礎測試機", sub: "電性測試與分級", baseCost: 900, upkeep: 10, tier: 1, inputPorts: 2, outputPorts: 2, mode: "parallel", baseCapacity: 2 },
  { key: "deposition", short: "鍍", name: "薄膜沉積機", sub: "精密介電與金屬薄膜", baseCost: 6500, upkeep: 42, tier: 2, inputPorts: 2, outputPorts: 1, mode: "serial", baseCapacity: 1 },
  { key: "implant", short: "植", name: "離子佈植機", sub: "精準控制元件電性", baseCost: 8200, upkeep: 55, tier: 2, inputPorts: 1, outputPorts: 1, mode: "serial", baseCapacity: 1 },
  { key: "stepper", short: "曝", name: "精密步進曝光機", sub: "多層積體電路微影", baseCost: 24000, upkeep: 125, tier: 3, inputPorts: 2, outputPorts: 2, mode: "serial", baseCapacity: 1 },
];

export const products = orderCatalog;
export const maxEquipmentLevel = 7;
export const maxSourceLevel = 10;

export const initialEquipment: Record<EquipmentKey, number> = {
  clean: 0, furnace: 0, aligner: 0, etch: 0, deposition: 0, implant: 0, package: 0, test: 0, stepper: 0,
};

export const initialTechnology: Record<EquipmentKey, number> = {
  clean: 1, furnace: 1, aligner: 1, etch: 1, deposition: 1, implant: 1, package: 1, test: 1, stepper: 1,
};

export function equipmentPurchasePrice(definition: EquipmentDefinition, level: number) {
  return Math.round(definition.baseCost * (0.72 + Math.max(0, level - 1) * 0.48));
}

export function equipmentResearchPrice(definition: EquipmentDefinition, currentLevel: number) {
  if (currentLevel >= maxEquipmentLevel) return 0;
  return Math.round(definition.baseCost * (0.4 + Math.max(0, currentLevel - 1) * 0.25));
}

export function purchasableEquipmentLevels(technologyLevel: number) {
  return Array.from({ length: Math.max(0, Math.min(maxEquipmentLevel, technologyLevel)) }, (_, index) => index + 1);
}

export function equipmentResaleValue(purchaseCost: number) {
  return Math.round(purchaseCost * 0.45);
}

export function equipmentLevelClass(level: number) {
  if (level >= maxEquipmentLevel) return "level-max";
  return level > 0 ? `level-${level}` : "level-none";
}

export function equipmentLevelName(level: number) {
  return level >= maxEquipmentLevel ? "MAX" : level > 0 ? `LV${level}` : "未安裝";
}

export function sourceOutputCount(level: number) {
  return [1, 2, 2, 2, 2, 3, 3, 3, 4, 5][Math.max(0, Math.min(maxSourceLevel - 1, Math.floor(level) - 1))] ?? 1;
}

export function sourceSupplyIntervalMs(level: number) {
  return [5000, 5000, 4000, 3000, 3000, 2000, 1500, 1500, 1000, 1000][Math.max(0, Math.min(maxSourceLevel - 1, Math.floor(level) - 1))] ?? 5000;
}

export function sourceUpgradePrice(level: number) {
  return [0, 300, 450, 600, 800, 1050, 1350, 1700, 2100, 2600][Math.max(0, Math.min(maxSourceLevel - 1, level))] ?? 0;
}

export function sourceLevelClass(level: number) {
  if (level >= 7) return "level-max";
  return equipmentLevelClass(level);
}

export function sourceLevelName(level: number) {
  return level >= maxSourceLevel ? "MAX" : `LV${Math.max(1, Math.floor(level))}`;
}

export function sourcePurchasePrice(sourceCount: number) {
  return 2400 + Math.max(0, sourceCount - 1) * 800;
}

export function canPurchaseSource(sourceLevels: number[]) {
  return sourceLevels.length > 0 && sourceLevels.every((level) => level >= maxSourceLevel);
}

export function orderTerminationFee(product: Product) {
  return Math.max(60, Math.round(product.materialCost * product.requiredLots * 0.2));
}

const capacityByLevel: Record<EquipmentKey, number[]> = {
  clean: [1, 2, 3, 4, 5, 6, 8],
  furnace: [1, 2, 3, 4, 5, 6, 7],
  aligner: [1, 1, 2, 2, 3, 3, 4],
  etch: [1, 2, 3, 3, 4, 5, 6],
  deposition: [1, 1, 2, 2, 3, 3, 4],
  implant: [1, 1, 1, 2, 2, 3, 3],
  package: [1, 2, 3, 4, 5, 6, 7],
  test: [1, 2, 3, 4, 5, 6, 8],
  stepper: [1, 1, 1, 2, 2, 2, 3],
};

function modeForLevel(key: EquipmentKey, level: number): EquipmentMode {
  if (key === "clean" || key === "etch" || key === "furnace") return level === 1 ? "serial" : "batch";
  if (key === "package" || key === "test") return level <= 2 ? "serial" : "parallel";
  if (key === "aligner") return level >= 5 ? "parallel" : "serial";
  if (key === "deposition" || key === "implant" || key === "stepper") return level >= 6 ? "parallel" : "serial";
  return "serial";
}

export function equipmentLevelProfile(definition: EquipmentDefinition, level: number): EquipmentLevelProfile {
  if (level <= 0) return { mode: "serial", capacity: 0, speed: 0, yieldBonus: 0, upkeepMultiplier: 0 };
  const normalized = Math.max(1, Math.min(maxEquipmentLevel, level));
  const baseSpeed = definition.mode === "batch" ? 31 : definition.mode === "parallel" ? 34 : 29;
  const precisionBonus = definition.key === "stepper" || definition.key === "implant" ? 0.18 : 0;
  return {
    mode: modeForLevel(definition.key, normalized),
    capacity: capacityByLevel[definition.key][normalized - 1],
    speed: baseSpeed + (normalized - 1) * (5.2 + precisionBonus * 10),
    yieldBonus: (normalized - 1) * (0.68 + precisionBonus),
    upkeepMultiplier: 0.68 + (normalized - 1) * 0.19,
  };
}

export function equipmentOutputCount(definition: EquipmentDefinition, level: number) {
  return definition.outputPorts + Math.floor(Math.max(0, level - 1) / 2);
}

export function productionOutputSlot(lotId: number, outputCount: number) {
  return Math.max(0, (lotId - 1) % Math.max(1, outputCount));
}

export function equipmentCapacity(definition: EquipmentDefinition, level: number) {
  return equipmentLevelProfile(definition, level).capacity;
}

export function equipmentModeName(mode: EquipmentMode) {
  return mode === "batch" ? "同步批次" : mode === "parallel" ? "平行機台" : "單批排隊";
}

export function fleetBestLevels(units: EquipmentUnit[]) {
  const levels = { ...initialEquipment };
  units.forEach((unit) => { levels[unit.key] = Math.max(levels[unit.key], unit.level); });
  return levels;
}

export function missingRequirements(product: Product, equipment: Record<EquipmentKey, number> | EquipmentUnit[]) {
  const levels = Array.isArray(equipment) ? fleetBestLevels(equipment) : equipment;
  return Object.entries(product.requirements)
    .filter(([key, level]) => levels[key as EquipmentKey] < (level ?? 0))
    .map(([key, level]) => ({ key: key as EquipmentKey, level: level ?? 0 }));
}

export function projectedYield(product: Product, equipment: Record<EquipmentKey, number> | EquipmentUnit[], quality: number) {
  const levels = Array.isArray(equipment) ? fleetBestLevels(equipment) : equipment;
  const yieldBonus = product.recipe.reduce((sum, key) => sum + equipmentLevelProfile(equipmentDefinitions.find((item) => item.key === key)!, levels[key]).yieldBonus, 0) / product.recipe.length;
  const value = product.baseYield + (quality - 50) * 0.055 + yieldBonus;
  return Math.max(55, Math.min(98.8, value));
}

export function factoryMarketTier(units: EquipmentUnit[]) {
  if (!units.length) return 1;
  const installed = new Set(units.map((unit) => unit.key));
  const averageLevel = units.reduce((sum, unit) => sum + unit.level, 0) / units.length;
  const basicLine: EquipmentKey[] = ["clean", "furnace", "aligner", "etch", "package", "test"];
  if (installed.has("stepper") && averageLevel >= 2) return 4;
  if (installed.has("deposition") && installed.has("implant") && averageLevel >= 1.2) return 3;
  if (basicLine.every((key) => installed.has(key)) && averageLevel >= 1) return 2;
  return 1;
}

export function createMarketOrder(product: Product, sequence: number): MarketOrder {
  return {
    ...product,
    offerId: `offer-${sequence}-${product.id}`,
    contractsRemaining: product.contractType === "limited" ? product.contractRuns ?? 1 : null,
  };
}

export function createInitialMarket(catalog: Product[] = products, count = 6) {
  return catalog.slice(0, count).map((product, index) => createMarketOrder(product, index + 1));
}

export function marketRefreshCost(refreshCount: number) {
  return 150 * Math.pow(refreshCount + 1, 2);
}

export function planProduction(lots: ProductionLot[], units: EquipmentUnit[], catalog: Product[] = products) {
  const assignments: { lotId: number; unitId: string; level: number; key: EquipmentKey }[] = [];
  const queuedIds: number[] = [];

  equipmentDefinitions.forEach((definition) => {
    const stationLots = lots
      .filter((lot) => catalog.find((product) => product.id === lot.productId)?.recipe[lot.step] === definition.key)
      .sort((a, b) => a.id - b.id);
    if (!stationLots.length) return;

    const stationUnits = units.filter((unit) => unit.key === definition.key).sort((a, b) => b.level - a.level || a.id.localeCompare(b.id));
    const assignedLots = new Set<number>();

    stationUnits.forEach((unit) => {
      const profile = equipmentLevelProfile(definition, unit.level);
      const capacity = profile.capacity;
      const processing = stationLots.filter((lot) => lot.machineId === unit.id && lot.progress > 0 && !assignedLots.has(lot.id));
      const waiting = stationLots.filter((lot) => !assignedLots.has(lot.id) && (!lot.machineId || !stationUnits.some((item) => item.id === lot.machineId)) && lot.progress <= 0);
      const active = profile.mode === "batch"
        ? (processing.length ? processing : waiting.slice(0, capacity))
        : [...processing.slice(0, capacity), ...waiting.slice(0, Math.max(0, capacity - processing.length))];
      active.forEach((lot) => {
        assignedLots.add(lot.id);
        assignments.push({ lotId: lot.id, unitId: unit.id, level: unit.level, key: definition.key });
      });
    });

    queuedIds.push(...stationLots.filter((lot) => !assignedLots.has(lot.id)).map((lot) => lot.id));
  });

  return { activeIds: assignments.map((item) => item.lotId), queuedIds, assignments };
}

export function productionSpeed(key: EquipmentKey, level: number, quality: number) {
  const definition = equipmentDefinitions.find((item) => item.key === key)!;
  return Math.max(18, equipmentLevelProfile(definition, level).speed - quality * 0.11);
}

export function activeDayCost(lots: ProductionLot[], units: EquipmentUnit[], catalog: Product[] = products) {
  const plan = planProduction(lots, units, catalog);
  if (!plan.activeIds.length) return 0;
  const activeUnitIds = new Set(plan.assignments.map((assignment) => assignment.unitId));
  const machineCost = units.filter((unit) => activeUnitIds.has(unit.id)).reduce((sum, unit) => {
    const definition = equipmentDefinitions.find((item) => item.key === unit.key)!;
    return sum + Math.round(definition.upkeep * equipmentLevelProfile(definition, unit.level).upkeepMultiplier);
  }, 0);
  return 20 + machineCost + plan.activeIds.length * 8;
}

export function advanceProductionDay(lots: ProductionLot[], units: EquipmentUnit[], quality: number, catalog: Product[] = products, random: () => number = Math.random) {
  const plan = planProduction(lots, units, catalog);
  const assignmentMap = new Map(plan.assignments.map((assignment) => [assignment.lotId, assignment]));
  const dayCost = activeDayCost(lots, units, catalog);
  const perActiveLotCost = plan.activeIds.length ? dayCost / plan.activeIds.length : 0;
  const completed: ProductionLot[] = [];

  const nextLots = lots.flatMap((lot) => {
    const assignment = assignmentMap.get(lot.id);
    if (!assignment) return [lot];
    const product = catalog.find((item) => item.id === lot.productId)!;
    const progress = lot.progress + productionSpeed(assignment.key, assignment.level, quality);
    const spent = lot.spent + perActiveLotCost;
    if (progress < 100) return [{ ...lot, progress, spent, machineId: assignment.unitId, machineLevel: assignment.level }];
    const remainingSteps = product.recipe.length - lot.step;
    const definition = equipmentDefinitions.find((item) => item.key === assignment.key)!;
    const effectiveTarget = Math.min(99.2, lot.targetYield + equipmentLevelProfile(definition, assignment.level).yieldBonus);
    const nextYield = Math.max(45, lot.yield - Math.max(0.03, (lot.yield - effectiveTarget) / remainingSteps) - random() * 0.14);
    const outputSlot = productionOutputSlot(lot.id, equipmentOutputCount(definition, assignment.level));
    if (lot.step < product.recipe.length - 1) return [{ ...lot, step: lot.step + 1, progress: 0, yield: nextYield, spent, machineId: undefined, machineLevel: undefined, outputSlot }];
    completed.push({ ...lot, progress: 100, yield: nextYield, spent, machineId: assignment.unitId, machineLevel: assignment.level, outputSlot });
    return [];
  });

  return { nextLots, completed, dayCost, ...plan };
}

export function lotRevenue(product: Product, finalYield: number) {
  const goodDies = Math.floor(product.diesPerLot * finalYield / 100);
  return { goodDies, revenue: Math.round(goodDies * product.unitPrice) };
}

export function yieldPriceMultiplier(averageYield: number, targetYield: number) {
  return Math.max(0.55, Math.min(1.35, 1 + (averageYield - targetYield) * 0.035));
}

export function calculateOrderPayment(product: Product, deliveredLots: DeliveredLot[]) {
  const averageYield = deliveredLots.reduce((sum, lot) => sum + lot.yield, 0) / deliveredLots.length;
  const baseRevenue = deliveredLots.reduce((sum, lot) => sum + lot.baseRevenue, 0);
  const totalSpent = deliveredLots.reduce((sum, lot) => sum + lot.spent, 0);
  const multiplier = yieldPriceMultiplier(averageYield, product.minYield);
  const payout = Math.round(baseRevenue * multiplier);
  return {
    averageYield: Number(averageYield.toFixed(1)),
    baseRevenue,
    multiplier,
    payout,
    totalSpent: Math.round(totalSpent),
    profit: payout - Math.round(totalSpent),
  };
}
