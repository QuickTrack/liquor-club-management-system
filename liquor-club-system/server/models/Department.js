import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  color?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
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
      uppercase: true,
      trim: true,
      maxlength: 20,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    color: {
      type: String,
      default: '#3B82F6',
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
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
DepartmentSchema.index({ branchId: 1 });
DepartmentSchema.index({ parentId: 1 });
DepartmentSchema.index({ code: 1, branchId: 1 }, { unique: true });

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
