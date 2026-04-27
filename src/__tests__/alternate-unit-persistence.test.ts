import { describe, expect, test, beforeEach, beforeAll, afterAll } from "bun:test";
import { ensureUnitPrices } from "@/lib/utils/uomPricing";
import { Product, ProductUOM } from "@/lib/db/models";
import { connectDB, closeDB } from "@/lib/db/connection";
import mongoose from "mongoose";

describe("Alternate Unit Persistence", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    // Clean collections between tests
    await ProductUOM.deleteMany({});
    await Product.deleteMany({});
  });

  test("POST /api/products should persist alternate unit sellPrice and costPrice", async () => {
    // Arrange
    const productData = {
      name: "Test Product",
      category: "Vodka",
      stock: 10,
      reorderLevel: 5,
      costPrice: 1000,
      sellPrice: 1500,
      supplier: "Test Supplier",
      uom: {
        baseUnit: "bottle",
        units: [
          {
            name: "Case",
            abbreviation: "case",
            isBase: false,
            conversionFactor: 12,
            isActive: true,
            sellPrice: 18000,
            costPrice: 12000,
          },
        ],
      },
    };

    // Act: Simulate creating via direct model call (since we're testing persistence at DB level)
    const product = await Product.create({
      name: productData.name,
      category: productData.category,
      stock: productData.stock,
      reorderLevel: productData.reorderLevel,
      costPrice: productData.costPrice,
      sellPrice: productData.sellPrice,
      supplier: productData.supplier,
    });

    await ProductUOM.create({
      product: product._id,
      baseUnit: productData.uom.baseUnit,
      units: productData.uom.units.map((u: any) => ({
        name: u.name,
        abbreviation: u.abbreviation,
        isBase: u.isBase,
        conversionFactor: u.conversionFactor,
        isActive: u.isActive,
        sellPrice: u.sellPrice,
        costPrice: u.costPrice,
      })),
    });

    // Assert: Retrieve and verify
    const savedUOM = await ProductUOM.findOne({ product: product._id });
    expect(savedUOM).not.toBeNull();
    expect(savedUOM!.units[0].sellPrice).toBe(18000);
    expect(savedUOM!.units[0].costPrice).toBe(12000);
    expect(savedUOM!.units[0].conversionFactor).toBe(12);
  });

  test("PATCH /api/products should update alternate unit prices", async () => {
    // Create initial product
    const product = await Product.create({
      name: "Update Test",
      category: "Beer",
      stock: 20,
      reorderLevel: 10,
      costPrice: 500,
      sellPrice: 800,
      supplier: "Supplier",
    });

    await ProductUOM.create({
      product: product._id,
      baseUnit: "bottle",
      units: [
        {
          name: "Case",
          abbreviation: "case",
          isBase: false,
          conversionFactor: 24,
          isActive: true,
          sellPrice: 0, // will be updated
          costPrice: 0,
        },
      ],
    });

    // Simulate PATCH update
    const updateUnits = [
      {
        name: "Case",
        abbreviation: "case",
        isBase: false,
        conversionFactor: 24,
        isActive: true,
        sellPrice: 19200,
        costPrice: 12000,
      },
    ];

    const updatedUOM = await ProductUOM.findOneAndUpdate(
      { product: product._id },
      { $set: { units: updateUnits } },
      { new: true }
    );

    expect(updatedUOM!.units[0].sellPrice).toBe(19200);
    expect(updatedUOM!.units[0].costPrice).toBe(12000);
  });

  test("ensureUnitPrices backfill works correctly for missing prices", async () => {
    // Arrange
    const product = await Product.create({
      name: "Backfill Test",
      category: "Whiskey",
      stock: 5,
      reorderLevel: 2,
      costPrice: 2000,
      sellPrice: 3000,
    });

    await ProductUOM.create({
      product: product._id,
      baseUnit: "bottle",
      units: [
        {
          name: "6-Pack",
          abbreviation: "6pk",
          isBase: false,
          conversionFactor: 6,
          // sellPrice and costPrice omitted (null in DB)
        } as any,
      ],
    });

    // Act: Find and apply ensureUnitPrices manually
    const uom = await ProductUOM.findOne({ product: product._id });
    const productObj = product.toObject();
    const backfilledUnits = ensureUnitPrices(
      uom!.units,
      productObj.sellPrice,
      productObj.costPrice
    );

    // Assert
    expect(backfilledUnits[0].sellPrice).toBe(3000 * 6);
    expect(backfilledUnits[0].costPrice).toBe(2000 * 6);
  });
});
