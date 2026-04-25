import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Supplier } from "@/lib/db/models";

export async function GET() {
  try {
    await connectDB();
    const suppliers = await Supplier.find({}).sort({ name: 1 });
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
    
    // Create purchase order
    const supplier = await Supplier.findById(body.supplier);
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const totalCost = body.items.reduce((sum: number, item: { cost: number; quantity: number }) => sum + (item.cost * item.quantity), 0);
    
    // Update supplier stats
    await Supplier.findByIdAndUpdate(body.supplier, {
      $inc: {
        totalOrders: 1,
        totalSpent: totalCost,
        creditBalance: body.useCredit ? totalCost : 0,
      },
    });

    return NextResponse.json({
      message: "Purchase order created",
      orderId: `PO-${Date.now()}`,
      total: totalCost,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}