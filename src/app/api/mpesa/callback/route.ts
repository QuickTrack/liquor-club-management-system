import { NextResponse } from "next/server";
import { handleCallback } from "@/lib/mpesa";
import type { NextRequest } from "next/server";

/**
 * POST /api/mpesa/callback
 * M-Pesa confirmation callback endpoint
 * Safaricom sends the result here after payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await handleCallback(body);
    
    if (!result) {
      return NextResponse.json({
        ResultCode: 1,
        ResultDesc: "Processing failed - no result",
      });
    }
    
    // Return success response to M-Pesa
    return NextResponse.json({
      ResultCode: result.ResultCode,
      ResultDesc: result.ResultDesc,
    });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    return NextResponse.json({
      ResultCode: 1,
      ResultDesc: "Processing failed",
    });
  }
}
