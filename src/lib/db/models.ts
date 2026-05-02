import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

// ============================================
// FAILED TRANSACTION LOG SCHEMA
// ============================================
export interface IFailedTransaction extends Document {
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
  severity: "critical" | "high" | "medium" | "low";
  status: "pending_retry" | "retrying" | "resolved" | "archived";
  retryCount: number;
  firstFailedAt: Date;
  lastAttemptedAt: Date;
  retryAfter?: Date;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  isPermanentFailure: boolean;
}

const FailedTransactionSchema = new Schema<IFailedTransaction>({
  transactionId: { type: String, required: true, unique: true, index: true },
  operationType: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  payload: { type: Schema.Types.Mixed, required: true },
  error: {
    message: { type: String, required: true },
    code: { type: String },
    stack: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  severity: {
    type: String,
    enum: ["critical", "high", "medium", "low"],
    default: "high",
    index: true,
  },
  status: {
    type: String,
    enum: ["pending_retry", "retrying", "resolved", "archived"],
    default: "pending_retry",
    index: true,
  },
  retryCount: { type: Number, default: 0, min: 0 },
  firstFailedAt: { type: Date, required: true, default: Date.now, index: true },
  lastAttemptedAt: { type: Date, required: true, default: Date.now, index: true },
  retryAfter: { type: Date, index: true },
  userId: { type: String, index: true },
  sessionId: { type: String, index: true },
  metadata: { type: Schema.Types.Mixed },
});

FailedTransactionSchema.virtual("isPermanentFailure").get(function (this: any) {
  if (this.error?.code === 11000) return true;
  const permanentMessages = ["Validation failed", "Cast to ObjectId failed", "duplicate key error", "document failed validation"];
  const message = (this.error?.message || "").toLowerCase();
  return permanentMessages.some((msg: string) => message.includes(msg.toLowerCase()));
});

FailedTransactionSchema.set("toJSON", { 
  virtuals: true, 
  transform: (doc: any, ret: any) => {
    delete ret._id;
    delete ret.__v;
    delete ret.isPermanentFailure; // Virtual, already serialized if needed
    return ret;
  } 
});
FailedTransactionSchema.set("toObject", { virtuals: true });

// ============================================
// USER SCHEMA (AUTHENTICATION)
// ============================================
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: "Super Admin" | "Admin" | "Manager" | "Cashier" | "Bartender" | "Waiter" | "Auditor";
  phone?: string;
  branchId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ["Super Admin", "Admin", "Manager", "Cashier", "Bartender", "Waiter", "Auditor"],
    required: true,
  },
  phone: String,
  branchId: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  try {
    const bcrypt = (await import("bcryptjs")).default;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw new Error("Password hashing failed: " + (err as Error).message);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    const bcrypt = (await import("bcryptjs")).default;
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

// ============================================
// CATEGORY SCHEMA (PRODUCT CATEGORIES)
// ============================================
export interface ICategory extends Document {
  name: string;
  description?: string;
  color: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  parentId?: mongoose.Types.ObjectId;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" },
  color: { type: String, default: "#64748b" },
  icon: { type: String, default: "" },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  parentId: { type: Schema.Types.ObjectId, ref: "Category" },
}, { timestamps: true });

CategorySchema.index({ sortOrder: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ parentId: 1 });

// ============================================
// CUSTOMER SCHEMA
// ============================================
export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  tier: "Bronze" | "Silver" | "Gold" | "VIP";
  creditLimit: number;
  creditUsed: number;
  points: number;
  totalSpent: number;
  visits: number;
  lastVisit?: Date;
  preferences: string;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  tier: { type: String, enum: ["Bronze", "Silver", "Gold", "VIP"], default: "Bronze" },
  creditLimit: { type: Number, default: 0 },
  creditUsed: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  visits: { type: Number, default: 0 },
  lastVisit: Date,
  preferences: String,
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });

CustomerSchema.index({ phone: 1 }, { unique: true });
CustomerSchema.index({ tier: 1 });
CustomerSchema.index({ status: 1 });

// ============================================
// PRODUCT SCHEMA (INVENTORY)
// ============================================
export interface IProduct extends Document {
  name: string;
  category: string;
  stock: number;
  unit: string;
  reorderLevel: number;
  costPrice: number;
  sellPrice: number;
  supplier: string;
  expiryDate?: Date;
  batchNo?: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 0 },
  unit: { type: String, default: "bottles" },
  reorderLevel: { type: Number, default: 10 },
  costPrice: { type: Number, required: true },
  sellPrice: { type: Number, required: true },
  supplier: String,
  expiryDate: Date,
  batchNo: String,
  status: { type: String, enum: ["In Stock", "Low Stock", "Out of Stock"], default: "In Stock" },
}, { timestamps: true });

ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ name: "text" });

// ============================================
// PRODUCT UOM (UNIT OF MEASURE) SCHEMA
// ============================================
export interface IUnit {
  name: string;
  abbreviation: string;
  isBase: boolean;
  conversionFactor: number;
  isActive: boolean;
  sellPrice: number;
  costPrice?: number;
}

export interface IProductUOM extends Document {
  product: mongoose.Types.ObjectId;
  baseUnit: string;
  units: IUnit[];
}

const UnitSchema = new Schema<IUnit>({
  name: { type: String, required: true },
  abbreviation: { type: String, required: true },
  isBase: { type: Boolean, default: false },
  conversionFactor: { type: Number, required: true, min: 0.01 },
  isActive: { type: Boolean, default: true },
  sellPrice: { type: Number, default: 0 },
  costPrice: { type: Number },
}, { _id: false });

const ProductUOMSchema = new Schema<IProductUOM>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  baseUnit: { type: String, required: true },
  units: [UnitSchema],
}, { timestamps: true });

ProductUOMSchema.index({ product: 1 }, { unique: true });

// ============================================
// ORDER SCHEMA
// ============================================
export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  category: string;
  unit: string; // Selected unit abbreviation (e.g., "kg", "g", "lbs", "oz", "bottle", "pack")
  conversionFactor: number; // Conversion factor from base unit to selected unit
  unitPrice: number; // Price per selected unit
}

export interface IOrder extends Document {
  orderId: string;
  customer: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "mpesa" | "card" | "account" | "bank_transfer";
  status: "draft" | "held" | "billed" | "paid" | "cancelled";
  pointsEarned: number;
  assignedTo?: mongoose.Types.ObjectId; // Staff member assigned to this order
  createdAt: Date;
  heldAt?: Date;
  paidAt?: Date;
  
  // Payment tracking
  payments?: mongoose.Types.ObjectId[];  // References to Payment documents
  totalPaid?: number;                    // Sum of all completed payments
  outstandingBalance?: number;           // total - totalPaid
  fullyPaid?: boolean;                   // totalPaid >= total
  
  // Financial close
  closed?: boolean;                      // Order is finalized, no more changes
  closedAt?: Date;
  closedBy?: mongoose.Types.ObjectId;   // User who closed
  
  // Reconciliation
  reconciliationId?: string;             // Link to end-of-shift reconciliation
  isReconciled?: boolean;
}

const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product" },
  name: String,
  price: Number,
  quantity: Number,
  category: String,
  unit: String,
  conversionFactor: Number,
  unitPrice: Number,
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: false },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["cash", "mpesa", "card", "account", "bank_transfer"], default: "cash" },
  status: { type: String, enum: ["draft", "held", "billed", "paid", "cancelled"], default: "draft" },
  pointsEarned: { type: Number, default: 0 },
  assignedTo: { type: Schema.Types.ObjectId, ref: "Staff" },
  heldAt: Date,
  paidAt: Date,
  
  // Payment tracking
  payments: [{ type: Schema.Types.ObjectId, ref: "Payment" }],
  totalPaid: { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 },
  fullyPaid: { type: Boolean, default: false },
  
  // Financial close
  closed: { type: Boolean, default: false },
  closedAt: Date,
  closedBy: { type: Schema.Types.ObjectId, ref: "User" },
  
  // Reconciliation
  reconciliationId: String,
  isReconciled: { type: Boolean, default: false },
}, { timestamps: true });

OrderSchema.index({ orderId: 1 }, { unique: true });
OrderSchema.index({ customer: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ assignedTo: 1 });
OrderSchema.index({ createdAt: -1 });

// ============================================
// PAYMENT SCHEMA (FINANCIAL TRANSACTIONS)
// ============================================
export interface IPayment extends Document {
  paymentId: string;                  // Unique payment identifier
  orderId: string;                    // Reference to Order.orderId (not ObjectId)
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

const PaymentSchema = new Schema<IPayment>({
  paymentId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  orderId: { 
    type: String, 
    required: true,
    index: true 
  },
  orderObjectId: { 
    type: Schema.Types.ObjectId, 
    ref: "Order",
    required: true,
    index: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0 
  },
  currency: { 
    type: String, 
    default: "KES" 
  },
  method: { 
    type: String, 
    enum: ["cash", "mpesa", "card", "account", "bank_transfer"],
    required: true,
    index: true 
  },
  status: { 
    type: String, 
    enum: ["pending", "completed", "failed", "refunded", "reversed"],
    default: "pending",
    index: true 
  },
  
  // M-Pesa details
  mpesaReceiptNumber: String,
  mpesaPhoneNumber: String,
  mpesaCheckoutRequestId: String,
  
  // Card details
  cardLast4: String,
  cardBrand: String,
  authorizationCode: String,
  
  // Cash handling
  cashTendered: Number,
  changeGiven: Number,
  
  metadata: Schema.Types.Mixed,
  
  // Critical: who processed this payment
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  
  // Timestamps
  initiatedAt: { type: Date, required: true, default: Date.now },
  completedAt: Date,
  refundedAt: Date
}, { 
  timestamps: true 
});

// Compound indexes for common queries
PaymentSchema.index({ orderId: 1, createdAt: -1 });
PaymentSchema.index({ method: 1, status: 1 });
PaymentSchema.index({ "metadata.sessionId": 1 });
PaymentSchema.index({ createdAt: -1 });

// ============================================
// SHIFT RECONCILIATION SCHEMA
// ============================================
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
  
  // Audit
  closedAt: Date;
  closedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftReconciliationSchema = new Schema<IShiftReconciliation>({
  reconciliationId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  branchId: String,
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  shift: { 
    type: String, 
    enum: ["Morning", "Evening", "Night"],
    required: true 
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  
  totalOrders: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  totalRefunds: { type: Number, default: 0 },
  
  cashReceived: { type: Number, default: 0 },
  cashInDrawer: { type: Number, default: 0 },
  cashVariance: { type: Number, default: 0 },
  
  mpesaReceived: { type: Number, default: 0 },
  cardReceived: { type: Number, default: 0 },
  accountReceived: { type: Number, default: 0 },
  
  itemsSold: { type: Number, default: 0 },
  categoriesSold: { type: Schema.Types.Mixed, default: {} },
  
  orderIds: [{ type: String }],
  paymentIds: [{ type: String }],
  inventoryTransactionIds: [{ type: String }],
  
  startingFloat: { type: Number, default: 0 },
  endingFloat: { type: Number, default: 0 },
  cashDrop: { type: Number, default: 0 },
  
  status: { 
    type: String, 
    enum: ["open", "closed", "reconciled"],
    default: "open" 
  },
  notes: String,
  
  closedAt: Date,
  closedBy: { type: Schema.Types.ObjectId, ref: "User" }
}, { 
  timestamps: true 
});

ShiftReconciliationSchema.index({ userId: 1, status: 1 });
ShiftReconciliationSchema.index({ startTime: -1 });
ShiftReconciliationSchema.index({ reconciliationId: 1 });

// ============================================
// STAFF SCHEMA
// ============================================
export interface IStaff extends Document {
  name: string;
  role: "Admin" | "Manager" | "Cashier" | "Bartender" | "Waiter";
  phone: string;
  email: string;
  shift: "Morning" | "Evening" | "Night";
  hireDate: Date;
  totalSales: number;
  commission: number;
  pin?: string;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>({
  name: { type: String, required: true },
  role: { type: String, enum: ["Admin", "Manager", "Cashier", "Bartender", "Waiter"], required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  shift: { type: String, enum: ["Morning", "Evening", "Night"], default: "Evening" },
  hireDate: { type: Date, required: true },
  totalSales: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  pin: String,
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });

StaffSchema.index({ role: 1 });
StaffSchema.index({ status: 1 });

// ============================================
// SUPPLIER SCHEMA
// ============================================
export interface ISupplier extends Document {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  products: string;
  totalOrders: number;
  totalSpent: number;
  creditBalance: number;
  rating: number;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>({
  name: { type: String, required: true },
  contactPerson: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  products: String,
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  creditBalance: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });

SupplierSchema.index({ status: 1 });

// ============================================
// RECIPE SCHEMA (COCKTAILS)
// ============================================
export interface IIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface IRecipe extends Document {
  name: string;
  category: string;
  price: number;
  ingredients: IIngredient[];
  prepTime: number;
  isAvailable: boolean;
  soldToday: number;
  revenue: number;
  createdAt: Date;
  updatedAt: Date;
}

const IngredientSchema = new Schema({
  name: String,
  amount: String,
  unit: String,
}, { _id: false });

const RecipeSchema = new Schema<IRecipe>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  ingredients: [IngredientSchema],
  prepTime: { type: Number, default: 5 },
  isAvailable: { type: Boolean, default: true },
  soldToday: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
}, { timestamps: true });

RecipeSchema.index({ category: 1 });
RecipeSchema.index({ isAvailable: 1 });

// ============================================
// TRANSACTION SCHEMA (FINANCIAL)
// ============================================
export interface ITransaction extends Document {
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: Date;
  status: "Completed" | "Pending";
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  type: { type: String, enum: ["income", "expense"], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["Completed", "Pending"], default: "Completed" },
}, { timestamps: true });

TransactionSchema.index({ type: 1 });
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ category: 1 });

// ============================================
// LICENSE SCHEMA (COMPLIANCE)
// ============================================
export interface ILicense extends Document {
  name: string;
  type: string;
  licenseNumber?: string;
  issueDate: Date;
  expiryDate: Date;
  status: "Valid" | "Expiring Soon" | "Expired";
  createdAt: Date;
  updatedAt: Date;
}

const LicenseSchema = new Schema<ILicense>({
  name: { type: String, required: true },
  type: { type: String, required: true },
  licenseNumber: String,
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  status: { type: String, enum: ["Valid", "Expiring Soon", "Expired"], default: "Valid" },
}, { timestamps: true });

LicenseSchema.index({ status: 1 });
LicenseSchema.index({ expiryDate: 1 });

// ============================================
// AUDIT LOG SCHEMA
// ============================================
export interface IAuditLog extends Document {
  action: string;
  user: string;
  details: string;
  date: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true },
  user: { type: String, required: true },
  details: String,
  date: { type: Date, required: true },
}, { timestamps: true });

AuditLogSchema.index({ date: -1 });
AuditLogSchema.index({ user: 1 });

// ============================================
// EXCISE DUTY SCHEMA
// ============================================
export interface IExciseDuty extends Document {
  product: string;
  volume: number;
  exciseDuty: number;
  date: Date;
}

const ExciseDutySchema = new Schema<IExciseDuty>({
  product: { type: String, required: true },
  volume: { type: Number, required: true },
  exciseDuty: { type: Number, required: true },
  date: { type: Date, required: true },
}, { timestamps: true });

ExciseDutySchema.index({ date: -1 });

// ============================================
// MPESA TRANSACTION SCHEMA
// ============================================
export interface IMPESATransaction extends Document {
  merchantRequestId: string;
  checkoutRequestId: string;
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  status: "Pending" | "Completed" | "Failed" | "Cancelled";
  resultCode?: number;
  resultDesc?: string;
  mpesaReceiptNumber?: string;
  transactionDate?: Date;
  metadata?: Record<string, any>;
}

const MPESATransactionSchema = new Schema<IMPESATransaction>({
  merchantRequestId: { type: String, required: true },
  checkoutRequestId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  accountReference: { type: String, required: true },
  transactionDesc: String,
  status: {
    type: String,
    enum: ["Pending", "Completed", "Failed", "Cancelled"],
    default: "Pending",
  },
  resultCode: Number,
  resultDesc: String,
  mpesaReceiptNumber: String,
  transactionDate: Date,
  metadata: Schema.Types.Mixed,
}, { timestamps: true });

MPESATransactionSchema.index({ checkoutRequestId: 1 });
MPESATransactionSchema.index({ merchantRequestId: 1 });
MPESATransactionSchema.index({ phoneNumber: 1 });
MPESATransactionSchema.index({ status: 1 });

// ============================================
// HAPPY HOUR SCHEMA
// ============================================
export interface IHappyHour extends Document {
  day: string;
  startTime: string;
  endTime: string;
  discount: number;
  isActive: boolean;
}

const HappyHourSchema = new Schema<IHappyHour>({
  day: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  discount: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
 }, { timestamps: true });

// ============================================
// SHIFT OPENING SCHEMA (CASHIER LOGIN INTAKE)
// ============================================
 export interface IShiftOpening extends Document {
   openingId: string;
   cashier: mongoose.Types.ObjectId;      // Staff who opened the shift
   shift: "Morning" | "Evening" | "Night";
   startTime: Date;
   endTime?: Date;                         // Set when shift closes

   // Financial opening balances
   openingCashFloat: number;               // Cash float at shift start
   openingMpesaBalance: number;            // M-Pesa balance at shift start

    // Stock verification checklist
    stockChecklist: {
      productId: mongoose.Types.ObjectId;
      productName: string;
      category: string;
      unit: string;                    // Base unit (system unit)
      systemQuantity: number;          // Expected stock in base units
      physicalCount: number;           // Counted quantity (already converted to base units). If verification deferred, assumed equal to systemQuantity.
      physicalUnit: string;            // Unit used during physical count (e.g., "cases", "bottles")
      conversionFactor: number;        // Multiplier to convert from physicalUnit to baseUnit
      discrepancy: number;             // physicalCount (converted) - systemQuantity
      notes?: string;
    }[];

   // Discrepancy summary
   totalDiscrepancies: number;
   totalMissingValue: number;              // Value of missing items

   // Authentication
   cashierSignature: string;               // Typed name or digital signature
   confirmedAt: Date;

   // Status
   status: "open" | "closed";

   // Deferral tracking
   checklistDeferred: boolean;             // True if stock verification was deferred using "Remind Me Later"
   deferredAt?: Date;                      // When the deferral occurred
   deferredUntil?: Date;                   // When the reminder should trigger

   // Audit
   createdAt: Date;
   updatedAt: Date;
 }

 const ShiftOpeningSchema = new Schema<IShiftOpening>({
   openingId: { type: String, required: true, unique: true, index: true },
   cashier: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
   shift: { type: String, enum: ["Morning", "Evening", "Night"], required: true },
   startTime: { type: Date, required: true, default: Date.now },
   endTime: Date,

   // Financial opening balances
   openingCashFloat: { type: Number, required: true, min: 0 },
   openingMpesaBalance: { type: Number, required: true, min: 0 },

    // Stock verification checklist
    stockChecklist: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        productName: { type: String, required: true },
        category: { type: String, required: true },
        unit: { type: String, required: true }, // Base unit
        systemQuantity: { type: Number, required: true, min: 0 },
        physicalCount: { type: Number, required: true, min: 0 }, // In base units after conversion
        physicalUnit: { type: String, required: true }, // Unit used during count
        conversionFactor: { type: Number, required: true, min: 0.01 },
        discrepancy: { type: Number, default: 0 },
        notes: String,
      },
    ],

   // Discrepancy summary
   totalDiscrepancies: { type: Number, default: 0 },
   totalMissingValue: { type: Number, default: 0 },

   // Authentication
   cashierSignature: { type: String, required: true },
   confirmedAt: { type: Date, required: true, default: Date.now },

   // Status
   status: { type: String, enum: ["open", "closed"], default: "open" },

    // Deferral tracking
    checklistDeferred: { type: Boolean, default: false },
    deferredAt: { type: Date },
    deferredUntil: { type: Date },

   // Audit
   createdAt: { type: Date, default: Date.now },
   updatedAt: { type: Date, default: Date.now },
 });

// Generate openingId
ShiftOpeningSchema.pre("save", async function () {
  if (!this.openingId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.openingId = `SO-${timestamp}-${random}`;
  }
});

ShiftOpeningSchema.index({ cashier: 1, startTime: -1 });
ShiftOpeningSchema.index({ shift: 1, status: 1 });

// ============================================
// EXPORT MODELS
// ============================================
export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
export const ProductUOM = mongoose.models.ProductUOM || mongoose.model<IProductUOM>("ProductUOM", ProductUOMSchema);
export const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
export const Payment = mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
export const Staff = mongoose.models.Staff || mongoose.model<IStaff>("Staff", StaffSchema);
export const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>("Supplier", SupplierSchema);
export const Recipe = mongoose.models.Recipe || mongoose.model<IRecipe>("Recipe", RecipeSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
export const License = mongoose.models.License || mongoose.model<ILicense>("License", LicenseSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
export const ExciseDuty = mongoose.models.ExciseDuty || mongoose.model<IExciseDuty>("ExciseDuty", ExciseDutySchema);
export const HappyHour = mongoose.models.HappyHour || mongoose.model<IHappyHour>("HappyHour", HappyHourSchema);
export const MPESATransaction = mongoose.models.MPESATransaction || mongoose.model<IMPESATransaction>("MPESATransaction", MPESATransactionSchema);
export const FailedTransaction = mongoose.models.FailedTransaction || mongoose.model<IFailedTransaction>("FailedTransaction", FailedTransactionSchema);
export const ShiftReconciliation = mongoose.models.ShiftReconciliation || mongoose.model<IShiftReconciliation>("ShiftReconciliation", ShiftReconciliationSchema);
export const ShiftOpening = mongoose.models.ShiftOpening || mongoose.model<IShiftOpening>("ShiftOpening", ShiftOpeningSchema);
