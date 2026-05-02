import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Staff } from "@/lib/db/models";

/**
 * GET /api/staff/[id]
 * Fetch a single staff member
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const staff = await Staff.findById(id);

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

/**
 * PATCH /api/staff/[id]
 * Update a staff member
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const data = await request.json();

    // Build update object with allowed fields
    const updateFields: Record<string, any> = {};
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.role !== undefined) updateFields.role = data.role;
    if (data.phone !== undefined) updateFields.phone = data.phone;
    if (data.email !== undefined) updateFields.email = data.email;
    if (data.shift !== undefined) updateFields.shift = data.shift;
    if (data.hireDate !== undefined) updateFields.hireDate = new Date(data.hireDate);
    if (data.status !== undefined) updateFields.status = data.status;
    if (data.pin !== undefined) {
      // Validate PIN format
      if (data.pin && !/^\d{4}$/.test(data.pin)) {
        return NextResponse.json(
          { error: "PIN must be exactly 4 digits" },
          { status: 400 }
        );
      }
      updateFields.pin = data.pin;
    }

    const updatedStaff = await Staff.findByIdAndUpdate(id, updateFields, { new: true });

    if (!updatedStaff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

/**
 * DELETE /api/staff/[id]
 * Delete a staff member
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const deletedStaff = await Staff.findByIdAndDelete(id);

    if (!deletedStaff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Staff deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}
