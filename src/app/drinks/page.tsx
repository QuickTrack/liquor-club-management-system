"use client";

import { useState } from "react";
import {
  FlaskConical,
  Plus,
  Search,
  Clock,
  Edit,
  Copy,
  Trash2,
  Flame,
} from "lucide-react";

interface Recipe {
  id: number;
  name: string;
  category: string;
  price: number;
  ingredients: { name: string; amount: string; unit: string }[];
  prepTime: number;
  isAvailable: boolean;
  soldToday: number;
  revenue: number;
}

const recipes: Recipe[] = [
  {
    id: 1,
    name: "Classic Margherita",
    category: "Cocktail",
    price: 450,
    ingredients: [
      { name: "Patron Silver", amount: "1.5", unit: "oz" },
      { name: "Lime Juice", amount: "1", unit: "oz" },
      { name: "Agave Syrup", amount: "0.5", unit: "oz" },
    ],
    prepTime: 3,
    isAvailable: true,
    soldToday: 12,
    revenue: 5400,
  },
  {
    id: 2,
    name: "Mojito",
    category: "Cocktail",
    price: 400,
    ingredients: [
      { name: "White Rum", amount: "2", unit: "oz" },
      { name: "Mint Leaves", amount: "6", unit: "pcs" },
      { name: "Lime Juice", amount: "1", unit: "oz" },
      { name: "Sugar", amount: "0.5", unit: "oz" },
    ],
    prepTime: 4,
    isAvailable: true,
    soldToday: 8,
    revenue: 3200,
  },
  {
    id: 3,
    name: "Whiskey Sour",
    category: "Cocktail",
    price: 450,
    ingredients: [
      { name: "Jack Daniel's", amount: "2", unit: "oz" },
      { name: "Lemon Juice", amount: "1", unit: "oz" },
      { name: "Sugar Syrup", amount: "0.75", unit: "oz" },
    ],
    prepTime: 3,
    isAvailable: true,
    soldToday: 5,
    revenue: 2250,
  },
  {
    id: 4,
    name: " Martini",
    category: "Cocktail",
    price: 500,
    ingredients: [
      { name: "Gin", amount: "2.5", unit: "oz" },
      { name: "Dry Vermouth", amount: "0.5", unit: "oz" },
    ],
    prepTime: 2,
    isAvailable: true,
    soldToday: 15,
    revenue: 7500,
  },
  {
    id: 5,
    name: "Pina Colada",
    category: "Cocktail",
    price: 500,
    ingredients: [
      { name: "White Rum", amount: "2", unit: "oz" },
      { name: "Coconut Cream", amount: "2", unit: "oz" },
      { name: "Pineapple Juice", amount: "4", unit: "oz" },
    ],
    prepTime: 4,
    isAvailable: true,
    soldToday: 6,
    revenue: 3000,
  },
  {
    id: 6,
    name: "Vodka Tonic",
    category: "Simple",
    price: 250,
    ingredients: [
      { name: "Vodka", amount: "1.5", unit: "oz" },
      { name: "Tonic Water", amount: "4", unit: "oz" },
    ],
    prepTime: 1,
    isAvailable: true,
    soldToday: 25,
    revenue: 6250,
  },
];

const categories = ["All", "Cocktail", "Simple", "Shot", "Mocktail"];
const happyHours = [
  { day: "Monday", start: "14:00", end: "18:00", discount: "20%" },
  { day: "Wednesday", start: "14:00", end: "18:00", discount: "20%" },
  { day: "Friday", start: "14:00", end: "18:00", discount: "20%" },
  { day: "Saturday", start: "12:00", end: "16:00", discount: "15%" },
];

export default function DrinksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showRecipe, setShowRecipe] = useState<number | null>(null);

  const filteredRecipes = recipes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalSold = recipes.reduce((sum, r) => sum + r.soldToday, 0);
  const totalRevenue = recipes.reduce((sum, r) => sum + r.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Bar & Drink Management</h1>
          <p className="text-gray-400">Menu engineering and recipe management</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-5 h-5" />
          Add Recipe
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <FlaskConical className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-white">{recipes.length}</p>
          <p className="text-gray-400 text-sm">Total Recipes</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-green-500">{totalSold}</p>
          <p className="text-gray-400 text-sm">Sold Today</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-white">Ksh {(totalRevenue / 1000).toFixed(1)}K</p>
          <p className="text-gray-400 text-sm">Today&apos;s Revenue</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-orange-500">Ksh {Math.round(totalRevenue * 0.3)}K</p>
          <p className="text-gray-400 text-sm">Est. Profit (30%)</p>
        </div>
      </div>

      {/* Happy Hour Schedule */}
      <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="text-white font-medium">Happy Hour Schedule</h3>
          </div>
          <button className="text-amber-500 text-sm hover:underline">Edit Schedule</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {happyHours.map((hh) => (
            <div key={hh.day} className="bg-neutral-700/50 p-3 rounded-lg">
              <p className="text-white font-medium">{hh.day}</p>
              <p className="text-gray-400 text-sm">{hh.start} - {hh.end}</p>
              <p className="text-orange-500 text-sm font-medium">{hh.discount} off</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recipes Table */}
      <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Recipe</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Category</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Price</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Ingredients</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Prep Time</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Sold Today</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Revenue</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecipes.map((recipe) => (
              <tr key={recipe.id} className="border-b border-neutral-700/50 hover:bg-neutral-700/30">
                <td className="px-4 py-3">
                  <button
                    onClick={() => setShowRecipe(showRecipe === recipe.id ? null : recipe.id)}
                    className="text-white font-medium hover:text-amber-500"
                  >
                    {recipe.name}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-300">{recipe.category}</td>
                <td className="px-4 py-3 text-white font-bold">Ksh {recipe.price}</td>
                <td className="px-4 py-3 text-gray-300">
                  {recipe.ingredients.length} items
                </td>
                <td className="px-4 py-3 text-gray-300">{recipe.prepTime} min</td>
                <td className="px-4 py-3 text-gray-300">{recipe.soldToday}</td>
                <td className="px-4 py-3 text-green-500">Ksh {recipe.revenue.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      recipe.isAvailable
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {recipe.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="text-gray-400 hover:text-amber-500">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-amber-500">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recipe Detail Modal */}
      {showRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 rounded-xl p-6 w-[500px] border border-neutral-700">
            {(() => {
              const recipe = recipes.find((r) => r.id === showRecipe);
              if (!recipe) return null;
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">{recipe.name}</h2>
                    <button onClick={() => setShowRecipe(null)} className="text-gray-400 hover:text-white">
                      ×
                    </button>
                  </div>
                  <p className="text-gray-400 mb-4">{recipe.category}</p>
                  <div className="border-t border-neutral-700 pt-4">
                    <h3 className="text-white font-medium mb-2">Ingredients</h3>
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ing, idx) => (
                        <li key={idx} className="flex justify-between text-gray-300">
                          <span>{ing.name}</span>
                          <span>
                            {ing.amount} {ing.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-3 mt-4 pt-4 border-t border-neutral-700">
                    <button className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">
                      Edit Recipe
                    </button>
                    <button className="flex-1 py-2 bg-neutral-700 text-gray-300 rounded-lg font-medium hover:bg-neutral-600">
                      Make Available
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}