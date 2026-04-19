import mongoose, { Schema, Document } from 'mongoose';
import { AUDIT_ACTIONS } from '../config/constants.js';

export interface IAuditLog extends Document {
  branchId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // null for system actions
  action: keyof typeof AUDIT_ACTIONS;
  entity: string; // e.g., 'sale', 'product', 'customer', 'stock'
  entityId: mongoose.Types.ObjectId;
  details: {
    changes?: Record<string, { old?: any; new?: any }>;
    summary: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
  level: 'info' | 'warning' | 'error' | 'critical';
  isRead: boolean;
  readBy?: mongoose.Types.ObjectId[];
  readAt?: Date[];
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: Object.values(AUDIT_ACTIONS),
      required: true,
    },
    entity: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    details: {
      changes: {
        type: Map,
        of: {
          old: Schema.Types.Mixed,
          new: Schema.Types.Mixed,
        },
      },
      summary: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },
      metadata: {
        type: Map,
        of: Schema.Types.Mixed,
      },
      ipAddress: {
        type: String,
        trim: true,
      },
      userAgent: String,
      sessionId: {
        type: String,
        trim: true,
      },
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    readAt: [Date],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
AuditLogSchema.index({ branchId: 1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ entity: 1, entityId: 1 });
AuditLogSchema.index({ level: 1 });
AuditLogSchema.index({ isRead: 1 });
AuditLogSchema.index({ createdAt: -1 });

// Compound indexes for common queries
AuditLogSchema.index({ branchId: 1, createdAt: -1 });
AuditLogSchema.index({ entity: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, action: 1, createdAt: -1 });

// TTL index to auto-remove logs older than X years (e.g., 7 years for compliance)
// Uncomment if needed:
// AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 * 7 });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
