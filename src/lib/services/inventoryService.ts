/**
 * Inventory Management Service
 * Handles stock updates, validation, audit logging, and reorder flagging
 */

import mongoose from "mongoose";
import { Product, ProductUOM, AuditLog } from "@/lib/db/models";
import { AuditLogService } from "./auditLogService";
import { Logger, logAudit } from "./logger.service";
import {
  StockUpdateItem,
  StockUpdateResult,
  ReorderAlert,
  TransactionContext,
  InventoryActionType,
  InventoryServiceOptions,
  SaleItem,
  UOMConversion,
  AuditLogEntry,
} from "@/types/inventory";

/**
 * Custom error classes for inventory operations
 */
export class InventoryError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = "InventoryError";
  }
}

export class InsufficientStockError extends InventoryError {
  constructor(productName: string, available: number, requested: number) {
    super(
      `Insufficient stock for "${productName}". Available: ${available}, Requested: ${requested}`,
      "INSUFFICIENT_STOCK",
      { productName, available, requested }
    );
    this.name = "InsufficientStockError";
  }
}

export class ProductNotFoundError extends InventoryError {
  constructor(productId: string) {
    super(`Product not found: ${productId}`, "PRODUCT_NOT_FOUND", { productId });
    this.name = "ProductNotFoundError";
  }
}

export class InvalidQuantityError extends InventoryError {
  constructor(message: string) {
    super(message, "INVALID_QUANTITY");
    this.name = "InvalidQuantityError";
  }
}

/**
 * Core Inventory Service
 */
export class InventoryService {
  private options: InventoryServiceOptions;

  constructor(options?: InventoryServiceOptions) {
    this.options = {
      allowNegativeStock: false,
      autoCreateReorderAlerts: true,
      auditLogging: true,
      ...options,
    };
  }

  /**
   * Get UOM conversion factor for a product
   */
  private async getUOMConversion(productId: string, unit: string): Promise<number> {
    const productUOM = await ProductUOM.findOne({ product: productId }).lean();

    if (!productUOM) {
      // No UOM conversions defined, assume 1:1 conversion
      return 1;
    }

    const unitEntry = productUOM.units.find((u: any) => u.abbreviation === unit || u.name === unit);

    if (!unitEntry) {
      // Unit not found in conversions, try to match base unit
      if (unit === productUOM.baseUnit) {
        return 1;
      }
      // Unknown unit - default to 1 but log warning
      console.warn(`Unknown unit "${unit}" for product ${productId}, using conversion factor 1`);
      return 1;
    }

    return unitEntry.conversionFactor;
  }

  /**
   * Convert quantity from one unit to base unit
   */
  private async convertToBaseUnit(productId: string, quantity: number, unit: string): Promise<number> {
    const conversionFactor = await this.getUOMConversion(productId, unit);
    // Convert to base unit: quantity / conversionFactor
    // Example: 12 bottles with conversionFactor 12 (12 bottles = 1 case) => 1 case
    return quantity / conversionFactor;
  }

  /**
   * Validate a stock update item
   */
  private validateStockUpdateItem(item: StockUpdateItem): void {
    if (!item.productId) {
      throw new InvalidQuantityError("Product ID is required");
    }
    if (typeof item.quantity !== "number" || isNaN(item.quantity)) {
      throw new InvalidQuantityError(`Invalid quantity for product ${item.productId}: quantity must be a number`);
    }
    if (item.quantity <= 0) {
      throw new InvalidQuantityError(`Invalid quantity for product ${item.productId}: quantity must be greater than 0`);
    }
    if (!item.unit || typeof item.unit !== "string") {
      throw new InvalidQuantityError(`Invalid unit for product ${item.productId}: unit is required`);
    }
  }

  /**
   * Update stock for a single product
   */
  private async updateProductStock(
    productId: string,
    quantityChange: number,
    unit: string,
    session: mongoose.ClientSession | null,
    allowNegativeStock?: boolean
  ): Promise<StockUpdateResult> {
    const product = session 
      ? await Product.findById(productId).session(session)
      : await Product.findById(productId);

    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    const baseUnitQuantity = await this.convertToBaseUnit(productId, Math.abs(quantityChange), unit);
    const previousStock = product.stock;
    const newStock = previousStock + quantityChange;

    // Check for negative stock
    const shouldAllowNegative = allowNegativeStock ?? this.options.allowNegativeStock;
    if (!shouldAllowNegative && newStock < 0) {
      throw new InsufficientStockError(product.name, previousStock, Math.abs(quantityChange));
    }

    // Update the product stock
    product.stock = newStock;

    // Update status based on stock level
    if (newStock <= 0) {
      product.status = "Out of Stock";
    } else if (newStock <= product.reorderLevel) {
      product.status = "Low Stock";
    } else {
      product.status = "In Stock";
    }

    if (session) {
      await product.save({ session });
    } else {
      await product.save();
    }

    // Check for reorder alert
    let reorderAlert: ReorderAlert | undefined;
    const requiresReorder = newStock <= product.reorderLevel;

    if (requiresReorder && this.options.autoCreateReorderAlerts) {
      reorderAlert = await this.createReorderAlert(product, session);
    }

    return {
      productId: product._id.toString(),
      productName: product.name,
      previousStock,
      newStock,
      quantityChanged: quantityChange,
      unit: product.unit,
      requiresReorder,
      reorderAlert,
    };
  }

  /**
   * Create reorder alert
   */
  private async createReorderAlert(product: any, session: mongoose.ClientSession | null): Promise<ReorderAlert> {
    const alert: ReorderAlert = {
      productId: product._id.toString(),
      productName: product.name,
      currentStock: product.stock,
      reorderLevel: product.reorderLevel,
      unit: product.unit,
      alertType: product.stock <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
      createdAt: new Date(),
      resolved: false,
    };

    // Log reorder alert with structured logger
    Logger.datastore.warn("Reorder alert triggered", {
      productId: product._id.toString(),
      productName: product.name,
      currentStock: product.stock,
      reorderLevel: product.reorderLevel,
      unit: product.unit,
      alertType: alert.alertType,
    });

    // TODO: Persist alert to dedicated collection in future
    // await ReorderAlert.create([alert], { session });

    return alert;
  }

  /**
   * Update stock for multiple items atomically
   */
  async updateStock(
    items: StockUpdateItem[],
    context: TransactionContext,
    options?: { allowNegativeStock?: boolean }
  ): Promise<StockUpdateResult[]> {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new InvalidQuantityError("At least one item is required for stock update");
    }

    // Validate all items first
    items.forEach((item) => this.validateStockUpdateItem(item));

    // Check if MongoDB is running as a replica set (for transactions)
    const isReplicaSet = mongoose.connection.readyState === 1 && 
      (mongoose.connection as any).client?.options?.replSetHosts;

    const useTransactions = isReplicaSet;
    let session: mongoose.ClientSession | null = null;

    if (useTransactions) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const results: StockUpdateResult[] = [];
    const previousStocks: { productId: string; stock: number }[] = [];

    try {
      // First pass: validate all items can be updated (check stock levels)
      for (const item of items) {
        const product = useTransactions
          ? await Product.findById(item.productId).session(session!)
          : await Product.findById(item.productId);

        if (!product) {
          Logger.datastore.error("Product not found for stock update", { productId: item.productId });
          throw new ProductNotFoundError(item.productId);
        }

        const baseUnitQuantity = await this.convertToBaseUnit(item.productId, item.quantity, item.unit);
        const newStock = product.stock - baseUnitQuantity;

        const shouldAllowNegative = options?.allowNegativeStock ?? this.options.allowNegativeStock;
        if (!shouldAllowNegative && newStock < 0) {
          Logger.datastore.warn("Insufficient stock for sale", {
            productId: product._id.toString(),
            productName: product.name,
            available: product.stock,
            requested: baseUnitQuantity,
          });
          throw new InsufficientStockError(product.name, product.stock, Math.abs(baseUnitQuantity));
        }

        previousStocks.push({ productId: item.productId, stock: product.stock });
      }

      // Second pass: perform all updates
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const baseUnitQuantity = await this.convertToBaseUnit(item.productId, item.quantity, item.unit);
        
        const result = await this.updateProductStock(
          item.productId,
          -baseUnitQuantity,
          item.unit,
          session,
          options?.allowNegativeStock
        );
        results.push(result);

        if (this.options.auditLogging) {
          const auditLogEntry: Omit<AuditLogEntry, "timestamp"> = {
            action: context.actionType,
            userId: context.userId,
            userName: context.userName,
            productId: result.productId,
            productName: result.productName,
            quantityBefore: previousStocks[i].stock,
            quantityAfter: result.newStock,
            quantityChanged: result.quantityChanged,
            unit: result.unit,
            orderId: context.orderId,
            transactionDetails: {
              unitPrice: item.unitPrice,
              totalValue: item.unitPrice ? item.unitPrice * item.quantity : undefined,
              referenceId: context.orderId,
              notes: context.notes,
            },
          };

          if (useTransactions && session) {
            await AuditLogService.createLog(auditLogEntry, session);
          } else {
            await AuditLogService.createLog(auditLogEntry);
          }
        }
      }

      if (useTransactions && session) {
        await session.commitTransaction();
        session.endSession();
      }

      return results;
      } catch (error) {
        if (useTransactions && session) {
          await session.abortTransaction();
          session.endSession();
          Logger.datastore.error("Transaction aborted due to inventory update failure", {
            error: (error as Error).message,
            itemsCount: items.length,
          });
        } else {
          // Manual rollback: restore previous stock levels
          for (const prev of previousStocks) {
            await Product.findByIdAndUpdate(prev.productId, { stock: prev.stock });
          }
          // Clean up audit logs for this transaction
          if (context.orderId) {
            await AuditLog.deleteMany({ "details.orderId": context.orderId });
          }
          Logger.datastore.warn("Manual rollback performed (non-transactional mode)", {
            previousStocksCount: previousStocks.length,
            orderId: context.orderId,
          });
        }
        throw error;
      }
  }

  /**
   * Process a sale (decrement stock)
   */
  async processSale(saleItems: SaleItem[], context: TransactionContext): Promise<StockUpdateResult[]> {
    const stockUpdateItems: StockUpdateItem[] = saleItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
    }));

    return this.updateStock(stockUpdateItems, {
      ...context,
      actionType: "SALE",
    });
  }

  /**
   * Restock items (increment stock)
   */
  async restockItems(items: StockUpdateItem[], context: TransactionContext): Promise<StockUpdateResult[]> {
    const isReplicaSet = mongoose.connection.readyState === 1 && 
      (mongoose.connection as any).client?.options?.replSetHosts;
    const useTransactions = isReplicaSet;

    const session = useTransactions ? await mongoose.startSession() : null;
    if (session) {
      session.startTransaction();
    }

    try {
      const results: StockUpdateResult[] = [];

      for (const item of items) {
        this.validateStockUpdateItem(item);
        const baseUnitQuantity = await this.convertToBaseUnit(item.productId, item.quantity, item.unit);
        const result = await this.updateProductStock(item.productId, baseUnitQuantity, item.unit, session);
        results.push(result);

        if (this.options.auditLogging) {
          const auditLogEntry: Omit<AuditLogEntry, "timestamp"> = {
            action: "RESTOCK",
            userId: context.userId,
            userName: context.userName,
            productId: result.productId,
            productName: result.productName,
            quantityBefore: result.previousStock,
            quantityAfter: result.newStock,
            quantityChanged: result.quantityChanged,
            unit: result.unit,
            orderId: context.orderId,
            transactionDetails: {
              unitPrice: item.unitPrice,
              totalValue: item.unitPrice ? item.unitPrice * item.quantity : undefined,
              referenceId: context.orderId,
              notes: context.notes,
            },
          };

          if (session) {
            await AuditLogService.createLog(auditLogEntry, session);
          } else {
            await AuditLogService.createLog(auditLogEntry);
          }
        }
      }

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      return results;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }

  /**
   * Adjust stock (manual adjustment)
   */
  async adjustStock(items: StockUpdateItem[], context: TransactionContext): Promise<StockUpdateResult[]> {
    const isReplicaSet = mongoose.connection.readyState === 1 && 
      (mongoose.connection as any).client?.options?.replSetHosts;
    const useTransactions = isReplicaSet;

    const session = useTransactions ? await mongoose.startSession() : null;
    if (session) {
      session.startTransaction();
    }

    try {
      const results: StockUpdateResult[] = [];

      for (const item of items) {
        this.validateStockUpdateItem(item);
        const baseUnitQuantity = await this.convertToBaseUnit(item.productId, item.quantity, item.unit);
        const result = await this.updateProductStock(
          item.productId,
          baseUnitQuantity,
          item.unit,
          session,
          true // Allow negative for adjustments
        );
        results.push(result);

        if (this.options.auditLogging) {
          const auditLogEntry: Omit<AuditLogEntry, "timestamp"> = {
            action: "ADJUSTMENT",
            userId: context.userId,
            userName: context.userName,
            productId: result.productId,
            productName: result.productName,
            quantityBefore: result.previousStock,
            quantityAfter: result.newStock,
            quantityChanged: result.quantityChanged,
            unit: result.unit,
            orderId: context.orderId,
            transactionDetails: {
              unitPrice: item.unitPrice,
              totalValue: item.unitPrice ? item.unitPrice * item.quantity : undefined,
              referenceId: context.orderId,
              notes: context.notes,
            },
          };

          if (session) {
            await AuditLogService.createLog(auditLogEntry, session);
          } else {
            await AuditLogService.createLog(auditLogEntry);
          }
        }
      }

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      return results;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(productId: string): Promise<any> {
    return Product.findById(productId).lean();
  }

  /**
   * Get all products
   */
  async getAllProducts(): Promise<any[]> {
    return Product.find().lean();
  }

  /**
   * Get products that need reordering
   */
  async getProductsNeedingReorder(): Promise<any[]> {
    const allProducts = await Product.find().lean();
    return allProducts.filter(p => p.stock <= p.reorderLevel);
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(): Promise<any[]> {
    const allProducts = await Product.find().lean();
    return allProducts.filter(p => p.stock > 0 && p.stock <= p.reorderLevel);
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts(): Promise<any[]> {
    return Product.find({ stock: { $lte: 0 } }).lean();
  }
}

// Export a default instance
export const inventoryService = new InventoryService({
  allowNegativeStock: false,
  autoCreateReorderAlerts: true,
  auditLogging: true,
});
