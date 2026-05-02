# POS Sales System - Technical Workflow & Database Schema
## Liquor Club Management System

**Version:** 1.0  
**Date:** 2026-04-28  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#1-overview)
2. [Database Schema Extensions](#2-database-schema-extensions)
3. [Technical Workflow: Order-to-Bill Lifecycle](#3-technical-workflow-order-to-bill-lifecycle)
4. [ACID Transaction Flow](#4-acid-transaction-flow)
5. [Payment Processing Trigger Mechanism](#5-payment-processing-trigger-mechanism)
6. [Data Integrity Requirements](#6-data-integrity-requirements)
7. [Reporting & Analytics Schema](#7-reporting--analytics-schema)
8. [Real-Time Dashboard Queries](#8-real-time-dashboard-queries)
9. [Indexing Strategy](#9-indexing-strategy)
10. [Error Handling & Recovery](#10-error-handling--recovery)

---

## 1. Overview

The POS Sales System manages the complete lifecycle of retail transactions from active order creation to final bill payment. The system ensures ACID-compliant transactions, real-time inventory updates, and comprehensive audit trails.

### Key Components

- **Order Management**: Active, held, and finalized orders
- **Payment Processing**: Multi-method payment support (cash, card, M-Pesa)
- **Inventory Integration**: Real-time stock deduction
- **Audit Trail**: Complete transaction history
- **Shift Reconciliation**: End-of-shift financial close
- **Analytics**: Real-time reporting and dashboards

---

## 2. Database Schema Extensions

### 2.1 Payment Schema (Already Implemented)

```typescript
export interface IPayment extends Document {
  paymentId: string;                  // Unique payment identifier
  orderId: string;                    // Reference to Order.orderId
  orderObjectId: mongoose.Types.ObjectId;  // Reference to Order _id
  amount: number;                     // Payment amount
  currency: string;                   // e.g., "KES"
  method: "cash" | "mpesa" | "card" | "account" | "bank_transfer";
  status: "pending" | "completed" | "failed" | "refunded" | "reversed";
  
  // Payment method details
  mpesaReceiptNumber?: string;
  mpesaPhoneNumber?: string;
  mpesaCheckoutRequestId?: string;
  cardLast4?: string;
  cardBrand?: string;
  authorizationCode?: string;
  
  // Cash handling
  cashTendered?: number;              // Amount given by customer
  changeGiven?: number;               // Change returned
  
  metadata?: {
    sessionId?: string;
    terminalId?: string;
    batchNumber?: string;
    referenceNumber?: string;
    notes?: string;
  };
  
  // Timestamps
  initiatedAt: Date;
  completedAt?: Date;
  refundedAt?: Date;
  
  // Audit
  userId: mongoose.Types.ObjectId;    // Staff who processed payment
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Indexes:**
- `paymentId` (unique)
- `orderId` + `createdAt` (payment history per order)
- `method` + `status` (payment method analytics)
- `metadata.sessionId` (terminal session queries)
- `createdAt` (time-based queries)

### 2.2 Order Schema Extensions

```typescript
export interface IOrder extends Document {
  orderId: string;
  customer: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "mpesa" | "card" | "account" | "bank_transfer";
  status: "draft" | "held" | "billed" | "paid" | "cancelled";
  
  // Payment tracking
  payments: mongoose.Types.ObjectId[];  // References to Payment documents
  totalPaid: number;                     // Sum of all completed payments
  outstandingBalance: number;           // total - totalPaid
  fullyPaid: boolean;                   // totalPaid >= total
  
  // Financial close
  closed: boolean;                      // Order is finalized, no more changes
  closedAt?: Date;
  closedBy?: mongoose.Types.ObjectId;
  
  // Reconciliation
  reconciliationId?: string;             // Link to end-of-shift reconciliation
  isReconciled?: boolean;
}
```

### 2.3 Shift Reconciliation Schema

```typescript
export interface IShiftReconciliation extends Document {
  reconciliationId: string;
  branchId?: string;
  userId: mongoose.Types.ObjectId;    // Staff closing shift
  shift: "Morning" | "Evening" | "Night";
  
  // Time window
  startTime: Date;                    // Start of shift (or last reconciliation)
  endTime: Date;                      // Current time
  
  // Order aggregates
  totalOrders: number;
  totalSales: number;
  totalTax: number;
  totalRefunds: number;
  
  // Payment method breakdown
  cashReceived: number;
  cashInDrawer: number;               // Actual cash count
  cashVariance: number;               // Difference
  
  mpesaReceived: number;
  cardReceived: number;
  accountReceived: number;            // Credit sales
  
  // Inventory metrics
  itemsSold: number;
  categoriesSold: Record<string, number>; // category -> count
  
  // References
  orderIds: string[];                 // Orders closed in this period
  paymentIds: string[];               // Payments processed
  inventoryTransactionIds: string[];  // Stock movements
  
  // Cash handling
  startingFloat: number;
  endingFloat: number;
  cashDrop: number;                   // Removed from drawer
  
  // Status
  status: "open" | "closed" | "reconciled";
  notes?: string;
  
  closedAt: Date;
  closedBy: mongoose.Types.ObjectId;
}
```

### 2.4 Sales Transaction Log Schema

```typescript
export interface ISalesTransaction extends Document {
  transactionId: string;              // Unique transaction identifier
  orderId: string;                    // Associated order
  type: "SALE" | "REFUND" | "VOID";
  
  // Financial details
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  
  // Payment details
  paymentBreakdown: {
    method: string;
    amount: number;
    reference?: string;
  }[];
  
  // Line items snapshot
  items: {
    productId: mongoose.Types.ObjectId;
    productName: string;
    category: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    costPrice: number;                // For margin calculation
  }[];
  
  // Context
  userId: mongoose.Types.ObjectId;    // Cashier
  terminalId: string;
  sessionId: string;
  
  // Inventory impact
  inventoryTransactionIds: string[];  // Linked stock movements
  
  // Timestamps
  createdAt: Date;
}
```

**Key Indexes:**
- `transactionId` (unique)
- `orderId` (order linking)
- `type` + `createdAt` (transaction type filtering)
- `userId` + `createdAt` (cashier performance)
- `terminalId` + `createdAt` (terminal analytics)
- `createdAt` (time-based queries)

---

## 3. Technical Workflow: Order-to-Bill Lifecycle

### Phase 1: Order Creation (Draft State)

**Trigger**: Customer adds items to cart

```typescript
// 1. Validate order items
async function validateOrderItems(items: IOrderItem[]): Promise<ValidationResult> {
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) throw new Error(`Product not found: ${item.productId}`);
    if (product.stock < item.quantity) throw new InsufficientStockError(...);
  }
}

// 2. Calculate pricing
function calculateOrderTotals(items: IOrderItem[]): {
  subtotal: number;
  tax: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const tax = subtotal * TAX_RATE; // 16% VAT
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

// 3. Create draft order
const order = new Order({
  orderId: generateOrderId(),
  customer: customerId,
  items: orderItems,
  subtotal,
  tax,
  total,
  paymentMethod: "cash",
  status: "draft",
  assignedTo: staffId
});
```

**State**: Order saved with `status: "draft"`

---

### Phase 2: Order Holding (Optional)

**Trigger**: Customer requests to hold order for later

```typescript
await Order.updateOne(
  { _id: orderId, status: "draft" },
  { 
    $set: { 
      status: "held",
      heldAt: new Date() 
    } 
  }
);
```

**State**: Order in `status: "held"`

---

### Phase 3: Payment Initiation

**Trigger**: Customer requests to pay

```typescript
// 1. Validate order is ready for payment
if (order.status !== "draft" && order.status !== "held") {
  throw new Error(`Order cannot be paid in ${order.status} state`);
}

// 2. Process payment based on method
const payment = new Payment({
  paymentId: generatePaymentId(),
  orderId: order.orderId,
  orderObjectId: order._id,
  amount: order.total,
  method: paymentMethod,
  status: "pending",
  userId: staffId,
  initiatedAt: new Date(),
  metadata: { terminalId, sessionId }
});

await payment.save();
```

**State**: Payment in `status: "pending"`

---

### Phase 4: Payment Processing (CRITICAL SECTION)

**Trigger**: Payment gateway response or cash confirmation

```typescript
async function processPayment(paymentId: string, paymentDetails: PaymentDetails) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // ACID TRANSACTION START
    
    // 1. Update payment status
    const payment = await Payment.findById(paymentId).session(session);
    payment.status = "completed";
    payment.completedAt = new Date();
    
    // Add payment method details
    if (paymentDetails.method === "cash") {
      payment.cashTendered = paymentDetails.cashTendered;
      payment.changeGiven = paymentDetails.changeGiven;
    }
    
    await payment.save({ session });
    
    // 2. Update order payment tracking
    const order = await Order.findById(payment.orderObjectId).session(session);
    order.payments.push(payment._id);
    order.totalPaid += payment.amount;
    order.outstandingBalance = order.total - order.totalPaid;
    order.fullyPaid = order.totalPaid >= order.total;
    
    // 3. Change order status to "paid"
    order.status = "paid";
    order.paidAt = new Date();
    
    await order.save({ session });
    
    // 4. Update inventory (atomic stock deduction)
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }
    
    // 5. Update customer loyalty points
    if (order.customer) {
      await Customer.findByIdAndUpdate(
        order.customer,
        { 
          $inc: { 
            points: order.pointsEarned,
            totalSpent: order.total,
            visits: 1 
          } 
        },
        { session }
      );
    }
    
    // 6. Create sales transaction record
    const salesTransaction = new SalesTransaction({
      transactionId: generateTransactionId(),
      orderId: order.orderId,
      type: "SALE",
      grossAmount: order.subtotal,
      discountAmount: 0,
      taxAmount: order.tax,
      netAmount: order.total,
      paymentBreakdown: [{
        method: payment.method,
        amount: payment.amount,
        reference: payment.mpesaReceiptNumber
      }],
      items: order.items.map(item => ({
        productId: item.product,
        productName: item.name,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        costPrice: item.costPrice
      })),
      userId: staffId,
      terminalId,
      sessionId
    });
    
    await salesTransaction.save({ session });
    
    // 7. Create audit log entry
    await AuditLog.create([{
      action: "PAYMENT_PROCESSED",
      user: staffId,
      details: JSON.stringify({
        orderId: order.orderId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        method: payment.method
      }),
      date: new Date()
    }], { session });
    
    // COMMIT TRANSACTION (All-or-nothing)
    await session.commitTransaction();
    session.endSession();
    
    // TRIGGER: Post-payment actions
    await triggerPostPaymentActions(order, payment);
    
    return { success: true, order, payment };
    
  } catch (error) {
    // ROLLBACK TRANSACTION (Automatic on error)
    await session.abortTransaction();
    session.endSession();
    
    // Log failure
    await logFailedPayment(paymentId, error);
    
    throw error;
  }
}
```

**Critical Section**: All database operations within a single MongoDB transaction

**State After Success**:
- Payment: `status: "completed"`
- Order: `status: "paid"`, `closed: true`
- Inventory: Stock deducted
- Customer: Points updated
- SalesTransaction: Record created
- AuditLog: Entry created

---

### Phase 5: Post-Payment Trigger Mechanism

**Trigger**: Transaction commit success

```typescript
async function triggerPostPaymentActions(order: IOrder, payment: IPayment) {
  // 1. Generate receipt
  const receipt = await generateReceipt(order, payment);
  
  // 2. Send notifications
  await Promise.all([
    sendCustomerReceipt(order.customer, receipt),
    notifyKitchen(order), // Kitchen display system
    updateSalesDashboard() // Real-time dashboard update
  ]);
  
  // 3. Check for reorder alerts
  for (const item of order.items) {
    await checkReorderLevel(item.product);
  }
  
  // 4. Update shift totals (if shift is open)
  await updateShiftRunningTotal(payment);
  
  // 5. Log to external accounting system (async)
  queueAccountingSync(order, payment);
}
```

---

### Phase 6: Order Finalization

**Trigger**: All payments completed

```typescript
if (order.fullyPaid && order.status === "paid") {
  order.closed = true;
  order.closedAt = new Date();
  order.closedBy = staffId;
  order.status = "billed"; // Final state
  
  await order.save();
}
```

**Final State**: Order `status: "billed"`, `closed: true`

---

## 4. ACID Transaction Flow

### Atomicity Guarantee

All payment processing operations occur within a single MongoDB transaction:

```
┌─────────────────────────────────────────┐
│  MongoDB Transaction Session            │
│                                         │
│  1. ✓ Update Payment Status             │
│  2. ✓ Update Order Payment Tracking     │
│  3. ✓ Deduct Inventory                  │
│  4. ✓ Update Customer Points            │
│  5. ✓ Create Sales Transaction          │
│  6. ✓ Create Audit Log                  │
│                                         │
│  ┌─────────────┐                         │
│  │  COMMIT ✓   │→ All succeed            │
│  └─────────────┘                         │
│                                         │
│  ┌─────────────┐                         │
│  │  ROLLBACK ✗ │→ Any fails              │
│  └─────────────┘                         │
└─────────────────────────────────────────┘
```

### Consistency Requirements

**Pre-Transaction Validation**:
- Order exists and is payable
- Payment amount matches order total
- Sufficient stock for all items
- Customer account valid (if applicable)

**Post-Transaction Validation**:
- Order total = Sum of all payments
- Stock levels ≥ 0
- Customer points balance consistent
- Payment status = "completed"

### Isolation Level

MongoDB uses **snapshot isolation** for transactions:

- Read operations see consistent snapshot
- Write operations isolated until commit
- No dirty reads
- No non-repeatable reads
- No phantom reads

### Durability

- Transaction commit written to oplog
- Journaled writes (default)
- Replicated to replica set members
- Cannot be rolled back after commit

---

## 5. Payment Processing Trigger Mechanism

### 5.1 State Machine

```

  Draft    

       ↓ [Add Items]

  Held   ←→  Draft   ←→  Cancelled 

       ↓ [Process Payment]

 Pending  →  Failed   (Retry)

       ↓ [Success]

  Paid    ← Partial Payment

       ↓ [Fully Paid]

 Billed   →  Final State  

```

### 5.2 Payment Completion Trigger

**Event-Driven Architecture**:

```typescript
// Event Emitter
class PaymentEventEmitter extends EventEmitter {
  async onPaymentCompleted(payment: IPayment) {
    const order = await Order.findById(payment.orderObjectId);
    
    // Check if order is fully paid
    if (order.fullyPaid) {
      // Emit order paid event
      this.emit('order:paid', {
        orderId: order.orderId,
        paymentId: payment.paymentId,
        timestamp: new Date()
      });
      
      // Chain: Order Paid → Post-Payment Actions
      this.emit('order:process-post-actions', order);
    }
  }
}

// Event Handlers
paymentEmitter.on('order:paid', async (data) => {
  // 1. Generate receipt
  await receiptService.generate(data.orderId);
  
  // 2. Update dashboard
  dashboardService.updateSalesMetrics(data.orderId);
  
  // 3. Notify systems
  await notifyExternalSystems(data);
});

paymentEmitter.on('order:process-post-actions', async (order) => {
  // 1. Inventory reorder check
  await inventoryService.checkAllItems(order.items);
  
  // 2. Loyalty points sync
  await loyaltyService.sync(order.customer);
  
  // 3. Accounting integration
  await accountingService.exportTransaction(order);
});
```

### 5.3 Transaction Commit Hook

```typescript
// MongoDB Change Stream (Real-time)
const changeStream = Order.watch([
  { $match: { 'updateDescription.updatedFields.status': 'paid' } }
]);

changeStream.on('change', async (change) => {
  const orderId = change.documentKey._id;
  const order = await Order.findById(orderId);
  
  // Trigger post-payment workflow
  await triggerPostPaymentActions(order);
});
```

---

## 6. Data Integrity Requirements

### 6.1 Referential Integrity

```typescript
// Foreign Key Constraints (Application-Level)

// Payment → Order (Required)
PaymentSchema.path('orderObjectId').validate(async (value) => {
  const order = await Order.findById(value);
  return order !== null;
}, 'Order does not exist');

// Order → Customer (Optional)
OrderSchema.path('customer').validate(async (value) => {
  if (!value) return true; // Null allowed
  const customer = await Customer.findById(value);
  return customer !== null;
}, 'Customer does not exist');

// Payment → User (Required)
PaymentSchema.path('userId').validate(async (value) => {
  const user = await User.findById(value);
  return user !== null;
}, 'User does not exist');
```

### 6.2 Uniqueness Constraints

```typescript
// Unique payment identifier
PaymentSchema.index({ paymentId: 1 }, { unique: true });

// Unique order identifier
OrderSchema.index({ orderId: 1 }, { unique: true });
```

### 6.3 Consistency Rules

```typescript
// Rule 1: Order total = Sum(line items) + tax
OrderSchema.pre('save', function(next) {
  const calculatedSubtotal = this.items.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity),
    0
  );
  
  if (Math.abs(this.subtotal - calculatedSubtotal) > 0.01) {
    return next(new Error('Subtotal does not match line items'));
  }
  next();
});

// Rule 2: totalPaid ≤ total
OrderSchema.pre('save', function(next) {
  if (this.totalPaid > this.total) {
    return next(new Error('Total paid cannot exceed order total'));
  }
  next();
});

// Rule 3: If fullyPaid=true, then totalPaid ≥ total
OrderSchema.pre('save', function(next) {
  if (this.fullyPaid && this.totalPaid < this.total) {
    return next(new Error('Order marked fullyPaid but totalPaid < total'));
  }
  next();
});

// Rule 4: If status='paid', then fullyPaid=true
OrderSchema.pre('save', function(next) {
  if (this.status === 'paid' && !this.fullyPaid) {
    return next(new Error('Order status paid requires fullyPaid=true'));
  }
  next();
});
```

### 6.4 Non-Negative Constraints

```typescript
// Stock levels
ProductSchema.path('stock').validate(function(value) {
  return value >= 0;
}, 'Stock cannot be negative');

// Payment amounts
PaymentSchema.path('amount').validate(function(value) {
  return value > 0;
}, 'Payment amount must be positive');

// Order totals
OrderSchema.path('total').validate(function(value) {
  return value >= 0;
}, 'Order total cannot be negative');
```

### 6.5 Temporal Consistency

```typescript
// paidAt cannot be before createdAt
OrderSchema.pre('save', function(next) {
  if (this.paidAt && this.paidAt < this.createdAt) {
    return next(new Error('paidAt cannot be before createdAt'));
  }
  next();
});

// completedAt cannot be before initiatedAt
PaymentSchema.pre('save', function(next) {
  if (this.completedAt && this.completedAt < this.initiatedAt) {
    return next(new Error('completedAt cannot be before initiatedAt'));
  }
  next();
});
```

---

## 7. Reporting & Analytics Schema

### 7.1 Sales Dashboard Data Model

```typescript
interface SalesDashboard {
  // Real-time metrics
  dailySales: number;
  dailyOrders: number;
  averageOrderValue: number;
  
  // Payment breakdown
  paymentMethods: {
    cash: number;
    mpesa: number;
    card: number;
    account: number;
  };
  
  // Top products
  topSellingProducts: {
    productId: mongoose.Types.ObjectId;
    productName: string;
    unitsSold: number;
    revenue: number;
  }[];
  
  // Category performance
  categorySales: {
    category: string;
    revenue: number;
    units: number;
  }[];
  
  // Hourly sales pattern
  hourlySales: {
    hour: number; // 0-23
    sales: number;
    orders: number;
  }[];
}
```

### 7.2 End-of-Shift Reconciliation

```typescript
async function generateShiftReconciliation(userId: string, shift: string) {
  const shiftStart = getShiftStartTime(shift);
  const shiftEnd = new Date();
  
  // Query all orders in shift period
  const orders = await Order.find({
    createdAt: { $gte: shiftStart, $lte: shiftEnd },
    status: { $in: ['paid', 'billed'] }
  }).populate('payments');
  
  // Aggregate by payment method
  const paymentBreakdown = {
    cash: 0,
    mpesa: 0,
    card: 0,
    account: 0
  };
  
let totalSales = 0;
  let totalTax = 0;
  let itemsSold = 0;
  
  const categoriesSold: Record<string, number> = {};
  const orderIds: string[] = [];
  const paymentIds: string[] = [];
  
  for (const order of orders) {
    totalSales += order.total;
    totalTax += order.tax;
    itemsSold += order.items.reduce((sum, item) => sum + item.quantity, 0);
    orderIds.push(order.orderId);
    
    // Category breakdown
    for (const item of order.items) {
      categoriesSold[item.category] = (categoriesSold[item.category] || 0) + item.quantity;
    }
    
    // Payment aggregation
    for (const paymentId of order.payments) {
      const payment = await Payment.findById(paymentId);
      if (payment && payment.status === 'completed') {
        paymentBreakdown[payment.method] += payment.amount;
        paymentIds.push(payment.paymentId);
      }
    }
  }
  
  // Cash count (actual)
  const cashInDrawer = await getActualCashCount();
  const startingFloat = await getShiftStartingFloat(userId);
  const cashDrop = calculateCashDrop(cashInDrawer, startingFloat, paymentBreakdown.cash);
  const cashVariance = cashInDrawer - (startingFloat + paymentBreakdown.cash - cashDrop);
  
  // Create reconciliation record
  const reconciliation = new ShiftReconciliation({
    reconciliationId: generateReconciliationId(),
    userId,
    shift,
    startTime: shiftStart,
    endTime: shiftEnd,
    totalOrders: orders.length,
    totalSales,
    totalTax,
    totalRefunds: 0, // Calculate separately
    cashReceived: paymentBreakdown.cash,
    cashInDrawer,
    cashVariance,
    mpesaReceived: paymentBreakdown.mpesa,
    cardReceived: paymentBreakdown.card,
    accountReceived: paymentBreakdown.account,
    itemsSold,
    categoriesSold,
    orderIds,
    paymentIds,
    startingFloat,
    endingFloat: cashInDrawer,
    cashDrop,
    status: 'closed',
    closedAt: new Date(),
    closedBy: userId
  });
  
  await reconciliation.save();
  
  return reconciliation;
}
```

---

## 8. Real-Time Dashboard Queries

### 8.1 Today's Sales Summary

```javascript
// MongoDB Aggregation Pipeline
const today = new Date();
today.setHours(0, 0, 0, 0);

const dailySales = await Order.aggregate([
  {
    $match: {
      createdAt: { $gte: today },
      status: { $in: ['paid', 'billed'] }
    }
  },
  {
    $group: {
      _id: null,
      totalSales: { $sum: '$total' },
      totalOrders: { $sum: 1 },
      totalTax: { $sum: '$tax' },
      averageOrderValue: { $avg: '$total' }
    }
  }
]);
```

### 8.2 Payment Method Breakdown

```javascript
const paymentSummary = await Payment.aggregate([
  {
    $match: {
      createdAt: { $gte: today },
      status: 'completed'
    }
  },
  {
    $group: {
      _id: '$method',
      totalAmount: { $sum: '$amount' },
      transactionCount: { $sum: 1 }
    }
  },
  {
    $project: {
      method: '$_id',
      totalAmount: 1,
      transactionCount: 1,
      _id: 0
    }
  }
]);
```

### 8.3 Top Selling Products (Real-time)

```javascript
const topProducts = await Order.aggregate([
  {
    $match: {
      createdAt: { $gte: today },
      status: { $in: ['paid', 'billed'] }
    }
  },
  { $unwind: '$items' },
  {
    $group: {
      _id: '$items.product',
      productName: { $first: '$items.name' },
      totalQuantity: { $sum: '$items.quantity' },
      totalRevenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } }
    }
  },
  { $sort: { totalRevenue: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: 'products',
      localField: '_id',
      foreignField: '_id',
      as: 'productInfo'
    }
  },
  {
    $unwind: '$productInfo'
  },
  {
    $project: {
      productId: '$_id',
      productName: 1,
      totalQuantity: 1,
      totalRevenue: 1,
      currentStock: '$productInfo.stock',
      _id: 0
    }
  }
]);
```

### 8.4 Category Performance

```javascript
const categorySales = await Order.aggregate([
  {
    $match: {
      createdAt: { $gte: today },
      status: { $in: ['paid', 'billed'] }
    }
  },
  { $unwind: '$items' },
  {
    $group: {
      _id: '$items.category',
      totalRevenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
      totalUnits: { $sum: '$items.quantity' },
      orderCount: { $sum: 1 }
    }
  },
  { $sort: { totalRevenue: -1 } }
]);
```

### 8.5 Hourly Sales Trend

```javascript
const hourlySales = await Order.aggregate([
  {
    $match: {
      createdAt: { $gte: today },
      status: { $in: ['paid', 'billed'] }
    }
  },
  {
    $group: {
      _id: { $hour: '$createdAt' },
      totalSales: { $sum: '$total' },
      orderCount: { $sum: 1 }
    }
  },
  { $sort: { '_id': 1 } }
]);
```

---

## 9. Indexing Strategy

### 9.1 Order Collection Indexes

```javascript
// Query patterns:
// - Find orders by status
// - Filter by customer
// - Sort by date
// - Find assigned orders

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ assignedTo: 1, status: 1 });
OrderSchema.index({ orderId: 1 }); // Unique
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, fullyPaid: 1 });
OrderSchema.index({ closed: 1, createdAt: -1 });
```

### 9.2 Payment Collection Indexes

```javascript
// Query patterns:
// - Get payments for an order
// - Find by payment method and status
// - Time-based queries
// - Session lookups

PaymentSchema.index({ orderId: 1, createdAt: -1 });
PaymentSchema.index({ orderObjectId: 1 });
PaymentSchema.index({ method: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ 'metadata.sessionId': 1 });
```

### 9.3 SalesTransaction Collection Indexes

```javascript
// Query patterns:
// - Time-series queries
// - Order lookups
// - User performance
// - Terminal analytics

SalesTransactionSchema.index({ transactionId: 1 }); // Unique
SalesTransactionSchema.index({ orderId: 1 });
SalesTransactionSchema.index({ type: 1, createdAt: -1 });
SalesTransactionSchema.index({ userId: 1, createdAt: -1 });
SalesTransactionSchema.index({ terminalId: 1, createdAt: -1 });
SalesTransactionSchema.index({ createdAt: -1 });
SalesTransactionSchema.index({ 'items.productId': 1, createdAt: -1 });
```

### 9.4 ShiftReconciliation Indexes

```javascript
// Query patterns:
// - Find open shifts
// - Historical reconciliations
// - User shift history

ShiftReconciliationSchema.index({ userId: 1, status: 1 });
ShiftReconciliationSchema.index({ startTime: -1 });
ShiftReconciliationSchema.index({ status: 1, startTime: -1 });
ShiftReconciliationSchema.index({ reconciliationId: 1 }); // Unique
```

---

## 10. Error Handling & Recovery

### 10.1 Transaction Failure Scenarios

| Scenario | Detection | Recovery Action | Data Integrity |
|----------|-----------|-----------------|----------------|
| Payment gateway timeout | HTTP timeout (30s) | Automatic retry (3x) | No duplicate payment || Insufficient stock | Pre-commit check | Fail transaction, rollback | Consistent stock |
| Network partition | MongoDB driver error | Retry after delay | Transaction atomic |
| Duplicate payment | Unique constraint violation | Fail, refund duplicate | Payment consistent |
| System crash during commit | MongoDB journaling | Automatic recovery on restart | Durable commit |
| Validation failure | Pre-commit checks | Fail fast, no DB changes | No partial writes |

### 10.2 Idempotency Keys

```typescript
// Prevent duplicate payments
interface PaymentRequest {
  amount: number;
  method: string;
  orderId: string;
  idempotencyKey: string; // Unique per payment attempt
}

// Check for existing payment with idempotency key
const existingPayment = await Payment.findOne({
  'metadata.idempotencyKey': request.idempotencyKey
});

if (existingPayment) {
  return { 
    success: true, 
    payment: existingPayment,
    message: 'Duplicate request, returning existing payment'
  };
}

// Save idempotency key
payment.metadata = {
  ...payment.metadata,
  idempotencyKey: request.idempotencyKey
};
```

### 10.3 Failed Transaction Log

```typescript
// Already implemented in models.ts
interface IFailedTransaction {
  transactionId: string;
  operationType: string;
  entityType: string;
  payload: Record<string, any>;
  error: {
    message: string;
    code?: string | number;
    stack?: string;
    details?: any;
  };
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending_retry' | 'retrying' | 'resolved' | 'archived';
  retryCount: number;
  // ...
}
```

### 10.4 Compensation Actions

```typescript
// If payment succeeded but order update failed
async function compensateFailedOrderUpdate(paymentId: string) {
  const payment = await Payment.findById(paymentId);
  
  if (payment.status === 'completed') {
    // Reverse payment
    await Payment.updateOne(
      { _id: paymentId },
      { 
        status: 'reversed',
        reversedAt: new Date()
      }
    );
    
    // Log compensation
    await AuditLog.create({
      action: 'PAYMENT_REVERSED',
      user: 'system',
      details: `Reversed payment ${paymentId} due to order update failure`,
      date: new Date()
    });
  }
}
```

---

## 11. Implementation Checklist

### Core Requirements
- [x] Order schema with payment tracking
- [x] Payment schema with multi-method support
- [x] ACID transaction management
- [x] Inventory integration
- [x] Audit logging
- [x] Shift reconciliation

### Reporting Requirements
- [x] Sales dashboard queries
- [x] Payment method analytics
- [x] Product performance metrics
- [x] Category breakdown
- [x] Hourly sales trends

### Data Integrity
- [x] Unique constraints
- [x] Foreign key validations
- [x] Non-negative constraints
- [x] Temporal consistency
- [x] Idempotency support

### Error Handling
- [x] Transaction rollback
- [x] Retry mechanism
- [x] Failed transaction log
- [x] Compensation actions

---