/**
 * Utility to ensure all unit entries have sellPrice and costPrice.
 * If missing, computes them from the base product pricing and conversion factor.
 */

export interface UnitWithPricing {
  sellPrice?: number | null;
  costPrice?: number | null;
  conversionFactor: number;
}

export function ensureUnitPrices(
  units: UnitWithPricing[],
  baseSellPrice: number,
  baseCostPrice?: number
): (UnitWithPricing & { sellPrice: number; costPrice?: number })[] {
  return units.map((unit) => {
    const updated: any = { ...unit };

    if (updated.sellPrice == null) {
      updated.sellPrice = baseSellPrice * unit.conversionFactor;
    }

    if (updated.costPrice == null && baseCostPrice != null) {
      updated.costPrice = baseCostPrice * unit.conversionFactor;
    }

    return updated;
  });
}
