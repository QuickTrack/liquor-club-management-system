import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Supplier } from "@/lib/db/models";

export async function GET() {
  try {
    await connectDB();
    const suppliers = await Supplier.find({ status: "Active" }).sort({ createdAt: -1 });
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const supplier = new Supplier({
      ...body,
      totalOrders: 0,
      totalSpent: 0,
      creditBalance: 0,
      rating: 4.0,
      status: "Active",
    });
    await supplier.save();
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}