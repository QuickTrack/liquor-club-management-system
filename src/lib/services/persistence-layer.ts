/**
 * Persistence Layer - Repository Pattern Implementation
 * Provides a unified interface for all database operations with
 * built-in validation, logging, error handling, and ACID guarantees
 */

import mongoose, { ClientSession, UpdateQuery } from "mongoose";
import type { HydratedDocument } from "mongoose";

// Simple FilterQuery type alias (MongoDB query object)
export type DbFilter<T = any> = Record<string, any>;

import {
  Logger,
  logDatastore,
  logAudit,
  logTransaction,
} from "./logger.service";
import { Validator, ValidationResult } from "./validation.service";
import { TransactionManager, TransactionContext, type OperationResult } from "./transaction-manager";
import {
  Order,
  Product,
  Customer,
  Transaction as FinTransaction,
  Staff,
  AuditLog,
  FailedTransaction,
} from "@/lib/db/models";
import type { IOrder } from "@/lib/db/models";
import {
  StockUpdateItem,
  SaleItem,
  TransactionContext as InventoryContext,
} from "@/types/inventory";
import { InventoryService } from "./inventoryService";

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Query options for repository methods
 */
export interface QueryOptions {
  populate?: string | string[];
  select?: string;
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
  lean?: boolean;
  session?: ClientSession | null;
}

/**
 * Base repository interface
 */
export interface IRepository<T> {
  findById(id: string, options?: QueryOptions): Promise<T | null>;
  findOne(filter: DbFilter<T>, options?: QueryOptions): Promise<T | null>;
  find(filter?: DbFilter<T>, options?: QueryOptions): Promise<T[]>;
  findPaginated(
    filter?: DbFilter<T>,
    options?: QueryOptions & { page: number; limit: number }
  ): Promise<PaginatedResult<T>>;
  create(data: Partial<T>, context?: TransactionContext): Promise<T>;
  update(id: string, data: UpdateQuery<T>, context?: TransactionContext): Promise<T | null>;
  delete(id: string, context?: TransactionContext): Promise<boolean>;
  count(filter?: DbFilter<T>): Promise<number>;
  bulkCreate(data: Partial<T>[], context?: TransactionContext): Promise<T[]>;
  bulkUpdate(filter: DbFilter<T>, update: UpdateQuery<T>, context?: TransactionContext): Promise<number>;
}

/**
 * Base repository implementation
 */
export class BaseRepository<T> implements IRepository<T> {
  protected model: mongoose.Model<T>;
  protected entityName: string;
  protected transactionManager: TransactionManager;
  protected inventoryService: InventoryService;

  constructor(
    model: mongoose.Model<T>,
    entityName: string,
    transactionManager?: TransactionManager,
    inventoryService?: InventoryService
  ) {
    this.model = model;
    this.entityName = entityName;
    this.transactionManager = transactionManager || new TransactionManager();
    this.inventoryService = inventoryService || new InventoryService();
  }

  async findById(id: string, options?: QueryOptions): Promise<T | null> {
    try {
      logDatastore("find_one", this.entityName, { id });

      let query = this.model.findById(id);
      if (options?.populate) {
        query = query.populate(options.populate);
      }
      if (options?.select) {
        query = query.select(options.select);
      }

      const doc = options?.lean
        ? (await query.lean()) as any
        : await query;

      return doc || null;
    } catch (error) {
      Logger.datastore.error(`Error finding ${this.entityName} by ID`, {
        id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

   async findOne(filter: DbFilter<T>, options?: QueryOptions): Promise<T | null> {
     try {
       logDatastore("find_one", this.entityName, { filter });

       let query = this.model.findOne(filter);
       if (options?.populate) {
         query = query.populate(options.populate);
       }
       if (options?.select) {
         query = query.select(options.select);
       }
       if (options?.sort) {
         query = query.sort(options.sort);
       }

       const doc = options?.lean
         ? (await query.lean()) as any
         : await query;

       return doc || null;
     } catch (error) {
       Logger.datastore.error(`Error finding ${this.entityName}`, {
         filter,
         error: (error as Error).message,
       });
       throw error;
     }
   }

   async find(filter?: DbFilter<T>, options?: QueryOptions): Promise<T[]> {
     try {
       logDatastore("find", this.entityName, { filter, options });

       let query = this.model.find(filter || {});
      if (options?.populate) {
        query = query.populate(options.populate);
      }
      if (options?.select) {
        query = query.select(options.select);
      }
      if (options?.sort) {
        query = query.sort(options.sort);
      }
      if (options?.skip) {
        query = query.skip(options.skip);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const docs = options?.lean
        ? (await query.lean()) as any[]
        : await query;

      return docs;
    } catch (error) {
      Logger.datastore.error(`Error querying ${this.entityName}`, {
        filter,
        error: (error as Error).message,
      });
      throw error;
    }
  }

   async findPaginated(
     filter: DbFilter<T> = {},
     options: QueryOptions & { page: number; limit: number } = { page: 1, limit: 50 }
   ): Promise<PaginatedResult<T>> {
    const skip = (options.page - 1) * options.limit;
    const total = await this.count(filter);
    const data = await this.find(filter, {
      ...options,
      skip,
      limit: options.limit,
    });

    return {
      data,
      total,
      page: options.page,
      limit: options.limit,
      hasMore: skip + data.length < total,
    };
  }

  async create(data: Partial<T>, context?: TransactionContext): Promise<T> {
    try {
      logDatastore("create", this.entityName, { data });

      const doc = new this.model(data);

      if (context) {
        // Use transaction manager
        const result = await this.transactionManager.executeWithRetry(
          `create_${this.entityName.toLowerCase()}`,
          this.entityName,
          async (session, ctx) => {
            doc.save({ session });
            return doc;
          },
          context,
          { data }
        );

        if (!result.success) {
          throw new Error(result.error?.message || "Transaction failed");
        }

        return result.data as T;
      } else {
        await doc.save();
        return doc;
      }
    } catch (error) {
      Logger.datastore.error(`Error creating ${this.entityName}`, {
        data,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateQuery<T>,
    context?: TransactionContext
  ): Promise<T | null> {
    try {
      logDatastore("update", this.entityName, { id, data });

      if (context) {
        const result = await this.transactionManager.executeWithRetry(
          `update_${this.entityName.toLowerCase()}`,
          this.entityName,
          async (session, ctx) => {
            const doc = await this.model.findByIdAndUpdate(id, data, {
              new: true,
              session,
            }).lean();
            return doc;
          },
          context,
          { id, data }
        );

        if (!result.success) {
          throw new Error(result.error?.message || "Transaction failed");
        }

        return result.data as T;
      } else {
        const doc = await this.model.findByIdAndUpdate(id, data, {
          new: true,
        }).lean();
        return doc || null;
      }
    } catch (error) {
      Logger.datastore.error(`Error updating ${this.entityName}`, {
        id,
        data,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async delete(id: string, context?: TransactionContext): Promise<boolean> {
    try {
      logDatastore("delete", this.entityName, { id });

      if (context) {
        const result = await this.transactionManager.executeWithRetry(
          `delete_${this.entityName.toLowerCase()}`,
          this.entityName,
          async (session, ctx) => {
            const doc = await this.model.findByIdAndDelete(id).session(session);
            return !!doc;
          },
          context,
          { id }
        );

        if (!result.success) {
          throw new Error(result.error?.message || "Transaction failed");
        }

        return result.data as boolean;
      } else {
        const doc = await this.model.findByIdAndDelete(id);
        return !!doc;
      }
    } catch (error) {
      Logger.datastore.error(`Error deleting ${this.entityName}`, {
        id,
        error: (error as Error).message,
      });
      throw error;
    }
   }

   async count(filter: DbFilter<T> = {}): Promise<number> {
     try {
       return await this.model.countDocuments(filter);
     } catch (error) {
      Logger.datastore.error(`Error counting ${this.entityName}`, {
        filter,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async bulkCreate(data: Partial<T>[], context?: TransactionContext): Promise<T[]> {
    if (!data.length) return [];

    try {
      logDatastore("bulk_create", this.entityName, { count: data.length });

      if (context) {
        const result = await this.transactionManager.executeWithRetry(
          `bulk_create_${this.entityName.toLowerCase()}`,
          this.entityName,
          async (session, ctx) => {
            const docs = data.map((item) => new this.model(item));
            const inserted = await this.model.insertMany(docs, { session });
            return inserted;
          },
          context,
          { count: data.length }
        );

        if (!result.success) {
          throw new Error(result.error?.message || "Transaction failed");
        }

        return result.data as T[];
      } else {
        const docs = data.map((item) => new this.model(item));
        return await this.model.insertMany(docs);
      }
    } catch (error) {
      Logger.datastore.error(`Error bulk creating ${this.entityName}`, {
        count: data.length,
        error: (error as Error).message,
      });
      throw error;
    }
  }

   async bulkUpdate(
     filter: DbFilter<T>,
     update: UpdateQuery<T>,
     context?: TransactionContext
   ): Promise<number> {
     try {
      logDatastore("bulk_update", this.entityName, { filter, update });

      if (context) {
        const result = await this.transactionManager.executeWithRetry(
          `bulk_update_${this.entityName.toLowerCase()}`,
          this.entityName,
          async (session, ctx) => {
            const res = await this.model.updateMany(filter, update, { session });
            return res.modifiedCount;
          },
          context,
          { filter, update }
        );

        if (!result.success) {
          throw new Error(result.error?.message || "Transaction failed");
        }

        return result.data as number;
      } else {
        const res = await this.model.updateMany(filter, update);
        return res.modifiedCount;
      }
    } catch (error) {
      Logger.datastore.error(`Error bulk updating ${this.entityName}`, {
        filter,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

/**
 * Specialized repository for Orders with inventory integration
 */
export class OrderRepository extends BaseRepository<IOrder> {
  constructor(
    transactionManager?: TransactionManager,
    inventoryService?: InventoryService
  ) {
    super(Order as any, "Order", transactionManager, inventoryService);
  }

  async createWithInventory(
    orderData: any,
    context: TransactionContext
  ): Promise<OperationResult<IOrder>> {
    return this.transactionManager.executeWithRetry(
      "create_order_with_inventory",
      "Order",
        async (session, ctx) => {
          // Calculate totals - prices from POS are VAT-inclusive (gross)
          let grossSubtotal = 0;
          for (const item of orderData.items) {
            grossSubtotal += (item.unitPrice || 0) * item.quantity;
          }
          // Derive net subtotal (exclusive of VAT) using 16% rate
          const subtotal = grossSubtotal / 1.16;
          const tax = grossSubtotal - subtotal;
          const total = grossSubtotal;

          // Prepare order input
          const orderInput: any = { ...orderData };

          // Ensure customer is set: use provided customerId or fall back to Walk-in Customer
          if (orderInput.customerId) {
            orderInput.customer = orderInput.customerId;
          } else {
            // Find default walk-in customer
            const walkIn = await Customer.findOne({ name: "Walk-in Customer" }).session(session);
            if (walkIn) {
              orderInput.customer = walkIn._id;
            } else {
              throw new Error("No customer provided and no default Walk-in Customer exists");
            }
          }

          // Create order
        const order = new Order({
          ...orderInput,
          orderId: `ORD-${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          subtotal,
          tax,
          total,
          pointsEarned: Math.floor(total / 100),
        });

        await order.save({ session });

        // Deduct inventory only for paid orders
        if (orderData.status === "paid" && orderData.items.length > 0) {
          await this.inventoryService!.processSale(
            orderData.items.map((item: SaleItem) => ({
              productId: item.productId,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
            })),
            {
              userId: ctx.userId,
              userName: ctx.userName,
              orderId: order.orderId,
              actionType: "SALE",
            }
          );
        }

        // Populate for return
        await order.populate("customer", "name phone email");
        await order.populate("assignedTo", "name role");

        return order;
      },
      context,
      { orderData }
    );
  }

     async createHeldOrder(
     orderData: any,
     context: TransactionContext
   ): Promise<OperationResult<IOrder>> {
     return this.transactionManager.executeWithRetry(
       "create_held_order",
       "Order",
        async (session, ctx) => {
          // Calculate totals - prices from POS are VAT-inclusive (gross)
          let grossSubtotal = 0;
          for (const item of orderData.items) {
            grossSubtotal += (item.unitPrice || 0) * item.quantity;
          }
          // Derive net subtotal (exclusive of VAT) using 16% rate
          const subtotal = grossSubtotal / 1.16;
          const tax = grossSubtotal - subtotal;
          const total = grossSubtotal;

          // Prepare order input
          const orderInput: any = { ...orderData };

          // Ensure customer is set: use provided customerId or fall back to Walk-in Customer
          if (orderInput.customerId) {
            orderInput.customer = orderInput.customerId;
          } else {
            // Find default walk-in customer
            const walkIn = await Customer.findOne({ name: "Walk-in Customer" }).session(session);
            if (walkIn) {
              orderInput.customer = walkIn._id;
            } else {
              throw new Error("No customer provided and no default Walk-in Customer exists");
            }
          }

          // Create order
        const order = new Order({
          ...orderInput,
          orderId: `ORD-${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          subtotal,
          tax,
          total,
          pointsEarned: Math.floor(total / 100),
          status: "held",
          paidAt: undefined,
        });

        await order.save({ session });

        // Populate for return
        await order.populate("customer", "name phone email");
        await order.populate("assignedTo", "name role");

        return order;
      },
      context,
      { orderData }
    );
  }

    async findByOrderId(orderId: string, options?: QueryOptions): Promise<IOrder | null> {
     return this.findOne({ orderId }, options) as Promise<IOrder | null>;
   }

   async updateStatus(
     id: string,
     status: IOrder["status"],
     context: TransactionContext
   ): Promise<OperationResult<IOrder>> {
     const update: UpdateQuery<IOrder> = { status };

    if (status === "paid") {
      update.paidAt = new Date();
    }

    return this.transactionManager.executeWithRetry(
      "update_order_status",
      "Order",
      async (session, ctx) => {
        const order = await Order.findByIdAndUpdate(
          id,
          { $set: update },
          { new: true, session }
        );

        if (!order) {
          throw new Error(`Order not found: ${id}`);
        }

        logAudit("ORDER_STATUS_UPDATED", ctx.userId, {
          orderId: order.orderId,
          status,
        });

        return order;
      },
      context,
      { id, status }
    );
  }

  async transferOwnership(
    filter: DbFilter<IOrder>,
    newOwnerId: string,
    context: TransactionContext
  ): Promise<OperationResult<number>> {
    return this.transactionManager.executeWithRetry(
      "transfer_order_ownership",
      "Order",
      async (session, ctx) => {
        const result = await Order.updateMany(
          { ...filter, session },
          { $set: { assignedTo: newOwnerId } }
        );

        logAudit("ORDERS_TRANSFERRED", ctx.userId, {
          filter: JSON.stringify(filter),
          newOwnerId,
          count: result.modifiedCount,
        });

        return result.modifiedCount;
      },
      context,
      { filter, newOwnerId }
    );
  }
}

/**
 * Repository factory - get typed repositories
 */
export class RepositoryFactory {
  private static instances: Map<string, BaseRepository<any>> = new Map();
  private static transactionManager: TransactionManager | null = null;
  private static inventoryService: InventoryService | null = null;

  static initialize(
    tm: TransactionManager,
    inv: InventoryService
  ) {
    RepositoryFactory.transactionManager = tm;
    RepositoryFactory.inventoryService = inv;
  }

  static getOrders(): OrderRepository {
    if (!RepositoryFactory.transactionManager) {
      RepositoryFactory.transactionManager = new TransactionManager();
    }
    if (!RepositoryFactory.inventoryService) {
      RepositoryFactory.inventoryService = new InventoryService();
    }

    const key = "orders";
    if (!RepositoryFactory.instances.has(key)) {
      RepositoryFactory.instances.set(
        key,
        new OrderRepository(
          RepositoryFactory.transactionManager,
          RepositoryFactory.inventoryService
        )
      );
    }
    return RepositoryFactory.instances.get(key) as OrderRepository;
  }

  static get<T>(model: mongoose.Model<T>, entityName: string): BaseRepository<T> {
    if (!RepositoryFactory.transactionManager) {
      RepositoryFactory.transactionManager = new TransactionManager();
    }

    const key = entityName.toLowerCase();
    if (!RepositoryFactory.instances.has(key)) {
      RepositoryFactory.instances.set(
        key,
        new BaseRepository<T>(model, entityName, RepositoryFactory.transactionManager)
      );
    }
    return RepositoryFactory.instances.get(key) as BaseRepository<T>;
  }
}

// Initialize factory with default services
RepositoryFactory.initialize(
  new TransactionManager(),
  new InventoryService()
);

export default BaseRepository;
