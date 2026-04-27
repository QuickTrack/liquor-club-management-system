/**
 * Audit Log Service
 * Handles detailed audit logging for all inventory transactions
 */

import mongoose from "mongoose";
import { AuditLog } from "@/lib/db/models";
import { InventoryActionType, AuditLogEntry } from "@/types/inventory";

/**
 * Creates a detailed audit log entry for an inventory transaction
 */
export class AuditLogService {
  /**
   * Create a single audit log entry
   */
  static async createLog(entry: Omit<AuditLogEntry, "timestamp">, session?: mongoose.ClientSession): Promise<void> {
    const auditLog = new AuditLog({
      action: entry.action,
      user: entry.userId,
      details: JSON.stringify({
        productId: entry.productId,
        productName: entry.productName,
        quantityBefore: entry.quantityBefore,
        quantityAfter: entry.quantityAfter,
        quantityChanged: entry.quantityChanged,
        unit: entry.unit,
        orderId: entry.orderId,
        transactionDetails: entry.transactionDetails,
      }),
      date: new Date(),
    });

    if (session) {
      await auditLog.save({ session });
    } else {
      await auditLog.save();
    }
  }

  /**
   * Create multiple audit log entries in a batch
   */
  static async createLogs(entries: Array<Omit<AuditLogEntry, "timestamp">>, session?: mongoose.ClientSession): Promise<void> {
    const auditLogs = entries.map(entry => ({
      action: entry.action,
      user: entry.userId,
      details: JSON.stringify({
        productId: entry.productId,
        productName: entry.productName,
        quantityBefore: entry.quantityBefore,
        quantityAfter: entry.quantityAfter,
        quantityChanged: entry.quantityChanged,
        unit: entry.unit,
        orderId: entry.orderId,
        transactionDetails: entry.transactionDetails,
      }),
      date: new Date(),
    }));

    if (session) {
      await AuditLog.insertMany(auditLogs, { session });
    } else {
      await AuditLog.insertMany(auditLogs);
    }
  }

  /**
   * Get audit logs with optional filters
   */
  static async getLogs(options?: {
    userId?: string;
    action?: InventoryActionType;
    productId?: string;
    orderId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: any[]; total: number }> {
    const filter: Record<string, any> = {};

    if (options?.userId) filter.user = options.userId;
    if (options?.action) filter.action = options.action;
    if (options?.productId) {
      filter["details.productId"] = options.productId;
    }
    if (options?.orderId) {
      filter["details.orderId"] = options.orderId;
    }
    if (options?.startDate || options?.endDate) {
      filter.date = {};
      if (options.startDate) filter.date.$gte = options.startDate;
      if (options.endDate) filter.date.$lte = options.endDate;
    }

    const logs = await AuditLog.find(filter)
      .sort({ date: -1 })
      .limit(options?.limit || 100)
      .skip(options?.offset || 0);

    const total = await AuditLog.countDocuments(filter);

    return { logs, total };
  }

  /**
   * Format audit log details for display
   */
  static formatLogDetails(log: any): AuditLogEntry | null {
    try {
      const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
      return {
        action: log.action,
        userId: log.user,
        productId: details.productId,
        productName: details.productName,
        quantityBefore: details.quantityBefore,
        quantityAfter: details.quantityAfter,
        quantityChanged: details.quantityChanged,
        unit: details.unit,
        orderId: details.orderId,
        transactionDetails: details.transactionDetails,
        timestamp: log.date,
      };
    } catch (error) {
      console.error("Error formatting log details:", error);
      return null;
    }
  }
}
