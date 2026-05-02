/**
 * Standalone validation test
 */

import { z } from 'zod';
import * as readline from 'readline';

// Replicate the exact schemas from validation.service.ts
const objectIdSchema = z.string().refine(
  (val) => /^[0-9a-fA-F]{24}$/.test(val),
  { message: "Invalid ObjectId format" }
);

const orderItemSchema = z.object({
  productId: objectIdSchema,
  name: z.string().min(1, "Product name is required"),
  price: z.number().min(0, "Price must be non-negative"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  category: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  conversionFactor: z.number().min(0.01, "Conversion factor must be positive"),
  unitPrice: z.number().min(0, "Unit price must be non-negative").optional(),
});

const createOrderSchema = z.object({
  customerId: objectIdSchema.optional().nullable(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  paymentMethod: z.enum(["cash", "mpesa", "card", "account", "bank_transfer"]),
  status: z.enum(["draft", "held", "billed", "paid", "cancelled"]).optional().default("paid"),
  assignedTo: objectIdSchema.optional().nullable(),
});

// Test case 1: New order with null customer
const testData1 = {
  customerId: null,
  items: [
    {
      productId: '662a1b2c3d4e5f6a7b8c9d0e',
      name: 'Test Product',
      price: 1000,
      quantity: 1,
      category: 'Spirits',
      unit: 'bottle',
      conversionFactor: 1,
      unitPrice: 1000,
    }
  ],
  paymentMethod: 'cash',
  status: 'paid',
  assignedTo: null,
};

try {
  const result1 = createOrderSchema.parse(testData1);
  console.log('TEST 1 PASSED - New order with null customer');
} catch (error: any) {
  console.log('TEST 1 FAILED:', error.issues || error.message);
}

// Test case 2: New order with customer ID
const testData2 = {
  customerId: '662a1b2c3d4e5f6a7b8c9d0f',
  items: [
    {
      productId: '662a1b2c3d4e5f6a7b8c9d0e',
      name: 'Test Product',
      price: 1000,
      quantity: 1,
      category: 'Spirits',
      unit: 'bottle',
      conversionFactor: 1,
      unitPrice: 1000,
    }
  ],
  paymentMethod: 'mpesa',
  status: 'paid',
  assignedTo: '662a1b2c3d4e5f6a7b8c9d10',
};

try {
  const result2 = createOrderSchema.parse(testData2);
  console.log('TEST 2 PASSED - New order with customer');
} catch (error: any) {
  console.log('TEST 2 FAILED:', error.issues || error.message);
}

// Test case 3: Product with 0 price
const testData3 = {
  customerId: null,
  items: [
    {
      productId: '662a1b2c3d4e5f6a7b8c9d0e',
      name: 'Free Sample',
      price: 0,
      quantity: 1,
      category: 'Samples',
      unit: 'piece',
      conversionFactor: 1,
      unitPrice: 0,
    }
  ],
  paymentMethod: 'cash',
  status: 'paid',
  assignedTo: null,
};

try {
  const result3 = createOrderSchema.parse(testData3);
  console.log('TEST 3 PASSED - Order with 0 price item');
} catch (error: any) {
  console.log('TEST 3 FAILED:', error.issues || error.message);
}

// Test case 4: Missing required field
const testData4 = {
  customerId: null,
  items: [
    {
      productId: '662a1b2c3d4e5f6a7b8c9d0e',
      name: 'Test Product',
      price: 1000,
      quantity: 1,
      // Missing category (optional, should be OK)
      unit: 'bottle',
      conversionFactor: 1,
      unitPrice: 1000,
    }
  ],
  paymentMethod: 'cash',
  status: 'paid',
  assignedTo: null,
};

try {
  const result4 = createOrderSchema.parse(testData4);
  console.log('TEST 4 PASSED - Order with missing optional field');
} catch (error: any) {
  console.log('TEST 4 FAILED:', error.issues || error.message);
}

console.log('\n=== All validation tests complete ===');

// Cleanup
process.exit(0);
