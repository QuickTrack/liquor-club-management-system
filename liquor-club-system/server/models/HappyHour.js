import mongoose, { Schema } from 'mongoose';

export interface IHappyHour {
  name: string;
  branchId: mongoose.Types.ObjectId;
  isActive: boolean;
  appliesToAll: boolean;
  productIds?: mongoose.Types.ObjectId[];
  categoryIds?: mongoose.Types.ObjectId[];
  pricing: {
    type: 'percentage_discount' | 'fixed_price' | 'buy_x_get_y';
    discountPercent?: number;
    fixedPrice?: number;
    buyQty?: number;
    getQty?: number;
  };
  schedule: {
    daysOfWeek: number[]; // 0=Sunday, 6=Saturday
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  };
  minPurchaseAmount?: number;
  maxDiscountPerItem?: number;
  totalCap?: number;
  requiresCode: boolean;
  promoCode?: string;
  stackable: boolean;
  notes?: string;
}

const HappyHourSchema = new Schema<IHappyHour>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    appliesToAll: {
      type: Boolean,
      default: false,
    },
    productIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    categoryIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    pricing: {
      type: {
        type: String,
        enum: ['percentage_discount', 'fixed_price', 'buy_x_get_y'],
        required: true,
      },
      discountPercent: {
        type: Number,
        min: 0,
        max: 100,
      },
      fixedPrice: {
        type: Number,
        min: 0,
      },
      buyQty: {
        type: Number,
        min: 1,
      },
      getQty: {
        type: Number,
        min: 1,
      },
    },
    schedule: {
      daysOfWeek: {
        type: [Number],
        required: true,
        minitems: 1,
        maxitems: 7,
      },
      startTime: {
        type: String,
        required: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'],
      },
      endTime: {
        type: String,
        required: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'],
      },
    },
    minPurchaseAmount: {
      type: Number,
      min: 0,
    },
    maxDiscountPerItem: {
      type: Number,
      min: 0,
    },
    totalCap: {
      type: Number,
      min: 0,
    },
    requiresCode: {
      type: Boolean,
      default: false,
    },
    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    stackable: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
HappyHourSchema.index({ branchId: 1, isActive: 1 });
HappyHourSchema.index({ isActive: 1 });

export default mongoose.models.HappyHour || mongoose.model<IHappyHour>('HappyHour', HappyHourSchema);
