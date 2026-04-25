import crypto from "crypto";
import { MPESATransaction } from "@/lib/db/models";
import { connectDB } from "@/lib/db/connection";

const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_PASSKEY,
  MPESA_SHORTCODE,
  MPESA_CALLBACK_URL,
  MPESA_ENV = "sandbox",
} = process.env;

if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_PASSKEY || !MPESA_SHORTCODE) {
  throw new Error("M-Pesa configuration missing in environment variables");
}

// Safaricom URLs
const BASE_URL = MPESA_ENV === "production"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

const AUTH_URL = `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;
const STK_PUSH_URL = `${BASE_URL}/mpesa/stkpush/v1/processrequest`;

/**
 * Generate M-Pesa password (base64 encoded)
 */
function generatePassword(timestamp: string): string {
  const password = `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(password).toString("base64");
}

/**
 * Generate timestamp in the format YYYYMMDDHHmmss
 */
function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
}

/**
 * Get M-Pesa access token (cached to avoid excess calls)
 */
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");
  
  const res = await fetch(AUTH_URL, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get M-Pesa access token: ${res.status} ${text}`);
  }

  const data = await res.json();
  const token = data.access_token;
  cachedToken = token;
  // Token expires in 3599 seconds; we'll refresh a bit earlier
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  return token;
}

/**
 * Initiate STK Push payment
 */
export async function initiateSTKPush(params: {
  phoneNumber: string; // Format: 2547XXXXXXXX
  amount: number;
  accountReference: string;
  transactionDesc?: string;
  orderId?: string;
}): Promise<{ success: boolean; message: string; checkoutRequestId?: string; merchantRequestId?: string }> {
  await connectDB();

  const { phoneNumber, amount, accountReference, transactionDesc = "Payment", orderId } = params;

  if (!phoneNumber.startsWith("254")) {
    return { success: false, message: "Phone number must be in format 2547XXXXXXXX" };
  }

  const timestamp = generateTimestamp();
  const password = generatePassword(timestamp);

  const accessToken = await getAccessToken();

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: `${MPESA_CALLBACK_URL}`,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  try {
    const res = await fetch(STK_PUSH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.ResponseCode === "0") {
      // Save transaction record
      await MPESATransaction.create({
        merchantRequestId: data.MerchantRequestID,
        checkoutRequestId: data.CheckoutRequestID,
        phoneNumber,
        amount,
        accountReference,
        transactionDesc,
        status: "Pending",
      });

      return {
        success: true,
        message: "STK push sent successfully",
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
      };
    } else {
      // Log error but still save attempt
      await MPESATransaction.create({
        merchantRequestId: data.MerchantRequestID || `ERR-${Date.now()}`,
        checkoutRequestId: data.CheckoutRequestID || `ERR-${Date.now()}`,
        phoneNumber,
        amount,
        accountReference,
        transactionDesc,
        status: "Failed",
        resultCode: parseInt(data.ResponseCode),
        resultDesc: data.ResponseDescription,
      });
      return {
        success: false,
        message: data.ResponseDescription || "Failed to initiate STK push",
      };
    }
  } catch (error: any) {
    console.error("STK Push error:", error);
    return { success: false, message: error.message || "Network error" };
  }
}

/**
 * Handle M-Pesa callback (confirmation and validation)
 */
export async function handleCallback(body: any) {
  await connectDB();

  const { Body } = body;
  if (!Body) {
    console.error("Invalid callback body");
    return;
  }

  const { stkCallback } = Body;
  const { CheckoutRequestID, MerchantRequestID, ResultCode, ResultDesc, } = stkCallback;

  // Update the transaction record
  const update: Record<string, any> = {
    status: ResultCode === 0 ? "Completed" : "Failed",
    resultCode: ResultCode,
    resultDesc: ResultDesc,
  };

  // If successful, extract metadata
  if (ResultCode === 0 && stkCallback.CallbackMetadata) {
    const items = stkCallback.CallbackMetadata.Item;
    const metadata: Record<string, any> = {};
    items.forEach((item: any) => {
      metadata[item.Name] = item.Value;
    });
    update.metadata = metadata;
    update.mpesaReceiptNumber = metadata["MpesaReceiptNumber"] || undefined;
    update.transactionDate = metadata["TransactionDate"] ? new Date(metadata["TransactionDate"]) : undefined;
    const phone = metadata["PhoneNumber"];
    update.phoneNumber = phone ? String(phone) : undefined;
  }

  await MPESATransaction.findOneAndUpdate(
    { checkoutRequestId: CheckoutRequestID },
    update,
    { new: true }
  );

  // If payment completed, you might want to update related order status, etc.
  return { ResultCode, ResultDesc };
}

/**
 * Query STK push status
 */
export async function querySTKStatus(checkoutRequestId: string): Promise<{
  success: boolean;
  status?: string;
  message: string;
}> {
  const accessToken = await getAccessToken();

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: generatePassword(generateTimestamp()),
    Timestamp: generateTimestamp(),
    CheckoutRequestID: checkoutRequestId,
  };

  try {
    const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.ResponseCode === "0") {
      return { success: true, status: data.ResponseDescription, message: data.ResponseDescription };
    } else {
      return { success: false, message: data.ResponseDescription || "Query failed" };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Network error" };
  }
}
