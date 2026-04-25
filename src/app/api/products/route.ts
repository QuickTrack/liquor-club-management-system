import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Product, ProductUOM, IProductUOM } from "@/lib/db/models";
import type { NextRequest } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({}).sort({ category: 1, name: 1 });
    
    // Fetch UOM data for each product
    const productIds = products.map(p => p._id.toString());
    const uoms = await ProductUOM.find({ product: { $in: productIds } });
    
    // Create a map of productId to UOM data
    const uomMap = new Map<string, IProductUOM>();
    uoms.forEach((uom: IProductUOM) => {
      uomMap.set(uom.product.toString(), uom);
    });
    
    // Combine product with UOM data
    const productsWithUOM = products.map(product => {
      const productUOM = uomMap.get(product._id.toString());
      return {
        ...product.toObject(),
        uom: productUOM ? {
          baseUnit: productUOM.baseUnit,
          units: productUOM.units
        } : {
          baseUnit: product.unit,
          units: [{ name: product.unit, abbreviation: product.unit, isBase: true, conversionFactor: 1, isActive: true }]
        }
      };
    });
    
    return NextResponse.json(productsWithUOM);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.category || data.costPrice === undefined || data.sellPrice === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Validate UOM
    if (!data.uom || !data.uom.baseUnit || !data.uom.units || data.uom.units.length === 0) {
      return NextResponse.json({ error: "At least one unit of measure is required" }, { status: 400 });
    }
    
    // Check for base unit
    const baseUnit = data.uom.units.find((u: any) => u.isBase);
    if (!baseUnit) {
      return NextResponse.json({ error: "One unit must be marked as base unit" }, { status: 400 });
    }
    
    // Validate conversion factors
    const conversionFactors = data.uom.units.map((u: any) => u.conversionFactor);
    if (conversionFactors.some((cf: number) => cf <= 0 || isNaN(cf))) {
      return NextResponse.json({ error: "All conversion factors must be positive numbers" }, { status: 400 });
    }
    
    // Check for duplicate unit names
    const unitNames = data.uom.units.map((u: any) => u.name.toLowerCase());
    const uniqueNames = new Set(unitNames);
    if (uniqueNames.size !== unitNames.length) {
      return NextResponse.json({ error: "Duplicate unit names found" }, { status: 400 });
    }
    
    // Create product
    const product = await Product.create({
      name: data.name,
      category: data.category,
      stock: data.stock || 0,
      reorderLevel: data.reorderLevel || 10,
      costPrice: data.costPrice,
      sellPrice: data.sellPrice,
      supplier: data.supplier || "",
      expiryDate: data.expiryDate || null,
      batchNo: data.batchNo || "",
      status: data.status || "In Stock",
    });
    
    // Create UOM record
    await ProductUOM.create({
      product: product._id,
      baseUnit: data.uom.baseUnit,
      units: data.uom.units.map((u: any) => ({
        name: u.name,
        abbreviation: u.abbreviation || u.name,
        isBase: u.isBase,
        conversionFactor: u.conversionFactor,
        isActive: u.isActive !== false,
      })),
    });
    
    return NextResponse.json({ 
      ...product.toObject(),
      uom: data.uom 
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}