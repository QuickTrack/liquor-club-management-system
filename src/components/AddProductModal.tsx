"use client";

import { useState } from "react";
import { Package, DollarSign, Building2, RefreshCw, Plus } from "lucide-react";

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

interface AddProductModalProps {
  onClose: () => void;
  onSave: (p: Omit<Product, "id" | "status">) => void;
  categories: string[];
}

const units = ["bottles", "shots", "kegs", "crates"];

export function AddProductModal({ onClose, onSave, categories }: AddProductModalProps) {
   const [form, setForm] = useState({
    name: "",
    category: categories[0] || "Bourbon",
    stock: 0,
    unit: "bottles",
    reorderLevel: 10,
    costPrice: 0,
    sellPrice: 0,
    supplier: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState(0);

  const sections = [
    { id: 0, title: "Basic Info", fields: ["name", "category"] },
    { id: 1, title: "Inventory", fields: ["stock", "unit", "reorderLevel"] },
    { id: 2, title: "Pricing", fields: ["costPrice", "sellPrice"] },
    { id: 3, title: "Supplier", fields: ["supplier"] },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (form.stock < 0) newErrors.stock = "Stock cannot be negative";
    if (form.costPrice < 0) newErrors.costPrice = "Cost price cannot be negative";
    if (form.sellPrice < 0) newErrors.sellPrice = "Sell price cannot be negative";
    if (form.sellPrice < form.costPrice) newErrors.sellPrice = "Sell price must be at least cost price";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave(form);
  };

  const currentSection = sections[activeSection];

  const renderField = (field: string) => {
    const hasError = errors[field];
    switch (field) {
      case "name":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Product Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${hasError ? "border border-red-500" : "border border-neutral-600"}`}
              placeholder="e.g., Jack Daniel's Old No. 7"
            />
            {hasError && <p className="mt-1 text-xs text-red-400">{hasError}</p>}
          </div>
        );
      case "category":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        );
      case "stock":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Stock Quantity</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
              className={`w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${hasError ? "border border-red-500" : "border border-neutral-600"}`}
            />
            {hasError && <p className="mt-1 text-xs text-red-400">{hasError}</p>}
          </div>
        );
      case "unit":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Unit Type</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
            >
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        );
      case "reorderLevel":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Reorder Level</label>
            <input
              type="number"
              min="1"
              value={form.reorderLevel}
              onChange={(e) => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 10 })}
              className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
            />
            <p className="mt-1 text-xs text-gray-400">Alert when stock drops below this level</p>
          </div>
        );
      case "costPrice":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Cost Price (KES)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
              className={`w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${hasError ? "border border-red-500" : "border border-neutral-600"}`}
              placeholder="0.00"
            />
            {hasError && <p className="mt-1 text-xs text-red-400">{hasError}</p>}
          </div>
        );
      case "sellPrice":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Sell Price (KES)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.sellPrice}
              onChange={(e) => setForm({ ...form, sellPrice: parseFloat(e.target.value) || 0 })}
              className={`w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${hasError ? "border border-red-500" : "border border-neutral-600"}`}
              placeholder="0.00"
            />
            {hasError && <p className="mt-1 text-xs text-red-400">{hasError}</p>}
            {form.sellPrice > 0 && form.costPrice > 0 && (
              <p className="mt-1 text-xs text-green-400">
                Profit: KES {(form.sellPrice - form.costPrice).toFixed(2)} ({((form.sellPrice - form.costPrice) / form.sellPrice * 100).toFixed(1)}% margin)
              </p>
            )}
          </div>
        );
      case "supplier":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Supplier</label>
            <input
              type="text"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
              placeholder="e.g., EABL, Kenya Breweries"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-800 rounded-2xl border border-neutral-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Add New Product</h2>
            <p className="text-sm text-gray-400 mt-1">Complete product setup in organized sections</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-56 bg-neutral-900/50 border-r border-neutral-700 p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Sections</p>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-all ${
                  activeSection === section.id
                    ? "bg-blue-500 text-white shadow-lg"
                    : "text-gray-400 hover:bg-neutral-700 hover:text-white"
                }`}
              >
                <div className={`w-2 h-2 rounded-full mr-3 ${activeSection === section.id ? "bg-white" : "bg-gray-500"}`} />
                <span className="text-sm font-medium">{section.title}</span>
              </button>
            ))}
          </div>

          {/* Form Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center space-x-3 pb-4 border-b border-neutral-700">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  {activeSection === 0 && <Package className="w-4 h-4" />}
                  {activeSection === 1 && <RefreshCw className="w-4 h-4" />}
                  {activeSection === 2 && <DollarSign className="w-4 h-4" />}
                  {activeSection === 3 && <Building2 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{currentSection.title}</h3>
                  <p className="text-sm text-gray-400">
                    {activeSection === 0 && "Basic product identification details"}
                    {activeSection === 1 && "Stock levels and inventory tracking"}
                    {activeSection === 2 && "Pricing information and margins"}
                    {activeSection === 3 && "Supplier and additional information"}
                  </p>
                </div>
              </div>

              {/* Fields */}
              <div className={
                activeSection === 0 ? "grid grid-cols-1 md:grid-cols-2 gap-4" :
                activeSection === 1 ? "grid grid-cols-1 md:grid-cols-3 gap-4" :
                activeSection === 2 ? "grid grid-cols-1 md:grid-cols-2 gap-4" :
                "grid grid-cols-1 gap-4"
              }>
                {currentSection.fields.map((field) => renderField(field))}
              </div>

              {/* Summary card when pricing section is active */}
              {activeSection === 2 && form.costPrice > 0 && form.sellPrice > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Estimated Profit Margin</p>
                      <p className="text-2xl font-bold text-green-400">
                        {((form.sellPrice - form.costPrice) / form.sellPrice * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Profit per unit</p>
                      <p className="text-2xl font-bold text-green-400">KES {(form.sellPrice - form.costPrice).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-700 bg-neutral-900/30">
          <div className="text-sm text-gray-400">
            Step {activeSection + 1} of {sections.length}
          </div>
          <div className="flex gap-3">
            {activeSection > 0 && (
              <button
                onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                className="px-5 py-2.5 border border-neutral-600 text-gray-300 rounded-lg hover:bg-neutral-700 transition-colors font-medium"
              >
                Previous
              </button>
            )}
            {activeSection < sections.length - 1 ? (
              <button
                onClick={() => setActiveSection(activeSection + 1)}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Next Section
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Product
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onSave: (p: Product) => void;
  categories: string[];
}

export function EditProductModal({ product, onClose, onSave, categories }: EditProductModalProps) {
  const [form, setForm] = useState<Product>({ ...product });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState(0);

  const sections = [
    { id: 0, title: "Basic Info", fields: ["name", "category"] },
    { id: 1, title: "Inventory", fields: ["stock", "unit", "reorderLevel"] },
    { id: 2, title: "Pricing", fields: ["costPrice", "sellPrice"] },
    { id: 3, title: "Supplier", fields: ["supplier"] },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (form.stock < 0) newErrors.stock = "Stock cannot be negative";
    if (form.costPrice < 0) newErrors.costPrice = "Cost price cannot be negative";
    if (form.sellPrice < 0) newErrors.sellPrice = "Sell price cannot be negative";
    if (form.sellPrice < form.costPrice) newErrors.sellPrice = "Sell price must be at least cost price";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave(form);
  };

  const currentSection = sections[activeSection];

  const renderField = (field: string) => {
    const hasError = errors[field];
    switch (field) {
      case "name":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Product Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${hasError ? "border border-red-500" : "border border-neutral-600"}`}
              placeholder="e.g., Jack Daniel's Old No. 7"
            />
            {hasError && <p className="mt-1 text-xs text-red-400">{hasError}</p>}
          </div>
        );
      case "category":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        );
      case "stock":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Stock Quantity</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
              className={`w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${hasError ? "border border-red-500" : "border border-neutral-600"}`}
            />
            {hasError && <p className="mt-1 text-xs text-red-400">{hasError}</p>}
          </div>
        );
      case "unit":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Unit Type</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
            >
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        );
      case "reorderLevel":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Reorder Level</label>
            <input
              type="number"
              min="1"
              value={form.reorderLevel}
              onChange={(e) => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 10 })}
              className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
            />
            <p className="mt-1 text-xs text-gray-400">Alert when stock drops below this level</p>
          </div>
        );
      case "costPrice":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Cost Price (KES)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
              className={`w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${hasError ? "border border-red-500" : "border border-neutral-600"}`}
              placeholder="0.00"
            />
            {hasError && <p className="mt-1 text-xs text-red-400">{hasError}</p>}
          </div>
        );
      case "sellPrice":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Sell Price (KES)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.sellPrice}
              onChange={(e) => setForm({ ...form, sellPrice: parseFloat(e.target.value) || 0 })}
              className={`w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${hasError ? "border border-red-500" : "border border-neutral-600"}`}
              placeholder="0.00"
            />
            {hasError && <p className="mt-1 text-xs text-red-400">{hasError}</p>}
            {form.sellPrice > 0 && form.costPrice > 0 && (
              <p className="mt-1 text-xs text-green-400">
                Profit: KES {(form.sellPrice - form.costPrice).toFixed(2)} ({((form.sellPrice - form.costPrice) / form.sellPrice * 100).toFixed(1)}% margin)
              </p>
            )}
          </div>
        );
      case "supplier":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Supplier</label>
            <input
              type="text"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
              placeholder="e.g., EABL, Kenya Breweries"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-800 rounded-2xl border border-neutral-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Edit Product</h2>
            <p className="text-sm text-gray-400 mt-1">Update product information and settings</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-56 bg-neutral-900/50 border-r border-neutral-700 p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Sections</p>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-all ${
                  activeSection === section.id
                    ? "bg-blue-500 text-white shadow-lg"
                    : "text-gray-400 hover:bg-neutral-700 hover:text-white"
                }`}
              >
                <div className={`w-2 h-2 rounded-full mr-3 ${activeSection === section.id ? "bg-white" : "bg-gray-500"}`} />
                <span className="text-sm font-medium">{section.title}</span>
              </button>
            ))}
          </div>

          {/* Form Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center space-x-3 pb-4 border-b border-neutral-700">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  {activeSection === 0 && <Package className="w-4 h-4" />}
                  {activeSection === 1 && <RefreshCw className="w-4 h-4" />}
                  {activeSection === 2 && <DollarSign className="w-4 h-4" />}
                  {activeSection === 3 && <Building2 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{currentSection.title}</h3>
                  <p className="text-sm text-gray-400">
                    {activeSection === 0 && "Basic product identification details"}
                    {activeSection === 1 && "Stock levels and inventory tracking"}
                    {activeSection === 2 && "Pricing information and margins"}
                    {activeSection === 3 && "Supplier and additional information"}
                  </p>
                </div>
              </div>

              {/* Fields */}
              <div className={
                activeSection === 0 ? "grid grid-cols-1 md:grid-cols-2 gap-4" :
                activeSection === 1 ? "grid grid-cols-1 md:grid-cols-3 gap-4" :
                activeSection === 2 ? "grid grid-cols-1 md:grid-cols-2 gap-4" :
                "grid grid-cols-1 gap-4"
              }>
                {currentSection.fields.map((field) => renderField(field))}
              </div>

              {/* Summary card when pricing section is active */}
              {activeSection === 2 && form.costPrice > 0 && form.sellPrice > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Estimated Profit Margin</p>
                      <p className="text-2xl font-bold text-green-400">
                        {((form.sellPrice - form.costPrice) / form.sellPrice * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Profit per unit</p>
                      <p className="text-2xl font-bold text-green-400">KES {(form.sellPrice - form.costPrice).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-700 bg-neutral-900/30">
          <div className="text-sm text-gray-400">
            Step {activeSection + 1} of {sections.length}
          </div>
          <div className="flex gap-3">
            {activeSection > 0 && (
              <button
                onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                className="px-5 py-2.5 border border-neutral-600 text-gray-300 rounded-lg hover:bg-neutral-700 transition-colors font-medium"
              >
                Previous
              </button>
            )}
            {activeSection < sections.length - 1 ? (
              <button
                onClick={() => setActiveSection(activeSection + 1)}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Next Section
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Update Product
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
