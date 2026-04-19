import mongoose, { Schema, Document } from 'mongoose';

export interface ITable extends Document {
  branchId: mongoose.Types.ObjectId;
  tableNumber: string;
  name?: string;
  capacity: number;
  currentCovers: number; // number of people seated
  status: 'available' | 'occupied' | 'reserved' | 'out_of_service' | 'cleaning';
  section?: string; // e.g., "VIP", "Main Hall", "Outside"
  currentTabId?: mongoose.Types.ObjectId; // ref Sale with orderType = 'dine_in'
  minSpend?: number; // minimum spend for reservation
  depositRequired: boolean;
  depositAmount?: number;
  equipment: string[]; // e.g., ["projector", "sound_system"]
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TableSchema = new Schema<ITable>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    tableNumber: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    currentCovers: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'out_of_service', 'cleaning'],
      default: 'available',
    },
    section: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    currentTabId: {
      type: Schema.Types.ObjectId,
      ref: 'Sale',
    },
    minSpend: {
      type: Number,
      min: 0,
      precision: 2,
    },
    depositRequired: {
      type: Boolean,
      default: false,
    },
    depositAmount: {
      type: Number,
      min: 0,
      precision: 2,
    },
    equipment: [
      {
        type: String,
        trim: true,
      },
    ],
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
TableSchema.index({ branchId: 1, tableNumber: 1 }, { unique: true });
TableSchema.index({ branchId: 1, status: 1 });
TableSchema.index({ currentTabId: 1 });
TableSchema.index({ section: 1 });

export default mongoose.models.Table || mongoose.model<ITable>('Table', TableSchema);
