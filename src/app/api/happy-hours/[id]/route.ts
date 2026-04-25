import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { HappyHour } from "@/lib/db/models";
import type { NextRequest } from "next/server";

/**
 * GET /api/happy-hours/[id]
 * Fetch a single happy hour by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const happyHour = await HappyHour.findById(id);
    if (!happyHour) {
      return NextResponse.json({ error: "Happy hour not found" }, { status: 404 });
    }
    return NextResponse.json(happyHour);
  } catch (error) {
    console.error("Error fetching happy hour:", error);
    return NextResponse.json({ error: "Failed to fetch happy hour" }, { status: 500 });
  }
}

/**
 * PATCH /api/happy-hours/[id]
 * Update a happy hour
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const data = await request.json();

    const allowed = ["day", "startTime", "endTime", "discount", "isActive"];
    const update: Record<string, any> = {};
    for (const key of allowed) {
      if (data[key] !== undefined) {
        update[key] = data[key];
      }
    }

    // If day or times are changing, check for conflicts
    if (update.day || update.startTime || update.endTime) {
      const existing = await HappyHour.findById(id);
      if (!existing) {
        return NextResponse.json({ error: "Happy hour not found" }, { status: 404 });
      }
      const day = update.day || existing.day;
      const startTime = update.startTime || existing.startTime;
      const endTime = update.endTime || existing.endTime;

      const conflict = await HappyHour.findOne({
        _id: { $ne: id },
        day,
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
        ],
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Happy hour time slot overlaps with an existing schedule" },
          { status: 400 }
        );
      }
    }

    const happyHour = await HappyHour.findByIdAndUpdate(id, update, { new: true });
    if (!happyHour) {
      return NextResponse.json({ error: "Happy hour not found" }, { status: 404 });
    }

    return NextResponse.json(happyHour);
  } catch (error) {
    console.error("Error updating happy hour:", error);
    return NextResponse.json({ error: "Failed to update happy hour" }, { status: 500 });
  }
}

/**
 * DELETE /api/happy-hours/[id]
 * Delete a happy hour
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await HappyHour.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting happy hour:", error);
    return NextResponse.json({ error: "Failed to delete happy hour" }, { status: 500 });
  }
}
