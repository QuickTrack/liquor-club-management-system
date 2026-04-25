import { NextResponse } from "next/server";
import { initiateSTKPush } from "@/lib/mpesa";

/**
 * POST /api/mpesa/stk-push
 * Initiate M-Pesa STK Push
 * Body: {
 *   phoneNumber: "2547XXXXXXXX",
 *   amount: number,
 *   accountReference: string,
 *   transactionDesc?: string
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, amount, accountReference, transactionDesc } = body;

    if (!phoneNumber || !amount || !accountReference) {
      return NextResponse.json(
        { error: "phoneNumber, amount, and accountReference are required" },
        { status: 400 }
      );
    }

    const result = await initiateSTKPush({
      phoneNumber,
      amount,
      accountReference,
      transactionDesc,
    });

    if (result.success) {
      return NextResponse.json({
        message: "STK Push initiated",
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error: any) {
    console.error("STK Push endpoint error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
