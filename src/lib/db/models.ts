import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

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
  sellPrice?: number;
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
  paymentMethod: "cash" | "mpesa" | "card";
  status: "draft" | "held" | "billed" | "paid" | "cancelled";
  pointsEarned: number;
  createdAt: Date;
  heldAt?: Date;
  paidAt?: Date;
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
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["cash", "mpesa", "card"], default: "cash" },
  status: { type: String, enum: ["draft", "held", "billed", "paid", "cancelled"], default: "draft" },
  pointsEarned: { type: Number, default: 0 },
  heldAt: Date,
  paidAt: Date,
}, { timestamps: true });

OrderSchema.index({ orderId: 1 }, { unique: true });
OrderSchema.index({ customer: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

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
// EXPORT MODELS
// ============================================
export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
export const ProductUOM = mongoose.models.ProductUOM || mongoose.model<IProductUOM>("ProductUOM", ProductUOMSchema);
export const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
export const Staff = mongoose.models.Staff || mongoose.model<IStaff>("Staff", StaffSchema);
export const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>("Supplier", SupplierSchema);
export const Recipe = mongoose.models.Recipe || mongoose.model<IRecipe>("Recipe", RecipeSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
export const License = mongoose.models.License || mongoose.model<ILicense>("License", LicenseSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
export const ExciseDuty = mongoose.models.ExciseDuty || mongoose.model<IExciseDuty>("ExciseDuty", ExciseDutySchema);
export const HappyHour = mongoose.models.HappyHour || mongoose.model<IHappyHour>("HappyHour", HappyHourSchema);
export const MPESATransaction = mongoose.models.MPESATransaction || mongoose.model<IMPESATransaction>("MPESATransaction", MPESATransactionSchema);

// Export all schemas for reference
export const schemas = {
  User: UserSchema,
  Category: CategorySchema,
  Customer: CustomerSchema,
  Product: ProductSchema,
  ProductUOM: ProductUOMSchema,
  Order: OrderSchema,
  Staff: StaffSchema,
  Supplier: SupplierSchema,
  Recipe: RecipeSchema,
  Transaction: TransactionSchema,
  License: LicenseSchema,
  AuditLog: AuditLogSchema,
  ExciseDuty: ExciseDutySchema,
  HappyHour: HappyHourSchema,
  MPESATransaction: MPESATransactionSchema,
};