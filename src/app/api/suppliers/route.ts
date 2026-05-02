import { NextRequest, NextResponse } from "next/server";
import { Supplier } from "@/lib/db/models";

// GET /api/suppliers - List all suppliers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const suppliers = await Supplier.find(query)
      .sort({ name: 1 })
      .select("_id name contactPerson phone email products totalOrders totalSpent creditBalance rating status")
      .lean();

    return NextResponse.json(suppliers);
  } catch (error: any) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

// POST /api/suppliers - Create a new supplier
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, contactPerson, phone, email, products, rating, status } = body;

    // Validate required fields
    if (!name || !contactPerson || !phone || !email) {
      return NextResponse.json(
        { error: "Name, contact person, phone, and email are required" },
        { status: 400 }
      );
    }

    // Check for duplicate supplier name (case-insensitive)
    const existingByName = await Supplier.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingByName) {
      return NextResponse.json(
        { error: `Supplier with name "${name}" already exists` },
        { status: 400 }
      );
    }

    // Create new supplier
    const supplier = new Supplier({
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      products: products?.trim() || "",
      totalOrders: 0,
      totalSpent: 0,
      creditBalance: 0,
      rating: rating || 0,
      status: status || "Active",
    });

    await supplier.save();

    return NextResponse.json(
      {
        _id: supplier._id,
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        products: supplier.products,
        totalOrders: supplier.totalOrders,
        totalSpent: supplier.totalSpent,
        creditBalance: supplier.creditBalance,
        rating: supplier.rating,
        status: supplier.status,
        createdAt: supplier.createdAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Failed to create supplier: " + error.message },
      { status: 500 }
    );
  }
}
