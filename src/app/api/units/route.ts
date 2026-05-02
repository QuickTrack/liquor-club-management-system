import { NextRequest, NextResponse } from "next/server";
import { UnitDefinition } from "@/lib/db/models/UnitDefinition";

// GET /api/units - List all unit definitions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly");

    const query: any = {};
    if (activeOnly === "true") {
      query.isActive = true;
    }

    const units = await UnitDefinition.find(query)
      .sort({ name: 1 })
      .select("_id name abbreviation description isActive")
      .lean();

    return NextResponse.json(units);
  } catch (error: any) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 }
    );
  }
}

// POST /api/units - Create a new unit definition
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, abbreviation, description } = body;

    // Validate required fields
    if (!name || !abbreviation) {
      return NextResponse.json(
        { error: "Name and abbreviation are required" },
        { status: 400 }
      );
    }

    // Normalize name (uppercase) and abbreviation (uppercase)
    const normalizedName = name.trim().toUpperCase();
    const normalizedAbbr = abbreviation.trim().toUpperCase();

    // Check for duplicate name or abbreviation (case-insensitive)
    const existingByName = await UnitDefinition.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
    });

    const existingByAbbr = await UnitDefinition.findOne({
      abbreviation: { $regex: new RegExp(`^${normalizedAbbr}$`, "i") },
    });

    if (existingByName) {
      return NextResponse.json(
        { error: `Unit with name "${name}" already exists` },
        { status: 400 }
      );
    }

    if (existingByAbbr) {
      return NextResponse.json(
        { error: `Unit with abbreviation "${abbreviation}" already exists` },
        { status: 400 }
      );
    }

    // Create new unit definition
    const unit = new UnitDefinition({
      name: normalizedName,
      abbreviation: normalizedAbbr,
      description: description?.trim() || "",
      isActive: true,
    });

    await unit.save();

    return NextResponse.json(
      {
        _id: unit._id,
        name: unit.name,
        abbreviation: unit.abbreviation,
        description: unit.description,
        isActive: unit.isActive,
        createdAt: unit.createdAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating unit:", error);
    return NextResponse.json(
      { error: "Failed to create unit: " + error.message },
      { status: 500 }
    );
  }
}
