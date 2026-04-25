import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Category } from "@/lib/db/models";
import type { NextRequest } from "next/server";

/**
 * GET /api/categories
 * Fetch all categories with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    const isActive = searchParams.get("active");
    const parentId = searchParams.get("parentId");

    const filter: Record<string, any> = {};
    if (isActive !== null) {
      filter.isActive = isActive === "true";
    }
    if (parentId) {
      filter.parentId = parentId === "null" ? null : parentId;
    }

    const categories = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .select("name description color icon sortOrder isActive parentId createdAt updatedAt");

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();

    const { name, description = "", color = "#64748b", icon = "", sortOrder = 0, parentId } = data;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name (case-insensitive)
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    // Validate color format (hex)
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(color)) {
      return NextResponse.json(
        { error: "Invalid color format. Use hex (e.g., #64748b)" },
        { status: 400 }
      );
    }

    const category = await Category.create({
      name: name.trim(),
      description: description.trim(),
      color,
      icon: icon.trim(),
      sortOrder: parseInt(String(sortOrder)) || 0,
      isActive: true,
      parentId: parentId || undefined,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
