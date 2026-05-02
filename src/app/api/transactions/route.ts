/**
 * Transactions API - Financial Management
 * Enhanced with validation, transaction manager, and audit logging
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Transaction } from "@/lib/db/models";
import { TransactionManager } from "@/lib/services/transaction-manager";
import { Validator } from "@/lib/services/validation.service";
import { Logger, logAudit } from "@/lib/services/logger.service";
import { BaseRepository } from "@/lib/services/persistence-layer";

// Initialize transaction manager
const transactionManager = new TransactionManager();

// Create repository for Transaction
const transactionRepo = new BaseRepository(Transaction, "Transaction", transactionManager);

/**
 * GET /api/transactions
 * Fetch financial transactions with optional filters
 * Query: ?type=income&category=rent&startDate=2024-01-01&endDate=2024-12-31
 */
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

    const filter: Record<string, any> = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    try {
      const transactions = await transactionRepo.find(filter, {
        sort: { date: -1 },
        limit,
        lean: true,
      });

      // Compute summary
      const summary = transactions.reduce(
        (acc, t) => {
          if (t.type === "income") {
            acc.income += t.amount;
          } else if (t.type === "expense") {
            acc.expense += t.amount;
          }
          return acc;
        },
        { income: 0, expense: 0, net: 0 }
      );
      summary.net = summary.income - summary.expense;

      return NextResponse.json({
        transactions,
        summary,
      });
    } catch (dbError: any) {
      Logger.datastore.error("Error fetching transactions", {
        filter,
        error: dbError.message,
      });
      return NextResponse.json(
        { error: "Failed to fetch transactions", details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    Logger.error.error("Unexpected error in GET /api/transactions", {
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
 * POST /api/transactions
 * Create a new income or expense transaction with ACID guarantee
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    // Validate with Zod
    const validation = Validator.validateTransaction(data);
    if (!validation.isValid) {
      Logger.transaction.warn("Transaction creation validation failed", {
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

    const transactionData = validation.data!;

    // Extract user context
    const userId = data.userId || "system";
    const userName = data.userName || "System";

    // Create with transaction manager (ensures audit log, rollback on failure)
    const result = await transactionManager.executeWithRetry<any>(
      "create_transaction",
      "Transaction",
      async (session, ctx) => {
        const transaction = new Transaction({
          type: transactionData.type,
          category: transactionData.category,
          amount: transactionData.amount,
          description: transactionData.description,
          date: transactionData.date || new Date(),
          status: transactionData.status || "Completed",
        });

        await transaction.save({ session });

        // Audit log
        logAudit("TRANSACTION_CREATED", ctx.userId, {
          transactionId: transaction._id.toString(),
          type: transactionData.type,
          amount: transactionData.amount,
          category: transactionData.category,
          description: transactionData.description,
        });

      return transaction;
    },
    {
      userId,
      userName,
      sessionId: data.sessionId,
      metadata: { source: "financial", referenceId: data.referenceId },
    },
    {
      type: transactionData.type,
      amount: transactionData.amount,
      category: transactionData.category,
    }
  );

    if (!result.success) {
      Logger.transaction.error("Transaction creation failed after retries", {
        transactionId: result.transactionId,
        operation: result.operation,
        error: result.error?.message,
        attempts: result.retryAttempt,
      });

      return NextResponse.json(
        {
          error: result.error?.message || "Failed to create transaction",
          code: result.error?.code,
          transactionId: result.transactionId,
        },
        { status: 500 }
      );
    }

    const transaction = result.data as { _id: any } | null | undefined;
    if (!transaction || !transaction._id) {
      return NextResponse.json(
        { error: "Invalid transaction data returned" },
        { status: 500 }
      );
    }

    Logger.transaction.info("Transaction created successfully", {
      transactionId: transaction._id,
      type: transactionData.type,
      amount: transactionData.amount,
      userId,
      durationMs: result.durationMs,
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    Logger.error.error("Unexpected error in POST /api/transactions", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to create transaction", details: error.message },
      { status: 500 }
    );
  }
}
