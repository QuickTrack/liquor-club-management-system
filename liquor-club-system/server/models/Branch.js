import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    county: string;
    country: string;
    postalCode: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  manager: mongoose.Types.ObjectId; // ref User
  timezone: string;
  currency: string;
  taxId?: string;
  licenseNumber?: string;
  licenseExpiry?: Date;
  isActive: boolean;
  settings: {
    enableCreditSales: boolean;
    creditLimitDefault: number;
    enableLoyalty: boolean;
    loyaltyPointsPerKes: number;
    enableHappyHour: boolean;
    defaultPaymentMethods: string[];
    receiptHeader: string;
    receiptFooter: string;
    posTheme: 'light' | 'dark' | 'auto';
  };
  inventory: {
    lowStockThreshold: number;
    reorderPoint: number;
    autoReorder: boolean;
  };
  operatingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 10,
    },
    address: {
      street: { type: String, trim: true, maxlength: 200 },
      city: { type: String, required: true, trim: true, maxlength: 100 },
      county: { type: String, required: true, trim: true, maxlength: 100 },
      country: { type: String, default: 'Kenya', trim: true },
      postalCode: { type: String, trim: true, maxlength: 10 },
    },
    contact: {
      phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^\+?254[0-9]{9}$|^07[0-9]{8}$/, 'Invalid Kenyan phone number'],
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
      },
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timezone: {
      type: String,
      default: 'Africa/Nairobi',
    },
    currency: {
      type: String,
      default: 'KES',
      uppercase: true,
    },
    taxId: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    licenseNumber: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    licenseExpiry: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      enableCreditSales: { type: Boolean, default: true },
      creditLimitDefault: { type: Number, default: 5000 },
      enableLoyalty: { type: Boolean, default: true },
      loyaltyPointsPerKes: { type: Number, default: 10 }, // 1 KES = 10 points
      enableHappyHour: { type: Boolean, default: true },
      defaultPaymentMethods: {
        type: [String],
        enum: ['cash', 'mpesa', 'card', 'bank_transfer', 'credit'],
        default: ['cash', 'mpesa'],
      },
      receiptHeader: { type: String, default: '', trim: true, maxlength: 500 },
      receiptFooter: { type: String, default: 'Thank you for your business!', trim: true, maxlength: 500 },
      posTheme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto',
      },
    },
    inventory: {
      lowStockThreshold: { type: Number, default: 10 },
      reorderPoint: { type: Number, default: 5 },
      autoReorder: { type: Boolean, default: false },
    },
    operatingHours: {
      monday: { open: String, close: String, closed: Boolean, default: { open: '08:00', close: '22:00', closed: false } },
      tuesday: { open: String, close: String, closed: Boolean, default: { open: '08:00', close: '22:00', closed: false } },
      wednesday: { open: String, close: String, closed: Boolean, default: { open: '08:00', close: '22:00', closed: false } },
      thursday: { open: String, close: String, closed: Boolean, default: { open: '08:00', close: '22:00', closed: false } },
      friday: { open: String, close: String, closed: Boolean, default: { open: '08:00', close: '23:00', closed: false } },
      saturday: { open: String, close: String, closed: Boolean, default: { open: '09:00', close: '23:00', closed: false } },
      sunday: { open: String, close: String, closed: Boolean, default: { open: '10:00', close: '20:00', closed: false } },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
BranchSchema.index({ code: 1 });
BranchSchema.index({ manager: 1 });
BranchSchema.index({ isActive: 1 });
BranchSchema.index({ 'contact.phone': 1 });
BranchSchema.index({ 'address.city': 1 });

// Virtual for combined address
BranchSchema.virtual('fullAddress').get(function (this: IBranch) {
  return `${this.address.street || ''}, ${this.address.city}, ${this.address.county} ${this.address.postalCode || ''}`.trim();
});

export default mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema);
