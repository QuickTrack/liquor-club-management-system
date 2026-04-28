/**
 * Orders API - Enhanced with persistence layer and ACID transactions
 */

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connection";
import { Order, Customer, Product } from "@/lib/db/models";
import { TransactionManager } from "@/lib/services/transaction-manager";
import { Validator, ValidationResult } from "@/lib/services/validation.service";
import { Logger, logAudit } from "@/lib/services/logger.service";
import { OrderRepository } from "@/lib/services/persistence-layer";

// Initialize services
const transactionManager = new TransactionManager();
const orderRepository = new OrderRepository(transactionManager);

/**
 * GET /api/orders
 * Fetch orders with optional filters (status, customerId, assignedTo)
 */
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const filters: Record<string, any> = {};
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const assignedTo = searchParams.get("assignedTo");

    if (status) filters.status = status;
    if (customerId) filters.customer = customerId;
    if (assignedTo) filters.assignedTo = assignedTo;

    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    try {
      const result = await orderRepository.findPaginated(filters, {
        page: offset / limit + 1,
        limit,
        populate: ["customer", "assignedTo"],
        sort: { createdAt: -1 },
      });

      return NextResponse.json({
        orders: result.data,
        total: result.total,
        limit,
        offset: result.page * limit,
      });
    } catch (dbError: any) {
      Logger.datastore.error("Error fetching orders", {
        filters,
        error: dbError.message,
      });
      return NextResponse.json(
        { error: "Failed to fetch orders", details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    Logger.error.error("Unexpected error in GET /api/orders", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Create a new order with ACID-compliant inventory updates
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    // Validate request body
    const validation = Validator.validateOrderCreate(data);
    if (!validation.isValid) {
      Logger.transaction.warn("Order creation validation failed", {
        errors: validation.errors,
        payload: data,
      });

      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const orderData = validation.data!;

    // Extract user context from request headers (set by middleware)
    const userId = data.userId || "system";
    const userName = data.userName || "System";

    try {
      const result = await orderRepository.createWithInventory(
        {
          ...orderData,
          paymentMethod: orderData.paymentMethod || "cash",
          status: orderData.status,
          ...(orderData.status === "paid" && { paidAt: new Date() }),
        },
        {
          transactionId: "", // Will be generated
          userId,
          userName,
          sessionId: data.sessionId,
          metadata: { source: "pos", ip: data.ip },
        }
      );

      if (!result.success) {
        // Log failure
        Logger.transaction.error("Order creation failed after retries", {
          transactionId: result.transactionId,
          operation: result.operation,
          error: result.error?.message,
          attempts: result.retryAttempt,
        });

        return NextResponse.json(
          {
            error: result.error?.message || "Failed to create order",
            code: result.error?.code,
            transactionId: result.transactionId,
          },
          { status: 500 }
        );
      }

      const createdOrder = result.data;

      if (!createdOrder) {
        return NextResponse.json(
          { error: "Failed to create order - no data returned" },
          { status: 500 }
        );
      }

      // Audit log for successful order
      logAudit("ORDER_CREATED", userId, {
        orderId: createdOrder.orderId,
        customer: orderData.customerId,
        items: orderData.items.length,
        total: createdOrder.total,
        paymentMethod: orderData.paymentMethod,
      });

      Logger.transaction.info("Order created successfully", {
        orderId: createdOrder.orderId,
        transactionId: result.transactionId,
        userId,
        total: createdOrder.total,
        durationMs: result.durationMs,
      });

      return NextResponse.json(createdOrder, { status: 201 });
    } catch (innerError: any) {
      Logger.error.error("Error in order creation transaction", {
        error: innerError.message,
        stack: innerError.stack,
      });

      return NextResponse.json(
        { error: "Failed to create order", details: innerError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    Logger.error.error("Unexpected error in POST /api/orders", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[id]
 * Update order status or assignment
 */
export async function PATCH(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { id } = body;
    const updates = { ...body };
    delete updates.id;

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Validate update payload
    const allowedUpdates = ["status", "assignedTo", "paymentMethod", "paidAt"];
    const updateKeys = Object.keys(updates);

    const invalidKeys = updateKeys.filter((k) => !allowedUpdates.includes(k));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Invalid update fields: ${invalidKeys.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (updates.status && !["draft", "held", "billed", "paid", "cancelled"].includes(updates.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const userId = updates.userId || "system";

    try {
      const updateQuery: any = { $set: {} };
      if (updates.status) updateQuery.$set.status = updates.status;
      if (updates.assignedTo) {
        updateQuery.$set.assignedTo = new mongoose.Types.ObjectId(updates.assignedTo);
      }
      if (updates.paymentMethod) {
        updateQuery.$set.paymentMethod = updates.paymentMethod;
      }
      if (updates.paidAt !== undefined) {
        updateQuery.$set.paidAt = updates.paidAt;
      }

      // Auto-set paidAt when status changes to paid
      if (updates.status === "paid" && !updateQuery.$set.paidAt) {
        updateQuery.$set.paidAt = new Date();
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        updateQuery,
        { new: true }
      )
        .populate("customer", "name phone email")
        .populate("assignedTo", "name role");

      if (!updatedOrder) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }

      // Audit log
      logAudit("ORDER_UPDATED", userId, {
        orderId: updatedOrder.orderId,
        changes: updateKeys,
        newStatus: updates.status,
      });

      return NextResponse.json(updatedOrder);
    } catch (dbError: any) {
      Logger.datastore.error("Error updating order", {
        orderId: id,
        updates,
        error: dbError.message,
      });

      return NextResponse.json(
        { error: "Failed to update order", details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    Logger.error.error("Unexpected error in PATCH /api/orders", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
