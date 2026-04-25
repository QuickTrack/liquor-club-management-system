import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUnitMetadata {
  floor?: string;
  section?: string;
  barcode?: string;
  qrCode?: string;
  lastInspectionDate?: Date;
  notes?: string;
  [key: string]: any;
}

export type UnitType = "bottle" | "crate" | "keg" | "case" | "shot" | "liter" | "can" | "growler" | "jug" | "rack" | "pallet" | "room" | "table" | "booth" | "other";

export type UnitStatus = "active" | "inactive" | "maintenance" | "out_of_service" | "reserved";

export interface IUnit extends Document {
  tenantId: Types.ObjectId;
  organizationId: Types.ObjectId;
  unitId: string;
  name: string;
  type: UnitType;
  capacity: number;
  capacityUnit: string;
  status: UnitStatus;
  metadata?: IUnitMetadata;
  location?: {
    floor?: string;
    aisle?: string;
    section?: string;
    bin?: string;
  };
  isActive: boolean;
  assignedTo?: Types.ObjectId;
  assignedAt?: Date;
  lastServicedAt?: Date;
  expiresAt?: Date;
  tags: string[];
}

const UnitSchema = new Schema<IUnit>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
    unitId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, enum: ["bottle","crate","keg","case","shot","liter","can","growler","jug","rack","pallet","room","table","booth","other"], required: true, index: true },
    capacity: { type: Number, required: true, min: 0 },
    capacityUnit: { type: String, required: true, trim: true },
    status: { type: String, enum: ["active","inactive","maintenance","out_of_service","reserved"], default: "active", index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    location: { floor: { type: String, trim: true }, aisle: { type: String, trim: true }, section: { type: String, trim: true }, bin: { type: String, trim: true } },
    isActive: { type: Boolean, default: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "Staff", index: true },
    assignedAt: Date,
    lastServicedAt: Date,
    expiresAt: Date,
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

UnitSchema.index({ tenantId: 1, unitId: 1 }, { unique: true });
UnitSchema.index({ organizationId: 1, type: 1, status: 1 });
UnitSchema.index({ tenantId: 1, isActive: 1, type: 1 });

export const Unit = mongoose.models.Unit || mongoose.model<IUnit>("Unit", UnitSchema);
export default Unit;
