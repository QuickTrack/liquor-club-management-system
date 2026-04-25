import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { License } from "@/lib/db/models";
import type { NextRequest } from "next/server";

/**
 * GET /api/licenses/[id]
 * Fetch a single license
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const license = await License.findById(id);
    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }
    return NextResponse.json(license);
  } catch (error) {
    console.error("Error fetching license:", error);
    return NextResponse.json({ error: "Failed to fetch license" }, { status: 500 });
  }
}

/**
 * PATCH /api/licenses/[id]
 * Update license status or details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const data = await request.json();

    const allowed = ["licenseNumber", "issueDate", "expiryDate", "status"];
    const update: Record<string, any> = {};
    for (const key of allowed) {
      if (data[key] !== undefined) {
        update[key] = key.includes("Date") ? new Date(data[key]) : data[key];
      }
    }

    const license = await License.findByIdAndUpdate(id, update, { new: true });
    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    return NextResponse.json(license);
  } catch (error) {
    console.error("Error updating license:", error);
    return NextResponse.json({ error: "Failed to update license" }, { status: 500 });
  }
}

/**
 * DELETE /api/licenses/[id]
 * Delete a license
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await License.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting license:", error);
    return NextResponse.json({ error: "Failed to delete license" }, { status: 500 });
  }
}
