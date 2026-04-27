/**
 * Inventory Management Type Definitions
 */

/**
 * Action types for inventory audit logging
 */
export type InventoryActionType = "SALE" | "RESTOCK" | "ADJUSTMENT" | "RETURN" | "WRITE_OFF";

/**
 * Unit of Measure conversion
 */
export interface UOMConversion {
  unit: string;
  conversionFactor: number; // Factor to convert to base unit
}

/**
 * Stock update details
 */
export interface StockUpdateItem {
  productId: string;
  quantity: number;
  unit: string; // Unit abbreviation (e.g., "bottles", "case", "kg")
  unitPrice?: number;
  uomConversion?: UOMConversion;
}

/**
 * Audit log entry for stock transactions
 */
export interface AuditLogEntry {
  action: InventoryActionType;
  userId: string;
  userName?: string;
  productId: string;
  productName: string;
  quantityBefore: number;
  quantityAfter: number;
  quantityChanged: number;
  unit: string;
  orderId?: string;
  transactionDetails?: {
    unitPrice?: number;
    totalValue?: number;
    referenceId?: string;
    notes?: string;
  };
  timestamp: Date;
}

/**
 * Reorder alert flag
 */
export interface ReorderAlert {
  productId: string;
  productName: string;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  alertType: "LOW_STOCK" | "OUT_OF_STOCK";
  createdAt: Date;
  resolvedAt?: Date;
  resolved: boolean;
}

/**
 * Stock update result
 */
export interface StockUpdateResult {
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  quantityChanged: number;
  unit: string;
  requiresReorder: boolean;
  reorderAlert?: ReorderAlert;
}

/**
 * Inventory service configuration options
 */
export interface InventoryServiceOptions {
  allowNegativeStock?: boolean;
  autoCreateReorderAlerts?: boolean;
  auditLogging?: boolean;
}

/**
 * Inventory transaction context
 */
export interface TransactionContext {
  userId: string;
  userName?: string;
  orderId?: string;
  actionType: InventoryActionType;
  notes?: string;
}

/**
 * Sale item for order processing
 */
export interface SaleItem {
  productId: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
}
