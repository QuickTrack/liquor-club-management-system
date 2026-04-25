import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Recipe } from "@/lib/db/models";
import type { NextRequest } from "next/server";

/**
 * GET /api/recipes
 * Fetch all recipes, optionally filtered by availability
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    const isAvailable = searchParams.get("available");
    const category = searchParams.get("category");

    const filter: Record<string, any> = {};
    if (isAvailable !== null) {
      filter.isAvailable = isAvailable === "true";
    }
    if (category) {
      filter.category = category;
    }

    const recipes = await Recipe.find(filter).sort({ name: 1 });
    return NextResponse.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}

/**
 * POST /api/recipes
 * Create a new recipe
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();

    const { name, category, price, ingredients, prepTime = 5, isAvailable = true } = data;

    if (!name || !category || price === undefined || !ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: "Name, category, price, and ingredients are required" },
        { status: 400 }
      );
    }

    const recipe = await Recipe.create({
      name,
      category,
      price,
      ingredients,
      prepTime,
      isAvailable,
      soldToday: 0,
      revenue: 0,
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("Error creating recipe:", error);
    return NextResponse.json({ error: "Failed to create recipe" }, { status: 500 });
  }
}
