import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Transaction } from "@/lib/db/models";

/**
 * GET /api/transactions
 * Fetch financial transactions with optional filters
 */
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get("type"); // "income" or "expense"
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    const filter: Record<string, any> = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .limit(limit);

    // Compute summary
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      transactions,
      summary: { income: totalIncome, expense: totalExpense, net: totalIncome - totalExpense },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

/**
 * POST /api/transactions
 * Create a new income or expense transaction
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    const { type, category, amount, description, date, status = "Completed" } = data;

    if (!type || !category || amount === undefined || !description || !date) {
      return NextResponse.json(
        { error: "Type, category, amount, description, and date are required" },
        { status: 400 }
      );
    }

    if (!["income", "expense"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'income' or 'expense'" },
        { status: 400 }
      );
    }

    const transaction = await Transaction.create({
      type,
      category,
      amount,
      description,
      date: new Date(date),
      status,
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
