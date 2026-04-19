import mongoose, { Schema, Document } from 'mongoose';

export interface IShift extends Document {
  shiftNumber: string;
  branchId: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  expectedEndTime?: Date;
  startCash: number; // Cash at beginning of shift
  endCash?: number; // Cash at end of shift
  expectedCash?: number; // Calculated expected cash at end
  cashDifference?: number; // actual - expected
  salesCount: number;
  salesTotal: number;
  transactionsCount: number;
  refundsCount: number;
  refundsTotal: number;
  cancelledSalesCount: number;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  clockedInAt: Date;
  clockedOutAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema = new Schema<IShift>(
  {
    shiftNumber: {
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
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: Date,
    expectedEndTime: Date,
    startCash: {
      type: Number,
      required: true,
      min: 0,
      precision: 2,
    },
    endCash: {
      type: Number,
      min: 0,
      precision: 2,
    },
    expectedCash: {
      type: Number,
      precision: 2,
    },
    cashDifference: {
      type: Number,
      precision: 2,
    },
    salesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    salesTotal: {
      type: Number,
      default: 0,
      min: 0,
      precision: 2,
    },
    transactionsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundsTotal: {
      type: Number,
      default: 0,
      min: 0,
      precision: 2,
    },
    cancelledSalesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    clockedInAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    clockedOutAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
ShiftSchema.index({ shiftNumber: 1 });
ShiftSchema.index({ branchId: 1 });
ShiftSchema.index({ staffId: 1 });
ShiftSchema.index({ status: 1 });
ShiftSchema.index({ startTime: -1 });
ShiftSchema.index({ endTime: 1 });

// Compound indexes
ShiftSchema.index({ branchId: 1, startTime: -1 });
ShiftSchema.index({ staffId: 1, status: 1 });

// Virtual for shift duration (in minutes)
ShiftSchema.virtual('durationMinutes').get(function (this: IShift) {
  const start = this.startTime;
  const end = this.endTime || new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
});

// Virtual for average transaction value
ShiftSchema.virtual('averageTransactionValue').get(function (this: IShift) {
  if (this.transactionsCount === 0) return 0;
  return this.salesTotal / this.transactionsCount;
});

// Virtual for expected vs actual
ShiftSchema.virtual('cashOverage').get(function (this: IShift) {
  if (this.cashDifference === undefined) return null;
  return this.cashDifference;
});

// Method to close shift
ShiftSchema.methods.closeShift = function (endCash: number, notes?: string) {
  if (this.status === 'completed' || this.status === 'cancelled') {
    throw new Error('Shift already closed');
  }

  this.endCash = endCash;
  this.endTime = new Date();
  this.expectedCash = this.startCash + this.salesTotal - this.refundsTotal; // Simplified
  this.cashDifference = endCash - (this.expectedCash || 0);
  this.status = 'completed';
  this.clockedOutAt = new Date();

  if (notes) {
    this.notes = (this.notes ? this.notes + '\n' : '') + notes;
  }
};

// Method to calculate expected cash
ShiftSchema.methods.calculateExpectedCash = function () {
  this.expectedCash = this.startCash + this.salesTotal - this.refundsTotal;
  return this.expectedCash;
};

export default mongoose.models.Shift || mongoose.model<IShift>('Shift', ShiftSchema);
