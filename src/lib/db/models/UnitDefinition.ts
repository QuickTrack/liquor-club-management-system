import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUnitDefinition extends Document {
  name: string;
  abbreviation: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UnitDefinitionSchema = new Schema<IUnitDefinition>({
  name: { type: String, required: true, unique: true, trim: true, uppercase: true },
  abbreviation: { type: String, required: true, trim: true, maxlength: 10 },
  description: { type: String, default: "" },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

UnitDefinitionSchema.index({ name: 1 });
UnitDefinitionSchema.index({ isActive: 1 });

export const UnitDefinition = mongoose.models.UnitDefinition || mongoose.model<IUnitDefinition>("UnitDefinition", UnitDefinitionSchema);
export default UnitDefinition;
