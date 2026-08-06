import assert from "node:assert/strict";
import test from "node:test";
import {
  activeDayCost,
  advanceProductionDay,
  calculateOrderPayment,
  canStageOrderLot,
  createInitialMarket,
  equipmentLevelClass,
  equipmentPurchasePrice,
  equipmentResaleValue,
  equipmentResearchPrice,
  equipmentDefinitions,
  equipmentLevelProfile,
  equipmentOutputCount,
  fleetBestLevels,
  factoryMarketTier,
  initialEquipment,
  initialTechnology,
  lotRevenue,
  marketRefreshCost,
  marketUpgradePrice,
  maxMarketTier,
  planProduction,
  productionOutputSlot,
  purchasableEquipmentLevels,
  processObjects,
  products,
  sourceOutputCount,
  sourceLevelClass,
  sourceLevelName,
  sourcePurchasePrice,
  sourceSupplyIntervalMs,
  sampleEquipmentYield,
  canPurchaseSource,
  orderTerminationFee,
  yieldPriceMultiplier,
  type EquipmentUnit,
  type ProductionLot,
} from "../app/gameCore.ts";

test("idle factory has no operating cost", () => {
  assert.equal(activeDayCost([], []), 0);
});

test("starter product makes money when its minimum yield is met", () => {
  const product = products[0];
  const { revenue } = lotRevenue(product, product.minYield);
  const conservativeOperatingCost = 3 * 40;
  assert.ok(revenue > product.materialCost + conservativeOperatingCost);
});

test("higher-tier products have larger material cost and revenue", () => {
  const starter = products[0];
  const advanced = products[products.length - 1];
  assert.ok(advanced.materialCost > starter.materialCost);
  assert.ok(lotRevenue(advanced, advanced.minYield).revenue > lotRevenue(starter, starter.minYield).revenue);
});

test("new game starts with no production equipment and a one-step cleaning order", () => {
  assert.ok(Object.values(initialEquipment).every((level) => level === 0));
  assert.ok(Object.values(initialTechnology).every((level) => level === 1));
  assert.deepEqual(products[0].recipe, ["clean"]);
  assert.deepEqual(products[0].objects, ["silicon-wafer", "clean-wafer"]);
});

test("every recipe starts with silicon wafer and defines one object per interface", () => {
  products.forEach((product) => {
    assert.equal(product.objects[0], "silicon-wafer");
    assert.equal(product.objects.length, product.recipe.length + 1);
    product.objects.forEach((key) => assert.ok(processObjects[key]));
  });
});

test("order outputs accept the declared result instead of raw silicon wafer", () => {
  products.forEach((product) => {
    const outputKey = product.objects[product.objects.length - 1];
    assert.notEqual(outputKey, "silicon-wafer");
    assert.ok(processObjects[outputKey]);
  });
});

test("advanced catalog includes repeated process loops and varied shipment stages", () => {
  const repeated = products.filter((product) => new Set(product.recipe).size < product.recipe.length);
  assert.ok(repeated.length >= 7);
  assert.ok(repeated.some((product) => product.recipe.at(-1) === "etch"));
  assert.ok(repeated.some((product) => product.recipe.at(-1) === "package"));
  assert.ok(repeated.some((product) => product.recipe.at(-1) === "test"));
  repeated.forEach((product) => assert.ok(processObjects[product.objects.at(-1)!]));
  assert.ok(products.some((product) => product.id === "loop-tested-logic"));
  assert.ok(products.some((product) => product.id === "loop-analog-tested"));
  assert.ok(products.some((product) => product.id === "mcu-triple-layer"));
});

test("equipment levels use the requested seven-color sequence", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(equipmentLevelClass), [
    "level-1", "level-2", "level-3", "level-4", "level-5", "level-6", "level-max",
  ]);
});

test("SOURCE uses its independent ten-level output and supply schedule", () => {
  assert.deepEqual(Array.from({ length: 10 }, (_, index) => index + 1).map(sourceOutputCount), [1, 2, 2, 2, 2, 3, 3, 3, 4, 5]);
  assert.deepEqual(Array.from({ length: 10 }, (_, index) => index + 1).map(sourceSupplyIntervalMs), [5000, 5000, 4000, 3000, 3000, 2000, 1500, 1500, 1000, 1000]);
  assert.equal(sourceLevelName(9), "LV9");
  assert.equal(sourceLevelName(10), "MAX");
  assert.equal(sourceLevelClass(7), "level-max");
});

test("a new SOURCE requires every installed SOURCE to reach MAX", () => {
  assert.equal(canPurchaseSource([10]), true);
  assert.equal(canPurchaseSource([10, 10]), true);
  assert.equal(canPurchaseSource([10, 9]), false);
  assert.ok(sourcePurchasePrice(2) > sourcePurchasePrice(1));
});

test("order cancellation carries a bounded termination fee", () => {
  assert.ok(orderTerminationFee(products[0]) >= 60);
  assert.ok(orderTerminationFee(products[products.length - 1]) > orderTerminationFee(products[0]));
});

test("market starts with six low-tier orders and supports permanent and limited contracts", () => {
  const market = createInitialMarket(products.filter((product) => product.marketTier === 1), 6);
  assert.equal(market.length, 6);
  assert.ok(market.every((order) => order.marketTier === 1));
  assert.ok(market.some((order) => order.contractsRemaining === null));
  assert.ok(market.some((order) => (order.contractsRemaining ?? 0) > 0));
  assert.ok(marketRefreshCost(2) > marketRefreshCost(1));
});

test("automatic supply stages at most one order payment at a time", () => {
  const permanent = createInitialMarket(products.filter((product) => product.contractType === "permanent"), 1)[0];
  const limited = createInitialMarket(products.filter((product) => product.contractType === "limited"), 1)[0];
  assert.equal(canStageOrderLot(permanent, 0, permanent.requiredLots - 1), true);
  assert.equal(canStageOrderLot(permanent, 1, permanent.requiredLots - 1), false);
  assert.equal(canStageOrderLot(limited, 0, limited.requiredLots), false);
  assert.equal(canStageOrderLot({ ...limited, contractsRemaining: 0 }, 0, 0), false);
});

test("batch tools process together while excess lots wait", () => {
  const equipment: EquipmentUnit[] = [{ id: "clean-2", key: "clean", level: 2, purchaseCost: 1440 }];
  const lots = [101, 102, 103].map((id) => makeLot(id, products[0].id));
  const plan = planProduction(lots, equipment);
  assert.deepEqual(plan.activeIds, [101, 102]);
  assert.deepEqual(plan.queuedIds, [103]);
});

test("serial tools admit only one lot at a time", () => {
  const diode = products.find((product) => product.recipe.includes("aligner"))!;
  const alignerStep = diode.recipe.indexOf("aligner");
  const equipment: EquipmentUnit[] = [{ id: "aligner-1", key: "aligner", level: 1, purchaseCost: 1800 }];
  const lots = [201, 202, 203].map((id) => makeLot(id, diode.id, alignerStep));
  const plan = planProduction(lots, equipment);
  assert.deepEqual(plan.activeIds, [201]);
  assert.deepEqual(plan.queuedIds, [202, 203]);
});

test("low-generation cleaning is serial and queued lots finish in order", () => {
  const product = products[0];
  const equipment: EquipmentUnit[] = [{ id: "clean-1", key: "clean", level: 1, purchaseCost: 1200 }];
  let lots: ProductionLot[] = [301, 302, 303].map((id) => ({
    id, offerId: "test-offer", productId: product.id, step: 0, progress: 0, yield: 99.5, targetYield: 97.5, spent: product.materialCost,
  }));
  const completionDays: number[] = [];
  let revenue = 0;
  for (let day = 1; day <= 20 && lots.length; day += 1) {
    const result = advanceProductionDay(lots, equipment, 58, products, () => 0);
    result.completed.forEach((lot) => {
      completionDays.push(day);
      revenue += lotRevenue(product, lot.yield).revenue;
    });
    lots = result.nextLots;
  }
  assert.equal(lots.length, 0);
  assert.deepEqual(completionDays, [5, 10, 15]);
  assert.equal(revenue, lotRevenue(product, 97.5).revenue * 3);
});

test("research unlocks a new generation without changing installed old machines", () => {
  const installed: EquipmentUnit[] = [{ id: "clean-old", key: "clean", level: 1, purchaseCost: 1200 }];
  const researched = { ...initialTechnology, clean: 2 };
  assert.equal(researched.clean, 2);
  assert.equal(installed[0].level, 1);
  assert.equal(fleetBestLevels(installed).clean, 1);

  const definition = equipmentDefinitions.find((item) => item.key === "clean")!;
  installed.push({ id: "clean-new", key: "clean", level: 2, purchaseCost: equipmentPurchasePrice(definition, 2) });
  assert.equal(fleetBestLevels(installed).clean, 2);
  assert.ok(equipmentResearchPrice(definition, 1) < equipmentPurchasePrice(definition, 2));
});

test("research raises the purchasing ceiling while old generations remain purchasable", () => {
  assert.deepEqual(purchasableEquipmentLevels(1), [1]);
  assert.deepEqual(purchasableEquipmentLevels(3), [1, 2, 3]);
  const clean = equipmentDefinitions.find((item) => item.key === "clean")!;
  assert.ok(equipmentPurchasePrice(clean, 1) < equipmentPurchasePrice(clean, 3));
});

test("each generation changes the cleaning station's operating profile", () => {
  const clean = equipmentDefinitions.find((item) => item.key === "clean")!;
  const lv1 = equipmentLevelProfile(clean, 1);
  const lv2 = equipmentLevelProfile(clean, 2);
  assert.equal(lv1.mode, "serial");
  assert.equal(lv1.capacity, 1);
  assert.equal(lv2.mode, "batch");
  assert.ok(lv2.capacity > lv1.capacity);
  assert.ok(lv2.speed > lv1.speed);
  assert.ok(lv2.nominalYield > lv1.nominalYield);
  assert.ok(lv2.yieldSigma < lv1.yieldSigma);
  assert.ok(lv2.upkeepMultiplier > lv1.upkeepMultiplier);
});

test("equipment yield centers differ by process and Gaussian samples center on the machine profile", () => {
  const clean = equipmentDefinitions.find((item) => item.key === "clean")!;
  const aligner = equipmentDefinitions.find((item) => item.key === "aligner")!;
  const stepper = equipmentDefinitions.find((item) => item.key === "stepper")!;
  assert.equal(equipmentLevelProfile(clean, 1).nominalYield, 96);
  assert.equal(equipmentLevelProfile(aligner, 1).nominalYield, 86);
  assert.ok(equipmentLevelProfile(stepper, 1).nominalYield < equipmentLevelProfile(aligner, 1).nominalYield);
  assert.ok(equipmentLevelProfile(clean, 1).yieldSigma < equipmentLevelProfile(aligner, 1).yieldSigma);

  let seed = 123456789;
  const random = () => {
    seed = (1664525 * seed + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const samples = Array.from({ length: 12000 }, () => sampleEquipmentYield(aligner, 1, random));
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  assert.ok(Math.abs(mean - 86) < 0.2);
  assert.ok(samples.some((value) => value < 70));
  assert.ok(samples.some((value) => value > 95));
});

test("equipment with multiple OUT ports rotates completed lots evenly", () => {
  const packager = equipmentDefinitions.find((item) => item.key === "package")!;
  const clean = equipmentDefinitions.find((item) => item.key === "clean")!;
  assert.equal(equipmentOutputCount(packager, 1), 2);
  assert.equal(equipmentOutputCount(clean, 3), 2);
  assert.deepEqual([101, 102, 103, 104].map((id) => productionOutputSlot(id, 2)), [0, 1, 0, 1]);
});

test("market tier grows from basic cleaning toward advanced product families", () => {
  assert.equal(factoryMarketTier([]), 1);
  const basicKeys = ["clean", "furnace", "aligner", "etch", "package", "test"] as const;
  const basic: EquipmentUnit[] = basicKeys.map((key, index) => ({ id: `basic-${index}`, key, level: 1, purchaseCost: 1000 }));
  assert.equal(factoryMarketTier(basic), 2);
  assert.equal(factoryMarketTier([...basic, { id: "deposition", key: "deposition", level: 2, purchaseCost: 6500 }, { id: "implant", key: "implant", level: 2, purchaseCost: 8200 }]), 3);
});

test("market upgrades are paid and catalog advances through five staged markets", () => {
  assert.equal(maxMarketTier, 5);
  assert.deepEqual([1, 2, 3, 4, 5].map((tier) => products.filter((product) => product.marketTier === tier).length), [6, 6, 6, 6, 8]);
  assert.equal(marketUpgradePrice(1), 650);
  assert.equal(marketUpgradePrice(2), 1800);
  assert.equal(marketUpgradePrice(5), 0);
  assert.ok(products.some((product) => product.marketTier === 2 && product.recipe.at(-1) === "furnace"));
  assert.ok(products.some((product) => product.marketTier === 2 && product.recipe.at(-1) === "aligner"));
  assert.ok(products.some((product) => product.marketTier === 4 && product.recipe.at(-1) === "package"));
});

test("old equipment sells below its original purchase price", () => {
  assert.equal(equipmentResaleValue(1200), 540);
  assert.ok(equipmentResaleValue(1200) < 1200);
});

test("a newer machine generation improves final yield", () => {
  const product = products[0];
  const run = (level: number) => {
    const unit: EquipmentUnit[] = [{ id: `clean-${level}`, key: "clean", level, purchaseCost: 1200 }];
    let lots = [makeLot(400 + level, product.id)];
    for (let day = 0; day < 8; day += 1) {
      const sequence = [Math.exp(-0.5), 0.25];
      const result = advanceProductionDay(lots, unit, 58, products, () => sequence.shift() ?? 0.25);
      if (result.completed.length) return result.completed[0].yield;
      lots = result.nextLots;
    }
    throw new Error("lot did not finish");
  };
  assert.ok(run(2) > run(1));
});

test("serial process yields multiply across equipment", () => {
  const product = products.find((item) => item.id === "diffused-standard")!;
  const units: EquipmentUnit[] = [
    { id: "clean-chain", key: "clean", level: 1, purchaseCost: 1200 },
    { id: "furnace-chain", key: "furnace", level: 1, purchaseCost: 1600 },
  ];
  let lots = [makeLot(450, product.id)];
  for (let day = 0; day < 12; day += 1) {
    const centeredGaussian = [0.5, 0.25];
    const result = advanceProductionDay(lots, units, 58, products, () => centeredGaussian.shift() ?? 0.25);
    if (result.completed.length) {
      assert.ok(Math.abs(result.completed[0].yield - 96 * 92 / 100) < 0.0001);
      return;
    }
    lots = result.nextLots;
  }
  assert.fail("two-stage lot did not finish");
});

test("order payout waits for required LOTS and applies yield bonus or discount", () => {
  const product = products[0];
  const delivered = (yieldValue: number, count: number) => Array.from({ length: count }, (_, index) => ({
    lotId: index + 1,
    yield: yieldValue,
    goodDies: 24,
    baseRevenue: 576,
    spent: 180,
  }));

  assert.equal(delivered(97, 1).length < product.requiredLots, true);
  const bonus = calculateOrderPayment(product, delivered(product.minYield + 10, product.requiredLots));
  const discount = calculateOrderPayment(product, delivered(product.minYield - 10, product.requiredLots));
  assert.equal(bonus.multiplier, 1.1);
  assert.equal(discount.multiplier, 0.9);
  assert.ok(bonus.payout > discount.payout);
  assert.equal(yieldPriceMultiplier(80, 70), 1.1);
  assert.equal(yieldPriceMultiplier(60, 70), 0.9);
  assert.equal(yieldPriceMultiplier(95, 95), 1);
});

test("order payment uses the target-yield base price instead of charging twice for actual good dies", () => {
  const product = products[0];
  const lots = Array.from({ length: product.requiredLots }, (_, index) => ({ lotId: index + 1, yield: product.minYield, goodDies: 1, baseRevenue: index ? 999999 : 1, spent: 100 }));
  const payment = calculateOrderPayment(product, lots);
  assert.equal(payment.multiplier, 1);
  assert.equal(payment.baseRevenue, Math.round(product.diesPerLot * product.unitPrice * product.minYield / 100) * product.requiredLots);
  assert.equal(payment.payout, payment.baseRevenue);
});

test("catalog contains both volume-first and yield-first orders", () => {
  assert.ok(products.some((product) => product.requiredLots >= 5 && product.minYield < 85));
  assert.ok(products.some((product) => product.requiredLots <= 2 && product.minYield >= 94));
});

test("order recipes grow continuously while multiplicative yield targets fall with complexity", () => {
  const ranges = [1, 2, 3, 4, 5].map((tier) => {
    const tierProducts = products.filter((product) => product.marketTier === tier);
    return {
      minRecipe: Math.min(...tierProducts.map((product) => product.recipe.length)),
      maxRecipe: Math.max(...tierProducts.map((product) => product.recipe.length)),
      averageTarget: tierProducts.reduce((sum, product) => sum + product.minYield, 0) / tierProducts.length,
    };
  });
  for (let index = 1; index < ranges.length; index += 1) {
    assert.ok(ranges[index].minRecipe <= ranges[index - 1].maxRecipe + 2);
    assert.ok(ranges[index].maxRecipe > ranges[index - 1].maxRecipe);
    assert.ok(ranges[index].averageTarget < ranges[index - 1].averageTarget);
  }
  assert.equal(products.find((product) => product.id === "cleaned-lab")?.minYield, 93);
  assert.ok((products.find((product) => product.id === "mcu-triple-layer")?.minYield ?? 100) < 30);
});

function makeLot(id: number, productId: string, step = 0): ProductionLot {
  const product = products.find((item) => item.id === productId)!;
  return {
    id,
    offerId: "test-offer",
    productId,
    step,
    progress: 0,
    yield: 99.5,
    targetYield: product.baseYield,
    spent: product.materialCost,
  };
}
