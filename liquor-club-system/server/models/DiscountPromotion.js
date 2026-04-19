import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscountPromotion extends Document {
  promotionCode: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'bundle' | 'tiered';
  value: number; // percentage or fixed amount
  config: {
    minPurchase?: number; // minimum subtotal
    maxDiscount?: number; // cap on discount
    buyQty?: number; // for buy_x_get_y
    getQty?: number; // for buy_x_get_y
    getProductId?: mongoose.Types.ObjectId; // for buy_x_get_y
    productIds?: mongoose.Types.ObjectId[]; // applicable products
    excludeProductIds?: mongoose.Types.ObjectId[]; // excluded products
    categories?: string[]; // applicable categories
    tiers?: string[]; // applicable customer tiers
    timeRestrictions?: {
      startTime?: string;
      endTime?: string;
      daysOfWeek?: number[]; // 0=Sun, 6=Sat
    };
    dateRange?: {
      startDate: Date;
      endDate: Date;
    };
    usageLimit?: number; // total max uses
    perCustomerLimit?: number; // max uses per customer
  };
  stackable: boolean; // can be combined with other promos
  priority: number; // for stacking order
  branchId?: mongoose.Types.ObjectId; // null = global
  applicableTo: 'all' | 'specific_customers' | 'exclude_customers';
  applicableCustomerIds?: mongoose.Types.ObjectId[];
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
  usageStats: {
    totalUsed: number;
    totalDiscountAmount: number;
    perCustomerUsage: Array<{
      customerId: mongoose.Types.ObjectId;
      usedCount: number;
      totalSavings: number;
    }>;
  };
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Virtual method to check if promo is valid now
  isValid(): boolean;
  // Virtual method to calculate discount for given cart
  calculateDiscount(subtotal: number, items: any[], customerId?: mongoose.Types.ObjectId): number;
}

const DiscountPromotionSchema = new Schema<IDiscountPromotion>(
  {
    promotionCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed_amount', 'buy_x_get_y', 'bundle', 'tiered'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    config: {
      minPurchase: { type: Number, min: 0 },
      maxDiscount: { type: Number, min: 0 },
      buyQty: { type: Number, min: 1 },
      getQty: { type: Number, min: 1 },
      getProductId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
      productIds: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
      ],
      excludeProductIds: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
      ],
      categories: [String],
      tiers: [String],
      timeRestrictions: {
        startTime: String,
        endTime: String,
        daysOfWeek: [Number],
      },
      dateRange: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
      },
      usageLimit: { type: Number, min: 1 },
      perCustomerLimit: { type: Number, min: 1 },
    },
    stackable: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
    },
    applicableTo: {
      type: String,
      enum: ['all', 'specific_customers', 'exclude_customers'],
      default: 'all',
    },
    applicableCustomerIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    startsAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    usageStats: {
      totalUsed: { type: Number, default: 0, min: 0 },
      totalDiscountAmount: { type: Number, default: 0, min: 0, precision: 2 },
      perCustomerUsage: [
        {
          customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
          usedCount: { type: Number, default: 0, min: 0 },
          totalSavings: { type: Number, default: 0, min: 0, precision: 2 },
        },
      ],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
DiscountPromotionSchema.index({ promotionCode: 1 });
DiscountPromotionSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });
DiscountPromotionSchema.index({ branchId: 1 });
DiscountPromotionSchema.index({ applicableTo: 1 });
DiscountPromotionSchema.index({ 'config.productIds': 1 });
DiscountPromotionSchema.index({ 'config.categories': 1 });
DiscountPromotionSchema.index({ type: 1 });

// Check if promotion is currently valid
DiscountPromotionSchema.methods.isValid = function (): boolean {
  const now = new Date();

  if (!this.isActive) return false;
  if (now < this.startsAt || now > this.endsAt) return false;

  // Check usage limit
  if (this.config.usageLimit && this.usageStats.totalUsed >= this.config.usageLimit) {
    return false;
  }

  return true;
};

// Calculate discount for a cart
DiscountPromotionSchema.methods.calculateDiscount = function (
  subtotal: number,
  items: Array<{ productId: string; quantity: number; unitPrice: number }>,
  customerId?: mongoose.Types.ObjectId
): number {
  if (!this.isValid()) return 0;

  // Check minimum purchase requirement
  if (this.config.minPurchase && subtotal < this.config.minPurchase) {
    return 0;
  }

  // Check per-customer usage limit
  if (this.config.perCustomerLimit && customerId) {
    const customerUsage = this.usageStats.perCustomerUsage.find(
      (u) => u.customerId.toString() === customerId.toString()
    );
    if (customerUsage && customerUsage.usedCount >= this.config.perCustomerLimit) {
      return 0;
    }
  }

  // Calculate based on type
  let discount = 0;

  switch (this.type) {
    case 'percentage':
      // Apply to all items or specific items
      if (this.config.productIds && this.config.productIds.length > 0) {
        // Apply only to matching products
        for (const item of items) {
          if (this.config.productIds?.some(pid => pid.toString() === item.productId.toString())) {
            discount += item.unitPrice * item.quantity * (this.value / 100);
          }
        }
      } else {
        // Apply to entire subtotal
        discount = subtotal * (this.value / 100);
      }
      break;

    case 'fixed_amount':
      discount = this.value;
      break;

    case 'buy_x_get_y':
      // Simplified: BUY X GET Y
      if (this.config.buyQty && this.config.getQty && this.config.getProductId) {
        // Calculate how many qualifying items in cart
        const qualifyingItems = items.filter(
          item => item.productId.toString() === this.config.getProductId?.toString()
        );
        const totalQualifyingQty = qualifyingItems.reduce((sum, item) => sum + item.quantity, 0);
        const sets = Math.floor(totalQualifyingQty / this.config.buyQty);
        discount = sets * this.config.getQty * items[0]?.unitPrice || 0; // Simplified
      }
      break;
  }

  // Apply max discount cap
  if (this.config.maxDiscount && discount > this.config.maxDiscount) {
    discount = this.config.maxDiscount;
  }

  return Math.min(discount, subtotal); // Can't discount more than subtotal
};

export default mongoose.models.DiscountPromotion || mongoose.model<IDiscountPromotion>('DiscountPromotion', DiscountPromotionSchema);
