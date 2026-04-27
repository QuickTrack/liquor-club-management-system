import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connection";
import { Order } from "@/lib/db/models";

/**
 * POST /api/orders/handover
 * Transfer multiple orders from one staff member to another
 * Body: { fromStaffId: string, toStaffId: string, orderIds?: string[] }
 * If orderIds not provided, transfers all held/draft orders for fromStaffId
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    const { fromStaffId, toStaffId, orderIds } = data;

    if (!fromStaffId || !toStaffId) {
      return NextResponse.json(
        { error: "fromStaffId and toStaffId are required" },
        { status: 400 }
      );
    }

    // Validate staff exist
    const { Staff } = await import("@/lib/db/models");
    const fromStaff = await Staff.findById(fromStaffId);
    const toStaff = await Staff.findById(toStaffId);

    if (!fromStaff) {
      return NextResponse.json({ error: "Source staff member not found" }, { status: 404 });
    }
    if (!toStaff) {
      return NextResponse.json({ error: "Target staff member not found" }, { status: 404 });
    }

    // Build filter for orders to transfer
    const filter: any = {
      assignedTo: fromStaffId,
      status: { $in: ["draft", "held"] },
    };

     if (orderIds && orderIds.length > 0) {
       filter._id = { $in: orderIds.map((id: string) => new mongoose.Types.ObjectId(id)) };
     }

    // Update all matching orders
    const result = await Order.updateMany(
      filter,
      { $set: { assignedTo: new mongoose.Types.ObjectId(toStaffId) } }
    );

    return NextResponse.json({
      success: true,
      transferredCount: result.modifiedCount,
      fromStaff: { name: fromStaff.name, role: fromStaff.role },
      toStaff: { name: toStaff.name, role: toStaff.role },
    });
  } catch (error: any) {
    console.error("Error performing handover:", error);
    return NextResponse.json(
      { error: "Failed to perform handover", details: error.message },
      { status: 500 }
    );
  }
}
