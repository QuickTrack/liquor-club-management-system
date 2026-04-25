import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Category } from "@/lib/db/models";
import type { NextRequest } from "next/server";

/**
 * GET /api/categories/[id]
 * Fetch a single category by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

/**
 * PATCH /api/categories/[id]
 * Update category
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const data = await request.json();

    const allowed = ["name", "description", "color", "icon", "sortOrder", "isActive", "parentId"];
    const update: Record<string, any> = {};

    for (const key of allowed) {
      if (data[key] !== undefined) {
        if (key === "sortOrder") {
          update[key] = parseInt(String(data[key])) || 0;
        } else if (key === "parentId") {
          update[key] = data[key] || undefined;
        } else {
          update[key] = data[key];
        }
      }
    }

    // If name is being updated, check for duplicates
    if (update.name) {
      const trimmedName = String(update.name).trim();
      const duplicate = await Category.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 400 }
        );
      }
      update.name = trimmedName;
    }

    // Validate color if provided
    if (update.color) {
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexRegex.test(update.color)) {
        return NextResponse.json(
          { error: "Invalid color format. Use hex (e.g., #64748b)" },
          { status: 400 }
        );
      }
    }

    const category = await Category.findByIdAndUpdate(id, update, { new: true });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete category (soft delete by setting isActive=false, or hard delete if no products)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Check if category has products
    const { Product } = await import("@/lib/db/models");
    const productCount = await Product.countDocuments({ category: id });
    
    if (productCount > 0) {
      // Soft delete: just deactivate
      const category = await Category.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
      return NextResponse.json({
        message: "Category deactivated (has products)",
        category,
      });
    }

    // No products, safe to hard delete
    await Category.findByIdAndDelete(id);
    return NextResponse.json({ message: "Category deleted permanently" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
