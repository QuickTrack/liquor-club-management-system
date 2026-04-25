import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Order } from "@/lib/db/models";

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

    const order = await Order.create({
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
    });

    // Populate customer info for response
    await order.populate("customer", "name phone email");

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
