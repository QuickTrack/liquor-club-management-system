import mongoose, { Schema, Document } from 'mongoose';
import { CREDIT_STATUS } from '../config/constants.js';

export interface ICreditTransaction extends Document {
  customerId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  transactionNumber: string;
  type: 'debit' | 'credit' | 'interest' | 'fee';
  amount: number;
  balanceAfter: number;
  previousBalance: number;
  referenceType: 'sale' | 'payment' | 'adjustment' | 'write_off' | 'interest';
  referenceId: mongoose.Types.ObjectId;
  description: string;
  dueDate?: Date; // for debit transactions
  paidAt?: Date;
  paidBy?: mongoose.Types.ObjectId; // User
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'written_off';
  daysOverdue?: number;
  reminderCount: number;
  lastReminderAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CreditTransactionSchema = new Schema<ICreditTransaction>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['debit', 'credit', 'interest', 'fee'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      precision: 2,
    },
    balanceAfter: {
      type: Number,
      required: true,
      precision: 2,
    },
    previousBalance: {
      type: Number,
      required: true,
      precision: 2,
    },
    referenceType: {
      type: String,
      enum: ['sale', 'payment', 'adjustment', 'write_off', 'interest'],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    dueDate: Date,
    paidAt: Date,
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue', 'written_off'],
      default: 'pending',
    },
    daysOverdue: {
      type: Number,
      default: 0,
    },
    reminderCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastReminderAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
CreditTransactionSchema.index({ customerId: 1 });
CreditTransactionSchema.index({ branchId: 1 });
CreditTransactionSchema.index({ transactionNumber: 1 });
CreditTransactionSchema.index({ type: 1 });
CreditTransactionSchema.index({ status: 1 });
CreditTransactionSchema.index({ dueDate: 1 });
CreditTransactionSchema.index({ createdAt: -1 });
CreditTransactionSchema.index({ customerId: 1, createdAt: -1 });
CreditTransactionSchema.index({ branchId: 1, status: 1 });

// Compound indexes for aging reports
CreditTransactionSchema.index({ customerId: 1, type: 1, status: 1 });
CreditTransactionSchema.index({ branchId: 1, type: 1, status: 1, dueDate: 1 });

// Virtual for days outstanding
CreditTransactionSchema.virtual('daysOutstanding').get(function (this: ICreditTransaction) {
  const now = new Date();
  const created = this.createdAt;
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
});

// Method to mark as paid
CreditTransactionSchema.methods.markAsPaid = function (paidBy: mongoose.Types.ObjectId) {
  this.status = 'paid';
  this.paidAt = new Date();
  this.paidBy = paidBy;
};

export default mongoose.models.CreditTransaction || mongoose.model<ICreditTransaction>('CreditTransaction', CreditTransactionSchema);
