import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
  supplierCode: string;
  name: string;
  contactPerson: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  address: {
    street?: string;
    city: string;
    county: string;
    country: string;
    postalCode?: string;
  };
  phone: string;
  email?: string;
  website?: string;
  registrationNumber?: string; // KRA PIN
  taxCategory?: string;
  creditTerms: {
    allowed: boolean;
    creditLimit: number;
    paymentTermsDays: number; // e.g., 30 days
    earlyPaymentDiscount?: number; // percentage
    latePaymentPenalty?: number; // percentage
  };
  pricing: {
    hasPreferredPricing: boolean;
    priceList?: mongoose.Types.ObjectId; // ref PriceList
  };
  bankDetails: {
    bankName?: string;
    branchName?: string;
    accountNumber?: string;
    accountName?: string;
    swiftCode?: string;
  };
  products: Array<{
    productId: mongoose.Types.ObjectId;
    supplierSku: string;
    unitCost: number;
    minimumOrderQty: number;
    leadTimeDays: number;
    isActive: boolean;
  }>;
  performance: {
    onTimeDeliveryRate: number; // percentage
    qualityRating: number; // 1-5
    totalOrders: number;
    averageOrderValue: number;
    averageLeadTime: number;
  };
  documents: Array<{
    type: 'license' | 'certificate' | 'contract' | 'tax_compliance' | 'other';
    name: string;
    fileUrl: string;
    uploadedAt: Date;
    expiryDate?: Date;
  }>;
  notes: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    supplierCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    contactPerson: {
      firstName: { type: String, required: true, trim: true, maxlength: 50 },
      lastName: { type: String, required: true, trim: true, maxlength: 50 },
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
    address: {
      street: { type: String, trim: true, maxlength: 200 },
      city: { type: String, required: true, trim: true, maxlength: 100 },
      county: { type: String, required: true, trim: true, maxlength: 100 },
      country: { type: String, default: 'Kenya', trim: true },
      postalCode: { type: String, trim: true, maxlength: 10 },
    },
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
      sparse: true,
    },
    website: String,
    registrationNumber: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    taxCategory: String,
    creditTerms: {
      allowed: { type: Boolean, default: false },
      creditLimit: { type: Number, default: 0, min: 0 },
      paymentTermsDays: { type: Number, default: 0, min: 0 },
      earlyPaymentDiscount: { type: Number, min: 0, max: 100 },
      latePaymentPenalty: { type: Number, min: 0, max: 100 },
    },
    pricing: {
      hasPreferredPricing: { type: Boolean, default: false },
      priceList: {
        type: Schema.Types.ObjectId,
        ref: 'PriceList',
      },
    },
    bankDetails: {
      bankName: String,
      branchName: String,
      accountNumber: String,
      accountName: String,
      swiftCode: String,
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        supplierSku: { type: String, trim: true },
        unitCost: { type: Number, required: true, min: 0, precision: 2 },
        minimumOrderQty: { type: Number, default: 1, min: 1 },
        leadTimeDays: { type: Number, default: 1, min: 0 },
        isActive: { type: Boolean, default: true },
      },
    ],
    performance: {
      onTimeDeliveryRate: { type: Number, default: 100, min: 0, max: 100 },
      qualityRating: { type: Number, default: 5, min: 1, max: 5 },
      totalOrders: { type: Number, default: 0, min: 0 },
      averageOrderValue: { type: Number, default: 0, min: 0, precision: 2 },
      averageLeadTime: { type: Number, default: 0, min: 0 },
    },
    documents: [
      {
        type: {
          type: String,
          enum: ['license', 'certificate', 'contract', 'tax_compliance', 'other'],
          required: true,
        },
        name: { type: String, required: true, trim: true, maxlength: 200 },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        expiryDate: Date,
      },
    ],
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
SupplierSchema.index({ supplierCode: 1 });
SupplierSchema.index({ name: 1 });
SupplierSchema.index({ 'contactPerson.phone': 1 });
SupplierSchema.index({ 'contactPerson.email': 1 });
SupplierSchema.index({ isActive: 1 });
SupplierSchema.index({ 'products.productId': 1 });

export default mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
