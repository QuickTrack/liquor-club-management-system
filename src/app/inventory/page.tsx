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
} from "lucide-react";
import { AddProductModal, EditProductModal } from "@/components/AddProductModal";

interface Product {
  id: number;
  name: string;
  category: string;
  stock: number;
  unit: string;
  reorderLevel: number;
  costPrice: number;
  sellPrice: number;
  supplier: string;
  expiryDate?: string;
  batchNo?: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

const products: Product[] = [
  { id: 1, name: "Jack Daniel's Old No. 7", category: "Bourbon", stock: 24, unit: "bottles", reorderLevel: 10, costPrice: 2000, sellPrice: 3000, supplier: "Kenya Breweries", status: "In Stock" },
  { id: 2, name: "Grey Goose Vodka", category: "Vodka", stock: 18, unit: "bottles", reorderLevel: 10, costPrice: 3000, sellPrice: 4500, supplier: "EABL", status: "In Stock" },
  { id: 3, name: "Moet & Chandon", category: "Champagne", stock: 0, unit: "bottles", reorderLevel: 5, costPrice: 8000, sellPrice: 12000, supplier: "French Wines", status: "Out of Stock" },
  { id: 4, name: "Johnnie Walker Blue", category: "Scotch", stock: 12, unit: "bottles", reorderLevel: 8, costPrice: 15000, sellPrice: 20000, supplier: "EABL", status: "In Stock" },
  { id: 5, name: "Patron Silver Tequila", category: "Tequila", stock: 6, unit: "bottles", reorderLevel: 10, costPrice: 3500, sellPrice: 4500, supplier: "MexImports", status: "Low Stock" },
  { id: 6, name: "Hennessy VS", category: "Cognac", stock: 8, unit: "bottles", reorderLevel: 10, costPrice: 2800, sellPrice: 4000, supplier: "EABL", status: "Low Stock" },
  { id: 7, name: "Heineken Draft", category: "Beer", stock: 50, unit: "kegs", reorderLevel: 20, costPrice: 2500, sellPrice: 3500, supplier: "Kenya Breweries", status: "In Stock" },
  { id: 8, name: "Guinness", category: "Beer", stock: 30, unit: "crates", reorderLevel: 15, costPrice: 1800, sellPrice: 2500, supplier: "Kenya Breweries", status: "In Stock" },
  { id: 9, name: "Vodka Shots", category: "Shots", stock: 200, unit: "shots", reorderLevel: 100, costPrice: 50, sellPrice: 100, supplier: "EABL", status: "In Stock" },
  { id: 10, name: "Tequila Shots", category: "Shots", stock: 80, unit: "shots", reorderLevel: 100, costPrice: 80, sellPrice: 150, supplier: "MexImports", status: "Low Stock" },
];

const categories = ["All", "Bourbon", "Vodka", "Scotch", "Champagne", "Cognac", "Tequila", "Beer", "Shots"];
const units = ["bottles", "shots", "kegs", "crates"];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showLowStock, setShowLowStock] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productList, setProductList] = useState<Product[]>(products);

  const handleAddProduct = (newProduct: Omit<Product, "id" | "status">) => {
    const product: Product = {
      ...newProduct,
      id: Date.now(),
      status: newProduct.stock === 0 ? "Out of Stock" : newProduct.stock <= newProduct.reorderLevel ? "Low Stock" : "In Stock",
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
    const matchesLowStock = !showLowStock || p.stock <= p.reorderLevel;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const totalValue = productList.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  const lowStockCount = productList.filter((p) => p.stock <= p.reorderLevel).length;
  const outOfStockCount = productList.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Inventory & Stock Control</h1>
          <p className="text-gray-400">Real-time stock tracking and management</p>
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
                <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Stock</th>
                <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Unit</th>
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
                    <span className={product.stock <= product.reorderLevel ? "text-yellow-500 font-bold" : "text-gray-300"}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{product.unit}</td>
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
                          : "bg-blue-500/10 text-blue-500"
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
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-400">Stock</p>
                  <p className="text-white font-bold">{product.stock} {product.unit}</p>
                </div>
                <div>
                  <p className="text-gray-400">Reorder Level</p>
                  <p className="text-gray-300">{product.reorderLevel}</p>
                </div>
                <div>
                  <p className="text-gray-400">Cost Price</p>
                  <p className="text-gray-300">Ksh {product.costPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Sell Price</p>
                  <p className="text-gray-300">Ksh {product.sellPrice.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-700 flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-neutral-700 text-gray-300 rounded text-sm hover:bg-neutral-600">
                  <ArrowDownUp className="w-3 h-3" />
                  Transfer
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-neutral-700 text-gray-300 rounded text-sm hover:bg-neutral-600">
                  <RefreshCw className="w-3 h-3" />
                  Reorder
                </button>
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
        <EditProductModal
          product={editingProduct}
          onClose={() => { setShowEditProduct(false); setEditingProduct(null); }}
          onSave={handleEditProduct}
          categories={categories.filter(c => c !== "All")}
        />
      )}
    </div>
  );
}
