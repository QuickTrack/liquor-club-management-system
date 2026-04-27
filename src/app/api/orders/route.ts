import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connection";
import { Order, Product } from "@/lib/db/models";
import { inventoryService } from "@/lib/services/inventoryService";
import { AuditLogService } from "@/lib/services/auditLogService";

/**
 * GET /api/orders
 * Fetch all orders with optional filters
 * Query params: ?status=paid&customerId=...&limit=20&offset=0
 */
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (customerId) filter.customer = customerId;

    const orders = await Order.find(filter)
      .populate("customer", "name phone")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const total = await Order.countDocuments(filter);

    return NextResponse.json({
      orders,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

/**
 * POST /api/orders
 * Create a new order
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    const {
      customer,
      items,
      subtotal,
      tax,
      total,
      paymentMethod,
      pointsEarned = 0,
    } = data;

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Customer and items are required" },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create the order
      const order = await Order.create(
        [
          {
            orderId,
            customer,
            items,
            subtotal,
            tax: tax || 0,
            total,
            paymentMethod: paymentMethod || "cash",
            status: "paid",
            pointsEarned,
            paidAt: new Date(),
          },
        ],
        { session }
      );

      const createdOrder = order[0];

      // Update inventory for each item in the order
      if (items && items.length > 0) {
        try {
          const saleItems = items.map((item: any) => ({
            productId: item.product,
            quantity: item.quantity,
            unit: item.unit || "bottles",
            unitPrice: item.unitPrice || item.price,
          }));

          const userId = data.userId || "system";
          const userName = data.userName || "System";

          await inventoryService.processSale(saleItems, {
            userId,
            userName,
            orderId,
            actionType: "SALE",
            notes: `Order ${orderId} processed`,
          });
        } catch (inventoryError) {
          // If inventory update fails, rollback the entire transaction
          await session.abortTransaction();
          session.endSession();

          console.error("Inventory update failed:", inventoryError);
          return NextResponse.json(
            {
              error: "Failed to update inventory",
              details: inventoryError instanceof Error ? inventoryError.message : "Unknown inventory error",
            },
            { status: 400 }
          );
        }
      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // Populate customer info for response
      await createdOrder.populate("customer", "name phone email");

      return NextResponse.json(createdOrder, { status: 201 });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();

      console.error("Error creating order:", error);
      return NextResponse.json(
        { error: "Failed to create order", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
