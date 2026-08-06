import type { EquipmentKey, ProcessObjectKey, Product } from "../gameCore.ts";

type MarketTier = Product["marketTier"];
type OrderSeed = Omit<Product, "requirements"> & { requirements?: Partial<Record<EquipmentKey, number>> };

const requirementsFor = (recipe: EquipmentKey[], overrides: Partial<Record<EquipmentKey, number>> = {}) => recipe.reduce<Partial<Record<EquipmentKey, number>>>((requirements, key) => ({ ...requirements, [key]: Math.max(requirements[key] ?? 0, overrides[key] ?? 1) }), {});
const order = (seed: OrderSeed): Product => ({ ...seed, requirements: requirementsFor(seed.recipe, seed.requirements) });

const clean = ["silicon-wafer", "clean-wafer"] as ProcessObjectKey[];
const diffuse = [...clean, "doped-wafer"] as ProcessObjectKey[];
const photo = [...clean, "patterned-wafer"] as ProcessObjectKey[];
const patterned = [...diffuse, "patterned-wafer"] as ProcessObjectKey[];
const etched = [...patterned, "etched-wafer"] as ProcessObjectKey[];
const packagedDiode = [...etched, "packaged-diode"] as ProcessObjectKey[];
const testedDiode = [...packagedDiode, "tested-diode"] as ProcessObjectKey[];
const loopEtched = [...etched, "clean-wafer", "doped-wafer", "patterned-wafer", "etched-wafer"] as ProcessObjectKey[];
const loopPackaged = [...loopEtched, "packaged-logic"] as ProcessObjectKey[];
const loopTested = [...loopPackaged, "tested-logic"] as ProcessObjectKey[];
const analogEtched = ["silicon-wafer", "clean-wafer", "patterned-wafer", "deposited-wafer", "implanted-wafer", "etched-wafer"] as ProcessObjectKey[];
const analogPackaged = [...analogEtched, "packaged-analog"] as ProcessObjectKey[];
const loopAnalogPackaged = [...analogEtched, "clean-wafer", "patterned-wafer", "deposited-wafer", "implanted-wafer", "etched-wafer", "packaged-analog"] as ProcessObjectKey[];
const loopAnalogTested = [...loopAnalogPackaged, "tested-analog"] as ProcessObjectKey[];
const mcuEtched = ["silicon-wafer", "precision-patterned-wafer", "deposited-wafer", "implanted-wafer", "etched-wafer"] as ProcessObjectKey[];
const mcuTested = [...mcuEtched, "packaged-mcu", "tested-mcu"] as ProcessObjectKey[];
const loopMcuTested = [...mcuEtched, "clean-wafer", "precision-patterned-wafer", "deposited-wafer", "implanted-wafer", "etched-wafer", "clean-wafer", "precision-patterned-wafer", "deposited-wafer", "implanted-wafer", "etched-wafer", "packaged-mcu", "tested-mcu"] as ProcessObjectKey[];

const tierColor: Record<MarketTier, string> = { 1: "#5ee8c5", 2: "#f5d463", 3: "#5bb6ff", 4: "#aa7cff", 5: "#ffd34d" };
const long = "permanent" as const;
const short = "limited" as const;

export const orderCatalog: Product[] = [
  // 市場 1：只需要清洗，讓新工廠先建立能賺錢的第一條產線。
  order({ id: "cleaned-lab", name: "實驗級潔淨晶圓", customer: "材料分析實驗室", description: "清洗站出貨・長期供應", minYield: 95, baseYield: 97.5, materialCost: 120, diesPerLot: 25, unitPrice: 24, color: tierColor[1], recipe: ["clean"], objects: clean, contractType: long, requiredLots: 2, marketTier: 1 }),
  order({ id: "cleaned-basic", name: "基礎清洗晶圓", customer: "在地元件廠", description: "低規格・長期供應", minYield: 88, baseYield: 94, materialCost: 85, diesPerLot: 25, unitPrice: 16, color: "#8bc7b4", recipe: ["clean"], objects: clean, contractType: long, requiredLots: 3, marketTier: 1 }),
  order({ id: "cleaned-optics", name: "光學級潔淨晶圓", customer: "精密光學中心", description: "高潔淨度・短期委託", minYield: 97, baseYield: 98.1, materialCost: 140, diesPerLot: 25, unitPrice: 30, color: "#8ff0dd", recipe: ["clean"], objects: clean, contractType: short, requiredLots: 2, contractRuns: 3, marketTier: 1 }),
  order({ id: "cleaned-sensor", name: "感測器潔淨晶圓", customer: "微感測研究所", description: "研究用料・小量訂單", minYield: 96, baseYield: 97.8, materialCost: 150, diesPerLot: 25, unitPrice: 28, color: "#66d8c0", recipe: ["clean"], objects: clean, contractType: short, requiredLots: 3, contractRuns: 3, marketTier: 1 }),
  order({ id: "cleaned-medical", name: "醫材實驗晶圓", customer: "生醫研發中心", description: "少量高酬勞・短期訂單", minYield: 96, baseYield: 97.4, materialCost: 155, diesPerLot: 25, unitPrice: 34, color: "#9aecd8", recipe: ["clean"], objects: clean, contractType: short, requiredLots: 2, contractRuns: 2, marketTier: 1 }),
  order({ id: "cleaned-volume", name: "基板前處理晶圓", customer: "封裝材料廠", description: "大量需求・長期供應", minYield: 86, baseYield: 93, materialCost: 75, diesPerLot: 25, unitPrice: 15, color: "#7ccfbd", recipe: ["clean"], objects: clean, contractType: long, requiredLots: 5, marketTier: 1 }),

  // 市場 2：擴散或光罩即可出貨，開始讓玩家自由選擇設備投資方向。
  order({ id: "diffused-standard", name: "摻雜基礎晶圓", customer: "分離元件廠", description: "清洗→擴散・長期供應", minYield: 86, baseYield: 93, materialCost: 230, diesPerLot: 200, unitPrice: 6, color: tierColor[2], recipe: ["clean", "furnace"], objects: diffuse, contractType: long, requiredLots: 4, marketTier: 2 }),
  order({ id: "diffused-solar", name: "太陽能擴散晶圓", customer: "日照能源", description: "擴散規格・專案訂單", minYield: 89, baseYield: 94, materialCost: 270, diesPerLot: 200, unitPrice: 7.5, color: "#ffd166", recipe: ["clean", "furnace"], objects: diffuse, contractType: short, requiredLots: 3, contractRuns: 3, marketTier: 2 }),
  order({ id: "diffused-power", name: "功率元件擴散片", customer: "動力控制公司", description: "耐壓前段・長期供應", minYield: 84, baseYield: 92, materialCost: 240, diesPerLot: 200, unitPrice: 6.8, color: "#f5b45a", recipe: ["clean", "furnace"], objects: diffuse, contractType: long, requiredLots: 5, marketTier: 2 }),
  order({ id: "photo-mask", name: "光罩校正晶圓", customer: "微影服務中心", description: "清洗→光罩・短期委託", minYield: 90, baseYield: 94, materialCost: 250, diesPerLot: 180, unitPrice: 8, color: "#f5d463", recipe: ["clean", "aligner"], objects: photo, contractType: short, requiredLots: 2, contractRuns: 3, marketTier: 2 }),
  order({ id: "photo-sensor", name: "感測圖形晶圓", customer: "智慧儀器", description: "圖形轉印・長期供應", minYield: 87, baseYield: 93, materialCost: 260, diesPerLot: 180, unitPrice: 7.2, color: "#e7c95e", recipe: ["clean", "aligner"], objects: photo, contractType: long, requiredLots: 4, marketTier: 2 }),
  order({ id: "photo-display", name: "顯示器圖形基板", customer: "顯示材料社", description: "圖形化基板・批量需求", minYield: 85, baseYield: 92, materialCost: 235, diesPerLot: 180, unitPrice: 6.7, color: "#dec45a", recipe: ["clean", "aligner"], objects: photo, contractType: long, requiredLots: 5, marketTier: 2 }),

  // 市場 3：整合擴散、光罩、蝕刻；仍可在晶圓狀態直接出貨。
  order({ id: "patterned-logic", name: "邏輯圖形晶圓", customer: "家電控制廠", description: "擴散→光罩・長期供應", minYield: 88, baseYield: 94, materialCost: 410, diesPerLot: 420, unitPrice: 8.5, color: tierColor[3], recipe: ["clean", "furnace", "aligner"], objects: patterned, contractType: long, requiredLots: 4, marketTier: 3 }),
  order({ id: "patterned-gate", name: "閘極圖形晶圓", customer: "功率半導體廠", description: "三站前段・短期訂單", minYield: 91, baseYield: 95, materialCost: 460, diesPerLot: 420, unitPrice: 10, color: "#72bfff", recipe: ["clean", "furnace", "aligner"], objects: patterned, contractType: short, requiredLots: 3, contractRuns: 3, marketTier: 3 }),
  order({ id: "patterned-mems", name: "微機電圖形晶圓", customer: "精密感測所", description: "圖形前段・小量高酬勞", minYield: 93, baseYield: 96, materialCost: 500, diesPerLot: 420, unitPrice: 12, color: "#8acaff", recipe: ["clean", "furnace", "aligner"], objects: patterned, contractType: short, requiredLots: 2, contractRuns: 2, marketTier: 3 }),
  order({ id: "etched-basic", name: "蝕刻元件晶圓", customer: "分離元件廠", description: "完成蝕刻即可出貨", minYield: 84, baseYield: 92, materialCost: 560, diesPerLot: 500, unitPrice: 9, color: "#59adf5", recipe: ["clean", "furnace", "aligner", "etch"], objects: etched, contractType: long, requiredLots: 4, marketTier: 3 }),
  order({ id: "etched-sensor", name: "感測結構晶圓", customer: "微感測研究所", description: "蝕刻結構・專案訂單", minYield: 89, baseYield: 94, materialCost: 620, diesPerLot: 500, unitPrice: 11, color: "#6abaff", recipe: ["clean", "furnace", "aligner", "etch"], objects: etched, contractType: short, requiredLots: 3, contractRuns: 3, marketTier: 3 }),
  order({ id: "etched-power", name: "功率溝槽晶圓", customer: "工業電控", description: "蝕刻完成・長期量產", minYield: 82, baseYield: 91, materialCost: 580, diesPerLot: 500, unitPrice: 8.4, color: "#4ca7e8", recipe: ["clean", "furnace", "aligner", "etch"], objects: etched, contractType: long, requiredLots: 6, marketTier: 3 }),

  // 市場 4：可在封裝後直接交貨，測試改為提升報酬與進一步訂單的選項。
  order({ id: "package-diode", name: "封裝整流二極體", customer: "民生電機", description: "封裝完成即可發包", minYield: 80, baseYield: 91, materialCost: 900, diesPerLot: 800, unitPrice: 9.5, color: tierColor[4], recipe: ["clean", "furnace", "aligner", "etch", "package"], objects: packagedDiode, contractType: long, requiredLots: 5, marketTier: 4 }),
  order({ id: "package-solar", name: "封裝太陽能二極體", customer: "日照能源", description: "封裝出貨・短期高單價", minYield: 84, baseYield: 93, materialCost: 980, diesPerLot: 800, unitPrice: 11.5, color: "#c9a0ff", recipe: ["clean", "furnace", "aligner", "etch", "package"], objects: packagedDiode, contractType: short, requiredLots: 3, contractRuns: 3, marketTier: 4 }),
  order({ id: "package-motor", name: "馬達保護模組", customer: "動力控制公司", description: "封裝交貨・長期供應", minYield: 82, baseYield: 92, materialCost: 940, diesPerLot: 800, unitPrice: 10.2, color: "#b38aff", recipe: ["clean", "furnace", "aligner", "etch", "package"], objects: packagedDiode, contractType: long, requiredLots: 5, marketTier: 4 }),
  order({ id: "tested-diode", name: "合格整流二極體", customer: "電源供應商", description: "封裝→測試・品質保證", minYield: 87, baseYield: 93, materialCost: 1050, diesPerLot: 800, unitPrice: 12.5, color: "#9f7ce9", recipe: ["clean", "furnace", "aligner", "etch", "package", "test"], objects: testedDiode, contractType: long, requiredLots: 4, marketTier: 4 }),
  order({ id: "tested-rail", name: "軌道用保護二極體", customer: "軌道電控系統", description: "全製程測試・限定專案", minYield: 91, baseYield: 95, materialCost: 1150, diesPerLot: 800, unitPrice: 15, color: "#c4a3ff", recipe: ["clean", "furnace", "aligner", "etch", "package", "test"], objects: testedDiode, contractType: short, requiredLots: 2, contractRuns: 3, marketTier: 4 }),
  order({ id: "analog-package", name: "封裝類比驅動晶片", customer: "聲學電子", description: "薄膜前段→封裝發包", minYield: 86, baseYield: 92, materialCost: 2100, diesPerLot: 900, unitPrice: 18, color: "#b996ff", recipe: ["clean", "aligner", "deposition", "implant", "etch", "package"], objects: analogPackaged, contractType: long, requiredLots: 3, marketTier: 4, requirements: { deposition: 1, implant: 1 } }),

  // 市場 5：多輪清洗、微影、蝕刻與先進製程，需配置重複的設備節點。
  order({ id: "loop-etched-logic", name: "雙輪蝕刻邏輯晶圓", customer: "智慧家電控制", description: "清洗→蝕刻循環 2 次・晶圓出貨", minYield: 88, baseYield: 94, materialCost: 1500, diesPerLot: 850, unitPrice: 17, color: tierColor[5], recipe: ["clean", "furnace", "aligner", "etch", "clean", "furnace", "aligner", "etch"], objects: loopEtched, contractType: long, requiredLots: 3, marketTier: 5, requirements: { clean: 2, furnace: 2, aligner: 2, etch: 2 } }),
  order({ id: "loop-package-logic", name: "雙層邏輯控制晶片", customer: "智慧電網系統", description: "雙重微影→封裝直接發包", minYield: 90, baseYield: 94.5, materialCost: 1900, diesPerLot: 850, unitPrice: 22, color: "#ffd86a", recipe: ["clean", "furnace", "aligner", "etch", "clean", "furnace", "aligner", "etch", "package"], objects: loopPackaged, contractType: long, requiredLots: 3, marketTier: 5, requirements: { clean: 2, furnace: 2, aligner: 2, etch: 2, package: 2 } }),
  order({ id: "loop-tested-logic", name: "雙層邏輯測試晶片", customer: "工業通訊科技", description: "雙重微影→封裝→測試", minYield: 93, baseYield: 96, materialCost: 2200, diesPerLot: 850, unitPrice: 27, color: "#ffe184", recipe: ["clean", "furnace", "aligner", "etch", "clean", "furnace", "aligner", "etch", "package", "test"], objects: loopTested, contractType: short, requiredLots: 2, contractRuns: 3, marketTier: 5, requirements: { clean: 2, furnace: 2, aligner: 2, etch: 2, package: 2, test: 2 } }),
  order({ id: "loop-analog-package", name: "雙層電源管理晶片", customer: "儲能控制科技", description: "薄膜製程循環 2 次・封裝出貨", minYield: 89, baseYield: 93, materialCost: 3400, diesPerLot: 900, unitPrice: 36, color: "#f5c553", recipe: ["clean", "aligner", "deposition", "implant", "etch", "clean", "aligner", "deposition", "implant", "etch", "package"], objects: loopAnalogPackaged, contractType: long, requiredLots: 3, marketTier: 5, requirements: { clean: 2, aligner: 2, deposition: 2, implant: 2, etch: 2, package: 2 } }),
  order({ id: "loop-analog-tested", name: "雙層類比測試晶片", customer: "智慧儀器", description: "雙輪薄膜→封裝→測試", minYield: 92, baseYield: 95, materialCost: 3900, diesPerLot: 900, unitPrice: 43, color: "#f7d96d", recipe: ["clean", "aligner", "deposition", "implant", "etch", "clean", "aligner", "deposition", "implant", "etch", "package", "test"], objects: loopAnalogTested, contractType: short, requiredLots: 2, contractRuns: 3, marketTier: 5, requirements: { clean: 2, aligner: 2, deposition: 2, implant: 2, etch: 2, package: 2, test: 2 } }),
  order({ id: "mcu-edge", name: "低功耗微控制器", customer: "邊緣系統", description: "精密曝光→封裝→測試", minYield: 91, baseYield: 94, materialCost: 4800, diesPerLot: 1000, unitPrice: 39, color: "#f4cc56", recipe: ["stepper", "deposition", "implant", "etch", "package", "test"], objects: mcuTested, contractType: long, requiredLots: 3, marketTier: 5, requirements: { stepper: 2, deposition: 2, implant: 2, etch: 2, package: 2, test: 2 } }),
  order({ id: "mcu-triple-layer", name: "三層工控微控制器", customer: "工業邊緣運算", description: "三重精密微影循環・長期供應", minYield: 94, baseYield: 96, materialCost: 9000, diesPerLot: 1000, unitPrice: 78, color: "#ffe999", recipe: ["stepper", "deposition", "implant", "etch", "clean", "stepper", "deposition", "implant", "etch", "clean", "stepper", "deposition", "implant", "etch", "package", "test"], objects: loopMcuTested, contractType: long, requiredLots: 2, marketTier: 5, requirements: { clean: 3, stepper: 3, deposition: 3, implant: 3, etch: 3, package: 3, test: 3 } }),
  order({ id: "mcu-auto", name: "車用安全控制器", customer: "智慧車電", description: "高良率三層循環・限定批次", minYield: 96, baseYield: 97, materialCost: 10500, diesPerLot: 1000, unitPrice: 94, color: "#fff0ae", recipe: ["stepper", "deposition", "implant", "etch", "clean", "stepper", "deposition", "implant", "etch", "clean", "stepper", "deposition", "implant", "etch", "package", "test"], objects: loopMcuTested, contractType: short, requiredLots: 2, contractRuns: 2, marketTier: 5, requirements: { clean: 4, stepper: 4, deposition: 4, implant: 4, etch: 4, package: 4, test: 4 } }),
];
