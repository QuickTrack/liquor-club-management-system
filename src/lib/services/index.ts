/**
 * Services Index
 * Centralized exports for all service layers
 */

// Logging
export { Logger, logTransaction, logAudit, logDatastore } from "./logger.service";

// Validation
export type {
  ValidationResult,
} from "./validation.service";
export { Validator, validateWithSchema } from "./validation.service";

// Re-export schemas as types where needed
export type {
  createOrderSchema,
  updateOrderSchema,
  transactionSchema,
  saleItemSchema,
  customerSchema,
  staffSchema,
  productSchema,
  categorySchema,
  unitSchema,
  mpesaStkPushSchema,
} from "./validation.service";

// Transaction Manager
export { TransactionManager, transactionManager } from "./transaction-manager";
export type {
  TransactionContext,
  OperationResult,
  TransactionError,
  RetryPolicy,
} from "./transaction-manager";

// Persistence Layer (Repository Pattern)
export { BaseRepository, OrderRepository, RepositoryFactory } from "./persistence-layer";
export type {
  PaginatedResult,
  QueryOptions,
  IRepository,
} from "./persistence-layer";

// Core Services
export { InventoryService } from "./inventoryService";
export { AuditLogService } from "./auditLogService";

// Error classes
export {
  InventoryError,
  InsufficientStockError,
  ProductNotFoundError,
  InvalidQuantityError,
} from "./inventoryService";
