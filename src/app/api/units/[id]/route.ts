import { NextRequest, NextResponse } from "next/server";
import { UnitDefinition } from "@/lib/db/models/UnitDefinition";
import { Types } from "mongoose";

// GET /api/units/[id] - Get single unit
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid unit ID" },
        { status: 400 }
      );
    }

    const unit = await UnitDefinition.findById(id).lean();

    if (!unit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(unit);
  } catch (error: any) {
    console.error("Error fetching unit:", error);
    return NextResponse.json(
      { error: "Failed to fetch unit" },
      { status: 500 }
    );
  }
}

// PATCH /api/units/[id] - Update unit
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid unit ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, abbreviation, description, isActive } = body;

    // Check for duplicate name or abbreviation if being updated
    if (name) {
      const existingByName = await UnitDefinition.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });

      if (existingByName) {
        return NextResponse.json(
          { error: `Unit with name "${name}" already exists` },
          { status: 400 }
        );
      }
    }

    if (abbreviation) {
      const existingByAbbr = await UnitDefinition.findOne({
        _id: { $ne: id },
        abbreviation: { $regex: new RegExp(`^${abbreviation.trim()}$`, "i") },
      });

      if (existingByAbbr) {
        return NextResponse.json(
          { error: `Unit with abbreviation "${abbreviation}" already exists` },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim().toUpperCase();
    if (abbreviation !== undefined) updateData.abbreviation = abbreviation.trim().toUpperCase();
    if (description !== undefined) updateData.description = description?.trim() || "";
    if (isActive !== undefined) updateData.isActive = isActive;

    const unit = await UnitDefinition.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!unit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(unit);
  } catch (error: any) {
    console.error("Error updating unit:", error);
    return NextResponse.json(
      { error: "Failed to update unit: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/units/[id] - Delete unit (hard delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid unit ID" },
        { status: 400 }
      );
    }

    const unit = await UnitDefinition.findById(id);

    if (!unit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      );
    }

    await UnitDefinition.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Unit deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting unit:", error);
    return NextResponse.json(
      { error: "Failed to delete unit: " + error.message },
      { status: 500 }
    );
  }
}
