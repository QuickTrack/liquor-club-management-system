import { describe, expect, test } from "bun:test";
import { ensureUnitPrices } from "@/lib/utils/uomPricing";

describe("ensureUnitPrices", () => {
  test("fills missing sellPrice and costPrice using base prices", () => {
    const units = [
      { name: "Case", conversionFactor: 12, sellPrice: null, costPrice: null },
      { name: "6-Pack", conversionFactor: 6 }, // missing both
      { name: "Bottle", conversionFactor: 1, sellPrice: 0, costPrice: 0 }, // explicit zeros
    ];
    const baseSellPrice = 3000;
    const baseCostPrice = 2000;

    const result = ensureUnitPrices(units, baseSellPrice, baseCostPrice);

    expect(result[0].sellPrice).toBe(3000 * 12);
    expect(result[0].costPrice).toBe(2000 * 12);
     expect(result[1].sellPrice).toBe(3000 * 6);
     expect(result[1].costPrice).toBe(2000 * 6);
     // zero is treated as missing and backfilled
     expect(result[2].sellPrice).toBe(3000 * 1);
     expect(result[2].costPrice).toBe(2000 * 1);
  });

  test("does not overwrite existing sellPrice/costPrice", () => {
    const units = [
      { name: "Case", conversionFactor: 12, sellPrice: 36000, costPrice: 24000 },
    ];
    const result = ensureUnitPrices(units, 3000, 2000);
    expect(result[0].sellPrice).toBe(36000);
    expect(result[0].costPrice).toBe(24000);
  });

  test("handles units with only sellPrice missing", () => {
    const units = [
      { name: "Case", conversionFactor: 12, costPrice: 24000 },
    ];
    const result = ensureUnitPrices(units, 3000, 2000);
    expect(result[0].sellPrice).toBe(3000 * 12);
    expect(result[0].costPrice).toBe(24000);
  });

  test("handles units with only costPrice missing", () => {
    const units = [
      { name: "Case", conversionFactor: 12, sellPrice: 36000 },
    ];
    const result = ensureUnitPrices(units, 3000, 2000);
    expect(result[0].sellPrice).toBe(36000);
    expect(result[0].costPrice).toBe(2000 * 12);
  });

  test("does not compute costPrice if baseCostPrice is undefined", () => {
    const units = [
      { name: "Case", conversionFactor: 12, sellPrice: null },
    ];
    const result = ensureUnitPrices(units, 3000, undefined);
    expect(result[0].sellPrice).toBe(3000 * 12);
    expect(result[0].costPrice).toBeUndefined();
  });

  test("handles negative or zero base prices", () => {
    const units = [
      { name: "Freebie", conversionFactor: 1, sellPrice: null },
    ];
    const result = ensureUnitPrices(units, 0, 0);
    expect(result[0].sellPrice).toBe(0);
    // baseCostPrice is 0 (defined), so costPrice should be computed as 0
    expect(result[0].costPrice).toBe(0);
  });
});
