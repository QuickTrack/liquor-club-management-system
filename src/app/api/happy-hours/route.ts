import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { HappyHour } from "@/lib/db/models";
import type { NextRequest } from "next/server";

/**
 * GET /api/happy-hours
 * Fetch all happy hour schedules
 */
export async function GET() {
  try {
    await connectDB();
    const happyHours = await HappyHour.find({}).sort({ day: 1, startTime: 1 });
    return NextResponse.json(happyHours);
  } catch (error) {
    console.error("Error fetching happy hours:", error);
    return NextResponse.json({ error: "Failed to fetch happy hours" }, { status: 500 });
  }
}

/**
 * POST /api/happy-hours
 * Create a new happy hour schedule
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();

    const { day, startTime, endTime, discount, isActive = true } = data;

    if (!day || !startTime || !endTime || discount === undefined) {
      return NextResponse.json(
        { error: "Day, start time, end time, and discount are required" },
        { status: 400 }
      );
    }

    // Check for conflicts for same day
    const conflict = await HappyHour.findOne({
      day,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
      ],
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Happy hour time slot overlaps with an existing schedule for the same day" },
        { status: 400 }
      );
    }

    const happyHour = await HappyHour.create({
      day,
      startTime,
      endTime,
      discount,
      isActive,
    });

    return NextResponse.json(happyHour, { status: 201 });
  } catch (error) {
    console.error("Error creating happy hour:", error);
    return NextResponse.json({ error: "Failed to create happy hour" }, { status: 500 });
  }
}
