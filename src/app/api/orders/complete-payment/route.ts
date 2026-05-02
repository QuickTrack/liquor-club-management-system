/**
 * POS Payment Completion API
 * Completes order payment and updates inventory atomically
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Order, Payment, Customer, Product } from "@/lib/db/models";
import { Logger, logAudit, logTransaction } from "@/lib/services/logger.service";
import { TransactionManager } from "@/lib/services/transaction-manager";
import mongoose from "mongoose";
import type { ClientSession } from "mongoose";

const transactionManager = new TransactionManager();

/**
 * POST /api/orders/complete-payment
 * Complete payment for an order and update inventory atomically
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    // Validate required fields
    if (!data.orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }
    if (!data.paymentMethod) {
      return NextResponse.json({ error: "paymentMethod is required" }, { status: 400 });
    }
    if (!data.amount) {
      return NextResponse.json({ error: "amount is required" }, { status: 400 });
    }

    const {
      orderId,
      paymentMethod,
      amount,
      cashTendered,
      changeGiven,
      mpesaReceiptNumber,
      mpesaPhoneNumber,
      cardLast4,
      cardBrand,
      authorizationCode,
      userId = "system",
      userName = "System",
    } = data;

    // Create transaction context
    const context = {
      transactionId: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName,
      sessionId: data.sessionId,
      metadata: { source: "pos_payment", terminalId: data.terminalId },
    };

    let session: ClientSession | null = null;

    try {
      // Check if MongoDB is running as replica set (required for transactions)
      const isReplicaSet = mongoose.connection.readyState === 1 &&
        (mongoose.connection as any).client?.options?.replSetHosts;

      if (!isReplicaSet) {
        Logger.transaction.warn(`MongoDB not running as replica set - using best effort for ${context.transactionId}`);
      }

      // Start session if available
      if (isReplicaSet) {
        session = await mongoose.startSession();
        session.startTransaction();
      }

      // Fetch order
      const orderQuery = Order.findById(orderId);
      if (session) orderQuery.session(session);
      const order = await orderQuery;

      if (!order) {
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Validate order status
      if (order.status !== "draft" && order.status !== "held" && order.status !== "billed") {
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return NextResponse.json(
          { error: `Order cannot be paid in ${order.status} state` },
          { status: 400 }
        );
      }

      // Validate payment amount
      if (amount !== order.total) {
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return NextResponse.json(
          { error: `Payment amount (${amount}) does not match order total (${order.total})` },
          { status: 400 }
        );
      }

      // Create payment record
      const payment = new Payment({
        paymentId: `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        orderId: order.orderId,
        orderObjectId: order._id,
        amount,
        method: paymentMethod,
        status: "completed",
        cashTendered,
        changeGiven,
        mpesaReceiptNumber,
        mpesaPhoneNumber,
        cardLast4,
        cardBrand,
        authorizationCode,
        userId: new mongoose.Types.ObjectId(userId === "system" ? "666666666666666666666666" : userId),
        initiatedAt: new Date(),
        completedAt: new Date(),
      });

      if (session) {
        await payment.save({ session });
      } else {
        await payment.save();
      }

      // Update order with payment
      order.payments.push(payment._id);
      order.totalPaid += payment.amount;
      order.outstandingBalance = order.total - order.totalPaid;
      order.fullyPaid = order.totalPaid >= order.total;
      order.status = "paid";
      order.paidAt = new Date();
      order.closed = true;
      order.closedAt = new Date();
      order.closedBy = new mongoose.Types.ObjectId(userId === "system" ? "666666666666666666666666" : userId);

      if (session) {
        await order.save({ session });
      } else {
        await order.save();
      }

      // Update inventory (atomic stock deduction)
      for (const item of order.items) {
        const updateQuery = { $inc: { stock: -item.quantity } };
        if (session) {
          await Product.findByIdAndUpdate(item.product, updateQuery, { session });
        } else {
          await Product.findByIdAndUpdate(item.product, updateQuery);
        }
      }

      // Update customer loyalty and stats
      if (order.customer) {
        const customerUpdate = {
          $inc: {
            points: order.pointsEarned || 0,
            totalSpent: order.total,
            visits: 1,
          },
          lastVisit: new Date(),
        };
        if (session) {
          await Customer.findByIdAndUpdate(order.customer, customerUpdate, { session });
        } else {
          await Customer.findByIdAndUpdate(order.customer, customerUpdate);
        }
      }

      // Commit transaction if using session
      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      // Create audit log
      await logAudit("PAYMENT_PROCESSED", userId, {
        orderId: order.orderId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        method: payment.method,
        terminalId: data.terminalId,
      });

      // Log transaction
      logTransaction("payment_processed", {
        transactionId: context.transactionId,
        orderId: order.orderId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        userId,
      });

      Logger.transaction.info("Payment processed successfully", {
        orderId: order.orderId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        method: payment.method,
        userId,
      });

      return NextResponse.json({
        success: true,
        order: {
          _id: order._id,
          orderId: order.orderId,
          status: order.status,
          total: order.total,
          items: order.items,
          customer: order.customer,
        },
        payment: {
          _id: payment._id,
          paymentId: payment.paymentId,
          amount: payment.amount,
          method: payment.method,
        },
      }, { status: 201 });

    } catch (error: any) {
      // Rollback transaction on error
      if (session) {
        try {
          await session.abortTransaction();
          session.endSession();
        } catch (abortErr) {
          Logger.error.error("Failed to abort transaction", {
            error: (abortErr as Error).message,
          });
        }
      }

      // Log failed transaction
      try {
        await Logger.datastore.error("Failed payment transaction", {
          orderId,
          error: error.message,
          paymentMethod,
          amount,
        });
      } catch (logErr) {
        // Ignore logging errors
      }

      Logger.error.error("Payment processing failed", {
        error: error.message,
        stack: error.stack,
        orderId,
      });

      return NextResponse.json(
        { error: "Payment processing failed", details: error.message },
        { status: 500 }
      );
    }
  }
  catch (error: any) {
    Logger.error.error("Unexpected error in payment completion", {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: "Failed to complete payment", details: error.message },
      { status: 500 }
    );
  }
}
