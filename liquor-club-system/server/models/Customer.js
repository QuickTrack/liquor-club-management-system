import mongoose, { Schema, Document } from 'mongoose';
import { CUSTOMER_TIERS, CREDIT_STATUS } from '../config/constants.js';

export interface ICustomer extends Document {
  customerNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  alternativePhone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  idType: 'national_id' | 'passport' | 'alien_id' | 'none';
  idNumber?: string;
  address: {
    street?: string;
    city: string;
    county: string;
    country: string;
    postalCode?: string;
  };
  tier: keyof typeof CUSTOMER_TIERS;
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  lastVisit?: Date;
  preferences: {
    favoriteProducts: mongoose.Types.ObjectId[];
    preferredPaymentMethod?: string;
    communicationChannel: 'sms' | 'whatsapp' | 'email' | 'all';
    receivePromotions: boolean;
    preferredLanguage: 'en' | 'sw';
  };
  credit: {
    currentBalance: number;
    creditLimit: number;
    creditStatus: keyof typeof CREDIT_STATUS;
    creditSince: Date;
    lastPaymentDate?: Date;
    lastPaymentAmount?: number;
    overLimitAllowed: boolean;
  };
  marketing: {
    subscribed: boolean;
  };
  notes: string;
  isActive: boolean;
  birthday?: Date;
  anniversary?: Date;
  customFields: Record<string, any>;
  referredBy?: mongoose.Types.ObjectId; // ref Customer
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  fullName: string;
  age?: number;
  availableCredit(): number;
  creditUtilization(): number;
  canBeOfferedCredit(amount: number): boolean;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customerNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      match: [/^\+?254[0-9]{9}$|^07[0-9]{8}$/, 'Invalid Kenyan phone number'],
    },
    alternativePhone: {
      type: String,
      trim: true,
      match: [/^\+?254[0-9]{9}$|^07[0-9]{8}$/, 'Invalid Kenyan phone number'],
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    idType: {
      type: String,
      enum: ['national_id', 'passport', 'alien_id', 'none'],
      default: 'none',
    },
    idNumber: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true, maxlength: 200 },
      city: { type: String, required: true, trim: true, maxlength: 100 },
      county: { type: String, required: true, trim: true, maxlength: 100 },
      country: { type: String, default: 'Kenya', trim: true },
      postalCode: { type: String, trim: true, maxlength: 10 },
    },
    tier: {
      type: String,
      enum: Object.values(CUSTOMER_TIERS),
      default: CUSTOMER_TIERS.REGULAR,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
      precision: 2,
    },
    visitCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastVisit: Date,
    preferences: {
      favoriteProducts: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
      ],
      preferredPaymentMethod: String,
      communicationChannel: {
        type: String,
        enum: ['sms', 'whatsapp', 'email', 'all'],
        default: 'sms',
      },
      receivePromotions: {
        type: Boolean,
        default: true,
      },
      preferredLanguage: {
        type: String,
        enum: ['en', 'sw'],
        default: 'en',
      },
    },
    credit: {
      currentBalance: {
        type: Number,
        default: 0,
        precision: 2,
      },
      creditLimit: {
        type: Number,
        default: 0,
        min: 0,
        precision: 2,
      },
      creditStatus: {
        type: String,
        enum: Object.values(CREDIT_STATUS),
        default: CREDIT_STATUS.GOOD,
      },
      creditSince: {
        type: Date,
        default: Date.now,
      },
      lastPaymentDate: Date,
      lastPaymentAmount: {
        type: Number,
        precision: 2,
      },
      overLimitAllowed: {
        type: Boolean,
        default: false,
      },
    },
    marketing: {
      subscribed: {
        type: Boolean,
        default: true,
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    birthday: Date,
    anniversary: Date,
    customFields: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
CustomerSchema.index({ customerNumber: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ 'credit.creditStatus': 1 });
CustomerSchema.index({ 'credit.currentBalance': 1 });
CustomerSchema.index({ tier: 1 });
CustomerSchema.index({ isActive: 1 });
CustomerSchema.index({ 'preferences.favoriteProducts': 1 });
CustomerSchema.index({ tags: 1 });

// Compound indexes
CustomerSchema.index({ firstName: 1, lastName: 1 });
CustomerSchema.index({ branchId: 1, isActive: 1 }); // assuming branchId might be added later

// Virtual for full name
CustomerSchema.virtual('fullName').get(function (this: ICustomer) {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
CustomerSchema.virtual('age').get(function (this: ICustomer) {
  if (!this.dateOfBirth) return undefined;
  const today = new Date();
  let age = today.getFullYear() - this.dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - this.dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dateOfBirth.getDate())) {
    age--;
  }
  return age;
});

// Virtual for available credit
CustomerSchema.virtual('availableCredit').get(function (this: ICustomer) {
  return this.credit.creditLimit - this.credit.currentBalance;
});

// Virtual for credit utilization percentage
CustomerSchema.virtual('creditUtilization').get(function (this: ICustomer) {
  if (this.credit.creditLimit === 0) return 0;
  return (this.credit.currentBalance / this.credit.creditLimit) * 100;
});

// Method to check if customer can be offered more credit
CustomerSchema.methods.canBeOfferedCredit = function (amount: number): boolean {
  if (!this.credit.overLimitAllowed) {
    return this.credit.currentBalance + amount <= this.credit.creditLimit;
  }
  return true;
};

// Method to add loyalty points
CustomerSchema.methods.addLoyaltyPoints = function (points: number, branchId?: mongoose.Types.ObjectId) {
  this.loyaltyPoints += points;
  // Could also create a separate LoyaltyTransaction model for history
  this.markModified('loyaltyPoints');
};

// Method to redeem loyalty points
CustomerSchema.methods.redeemLoyaltyPoints = function (points: number) {
  if (points > this.loyaltyPoints) {
    throw new Error('Insufficient loyalty points');
  }
  this.loyaltyPoints -= points;
};

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
