"use client";

import { useState } from "react";
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  ArrowDownUp,
  Filter,
  Download,
  Edit,
  Scale,
} from "lucide-react";
import { AddProductModal } from "@/components/AddProductModal";

interface UnitConversion {
  unit: string;
  conversionFactor: number;
  sellPrice: number;
  costPrice?: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  baseUnit: string;
  stockQuantity: number;
  alternateUnits: UnitConversion[];
  reorderLevel: number;
  costPrice: number;
  sellPrice: number;
  supplier: string;
  expiryDate?: string;
  batchNo?: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

const products: Product[] = [
  {
    id: 1,
    name: "Jack Daniel's Old No. 7",
    category: "Bourbon",
    baseUnit: "bottle",
    stockQuantity: 24,
    reorderLevel: 10,
    costPrice: 2000,
    sellPrice: 3000,
    supplier: "Kenya Breweries",
    alternateUnits: [
      { unit: "6-Pack", conversionFactor: 6, sellPrice: 18000, costPrice: 12000 },
      { unit: "Case", conversionFactor: 12, sellPrice: 36000, costPrice: 24000 },
    ],
    status: "In Stock",
  },
  {
    id: 2,
    name: "Grey Goose Vodka",
    category: "Vodka",
    baseUnit: "bottle",
    stockQuantity: 18,
    reorderLevel: 10,
    costPrice: 3000,
    sellPrice: 4500,
    supplier: "EABL",
    alternateUnits: [],
    status: "In Stock",
  },
  {
    id: 3,
    name: "Moet & Chandon",
    category: "Champagne",
    baseUnit: "bottle",
    stockQuantity: 0,
    reorderLevel: 5,
    costPrice: 8000,
    sellPrice: 12000,
    supplier: "French Wines",
    alternateUnits: [
      { unit: "Half-Case", conversionFactor: 6, sellPrice: 72000, costPrice: 48000 },
    ],
    status: "Out of Stock",
  },
  {
    id: 4,
    name: "Johnnie Walker Blue",
    category: "Scotch",
    baseUnit: "bottle",
    stockQuantity: 12,
    reorderLevel: 8,
    costPrice: 15000,
    sellPrice: 20000,
    supplier: "EABL",
    alternateUnits: [],
    status: "In Stock",
  },
  {
    id: 5,
    name: "Patron Silver Tequila",
    category: "Tequila",
    baseUnit: "bottle",
    stockQuantity: 6,
    reorderLevel: 10,
    costPrice: 3500,
    sellPrice: 4500,
    supplier: "MexImports",
    alternateUnits: [],
    status: "Low Stock",
  },
  {
    id: 6,
    name: "Hennessy VS",
    category: "Cognac",
    baseUnit: "bottle",
    stockQuantity: 8,
    reorderLevel: 10,
    costPrice: 2800,
    sellPrice: 4000,
    supplier: "EABL",
    alternateUnits: [],
    status: "Low Stock",
  },
  {
    id: 7,
    name: "Heineken Draft",
    category: "Beer",
    baseUnit: "keg",
    stockQuantity: 50,
    reorderLevel: 20,
    costPrice: 2500,
    sellPrice: 3500,
    supplier: "Kenya Breweries",
    alternateUnits: [
      { unit: "Half-Keg", conversionFactor: 0.5, sellPrice: 1750, costPrice: 1250 },
    ],
    status: "In Stock",
  },
  {
    id: 8,
    name: "Guinness",
    category: "Beer",
    baseUnit: "crate",
    stockQuantity: 30,
    reorderLevel: 15,
    costPrice: 1800,
    sellPrice: 2500,
    supplier: "Kenya Breweries",
    alternateUnits: [],
    status: "In Stock",
  },
  {
    id: 9,
    name: "Vodka Shots",
    category: "Shots",
    baseUnit: "shot",
    stockQuantity: 200,
    reorderLevel: 100,
    costPrice: 50,
    sellPrice: 100,
    supplier: "EABL",
    alternateUnits: [
      { unit: "50ml", conversionFactor: 1, sellPrice: 100, costPrice: 50 },
    ],
    status: "In Stock",
  },
  {
    id: 10,
    name: "Tequila Shots",
    category: "Shots",
    baseUnit: "shot",
    stockQuantity: 80,
    reorderLevel: 100,
    costPrice: 80,
    sellPrice: 150,
    supplier: "MexImports",
    alternateUnits: [],
    status: "Low Stock",
  },
];

const categories = ["All", "Bourbon", "Vodka", "Scotch", "Champagne", "Cognac", "Tequila", "Beer", "Shots"];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showLowStock, setShowLowStock] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productList, setProductList] = useState<Product[]>(products);

  const handleAddProduct = (newProduct: Omit<Product, "id" | "status"> ) => {
      const product: Product = {
        ...newProduct,
        id: Date.now(),
        status: newProduct.stockQuantity === 0 ? "Out of Stock" : newProduct.stockQuantity <= newProduct.reorderLevel ? "Low Stock" : "In Stock",
      };
      setProductList([...productList, product]);
      setShowAddProduct(false);
    };

  const handleEditProduct = (updated: Product) => {
    setProductList(productList.map(p => p.id === updated.id ? updated : p));
    setShowEditProduct(false);
    setEditingProduct(null);
  };

  const filteredProducts = productList.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesLowStock = !showLowStock || p.stockQuantity <= p.reorderLevel;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const totalValue = productList.reduce((sum, p) => sum + p.stockQuantity * p.costPrice, 0);
  const lowStockCount = productList.filter((p) => p.stockQuantity <= p.reorderLevel).length;
  const outOfStockCount = productList.filter((p) => p.stockQuantity === 0).length;

  // Calculate stock in specific unit for display
  const getStockDisplay = (product: Product, unit?: string): string => {
    if (!unit || unit === product.baseUnit) {
      return `${product.stockQuantity} ${product.baseUnit}s`;
    }
    const altUnit = product.alternateUnits.find(u => u.unit === unit);
    if (altUnit) {
      const convertedQty = Math.round(product.stockQuantity / altUnit.conversionFactor * 100) / 100;
      return `${convertedQty} ${unit}`;
    }
    return `${product.stockQuantity} ${product.baseUnit}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Inventory & Stock Control</h1>
          <p className="text-gray-400">Real-time stock tracking with multi-unit support</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={() => setShowAddProduct(true)} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <Package className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-white">{products.length}</p>
          <p className="text-gray-400 text-sm">Total Products</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-green-500">Ksh {(totalValue / 1000).toFixed(0)}K</p>
          <p className="text-gray-400 text-sm">Stock Value</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <p className="text-2xl font-bold text-yellow-500">{lowStockCount}</p>
          </div>
          <p className="text-gray-400 text-sm">Low Stock</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-500" />
            <p className="text-2xl font-bold text-red-500">{outOfStockCount}</p>
          </div>
          <p className="text-gray-400 text-sm">Out of Stock</p>
        </div>
      </div>

      {/* Alerts */}
      {lowStockCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <p className="text-yellow-500">
              {lowStockCount} products need reorder. Click to view low stock items.
            </p>
            <button
              onClick={() => setShowLowStock(true)}
              className="text-yellow-500 underline hover:no-underline ml-auto"
            >
              View All
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            showLowStock
              ? "bg-blue-500 text-white"
              : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Low Stock
        </button>
        <div className="flex gap-1 bg-neutral-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1 rounded text-sm ${viewMode === "table" ? "bg-neutral-600 text-white" : "text-gray-400"}`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1 rounded text-sm ${viewMode === "cards" ? "bg-neutral-600 text-white" : "text-gray-400"}`}
          >
            Cards
          </button>
        </div>
      </div>

      {/* Stock Table */}
      {viewMode === "table" && (
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Product</th>
                <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Category</th>
                <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Stock (Base Unit)</th>
                <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Unit</th>
                <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Alt Units</th>
                <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Cost</th>
                <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Sell</th>
                <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Reorder</th>
                <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Supplier</th>
                <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-neutral-700/50 hover:bg-neutral-700/30">
                  <td className="px-4 py-3 text-white font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-gray-300">{product.category}</td>
                  <td className="px-4 py-3">
                    <span className={product.stockQuantity <= product.reorderLevel ? "text-yellow-500 font-bold" : "text-gray-300"}>
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{product.baseUnit}</td>
                  <td className="px-4 py-3">
                    {product.alternateUnits.length > 0 ? (
                      <div className="space-y-1">
                        {product.alternateUnits.slice(0, 2).map((au, idx) => (
                          <span key={idx} className="block text-xs text-blue-400">
                            1 {au.unit} = {au.conversionFactor} {product.baseUnit}s
                          </span>
                        ))}
                        {product.alternateUnits.length > 2 && (
                          <span className="text-xs text-gray-400">+{product.alternateUnits.length - 2} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300">Ksh {product.costPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">Ksh {product.sellPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400">{product.reorderLevel}</td>
                  <td className="px-4 py-3 text-gray-300">{product.supplier}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        product.status === "In Stock"
                          ? "bg-green-500/10 text-green-500"
                          : product.status === "Out of Stock"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setEditingProduct(product); setShowEditProduct(true); }}
                      className="text-blue-500 hover:text-blue-400"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Cards View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-neutral-800 rounded-xl p-4 border border-neutral-700 hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-medium">{product.name}</h3>
                  <p className="text-gray-400 text-sm">{product.category}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    product.status === "In Stock"
                      ? "bg-green-500/10 text-green-500"
                      : product.status === "Out of Stock"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-yellow-500/10 text-yellow-500"
                  }`}
                >
                  {product.status}
                </span>
              </div>

              {/* Base Unit Info */}
              <div className="bg-neutral-700/30 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400">Base Unit:</span>
                  </div>
                  <span className="text-sm font-medium text-white capitalize">{product.baseUnit}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{product.stockQuantity}</span>
                  <span className="text-gray-400">{product.baseUnit}s</span>
                </div>
              </div>

              {/* Alternate Units */}
              {product.alternateUnits.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2">Alternate Units:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {product.alternateUnits.map((au, idx) => (
                      <div key={idx} className="bg-neutral-700/30 rounded p-2 border border-neutral-600/50">
                        <div className="text-xs font-medium text-blue-300">{au.unit}</div>
                        <div className="text-xs text-gray-300 mt-1">
                          1 {au.unit} = {au.conversionFactor} {product.baseUnit}s
                        </div>
                        <div className="text-xs text-green-400 mt-1">
                          Ksh {au.sellPrice.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm pt-3 border-t border-neutral-700">
                <div>
                  <p className="text-gray-400">Cost / {product.baseUnit}</p>
                  <p className="text-white font-bold">Ksh {product.costPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Sell / {product.baseUnit}</p>
                  <p className="text-white font-bold">Ksh {product.sellPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Reorder Level</p>
                  <p className="text-gray-300">{product.reorderLevel} {product.baseUnit}s</p>
                </div>
                <div>
                  <p className="text-gray-400">Stock Value</p>
                  <p className="text-green-400 font-bold">Ksh {(product.stockQuantity * product.costPrice).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
        <h3 className="text-white font-medium mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="flex items-center justify-center gap-2 py-3 bg-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-600">
            <ArrowDownUp className="w-4 h-4" />
            Stock Transfer
          </button>
          <button className="flex items-center justify-center gap-2 py-3 bg-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-600">
            <RefreshCw className="w-4 h-4" />
            Stock Count
          </button>
          <button className="flex items-center justify-center gap-2 py-3 bg-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-600">
            <Filter className="w-4 h-4" />
            Filter by Batch
          </button>
          <button className="flex items-center justify-center gap-2 py-3 bg-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-600">
            <Download className="w-4 h-4" />
            Stock Report
          </button>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <AddProductModal
          onClose={() => setShowAddProduct(false)}
          onSave={handleAddProduct}
          categories={categories.filter(c => c !== "All")}
        />
      )}

       {/* Edit Product Modal */}
       {showEditProduct && editingProduct && (
         <AddProductModal
           onClose={() => { setShowEditProduct(false); setEditingProduct(null); }}
           onSave={(updated) => {
             setProductList(productList.map(p => p.id === editingProduct.id 
               ? { ...updated, id: editingProduct.id, status: editingProduct.status }
               : p
             ));
             setShowEditProduct(false);
             setEditingProduct(null);
           }}
           categories={categories.filter(c => c !== "All")}
         />
       )}
    </div>
  );
}
