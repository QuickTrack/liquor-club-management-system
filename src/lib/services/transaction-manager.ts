/**
 * Transaction Manager Service
 * Provides ACID-compliant transactions with automatic retry,
 * comprehensive error handling, and persistent failure logging
 */

import mongoose, { ClientSession, Document } from "mongoose";
import { Logger, logTransaction, logAudit, logDatastore } from "./logger.service";
import { validateWithSchema } from "./validation.service";
import { createOrderSchema, transactionSchema } from "./validation.service";
import { FailedTransaction } from "@/lib/db/models";
import { InventoryService } from "./inventoryService";
import type { ValidationResult } from "./validation.service";

/**
 * Configuration for transaction retry policy
 */
export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Transaction context with correlation data
 */
export interface TransactionContext {
  transactionId: string;
  userId: string;
  userName?: string;
  clientIP?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Operation result with outcome details
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: TransactionError;
  transactionId: string;
  operation: string;
  durationMs: number;
  retryAttempt: number;
}

/**
 * Detailed transaction error
 */
export interface TransactionError {
  message: string;
  code?: string;
  type: "validation" | "conflict" | "not_found" | "system" | "network" | "unknown";
  details?: any;
  stack?: string;
  isRetryable: boolean;
  isPermanent: boolean;
}

/**
 * Transaction operation wrapper
 */
type TransactionOperation<T, U = void> = (
  session: ClientSession,
  context: TransactionContext
) => Promise<T | U>;

/**
 * Default retry policy: exponential backoff
 */
const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

/**
 * Delay utility with jitter
 */
function delay(ms: number): Promise<void> {
  const jitter = Math.random() * 0.1 * ms; // 10% jitter
  return new Promise((resolve) => setTimeout(resolve, ms + jitter));
}

/**
 * Calculate delay for retry attempt using exponential backoff
 */
function getRetryDelay(attempt: number, policy: RetryPolicy): number {
  const delay = Math.min(
    policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt - 1),
    policy.maxDelayMs
  );
  return Math.floor(delay);
}

/**
 * Classify error for retry decisions
 */
function classifyError(error: unknown): TransactionError {
  const err = error as Error;

  // Mongoose errors
  if ((err as any).name === "MongoServerError") {
    const mongoErr = err as any;

    // Duplicate key - permanent
    if (mongoErr.code === 11000) {
      return {
        message: mongoErr.message || "Duplicate key error",
        code: String(mongoErr.code),
        type: "conflict",
        details: mongoErr.keyPattern,
        isRetryable: false,
        isPermanent: true,
      };
    }

    // Network errors - retryable
    if (mongoErr.code === 89 || mongoErr.code === 91 || mongoErr.code === 9001) {
      return {
        message: mongoErr.message || "Network error",
        code: String(mongoErr.code),
        type: "network",
        isRetryable: true,
        isPermanent: false,
      };
    }

    // Write concern failed - retryable
    if (mongoErr.code === 64) {
      return {
        message: mongoErr.message || "Write concern failed",
        code: String(mongoErr.code),
        type: "system",
        isRetryable: true,
        isPermanent: false,
      };
    }
  }

  // Validation errors - permanent
  if (err.name === "ZodError") {
    return {
      message: "Validation failed",
      type: "validation",
      details: err,
      isRetryable: false,
      isPermanent: true,
    };
  }

  // Cast errors (invalid ObjectId) - permanent
  if (err.name === "CastError") {
    return {
      message: `Invalid ID: ${err.message}`,
      type: "validation",
      isRetryable: false,
      isPermanent: true,
    };
  }

  // Not found errors - permanent for single operations
  if (err.message?.includes("not found")) {
    return {
      message: err.message,
      type: "not_found",
      isRetryable: false,
      isPermanent: true,
    };
  }

  // Default: unknown error, treat as possibly retryable
  return {
    message: err.message || "Unknown error",
    type: "unknown",
    stack: err.stack,
    isRetryable: true,
    isPermanent: false,
  };
}

/**
 * Log failed transaction to persistent storage
 */
async function logFailedTransaction(
  context: TransactionContext,
  operation: string,
  entityType: string,
  payload: Record<string, any>,
  error: TransactionError,
  attempt: number,
  retryPolicy: RetryPolicy
): Promise<void> {
  try {
    const transactionId = `${context.transactionId}_attempt_${attempt}`;

    const failedTxData = {
      transactionId,
      operationType: operation,
      entityType,
      payload,
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack,
        details: error.details,
      },
      severity: error.isPermanent ? "critical" : "high",
      status: attempt >= 3 ? "archived" : "pending_retry",
      retryCount: attempt,
      firstFailedAt: new Date(),
      lastAttemptedAt: new Date(),
      retryAfter: attempt < 3 ? new Date(Date.now() + getRetryDelay(attempt + 1, retryPolicy)) : undefined,
      userId: context.userId,
      sessionId: context.sessionId,
      metadata: context.metadata,
    };

    await FailedTransaction.create(failedTxData);

    Logger.error.error(`Failed transaction logged: ${transactionId}`, {
      operation,
      entityType,
      severity: failedTxData.severity,
      error: error.message,
      transactionId: context.transactionId,
    });
  } catch (logErr) {
    Logger.error.error("Failed to log failed transaction", {
      originalError: error.message,
      logError: (logErr as Error).message,
    });
  }
}

/**
 * Transaction Manager
 * Coordinates multi-document ACID transactions with validation, retry, and logging
 */
export class TransactionManager {
  private inventoryService: InventoryService;
  private retryPolicy: RetryPolicy;

  constructor(inventoryService?: InventoryService, retryPolicy?: RetryPolicy) {
    this.inventoryService = inventoryService || new InventoryService();
    this.retryPolicy = retryPolicy || DEFAULT_RETRY_POLICY;
  }

  /**
   * Generate a unique transaction ID
   */
  private generateTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `tx_${timestamp}_${random}`;
  }

  /**
   * Execute a transaction with retry logic
   */
  async executeWithRetry<T>(
    operation: string,
    entityType: string,
    fn: TransactionOperation<T>,
    context: Omit<TransactionContext, "transactionId">,
    payload: Record<string, any> = {}
  ): Promise<OperationResult<T>> {
    const transactionId = this.generateTransactionId();
    const fullContext: TransactionContext = {
      ...context,
      transactionId,
    };

    let lastError: TransactionError | null = null;

    for (let attempt = 1; attempt <= this.retryPolicy.maxAttempts; attempt++) {
      const startTime = Date.now();
      let session: ClientSession | null = null;

      try {
        logTransaction("transaction_started", {
          transactionId,
          operation,
          attempt,
          userId: context.userId,
        });

        // Check if MongoDB is running as replica set (required for transactions)
        const isReplicaSet = mongoose.connection.readyState === 1 &&
          (mongoose.connection as any).client?.options?.replSetHosts;

        if (!isReplicaSet) {
          Logger.transaction.warn(`MongoDB not running as replica set - transactions disabled for ${transactionId}`);
          // Execute without transaction (best effort)
          const result = await fn(null as unknown as ClientSession, fullContext);
          return {
            success: true,
            data: result as T,
            transactionId,
            operation,
            durationMs: Date.now() - startTime,
            retryAttempt: attempt,
          };
        }

        // Start session
        session = await mongoose.startSession();
        session.startTransaction();

        logDatastore("transaction_start", "session", { transactionId, sessionId: session.id });

        // Execute operation
        const result = await fn(session, fullContext);

        // Commit
        await session.commitTransaction();
        session.endSession();

        const duration = Date.now() - startTime;

        logTransaction("transaction_committed", {
          transactionId,
          operation,
          durationMs: duration,
          attempt,
        });

        logAudit("TRANSACTION_COMMIT", context.userId, {
          transactionId,
          operation,
          entityType,
          durationMs: duration,
        });

        return {
          success: true,
          data: result as T,
          transactionId,
          operation,
          durationMs: duration,
          retryAttempt: attempt,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        lastError = classifyError(error);

        // Abort transaction if session exists
        if (session) {
          try {
            await session.abortTransaction();
            session.endSession();
            logDatastore("transaction_aborted", "session", { transactionId, reason: lastError.message });
          } catch (abortErr) {
            Logger.error.error("Failed to abort transaction", {
              transactionId,
              error: (abortErr as Error).message,
            });
          }
        }

        logTransaction("transaction_failed", {
          transactionId,
          operation,
          attempt,
          error: lastError.message,
          type: lastError.type,
          retryable: lastError.isRetryable,
          durationMs: duration,
        });

        // If error is permanent or max retries reached, log and bail
        if (lastError.isPermanent || attempt >= this.retryPolicy.maxAttempts) {
          // Log failed transaction for audit
          await logFailedTransaction(
            fullContext,
            operation,
            entityType,
            payload,
            lastError,
            attempt,
            this.retryPolicy
          );

          return {
            success: false,
            transactionId,
            operation,
            durationMs: duration,
            retryAttempt: attempt,
            error: lastError,
          };
        }

        // Wait before retry with exponential backoff
        const delayMs = getRetryDelay(attempt, this.retryPolicy);
        logTransaction("transaction_retrying", {
          transactionId,
          attempt,
          delayMs,
        });

        await delay(delayMs);
      }
    }

    // Should not reach here, but return last error if we do
    return {
      success: false,
      transactionId: "",
      operation,
      durationMs: 0,
      retryAttempt: this.retryPolicy.maxAttempts,
      error: lastError || {
        message: "Unknown transaction failure",
        type: "unknown",
        isRetryable: false,
        isPermanent: true,
      },
    };
  }

  /**
   * Create an order with full ACID guarantees
   */
  async createOrder(
    orderData: unknown,
    context: Omit<TransactionContext, "transactionId">
  ): Promise<OperationResult> {
    // Validate input using validateWithSchema directly
    const validation = validateWithSchema(createOrderSchema, orderData) as ValidationResult<any>;
    if (!validation.isValid) {
      return {
        success: false,
        transactionId: "",
        operation: "create_order",
        durationMs: 0,
        retryAttempt: 0,
        error: {
          message: "Validation failed",
          type: "validation",
          details: validation.errors,
          isRetryable: false,
          isPermanent: true,
        },
      };
    }

    const order = validation.data!;

    return this.executeWithRetry(
      "create_order",
      "Order",
      async (session, ctx) => {
        const { Order, Customer, Product } = await import("@/lib/db/models");

        // Build order document
        const orderDoc = new Order({
          ...order,
          orderId: `ORD-${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          subtotal: 0,
          tax: 0,
          total: 0,
          pointsEarned: 0,
        });

        // Ensure customer is set: use provided customerId or fall back to Walk-in Customer
        if (order.customerId) {
          orderDoc.customer = order.customerId;
        } else {
          const walkIn = await Customer.findOne({ name: "Walk-in Customer" }).session(session);
          if (walkIn) {
            orderDoc.customer = walkIn._id;
          } else {
            throw new Error("No customer provided and no default Walk-in Customer exists");
          }
        }

        // Process order items with inventory deduction
        let grossSubtotal = 0;
        for (const item of order.items) {
          const product = await Product.findById(item.productId).session(session);
          if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
          }

          // Calculate unit price if not provided
          const unitPrice = item.unitPrice || product.sellPrice;
          const lineTotal = unitPrice * item.quantity;
          grossSubtotal += lineTotal;
        }

        // Derive net subtotal (exclusive of VAT) using 16% rate
        const subtotal = grossSubtotal / 1.16;
        const tax = grossSubtotal - subtotal;
        const total = grossSubtotal;

        orderDoc.subtotal = subtotal;
        orderDoc.tax = tax;
        orderDoc.total = total;
        orderDoc.pointsEarned = Math.floor(total / 100); // 1 point per 100 spent

        // Save order
        await orderDoc.save({ session });

        // Update inventory atomically
        if (order.items.length > 0) {
          await this.inventoryService.processSale(
            order.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
            })),
            {
              userId: ctx.userId,
              userName: ctx.userName,
              orderId: orderDoc.orderId,
              actionType: "SALE",
            }
          );
        }

        // Update customer stats if customer provided
        if (order.customerId) {
          const customer = await Customer.findById(order.customerId).session(session);
          if (customer) {
            customer.totalSpent += total;
            customer.visits += 1;
            customer.points += orderDoc.pointsEarned;
            await customer.save({ session });
          }
        }

        return orderDoc;
      },
      context,
      { items: order?.items, customerId: order?.customerId }
    );
  }

  /**
   * Process a financial transaction with full audit trail
   */
  async createTransaction(
    transactionData: unknown,
    context: Omit<TransactionContext, "transactionId">
  ): Promise<OperationResult> {
    // Validate
    const validation = validateWithSchema(transactionSchema, transactionData) as ValidationResult<any>;
    if (!validation.isValid) {
      return {
        success: false,
        transactionId: "",
        operation: "create_transaction",
        durationMs: 0,
        retryAttempt: 0,
        error: {
          message: "Validation failed",
          type: "validation",
          details: validation.errors,
          isRetryable: false,
          isPermanent: true,
        },
      };
    }

    const data = validation.data!;

    return this.executeWithRetry(
      "create_transaction",
      "Transaction",
      async (session, ctx) => {
        const { Transaction } = await import("@/lib/db/models");

        const transaction = new Transaction({
          type: data.type,
          category: data.category,
          amount: data.amount,
          description: data.description,
          date: data.date || new Date(),
          status: data.status || "Completed",
        });

        await transaction.save({ session });

        logAudit("TRANSACTION_CREATED", ctx.userId, {
          transactionId: transaction._id.toString(),
          type: data.type,
          amount: data.amount,
          category: data.category,
        });

        return transaction;
      },
      context,
      { amount: data.amount, type: data.type, category: data.category }
    );
  }

  /**
   * Batch create orders in a single transaction
   */
  async createOrdersBatch(
    ordersData: unknown[],
    context: Omit<TransactionContext, "transactionId">
  ): Promise<OperationResult<any[]>> {
    if (!ordersData || ordersData.length === 0) {
      return {
        success: false,
        transactionId: "",
        operation: "create_orders_batch",
        durationMs: 0,
        retryAttempt: 0,
        error: {
          message: "Orders array cannot be empty",
          type: "validation",
          isRetryable: false,
          isPermanent: true,
        },
      };
    }

    // Validate all orders first
    const validatedOrders = ordersData.map((data, index) => {
      const validation = validateWithSchema(createOrderSchema, data) as ValidationResult<any>;
      if (!validation.isValid) {
        throw new Error(`Order ${index + 1} validation failed: ${JSON.stringify(validation.errors)}`);
      }
      return validation.data!;
    });

    return this.executeWithRetry(
      "create_orders_batch",
      "Order",
      async (session, ctx) => {
        const { Order } = await import("@/lib/db/models");
        const createdOrders: any[] = [];

        for (const orderData of validatedOrders) {
          const order = new Order({
            ...orderData,
            orderId: `ORD-${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            subtotal: 0,
            tax: 0,
            total: 0,
          });

          await order.save({ session });
          createdOrders.push(order);
        }

        return createdOrders;
      },
      context,
      { count: validatedOrders.length }
    );
  }
}

// Export singleton instance
export const transactionManager = new TransactionManager();
