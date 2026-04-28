/**
 * Held Orders API - Create or update held orders
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { OrderRepository } from "@/lib/services/persistence-layer";
import { Validator, ValidationResult } from "@/lib/services/validation.service";
import { Logger, logAudit } from "@/lib/services/logger.service";
import { TransactionManager } from "@/lib/services/transaction-manager";

// Initialize services
const transactionManager = new TransactionManager();
const orderRepository = new OrderRepository(transactionManager);

/**
 * POST /api/orders/held
 * Create a new held order (cart) or update an existing one.
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    // Validate request body
    const validation = Validator.validateOrderCreate(data);
    if (!validation.isValid) {
      Logger.transaction.warn("Held order validation failed", {
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

    // Ensure status is held (override if provided)
    orderData.status = "held";

    try {
      const result = await orderRepository.createHeldOrder(
        {
          ...orderData,
          paymentMethod: orderData.paymentMethod || "cash",
          assignedTo: orderData.assignedTo || data.assignedTo,
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
        Logger.transaction.error("Held order creation failed after retries", {
          transactionId: result.transactionId,
          operation: result.operation,
          error: result.error?.message,
          attempts: result.retryAttempt,
        });

        return NextResponse.json(
          {
            error: result.error?.message || "Failed to create held order",
            code: result.error?.code,
            transactionId: result.transactionId,
          },
          { status: 500 }
        );
      }

      const createdOrder = result.data;

      if (!createdOrder) {
        return NextResponse.json(
          { error: "Failed to create held order - no data returned" },
          { status: 500 }
        );
      }

      // Audit log for successful order
      logAudit("HELD_ORDER_CREATED", userId, {
        orderId: createdOrder.orderId,
        customer: orderData.customerId,
        items: orderData.items.length,
        total: createdOrder.total,
        assignedTo: orderData.assignedTo,
      });

      Logger.transaction.info("Held order created successfully", {
        orderId: createdOrder.orderId,
        transactionId: result.transactionId,
        userId,
        total: createdOrder.total,
        durationMs: result.durationMs,
      });

      return NextResponse.json(createdOrder, { status: 201 });
    } catch (innerError: any) {
      Logger.error.error("Error in held order creation transaction", {
        error: innerError.message,
        stack: innerError.stack,
      });

      return NextResponse.json(
        { error: "Failed to create held order", details: innerError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    Logger.error.error("Unexpected error in POST /api/orders/held", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
