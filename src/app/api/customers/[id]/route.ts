import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Customer } from "@/lib/db/models";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await connectDB();
    const data = await request.json();

    // Build update object
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.tier !== undefined) updateData.tier = data.tier;
    if (data.creditLimit !== undefined) updateData.creditLimit = data.creditLimit;
    if (data.preferences !== undefined) updateData.preferences = data.preferences;
    if (data.status !== undefined) updateData.status = data.status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Check if customer exists
    const existing = await Customer.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Check for duplicate phone (excluding this customer)
    if (data.phone && data.phone !== existing.phone) {
      const phoneExists = await Customer.findOne({ phone: data.phone, _id: { $ne: id } });
      if (phoneExists) {
        return NextResponse.json({ error: "Another customer with this phone number already exists" }, { status: 400 });
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedCustomer);
  } catch (error: any) {
    console.error("Error updating customer:", error);
    
    if (error.code === 11000) {
      return NextResponse.json({ error: "Phone number already exists" }, { status: 400 });
    }
    
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await connectDB();

    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await Customer.findByIdAndDelete(id);
    
    return NextResponse.json({ message: "Customer deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
