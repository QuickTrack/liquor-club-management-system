import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Staff } from "@/lib/db/models";

/**
 * POST /api/staff/verify-pin
 * Verify a staff member's PIN
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    const { staffId, pin } = data;

    if (!staffId || !pin) {
      return NextResponse.json(
        { error: "Staff ID and PIN are required" },
        { status: 400 }
      );
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    // Find staff and check PIN
    const staff = await Staff.findById(staffId);

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Note: PIN is stored as plain text (consider hashing in production)
    const isValid = staff.pin === pin;

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true, staff: { _id: staff._id, name: staff.name, role: staff.role } });
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return NextResponse.json({ error: "Failed to verify PIN" }, { status: 500 });
  }
}
