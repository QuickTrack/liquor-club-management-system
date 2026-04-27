/**
 * Utility to ensure all unit entries have required pricing and identity fields.
 * Backfills missing values from base product pricing.
 */

export interface UnitWithPricing {
  name?: string;
  abbreviation?: string;
  isBase?: boolean;
  conversionFactor?: number;
  isActive?: boolean;
  sellPrice?: number | null;
  costPrice?: number | null;
}

export function ensureUnitPrices(
  units: UnitWithPricing[],
  baseSellPrice: number,
  baseCostPrice?: number
): (UnitWithPricing & { sellPrice: number; costPrice?: number; isActive: boolean })[] {
  return units.map((unit) => {
    // Convert Mongoose subdocument to plain object if needed
    const unitAny = unit as any;
    const plainUnit: UnitWithPricing = unitAny.toObject
      ? (unitAny.toObject() as UnitWithPricing)
      : { ...unit };

    // Backfill missing sellPrice (null/undefined) or placeholder zero
    if (plainUnit.sellPrice == null || plainUnit.sellPrice === 0) {
      const cf = plainUnit.conversionFactor;
      plainUnit.sellPrice = cf != null ? baseSellPrice * cf : 0;
    }

    // Backfill missing costPrice similarly
    if ((plainUnit.costPrice == null || plainUnit.costPrice === 0) && baseCostPrice != null) {
      const cf = plainUnit.conversionFactor;
      plainUnit.costPrice = cf != null ? baseCostPrice * cf : 0;
    }

    // Backfill missing isActive to true (default active)
    if (plainUnit.isActive == null) {
      plainUnit.isActive = true;
    }

    // Ensure other critical fields never undefined (prevents runtime errors)
    if (plainUnit.name == null) plainUnit.name = 'Unit';
    if (plainUnit.abbreviation == null) plainUnit.abbreviation = 'U';
    if (plainUnit.conversionFactor == null) plainUnit.conversionFactor = 1;
    if (plainUnit.isBase == null) plainUnit.isBase = false;

    return plainUnit as any;
  });
}
