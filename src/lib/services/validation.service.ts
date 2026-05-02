/**
 * Validation schemas with Zod for runtime type safety
 */

import { z, ZodError } from "zod";

/**
 * Base ObjectId validation
 */
export const objectIdSchema = z.string().refine(
  (val) => /^[0-9a-fA-F]{24}$/.test(val),
  { message: "Invalid ObjectId format" }
);

/**
 * Zod schema definitions
 */
export const orderItemSchema = z.object({
  productId: objectIdSchema,
  name: z.string().min(1, "Product name is required"),
  price: z.number().min(0, "Price must be non-negative"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  category: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  conversionFactor: z.number().min(0.01, "Conversion factor must be positive"),
  unitPrice: z.number().min(0, "Unit price must be non-negative").optional(),
});

export const saleItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().min(0, "Unit price must be non-negative").optional(),
});

export const createOrderSchema = z.object({
  customerId: objectIdSchema.optional().nullable(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  paymentMethod: z.enum(["cash", "mpesa", "card", "account", "bank_transfer"]),
  status: z.enum(["draft", "held", "billed", "paid", "cancelled"]).optional().default("paid"),
  assignedTo: objectIdSchema.optional().nullable(),
});

export const updateOrderSchema = z.object({
  status: z.enum(["draft", "held", "billed", "paid", "cancelled"]).optional(),
  paymentMethod: z.enum(["cash", "mpesa", "card"]).optional(),
  assignedTo: objectIdSchema.optional().nullable(),
});

export const orderFilterSchema = z.object({
  customerId: objectIdSchema.optional(),
  assignedTo: objectIdSchema.optional(),
  status: z.enum(["draft", "held", "billed", "paid", "cancelled"]).optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  date: z.date().optional(),
  status: z.enum(["Completed", "Pending"]).optional().default("Completed"),
  referenceId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const transactionFilterSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
  email: z.string().email("Invalid email").optional().nullable(),
  tier: z.enum(["Bronze", "Silver", "Gold", "VIP"]).optional().default("Bronze"),
  creditLimit: z.number().nonnegative().optional().default(0),
  creditUsed: z.number().nonnegative().optional().default(0),
  points: z.number().nonnegative().optional().default(0),
  totalSpent: z.number().nonnegative().optional().default(0),
  visits: z.number().int().nonnegative().optional().default(0),
  preferences: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
});

export const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.enum(["Admin", "Manager", "Cashier", "Bartender", "Waiter"]),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
  email: z.string().email("Invalid email"),
  shift: z.enum(["Morning", "Evening", "Night"]).optional(),
  hireDate: z.date().optional(),
  totalSales: z.number().nonnegative().optional().default(0),
  commission: z.number().optional().default(0),
  pin: z.string().length(4, "PIN must be 4 digits").regex(/^\d{4}$/, "PIN must be numeric").optional(),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  stock: z.number().min(0, "Stock cannot be negative").default(0),
  unit: z.string().min(1, "Base unit is required"),
  reorderLevel: z.number().min(0).default(10),
  costPrice: z.number().min(0, "Cost price cannot be negative"),
  sellPrice: z.number().min(0, "Sell price cannot be negative"),
  supplier: z.string().min(1, "Supplier is required"),
  expiryDate: z.coerce.date().optional().nullable(),
  batchNo: z.string().optional(),
  status: z.enum(["In Stock", "Low Stock", "Out of Stock"]).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be hex format (e.g., #FF5733)").default("#64748b"),
  icon: z.string().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  parentId: objectIdSchema.optional().nullable(),
});

export const unitSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  abbreviation: z.string().min(1, "Abbreviation is required"),
  isBase: z.boolean().default(false),
  conversionFactor: z.number().min(0.01, "Conversion factor must be at least 0.01"),
  isActive: z.boolean().default(true),
  sellPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional().nullable(),
});

export const productUOMSchema = z.object({
  productId: objectIdSchema,
  baseUnit: z.string().min(1, "Base unit is required"),
  units: z.array(unitSchema).min(1, "At least one unit must be defined"),
});

export const mpesaStkPushSchema = z.object({
  phoneNumber: z.string().regex(/^254[0-9]{9}$/, "Phone must be in format 254XXXXXXXXX"),
  amount: z.number().min(1, "Amount must be at least 1").max(70000, "Amount exceeds maximum"),
  accountReference: z.string().min(1, "Account reference is required"),
  transactionDesc: z.string().min(1, "Description is required").optional(),
});

export const mpesaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      Metadata: z.object({
        Item: z.array(
          z.object({
            Name: z.string(),
            Value: z.string(),
          })
        ).optional(),
      }).optional(),
    }),
  }),
});

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: Array<{ path: string; message: string }>;
}

/**
 * Generic validation helper - returns typed result
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return { isValid: true, data: validated, errors: [] };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        isValid: false,
        errors: (error.issues || []).map((issue: any) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      };
    }
    console.error("Unknown validation error:", error);
    return {
      isValid: false,
      errors: [{ path: "unknown", message: "Unknown validation error" }],
    };
  }
}

/**
 * Validator class with pre-validated schemas
 */
export class Validator {
  static validateOrderCreate(data: unknown): ValidationResult<z.infer<typeof createOrderSchema>> {
    return validateWithSchema(createOrderSchema, data);
  }

  static validateOrderUpdate(data: unknown): ValidationResult<z.infer<typeof updateOrderSchema>> {
    return validateWithSchema(updateOrderSchema, data);
  }

  static validateTransaction(data: unknown): ValidationResult<z.infer<typeof transactionSchema>> {
    return validateWithSchema(transactionSchema, data);
  }

  static validateSaleItems(items: unknown): ValidationResult<z.infer<typeof saleItemSchema>[]> {
    const schema = z.array(saleItemSchema).min(1);
    return validateWithSchema(schema, items);
  }

  static validateCustomer(data: unknown): ValidationResult<z.infer<typeof customerSchema>> {
    return validateWithSchema(customerSchema, data);
  }

  static validateStaff(data: unknown): ValidationResult<z.infer<typeof staffSchema>> {
    return validateWithSchema(staffSchema, data);
  }

  static validateProduct(data: unknown): ValidationResult<z.infer<typeof productSchema>> {
    return validateWithSchema(productSchema, data);
  }

  static validateUOM(data: unknown): ValidationResult<z.infer<typeof unitSchema>> {
    return validateWithSchema(unitSchema, data);
  }
}

export default Validator;
