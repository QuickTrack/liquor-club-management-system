import mongoose, { Schema, Document } from 'mongoose';
import { STOCK_MOVEMENT_TYPES } from '../config/constants.js';

export interface IStockMovement extends Document {
  productId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  type: keyof typeof STOCK_MOVEMENT_TYPES;
  quantity: number; // positive for in, negative for out
  unitCost?: number; // cost per unit at time of movement
  totalCost?: number; // quantity * unitCost
  referenceType: 'sale' | 'purchase' | 'transfer' | 'adjustment' | 'waste' | 'initial' | 'return';
  referenceId: mongoose.Types.ObjectId; // saleId, purchaseId, etc.
  batchNumber?: string;
  expiryDate?: Date;
  supplierId?: mongoose.Types.ObjectId;
  destinationBranchId?: mongoose.Types.ObjectId; // for transfers
  reason?: string;
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId; // ref User
  approvedAt?: Date;
  createdBy: mongoose.Types.ObjectId; // ref User
  createdAt: Date;
  updatedAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(STOCK_MOVEMENT_TYPES),
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unitCost: {
      type: Number,
      min: 0,
      precision: 2,
    },
    totalCost: {
      type: Number,
      precision: 2,
    },
    referenceType: {
      type: String,
      enum: ['sale', 'purchase', 'transfer', 'adjustment', 'waste', 'initial', 'return'],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    batchNumber: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    expiryDate: Date,
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    destinationBranchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
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

// Indexes for fast queries
StockMovementSchema.index({ productId: 1, branchId: 1 });
StockMovementSchema.index({ type: 1 });
StockMovementSchema.index({ createdAt: -1 });
StockMovementSchema.index({ branchId: 1, createdAt: -1 });
StockMovementSchema.index({ batchNumber: 1 });
StockMovementSchema.index({ expiryDate: 1 });
StockMovementSchema.index({ referenceType: 1, referenceId: 1 });

// Compound index for stock-level queries
StockMovementSchema.index({ productId: 1, branchId: 1, type: 1 });

// Calculate totalCost before saving
StockMovementSchema.pre('save', function (next) {
  if (this.unitCost && this.quantity) {
    // For sales, cost is negative (stock going out)
    const sign = this.quantity >= 0 ? 1 : -1;
    this.totalCost = Math.abs(this.quantity) * this.unitCost * sign;
  }
  next();
});

// Static method to get current stock for a product at a branch
StockMovementSchema.statics.getCurrentStock = async function (
  productId: mongoose.Types.ObjectId,
  branchId: mongoose.Types.ObjectId
): Promise<number> {
  const movements = await this.find({
    productId,
    branchId,
  }).sort({ createdAt: 1 });

  let currentStock = 0;
  for (const movement of movements) {
    currentStock += movement.quantity;
  }

  return currentStock;
};

// Static method to get stock history with FIFO/LIFO
StockMovementSchema.statics.getStockHistory = async function (
  productId: mongoose.Types.ObjectId,
  branchId: mongoose.Types.ObjectId,
  limit = 100
) {
  return this.find({
    productId,
    branchId,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('createdBy', 'firstName lastName')
    .populate('approvedBy', 'firstName lastName');
};

// Static method to get products with low stock
StockMovementSchema.statics.getLowStockProducts = async function (branchId: mongoose.Types.ObjectId, threshold = 10) {
  // Aggregate stock per product
  const pipeline = [
    { $match: { branchId } },
    {
      $group: {
        _id: '$productId',
        totalStock: { $sum: '$quantity' },
      },
    },
    { $match: { totalStock: { $lt: threshold } } },
  ];

  const results = await this.aggregate(pipeline);
  return results;
};

export default mongoose.models.StockMovement || mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
