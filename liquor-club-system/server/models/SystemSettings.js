import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  key: string;
  value: any;
  description?: string;
  isGlobal: boolean; // true for system-wide, false for branch-specific
  branchId?: mongoose.Types.ObjectId; // null for global
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'date';
  isEncrypted: boolean; // for sensitive data
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isGlobal: {
      type: Boolean,
      default: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
    },
    dataType: {
      type: String,
      enum: ['string', 'number', 'boolean', 'json', 'date'],
      required: true,
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
SystemSettingsSchema.index({ key: 1 });
SystemSettingsSchema.index({ isGlobal: 1 });
SystemSettingsSchema.index({ branchId: 1 });

export default mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
