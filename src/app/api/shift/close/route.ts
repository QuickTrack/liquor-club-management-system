/**
 * Shift Close API - End of Shift Reconciliation
 * Creates comprehensive sales summary and reconciliation record
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Order, Payment, ShiftReconciliation, Customer } from "@/lib/db/models";
import { Logger, logAudit } from "@/lib/services/logger.service";
import { TransactionManager } from "@/lib/services/transaction-manager";

const transactionManager = new TransactionManager();

/**
 * POST /api/shift/close
 * Close shift and generate reconciliation summary
 */
export async function POST(request: Request) {
  try {
    await connectDB();

    // Validate staff ID (in production, use proper auth middleware like NextAuth)
    const data = await request.json();
    const {
      staffId,
      shift = "Evening",
      salesSummary,
      cashVariance = 0,
      stockVariance = 0,
      notes = "",
      handover
    } = data;

    // Validate required fields
    if (!staffId) {
      return NextResponse.json(
        { error: "staffId is required" },
        { status: 400 }
      );
    }

    const shiftStart = getShiftStartTime(shift);
    const shiftEnd = new Date();

    // Create reconciliation within transaction
    const result = await transactionManager.executeWithRetry(
      "close_shift",
      "ShiftReconciliation",
      async (session, ctx) => {
        // Query all paid orders for this shift and staff
        const orders = await Order.find({
          assignedTo: staffId,
          status: { $in: ["paid", "billed"] },
          paidAt: { $gte: shiftStart, $lte: shiftEnd }
        }).session(session).lean();

        // Query all payments for these orders
        const orderIds = orders.map(o => o.orderId);
        const payments = await Payment.find({
          orderId: { $in: orderIds },
          status: "completed"
        }).session(session).lean();

        // Aggregate metrics
        let totalSales = 0;
        let totalTax = 0;
        let totalOrders = orders.length;
        let itemsSold = 0;
        const categoriesSold: Record<string, number> = {};

        // Payment breakdown
        const paymentBreakdown = {
          cash: 0,
          mpesa: 0,
          card: 0,
          account: 0,
          bank_transfer: 0
        };

        // Process orders
        for (const order of orders) {
          totalSales += order.total || 0;
          totalTax += order.tax || 0;
          itemsSold += (order.items || []).reduce(
            (sum: number, item: any) => sum + (item.quantity || 0),
            0
          );

          // Category breakdown
          for (const item of order.items || []) {
            const category = item.category || "Uncategorized";
            categoriesSold[category] = (categoriesSold[category] || 0) + (item.quantity || 0);
          }
        }

        // Process payments
        const paymentIds: string[] = [];
        const orderIdsList: string[] = [];
        for (const payment of payments) {
          paymentBreakdown[payment.method as keyof typeof paymentBreakdown] += payment.amount || 0;
          paymentIds.push(payment.paymentId || "");
          if (payment.orderId && !orderIdsList.includes(payment.orderId)) {
            orderIdsList.push(payment.orderId);
          }
        }

        // Calculate expected cash in drawer
        const startingFloat = salesSummary?.startingFloat || 0;
        const cashDrop = salesSummary?.cashDrop || 0;
        const expectedCashInDrawer = startingFloat + paymentBreakdown.cash - cashDrop;
        const actualCashInDrawer = salesSummary?.cashInDrawer || expectedCashInDrawer;

        // Create reconciliation record
        const reconciliation = new ShiftReconciliation({
          reconciliationId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          userId: staffId,
          shift,
          startTime: shiftStart,
          endTime: shiftEnd,
          totalOrders,
          totalSales,
          totalTax,
          totalRefunds: 0, // Could calculate from refund orders if needed
          cashReceived: paymentBreakdown.cash,
          cashInDrawer: actualCashInDrawer,
          cashVariance: cashVariance || (actualCashInDrawer - expectedCashInDrawer),
          mpesaReceived: paymentBreakdown.mpesa,
          cardReceived: paymentBreakdown.card,
          accountReceived: paymentBreakdown.account + paymentBreakdown.bank_transfer,
          itemsSold,
          categoriesSold,
          orderIds: orderIdsList,
          paymentIds,
          inventoryTransactionIds: [],
          startingFloat,
          endingFloat: actualCashInDrawer,
          cashDrop,
          status: "closed",
          notes,
          closedAt: new Date(),
          closedBy: staffId
        });

        await reconciliation.save({ session });

        // Mark orders as reconciled
        if (orderIdsList.length > 0) {
          await Order.updateMany(
            { orderId: { $in: orderIdsList } },
            { $set: { isReconciled: true, reconciliationId: reconciliation.reconciliationId } }
          ).session(session);
        }

        // Log audit
        await logAudit("SHIFT_CLOSED", ctx.userId, {
          reconciliationId: reconciliation.reconciliationId,
          shift,
          totalSales,
          totalOrders,
          cashVariance: reconciliation.cashVariance,
          paymentBreakdown,
          notes,
          handover
        });

        return {
          reconciliation,
          orders,
          payments: payments.length
        };
      },
      {
        userId: staffId,
        userName: "Staff",
        sessionId: data.sessionId,
        metadata: { source: "shift_close", shift }
      },
      {
        totalSales: salesSummary?.totalSales || 0,
        cashVariance,
        stockVariance
      }
    );

    if (!result.success) {
      Logger.error.error("Shift closure failed", {
        error: result.error?.message,
        staffId,
        shift
      });

      return NextResponse.json(
        {
          error: result.error?.message || "Failed to close shift",
          code: result.error?.code
        },
        { status: 500 }
      );
    }

    const reconciliation = result.data?.reconciliation;

    Logger.transaction.info("Shift closed successfully", {
      reconciliationId: reconciliation.reconciliationId,
      staffId,
      shift,
      totalSales: reconciliation.totalSales,
      totalOrders: reconciliation.totalOrders,
      durationMs: result.durationMs
    });

    return NextResponse.json({
      success: true,
      message: "Shift closed successfully",
      reconciliation: {
        id: reconciliation._id,
        reconciliationId: reconciliation.reconciliationId,
        shift: reconciliation.shift,
        startTime: reconciliation.startTime,
        endTime: reconciliation.endTime,
        totalOrders: reconciliation.totalOrders,
        totalSales: reconciliation.totalSales,
        totalTax: reconciliation.totalTax,
        paymentBreakdown: {
          cash: reconciliation.cashReceived,
          mpesa: reconciliation.mpesaReceived,
          card: reconciliation.cardReceived,
          account: reconciliation.accountReceived
        },
        cashVariance: reconciliation.cashVariance,
        itemsSold: reconciliation.itemsSold,
        categoriesSold: reconciliation.categoriesSold
      }
    }, { status: 201 });

  } catch (error: any) {
    Logger.error.error("Unexpected error in shift close", {
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { error: "Failed to close shift", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Calculate shift start time based on shift type
 */
function getShiftStartTime(shift: string): Date {
  const now = new Date();
  const start = new Date(now);

  switch (shift.toLowerCase()) {
    case "morning":
      start.setHours(6, 0, 0, 0);
      if (now.getHours() < 6) {
        start.setDate(start.getDate() - 1);
      }
      break;
    case "evening":
      start.setHours(14, 0, 0, 0);
      if (now.getHours() < 14) {
        start.setDate(start.getDate() - 1);
      }
      break;
    case "night":
      start.setHours(22, 0, 0, 0);
      if (now.getHours() < 22) {
        start.setDate(start.getDate() - 1);
      }
      break;
    default:
      start.setHours(14, 0, 0, 0);
  }

  return start;
}
