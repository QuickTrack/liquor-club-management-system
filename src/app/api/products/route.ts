import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Product } from "@/lib/db/models";

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({}).sort({ category: 1, name: 1 });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}