import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Staff } from "@/lib/db/models";

/**
 * GET /api/staff
 * Fetch all staff members, optionally filtered by query params
 */
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const name = searchParams.get("name");
    const role = searchParams.get("role");

    const filters: Record<string, any> = {};
    if (email) {
      // Case-insensitive exact email match
      filters.email = { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
    }
    if (name) {
      // Case-insensitive partial name match
      filters.name = { $regex: name, $options: 'i' };
    }
    if (role) filters.role = role;

    const staff = await Staff.find(filters).sort({ name: 1 });
    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

/**
 * POST /api/staff
 * Create a new staff member
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    // Check for required fields
    const required = ["name", "role", "phone", "email", "hireDate"];
    for (const field of required) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check for duplicate email
    const existing = await Staff.findOne({ email: data.email });
    if (existing) {
      return NextResponse.json(
        { error: "Staff with this email already exists" },
        { status: 400 }
      );
    }

    // Validate PIN format if provided
    if (data.pin && !/^\d{4}$/.test(data.pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    const staff = await Staff.create({
      name: data.name,
      role: data.role,
      phone: data.phone,
      email: data.email,
      shift: data.shift || "Evening",
      hireDate: new Date(data.hireDate),
      totalSales: 0,
      commission: 0,
      pin: data.pin || undefined,
      status: data.status || "Active",
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 });
  }
}

