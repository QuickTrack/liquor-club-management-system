/**
 * POS Payment Service
 * Manages the complete payment lifecycle with ACID-compliant transactions
 * 
 * Handles the transition from active order to finalized bill
 * 
 * @module POSPaymentService
 */

import mongoose, { ClientSession, Types } from "mongoose";
import { TransactionManager, TransactionContext, OperationResult } from "./transaction-manager";
import { Order, Payment, Product, Customer } from "@/lib/db/models";
import { Logger, logAudit, logTransaction } from "./logger.service";
import { InventoryService } from "./inventoryService";

/**
 * Payment request interface
 */
export interface PaymentRequest {
  orderId: string;
  method: "cash" | "mpesa" | "card" | "account" | "bank_transfer";
  amount: number;
  cashTendered?: number;
  changeGiven?: number;
  mpesaReceiptNumber?: string;
  mpesaPhoneNumber?: string;
  cardLast4?: string;
  cardBrand?: string;
  authorizationCode?: string;
}

/**
 * Payment result interface
 */
export interface PaymentResult {
  success: boolean;
  order: any;
  payment: any;
  receipt: string;
}

/**
 * POS Payment Service
 */
export class POSPaymentService {
  private transactionManager: TransactionManager;
  private inventoryService: InventoryService;

  constructor(
    transactionManager?: TransactionManager,
    inventoryService?: InventoryService
  ) {
    this.transactionManager = transactionManager || new TransactionManager();
    this.inventoryService = inventoryService || new InventoryService();
  }

  /**
   * Process a payment for an order
   * 
   * @param paymentRequest - Payment details
   * @param context - Transaction context with user information
   * @returns PaymentResult with all created entities
   */
  async processPayment(
    paymentRequest: PaymentRequest,
    context: Omit<TransactionContext, "transactionId">
  ): Promise<PaymentResult> {
    const result = await this.transactionManager.executeWithRetry(
      "process_payment",
      "Payment",
      async (session: ClientSession, ctx: TransactionContext) => {
        return await this.executePaymentInTransaction(paymentRequest, ctx, session);
      },
      context,
      {
        orderId: paymentRequest.orderId,
        paymentMethod: paymentRequest.method,
        amount: paymentRequest.amount
      }
    );

    if (!result.success || !result.data) {
      throw new Error(`Payment processing failed: ${result.error?.message}`);
    }

    // Generate receipt
    const receipt = await this.generateReceipt(result.data.order, result.data.payment);

    return {
      success: true,
      order: result.data.order,
      payment: result.data.payment,
      receipt
    };
  }

  /**
   * Execute payment within a MongoDB transaction
   * 
   * All operations are atomic - either all succeed or all rollback
   */
  private async executePaymentInTransaction(
    paymentRequest: PaymentRequest,
    context: TransactionContext,
    session: ClientSession
  ): Promise<{ order: any; payment: any }> {
    // 1. Fetch and validate order
    const order = await Order.findById(paymentRequest.orderId).session(session);
    if (!order) {
      throw new Error(`Order not found: ${paymentRequest.orderId}`);
    }

    // Validate order status
    if (order.status !== "draft" && order.status !== "held") {
      throw new Error(`Order cannot be paid in ${order.status} state`);
    }

    // Validate payment amount
    if (paymentRequest.amount !== order.total) {
      throw new Error(
        `Payment amount (${paymentRequest.amount}) does not match order total (${order.total})`
      );
    }

    // 2. Create payment record
    const payment = new Payment({
      paymentId: this.generatePaymentId(),
      orderId: order.orderId,
      orderObjectId: order._id,
      amount: paymentRequest.amount,
      method: paymentRequest.method,
      status: "completed",
      cashTendered: paymentRequest.cashTendered,
      changeGiven: paymentRequest.changeGiven,
      mpesaReceiptNumber: paymentRequest.mpesaReceiptNumber,
      mpesaPhoneNumber: paymentRequest.mpesaPhoneNumber,
      cardLast4: paymentRequest.cardLast4,
      cardBrand: paymentRequest.cardBrand,
      authorizationCode: paymentRequest.authorizationCode,
      userId: context.userId,
      initiatedAt: new Date(),
      completedAt: new Date()
    });

    await payment.save({ session });

    // 3. Update order with payment
    order.payments.push(payment._id);
    order.totalPaid += payment.amount;
    order.outstandingBalance = order.total - order.totalPaid;
    order.fullyPaid = order.totalPaid >= order.total;
    order.status = "paid";
    order.paidAt = new Date();
    order.closed = true;
    order.closedAt = new Date();
    order.closedBy = context.userId;

    await order.save({ session });

    // 4. Update inventory (atomic stock deduction)
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    // 5. Update customer loyalty and stats
    if (order.customer) {
      await Customer.findByIdAndUpdate(
        order.customer,
        {
          $inc: {
            points: order.pointsEarned,
            totalSpent: order.total,
            visits: 1
          },
          lastVisit: new Date()
        },
        { session }
      );
    }

    // 6. Create audit log entry
    await logAudit("PAYMENT_PROCESSED", context.userId, {
      orderId: order.orderId,
      paymentId: payment.paymentId,
      amount: payment.amount,
      method: payment.method,
      terminalId: context.metadata?.terminalId
    });

    // 7. Log transaction
    logTransaction("payment_processed", {
      transactionId: context.transactionId,
      orderId: order.orderId,
      paymentId: payment.paymentId,
      amount: payment.amount,
      userId: context.userId
    });

    return {
      order,
      payment
    };
  }

  /**
   * Generate a unique payment ID
   */
  private generatePaymentId(): string {
    return `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  }

  /**
   * Generate a unique transaction ID
   */
  private generateTransactionId(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  }

  /**
   * Generate a receipt for the payment
   */
  private async generateReceipt(order: any, payment: any): Promise<string> {
    const lines: string[] = [];
    const width = 32;

    // Header
    lines.push("=".repeat(width));
    lines.push("        LIQUOR CLUB".padStart(width / 2 + 12));
    lines.push("    POS Retail System".padStart(width / 2 + 11));
    lines.push("=".repeat(width));

    // Order details
    lines.push(`Order ID: ${order.orderId}`);
    lines.push(`Date: ${new Date().toLocaleString()}`);
    lines.push(`Cashier: ${payment.userId}`);
    lines.push("-" .repeat(width));

    // Items
    lines.push("ITEM".padEnd(20) + "QTY".padStart(5) + "AMT".padStart(7));
    lines.push("-" .repeat(width));

    for (const item of order.items) {
      const name = item.name.length > 17 ? item.name.substring(0, 14) + "..." : item.name;
      const lineTotal = (item.unitPrice * item.quantity).toFixed(2);
      lines.push(
        `${name.padEnd(20)}` +
        `${item.quantity.toString().padStart(3)} ` +
        `${lineTotal.padStart(6)}`
      );
    }

    lines.push("-" .repeat(width));

    // Totals
    lines.push(`Subtotal: ${order.subtotal.toFixed(2)}`.padStart(width));
    lines.push(`Tax (16%): ${order.tax.toFixed(2)}`.padStart(width));
    lines.push(`Total: ${order.total.toFixed(2)}`.padStart(width));
    lines.push("-" .repeat(width));

    // Payment
    lines.push(`Paid: ${payment.amount.toFixed(2)}`.padStart(width));
    if (payment.cashTendered && payment.changeGiven) {
      lines.push(`Tendered: ${payment.cashTendered.toFixed(2)}`.padStart(width));
      lines.push(`Change: ${payment.changeGiven.toFixed(2)}`.padStart(width));
    }
    lines.push("=".repeat(width));

    // Payment method
    const methodNames: Record<string, string> = {
      cash: "Cash",
      mpesa: "M-Pesa",
      card: "Card",
      account: "Account",
      bank_transfer: "Bank Transfer"
    };
    lines.push(`Method: ${methodNames[payment.method] || payment.method}`);
    if (payment.mpesaReceiptNumber) {
      lines.push(`Receipt: ${payment.mpesaReceiptNumber}`);
    }

    lines.push("=".repeat(width));
    lines.push("Thank you for your business!");
    lines.push("=".repeat(width));

    return lines.join("\n");
  }

  /**
   * Process partial payment
   */
  async processPartialPayment(
    orderId: string,
    paymentRequest: PaymentRequest,
    context: Omit<TransactionContext, "transactionId">
  ): Promise<any> {
    const result = await this.transactionManager.executeWithRetry(
      "process_partial_payment",
      "Payment",
      async (session: ClientSession, ctx: TransactionContext) => {
        const order = await Order.findById(orderId).session(session);
        if (!order) {
          throw new Error(`Order not found: ${orderId}`);
        }

        if (paymentRequest.amount >= order.total) {
          throw new Error("Use full payment for complete payment");
        }

        // Create payment
        const payment = new Payment({
          paymentId: this.generatePaymentId(),
          orderId: order.orderId,
          orderObjectId: order._id,
          amount: paymentRequest.amount,
          method: paymentRequest.method,
          status: "completed",
          userId: context.userId,
          initiatedAt: new Date(),
          completedAt: new Date()
        });

        await payment.save({ session });

        // Update order
        order.payments.push(payment._id);
        order.totalPaid += payment.amount;
        order.outstandingBalance = order.total - order.totalPaid;
        order.fullyPaid = order.totalPaid >= order.total;

        if (order.fullyPaid) {
          order.status = "paid";
          order.paidAt = new Date();
        }

        await order.save({ session });

        // Log audit
        await logAudit("PARTIAL_PAYMENT", context.userId, {
          orderId: order.orderId,
          paymentId: payment.paymentId,
          amount: payment.amount,
          outstandingBalance: order.outstandingBalance
        });

        return { order, payment };
      },
      context,
      {
        orderId,
        paymentMethod: paymentRequest.method,
        amount: paymentRequest.amount
      }
    );

    if (!result.success || !result.data) {
      throw new Error(`Partial payment failed: ${result.error?.message}`);
    }

    return result.data;
  }

  /**
   * Get payment history for an order
   */
  async getPaymentHistory(orderId: string): Promise<any[]> {
    return Payment.find({ orderId, status: "completed" })
      .sort({ createdAt: 1 })
      .lean();
  }
}
