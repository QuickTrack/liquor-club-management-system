import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  name: string;
  type: 'sales_summary' | 'product_performance' | 'profit_margin' | 'staff_performance' | 'inventory_audit' | 'tax_report' | 'credit_aging' | 'customer_analytics' | 'custom';
  branchId?: mongoose.Types.ObjectId; // null = all branches
  parameters: Record<string, any>;
  filters: {
    startDate: Date;
    endDate: Date;
    productIds?: mongoose.Types.ObjectId[];
    categoryIds?: mongoose.Types.ObjectId[];
    staffIds?: mongoose.Types.ObjectId[];
    customerIds?: mongoose.Types.ObjectId[];
    paymentMethods?: string[];
    orderTypes?: string[];
    statuses?: string[];
  };
  results: Record<string, any>; // JSON BLOB of report data
  exportedAt?: Date;
  exportedBy?: mongoose.Types.ObjectId;
  fileUrl?: string;
  isScheduled: boolean;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    recipients: string[]; // email addresses
  };
  isShared: boolean;
  shareToken?: string;
  sharedBy?: mongoose.Types.ObjectId;
  sharedAt?: Date;
  expiresAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: [
        'sales_summary',
        'product_performance',
        'profit_margin',
        'staff_performance',
        'inventory_audit',
        'tax_report',
        'credit_aging',
        'customer_analytics',
        'custom',
      ],
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
    },
    parameters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    filters: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
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
      staffIds: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      customerIds: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Customer',
        },
      ],
      paymentMethods: [String],
      orderTypes: [String],
      statuses: [String],
    },
    results: {
      type: Schema.Types.Mixed,
      required: true,
      description: 'Report data in JSON format',
    },
    exportedAt: Date,
    exportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    schedule: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      },
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
      },
      dayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
      },
      time: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time'],
      },
      recipients: [
        {
          type: String,
          trim: true,
          lowercase: true,
          match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
        },
      ],
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    sharedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sharedAt: Date,
    expiresAt: Date,
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
ReportSchema.index({ name: 1 });
ReportSchema.index({ type: 1 });
ReportSchema.index({ branchId: 1 });
ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ 'filters.startDate': 1, 'filters.endDate': 1 });
ReportSchema.index({ shareToken: 1 }, { sparse: true });
ReportSchema.index({ 'schedule.frequency': 1 });

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
