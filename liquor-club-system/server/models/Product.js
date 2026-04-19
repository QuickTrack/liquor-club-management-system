import mongoose, { Schema, Document } from 'mongoose';
import { PRODUCT_CATEGORIES, UNIT_TYPES } from '../config/constants.js';

export interface IProduct extends Document {
  sku: string;
  name: string;
  description?: string;
  category: keyof typeof PRODUCT_CATEGORIES;
  brand?: string;
  origin?: string;
  alcoholContent?: number; // percentage
  volume: number; // in ml
  unitType: keyof typeof UNIT_TYPES;
  conversionRate: number; // e.g., 1 bottle = 30 shots
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  retailPrice?: number;
  images: string[];
  barcode?: string;
  isActive: boolean;
  isAlcoholic: boolean;
  exciseDutyCategory?: string; // beer, wine, spirits
  ingredients?: string[];
  allergens?: string[];
  storageRequirements?: string;
  minTemperature?: number;
  maxTemperature?: number;
  shelfLifeDays?: number;
  nutritionFacts?: Record<string, any>;
  tags: string[];
  branchId: mongoose.Types.ObjectId; // which branch carries this product
  Department?: mongoose.Types.ObjectId; // ref Department for categorization
  isComboItem: boolean; // part of a combo/menu item
  comboItems?: mongoose.Types.ObjectId[]; // ref to other products if this is a combo
  requiresRecipe: boolean; // for cocktails/mixed drinks
  recipe?: {
    ingredients: Array<{
      productId: mongoose.Types.ObjectId;
      quantity: number;
      unit: string;
    }>;
    instructions: string[];
    glassware: string;
    garnish?: string[];
    prepTimeMinutes: number;
  };
  pricingRules: Array<{
    name: string;
    type: 'percentage' | 'fixed' | 'time_based' | 'day_based';
    value: number;
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[]; // 0=Sunday, 6=Saturday
    minQty?: number;
    maxQty?: number;
    applicableTo?: mongoose.Types.ObjectId[]; // customer tiers
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
  }>;
  taxRate: number; // VAT rate percentage
  exciseDuty: number; // per unit (bottle/litre)
  accounting: {
    revenueAccount: string;
    costOfGoodsSoldAccount: string;
    inventoryAccount: string;
  };
  trackExpiry: boolean;
  expiryWarningDays: number;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  profitMargin(): number;
  markupPercentage(): number;
  isLowStock(branchId: string, currentStock: number): boolean;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    name: {
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
    category: {
      type: String,
      enum: Object.values(PRODUCT_CATEGORIES),
      required: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    origin: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    alcoholContent: {
      type: Number,
      min: 0,
      max: 100,
    },
    volume: {
      type: Number,
      required: true,
      min: 0,
    },
    unitType: {
      type: String,
      enum: Object.values(UNIT_TYPES),
      required: true,
    },
    conversionRate: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
      description: 'How many units of smaller measure in this unit (e.g., 1 bottle = 30 shots)',
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
      precision: 2,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
      precision: 2,
    },
    wholesalePrice: {
      type: Number,
      min: 0,
      precision: 2,
    },
    retailPrice: {
      type: Number,
      min: 0,
      precision: 2,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isAlcoholic: {
      type: Boolean,
      default: true,
    },
    exciseDutyCategory: {
      type: String,
      enum: ['beer', 'wine', 'spirits', 'cider', 'none'],
      default: 'none',
    },
    ingredients: [
      {
        type: String,
        trim: true,
      },
    ],
    allergens: [
      {
        type: String,
        trim: true,
      },
    ],
    storageRequirements: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    minTemperature: Number,
    maxTemperature: Number,
    shelfLifeDays: Number,
    nutritionFacts: {
      type: Schema.Types.Mixed,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    isComboItem: {
      type: Boolean,
      default: false,
    },
    comboItems: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    requiresRecipe: {
      type: Boolean,
      default: false,
    },
    recipe: {
      ingredients: [
        {
          productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 0.1,
          },
          unit: {
            type: String,
            required: true,
          },
        },
      ],
      instructions: [
        {
          type: String,
          trim: true,
        },
      ],
      glassware: {
        type: String,
        trim: true,
      },
      garnish: [String],
      prepTimeMinutes: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    pricingRules: [
      {
        name: { type: String, trim: true, maxlength: 100 },
        type: {
          type: String,
          enum: ['percentage', 'fixed', 'time_based', 'day_based'],
        },
        value: { type: Number },
        startTime: String,
        endTime: String,
        daysOfWeek: [Number],
        minQty: Number,
        maxQty: Number,
        applicableTo: [
          {
            type: Schema.Types.ObjectId,
            ref: 'CustomerTier',
          },
        ],
        startDate: Date,
        endDate: Date,
        isActive: { type: Boolean, default: true },
      },
    ],
    taxRate: {
      type: Number,
      default: 16, // VAT 16%
      min: 0,
      max: 100,
    },
    exciseDuty: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Excise duty per unit (bottle/liter) in KES',
    },
    accounting: {
      revenueAccount: { type: String, default: '4000' },
      costOfGoodsSoldAccount: { type: String, default: '5000' },
      inventoryAccount: { type: String, default: '1200' },
    },
    trackExpiry: {
      type: Boolean,
      default: false,
    },
    expiryWarningDays: {
      type: Number,
      default: 30,
      min: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
ProductSchema.index({ sku: 1 });
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ branchId: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ 'brand': 1 });
ProductSchema.index({ 'alcoholContent': 1 });

// Compound indexes
ProductSchema.index({ branchId: 1, category: 1 });
ProductSchema.index({ branchId: 1, isActive: 1 });

// Virtual for total stock (populated from stockMovements)
ProductSchema.virtual('totalStock', {
  ref: 'StockMovement',
  localField: '_id',
  foreignField: 'productId',
  count: true,
});

// Virtual for profit margin
ProductSchema.virtual('profitMargin').get(function (this: IProduct) {
  if (this.costPrice === 0) return 0;
  return ((this.sellingPrice - this.costPrice) / this.sellingPrice) * 100;
});

// Virtual for markup percentage
ProductSchema.virtual('markupPercentage').get(function (this: IProduct) {
  if (this.costPrice === 0) return 0;
  return ((this.sellingPrice - this.costPrice) / this.costPrice) * 100;
});

// Virtual to check if product is low stock
ProductSchema.virtual('isLowStock').get(function (this: IProduct) {
  // Would be calculated from stock levels
  return false;
});

// Method to get price after applying active pricing rules
ProductSchema.methods.getEffectivePrice = function (customerTierId?: mongoose.Types.ObjectId) {
  let price = this.sellingPrice;

  // Apply active pricing rules sorted by priority (could add priority field)
  for (const rule of this.pricingRules) {
    if (!rule.isActive) continue;

    // Check date ranges
    const now = new Date();
    if (rule.startDate && now < rule.startDate) continue;
    if (rule.endDate && now > rule.endDate) continue;

    // Check customer tier
    if (rule.applicableTo && rule.applicableTo.length > 0 && customerTierId) {
      if (!rule.applicableTo.includes(customerTierId)) continue;
    }

    switch (rule.type) {
      case 'percentage':
        price = price * (1 - rule.value / 100);
        break;
      case 'fixed':
        price = rule.value;
        break;
      case 'time_based':
        const currentTime = now.getHours() * 60 + now.getMinutes();
        // Logic for time-based pricing
        break;
      case 'day_based':
        // Logic for day-based pricing
        break;
    }
  }

  return Math.max(0, price);
};

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
