import { NextRequest, NextResponse } from "next/server";
import { Supplier } from "@/lib/db/models";
import { Types } from "mongoose";

// GET /api/suppliers/[id] - Get single supplier
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    const supplier = await Supplier.findById(id).lean();

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier" },
      { status: 500 }
    );
  }
}

// PATCH /api/suppliers/[id] - Update supplier
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, contactPerson, phone, email, products, rating, status } = body;

    // Check for duplicate name if name is being updated (excluding current record)
    if (name) {
      const existingByName = await Supplier.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });

      if (existingByName) {
        return NextResponse.json(
          { error: `Supplier with name "${name}" already exists` },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (products !== undefined) updateData.products = products?.trim() || "";
    if (rating !== undefined) updateData.rating = rating;
    if (status !== undefined) updateData.status = status;

    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Failed to update supplier: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/[id] - Delete supplier (hard delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Hard delete - remove from database
    await Supplier.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Supplier deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Failed to delete supplier: " + error.message },
      { status: 500 }
    );
  }
}
