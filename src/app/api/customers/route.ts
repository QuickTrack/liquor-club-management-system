import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Customer } from "@/lib/db/models";

export async function GET() {
  try {
    await connectDB();
    const customers = await Customer.find({}).sort({ name: 1 });
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    
    console.log("Creating customer with data:", { name: data.name, phone: data.phone, email: data.email, tier: data.tier });
    
    // Check if customer with this phone already exists
    const existingCustomer = await Customer.findOne({ phone: data.phone });
    if (existingCustomer) {
      console.log("Duplicate phone attempt:", data.phone);
      return NextResponse.json({ error: "Customer with this phone number already exists" }, { status: 400 });
    }
    
    const customer = await Customer.create({
      name: data.name,
      phone: data.phone,
      email: data.email || "",
      tier: data.tier || "Bronze",
      creditLimit: data.creditLimit || 0,
      creditUsed: 0,
      points: 0,
      totalSpent: 0,
      visits: 0,
      lastVisit: new Date(),
      preferences: data.preferences || "",
      status: "Active",
    });
    
    console.log("Customer created successfully:", customer._id);
    
    // Return the created customer with _id
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    
    // Handle Mongoose duplicate key error
    if (error.code === 11000) {
      return NextResponse.json({ error: "A customer with this phone number already exists" }, { status: 400 });
    }
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to create customer. Please try again." }, { status: 500 });
  }
}
