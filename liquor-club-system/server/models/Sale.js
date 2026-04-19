import mongoose, { Schema, Document } from 'mongoose';
import { PAYMENT_METHODS, PAYMENT_STATUS, SALE_STATUS } from '../config/constants.js';

export interface ISale extends Document {
  saleNumber: string; // e.g., INV-2024-0001
  branchId: mongoose.Types.ObjectId;
  cashierId: mongoose.Types.ObjectId; // ref User
  customerId?: mongoose.Types.ObjectId; // ref Customer (null for walk-in)
  tableNumber?: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'tab';
  status: keyof typeof SALE_STATUS;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    productSnapshot: {
      name: string;
      sku: string;
      sellingPrice: number;
      costPrice: number;
      unitType: string;
      alcoholContent?: number;
    };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discountAmount: number;
    discountReason?: string;
    notes?: string;
  }>;
  subtotal: number;
  taxAmount: number; // VAT
  exciseDutyAmount: number;
  discountTotal: number;
  totalAmount: number;
  paymentMethod: keyof typeof PAYMENT_METHODS;
  paymentStatus: keyof typeof PAYMENT_STATUS;
  mpesaTransactionId?: string;
  mpesaReceiptNumber?: string;
  cardTransactionId?: string;
  paidAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  refundReason?: string;
  voidedAt?: Date;
  voidedBy?: mongoose.Types.ObjectId;
  voidReason?: string;
  isTaxInclusive: boolean; // if true, prices include VAT
  exchangeRate?: number; // for foreign currency
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  loyaltyPointsDiscount: number;
  isRecurring: boolean;
  recurrenceInterval?: 'daily' | 'weekly' | 'monthly';
  nextRecurrenceDate?: Date;
  staffCommission?: Array<{
    staffId: mongoose.Types.ObjectId;
    amount: number;
    percentage: number;
    paid: boolean;
  }>;
  notes?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  calculateTotals(): void;
}

const SaleSchema = new Schema<ISale>(
  {
    saleNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    cashierId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    tableNumber: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    orderType: {
      type: String,
      enum: ['dine_in', 'takeaway', 'delivery', 'tab'],
      default: 'dine_in',
    },
    status: {
      type: String,
      enum: Object.values(SALE_STATUS),
      default: SALE_STATUS.COMPLETED,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        productSnapshot: {
          name: { type: String, required: true },
          sku: { type: String, required: true },
          sellingPrice: { type: Number, required: true, min: 0 },
          costPrice: { type: Number, required: true, min: 0 },
          unitType: { type: String, required: true },
          alcoholContent: Number,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
          description: 'Price per unit at time of sale',
        },
        totalPrice: {
          type: Number,
          required: true,
          min: 0,
          description: 'quantity * unitPrice - discount',
        },
        discountAmount: {
          type: Number,
          default: 0,
          min: 0,
        },
        discountReason: String,
        notes: {
          type: String,
          trim: true,
          maxlength: 200,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      description: 'Sum of (unitPrice * quantity) for all items before taxes',
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
      description: 'VAT amount',
    },
    exciseDutyAmount: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Excise duty total',
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Total discount applied to sale',
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      description: 'Final amount payable (subtotal + taxes - discounts)',
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    mpesaTransactionId: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    mpesaReceiptNumber: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    cardTransactionId: String,
    paidAt: Date,
    refundedAt: Date,
    refundAmount: {
      type: Number,
      min: 0,
    },
    refundReason: String,
    voidedAt: Date,
    voidedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    voidReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isTaxInclusive: {
      type: Boolean,
      default: false,
    },
    exchangeRate: {
      type: Number,
      min: 0,
    },
    loyaltyPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    loyaltyPointsRedeemed: {
      type: Number,
      default: 0,
      min: 0,
    },
    loyaltyPointsDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceInterval: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
    },
    nextRecurrenceDate: Date,
    staffCommission: [
      {
        staffId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        percentage: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        paid: {
          type: Boolean,
          default: false,
        },
      },
    ],
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
SaleSchema.index({ saleNumber: 1 });
SaleSchema.index({ branchId: 1 });
SaleSchema.index({ cashierId: 1 });
SaleSchema.index({ customerId: 1 });
SaleSchema.index({ status: 1 });
SaleSchema.index({ paymentStatus: 1 });
SaleSchema.index({ createdAt: -1 });
SaleSchema.index({ 'items.productId': 1 });
SaleSchema.index({ 'paymentMethod': 1 });
SaleSchema.index({ 'orderType': 1 });

// Compound indexes
SaleSchema.index({ branchId: 1, createdAt: -1 });
SaleSchema.index({ branchId: 1, status: 1 });
SaleSchema.index({ branchId: 1, paymentStatus: 1 });
SaleSchema.index({ customerId: 1, createdAt: -1 });

// Generate sale number before saving
SaleSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      // Get current year and month
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');

      // Count sales for this branch in current month
      const count = await this.constructor.countDocuments({
        branchId: this.branchId,
        createdAt: {
          $gte: new Date(year, now.getMonth(), 1),
          $lt: new Date(year, now.getMonth() + 1, 1),
        },
      });

      // Generate number: INV-{year}{month}-{4-digit sequential}
      this.saleNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
      next();
    } catch (err) {
      return next(err as Error);
    }
  } else {
    next();
  }
});

// Method to calculate totals (called before save)
SaleSchema.methods.calculateTotals = function () {
  // Reset totals
  this.subtotal = 0;
  this.taxAmount = 0;
  this.exciseDutyAmount = 0;
  this.discountTotal = 0;

  // Sum up items
  for (const item of this.items) {
    item.totalPrice = (item.unitPrice * item.quantity) - item.discountAmount;
    this.subtotal += item.unitPrice * item.quantity;
    this.discountTotal += item.discountAmount;
  }

  // Calculate taxes (VAT)
  if (this.isTaxInclusive) {
    // If prices include VAT, extract it
    this.taxAmount = this.subtotal * (16 / 116); // Kenyan VAT is 16%
  } else {
    this.taxAmount = this.subtotal * (this.taxRate || 16) / 100;
  }

  // Calculate excise duty based on items
  // Need to look up product excise duty from Product collection
  // Simplified here - would need async lookup

  // Final total
  this.totalAmount = this.subtotal + this.taxAmount + this.exciseDutyAmount - this.discountTotal;
};

// Virtual for net profit
SaleSchema.virtual('netProfit').get(function (this: ISale) {
  const costOfGoodsSold = this.items.reduce((sum, item) => {
    return sum + (item.productSnapshot.costPrice * item.quantity);
  }, 0);

  return this.totalAmount - costOfGoodsSold - this.taxAmount - this.exciseDutyAmount;
});

// Method to void sale
SaleSchema.methods.void = function (voidedBy: mongoose.Types.ObjectId, reason: string) {
  if (this.status === SALE_STATUS.VOIDED || this.status === SALE_STATUS.REFUNDED) {
    throw new Error('Cannot void an already voided/refunded sale');
  }

  this.status = SALE_STATUS.VOIDED;
  this.voidedAt = new Date();
  this.voidedBy = voidedBy;
  this.voidReason = reason;
};

// Method to refund
SaleSchema.methods.refund = function (refundedBy: mongoose.Types.ObjectId, amount: number, reason: string) {
  if (this.paymentStatus !== PAYMENT_STATUS.COMPLETED) {
    throw new Error('Cannot refund an unpaid sale');
  }

  if (amount > this.totalAmount) {
    throw new Error('Refund amount cannot exceed total amount');
  }

  this.refundedAt = new Date();
  this.refundAmount = amount;
  this.refundReason = reason;

  if (amount === this.totalAmount) {
    this.status = SALE_STATUS.REFUNDED;
    this.paymentStatus = PAYMENT_STATUS.REFUNDED;
  } else {
    this.status = SALE_STATUS.PARTIALLY_REFUNDED;
    this.paymentStatus = PAYMENT_STATUS.PARTIALLY_REFUNDED;
  }
};

export default mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);
