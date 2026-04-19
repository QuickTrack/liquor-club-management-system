import mongoose, { Schema, Document } from 'mongoose';
import { EXPENSE_CATEGORIES } from '../config/constants.js';

export interface IExpense extends Document {
  expenseNumber: string;
  branchId: mongoose.Types.ObjectId;
  category: keyof typeof EXPENSE_CATEGORIES;
  title: string;
  description?: string;
  amount: number;
  taxAmount?: number;
  paymentMethod: 'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'credit';
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  paidAt?: Date;
  paidBy?: mongoose.Types.ObjectId;
  receiptImage?: string;
  vendor?: string;
  vendorInvoiceNumber?: string;
  isRecurring: boolean;
  recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDueDate?: Date;
  attachments: string[];
  notes: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    expenseNumber: {
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
    category: {
      type: String,
      enum: Object.values(EXPENSE_CATEGORIES),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      precision: 2,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
      precision: 2,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'mpesa', 'card', 'bank_transfer', 'credit'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
    paidAt: Date,
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    receiptImage: String,
    vendor: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    vendorInvoiceNumber: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceInterval: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    nextDueDate: Date,
    attachments: [
      {
        type: String,
      },
    ],
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
ExpenseSchema.index({ expenseNumber: 1 });
ExpenseSchema.index({ branchId: 1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ paymentStatus: 1 });
ExpenseSchema.index({ paymentMethod: 1 });
ExpenseSchema.index({ createdAt: -1 });
ExpenseSchema.index({ dueDate: 1 });
ExpenseSchema.index({ nextDueDate: 1 });

// Compound indexes
ExpenseSchema.index({ branchId: 1, createdAt: -1 });
ExpenseSchema.index({ createdBy: 1, branchId: 1 });

// Generate expense number before saving
ExpenseSchema.pre('save', async function (next) {
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
      this.expenseNumber = `EXP-${year}${month}-${String(count + 1).padStart(4, '0')}`;
      next();
    } catch (err) {
      return next(err as Error);
    }
  } else {
    next();
  }
});

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
