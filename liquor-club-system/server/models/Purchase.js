import mongoose, { Schema, Document } from 'mongoose';
import { PURCHASE_STATUS } from '../config/constants.js';

export interface IPurchase extends Document {
  purchaseNumber: string;
  branchId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  status: keyof typeof PURCHASE_STATUS;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    productSnapshot: {
      name: string;
      sku: string;
      unitType: string;
    };
    orderedQty: number;
    receivedQty: number;
    unitCost: number;
    totalCost: number;
    batchNumber?: string;
    expiryDate?: Date;
    notes?: string;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  deliveryDate?: Date;
  receivedAt?: Date;
  receivedBy?: mongoose.Types.ObjectId;
  invoiceNumber?: string;
  invoiceDate?: Date;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paidAmount: number;
  paidAt?: Date;
  paymentMethod?: string;
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  calculateTotals(): void;
  markAsReceived(receivedBy: mongoose.Types.ObjectId): Promise<void>;
  markAsPaid(paidAmount: number, paymentMethod: string): void;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    purchaseNumber: {
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
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PURCHASE_STATUS),
      default: PURCHASE_STATUS.DRAFT,
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
          unitType: { type: String, required: true },
        },
        orderedQty: {
          type: Number,
          required: true,
          min: 1,
        },
        receivedQty: {
          type: Number,
          default: 0,
          min: 0,
        },
        unitCost: {
          type: Number,
          required: true,
          min: 0,
          precision: 2,
        },
        totalCost: {
          type: Number,
          required: true,
          min: 0,
          precision: 2,
        },
        batchNumber: {
          type: String,
          trim: true,
          maxlength: 50,
        },
        expiryDate: Date,
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
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryDate: Date,
    receivedAt: Date,
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    invoiceNumber: {
      type: String,
      trim: true,
      maxlength: 100,
      unique: true,
      sparse: true,
    },
    invoiceDate: Date,
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
      precision: 2,
    },
    paidAt: Date,
    paymentMethod: String,
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
PurchaseSchema.index({ purchaseNumber: 1 });
PurchaseSchema.index({ branchId: 1 });
PurchaseSchema.index({ supplierId: 1 });
PurchaseSchema.index({ status: 1 });
PurchaseSchema.index({ paymentStatus: 1 });
PurchaseSchema.index({ deliveryDate: 1 });
PurchaseSchema.index({ createdAt: -1 });
PurchaseSchema.index({ 'items.productId': 1 });

// Compound indexes
PurchaseSchema.index({ branchId: 1, status: 1 });
PurchaseSchema.index({ supplierId: 1, status: 1 });

// Generate purchase number before saving
PurchaseSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');

      const count = await this.constructor.countDocuments({
        branchId: this.branchId,
        createdAt: {
          $gte: new Date(year, now.getMonth(), 1),
          $lt: new Date(year, now.getMonth() + 1, 1),
        },
      });

      this.purchaseNumber = `PO-${year}${month}-${String(count + 1).padStart(4, '0')}`;
      next();
    } catch (err) {
      return next(err as Error);
    }
  } else {
    next();
  }
});

// Calculate totals before saving
PurchaseSchema.methods.calculateTotals = function () {
  this.subtotal = 0;
  for (const item of this.items) {
    item.totalCost = item.orderedQty * item.unitCost;
    this.subtotal += item.totalCost;
  }

  // Assuming 16% VAT on purchases (simplified)
  this.taxAmount = this.subtotal * 0.16;
  this.totalAmount = this.subtotal + this.taxAmount;
};

// Mark as received - updates stock
PurchaseSchema.methods.markAsReceived = async function (receivedBy: mongoose.Types.ObjectId) {
  this.status = PURCHASE_STATUS.RECEIVED;
  this.receivedAt = new Date();
  this.receivedBy = receivedBy;

  // Stock movements will be created by service layer after this
  // This method just updates the purchase status
};

// Mark as paid
PurchaseSchema.methods.markAsPaid = function (paidAmount: number, paymentMethod: string) {
  this.paidAmount = paidAmount;
  this.paymentMethod = paymentMethod;
  this.paidAt = new Date();

  if (paidAmount >= this.totalAmount) {
    this.paymentStatus = 'paid';
  } else {
    this.paymentStatus = 'partial';
  }
};

export default mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema);
