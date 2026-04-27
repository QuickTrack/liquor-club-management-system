import { connectDB } from "@/lib/db/connection";
import { ProductUOM, Product } from "@/lib/db/models";
import { ensureUnitPrices } from "@/lib/utils/uomPricing";

/**
 * Migration: Backfill missing sellPrice and costPrice for all ProductUOM units
 *
 * For any unit that has sellPrice === null/undefined/missing, compute it as:
 *   unit.sellPrice = product.sellPrice * unit.conversionFactor
 * Similarly for costPrice using product.costPrice.
 *
 * Run: bun run src/lib/db/migrations/backfill-unit-prices.ts
 */

const migrate = async () => {
  await connectDB();
  console.log("✅ Connected to MongoDB\n");

  const uoms = await ProductUOM.find({});
  console.log(`Found ${uoms.length} ProductUOM documents`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const uom of uoms) {
    const product = await Product.findById(uom.product);
    if (!product) {
      console.log(`  [SKIP] Product not found for UOM ${uom._id}`);
      skippedCount++;
      continue;
    }

    // Convert units to plain objects for comparison/transformation
    const originalUnits = uom.units.map((u: any) => (u.toObject ? u.toObject() : { ...u }));
    const updatedUnits = ensureUnitPrices(originalUnits, product.sellPrice, product.costPrice);

    // Detect if any sellPrice/costPrice changed
    const hasChanges = originalUnits.some((orig: any, idx: number) => {
      const upd = updatedUnits[idx];
      return orig.sellPrice != upd.sellPrice || orig.costPrice != upd.costPrice;
    });

    if (hasChanges) {
      uom.units = updatedUnits;
      await uom.save();
      updatedCount++;
      console.log(`  [UPDATED] UOM ${uom._id} for product ${product.name}`);
    } else {
      skippedCount++;
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Updated: ${updatedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Total:   ${uoms.length}`);
};

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
