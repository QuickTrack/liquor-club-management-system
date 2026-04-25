"use client";

import { useState } from "react";
import { Package, DollarSign, Building2, RefreshCw, Plus, Scale } from "lucide-react";

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

interface AddProductModalProps {
  onClose: () => void;
  onSave: (p: Omit<Product, "id" | "status">) => void;
  categories: string[];
}

export function AddProductModal({ onClose, onSave, categories }: AddProductModalProps) {
  const [form, setForm] = useState<{
    name: string;
    category: string;
    baseUnit: string;
    stockQuantity: number;
    reorderLevel: number;
    costPrice: number;
    sellPrice: number;
    supplier: string;
    alternateUnits: UnitConversion[];
    newCategory: string;
    newUnitName: string;
    newUnitFactor: string;
    newUnitSellPrice: string;
    newUnitCostPrice: string;
  }>({
    name: "",
    category: categories[0] || "Bourbon",
    baseUnit: "bottle",
    stockQuantity: 0,
    reorderLevel: 10,
    costPrice: 0,
    sellPrice: 0,
    supplier: "",
    alternateUnits: [] as UnitConversion[],
    newCategory: "",
    newUnitName: "",
    newUnitFactor: "",
    newUnitSellPrice: "",
    newUnitCostPrice: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState(0);

  const sections = [
    { id: 0, title: "Basic Info", fields: ["name", "category"] },
    { id: 1, title: "Inventory", fields: ["baseUnit", "stockQuantity", "reorderLevel"] },
    { id: 2, title: "Pricing", fields: ["costPrice", "sellPrice"] },
    { id: 3, title: "Units", fields: ["alternateUnits"] },
    { id: 4, title: "Supplier", fields: ["supplier"] },
  ];

  const baseUnits = ["bottle", "liter", "keg", "shot", "crate", "case"];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (form.stockQuantity < 0) newErrors.stockQuantity = "Stock cannot be negative";
    if (form.costPrice < 0) newErrors.costPrice = "Cost price cannot be negative";
    if (form.sellPrice < 0) newErrors.sellPrice = "Sell price cannot be negative";
    if (form.sellPrice < form.costPrice) newErrors.sellPrice = "Sell price must be >= cost price";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave({
      name: form.name,
      category: form.category,
      baseUnit: form.baseUnit,
      stockQuantity: form.stockQuantity,
      reorderLevel: form.reorderLevel,
      costPrice: form.costPrice,
      sellPrice: form.sellPrice,
      supplier: form.supplier,
      alternateUnits: form.alternateUnits,
    });
  };

  const addAlternateUnit = () => {
    if (!form.newUnitName.trim() || !form.newUnitFactor || parseFloat(form.newUnitFactor) <= 0) {
      setErrors({ ...errors, newUnitName: "Enter name and valid factor" });
      return;
    }
    const newUnit = {
      unit: form.newUnitName.trim(),
      conversionFactor: parseFloat(form.newUnitFactor),
      sellPrice: parseFloat(form.newUnitSellPrice) || 0,
      costPrice: parseFloat(form.newUnitCostPrice) || undefined,
    };
    if (form.alternateUnits.some(u => u.unit.toLowerCase() === newUnit.unit.toLowerCase())) {
      setErrors({ ...errors, newUnitName: "Unit already exists" });
      return;
    }
    setForm({
      ...form,
      alternateUnits: [...form.alternateUnits, newUnit],
      newUnitName: "",
      newUnitFactor: "",
      newUnitSellPrice: "",
      newUnitCostPrice: "",
    });
    setErrors({ ...errors, newUnitName: "" });
  };

  const removeAlternateUnit = (index: number) => {
    setForm({
      ...form,
      alternateUnits: form.alternateUnits.filter((_, i) => i !== index),
    });
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
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder="New category"
                value={form.newCategory}
                onChange={(e) => setForm({ ...form, newCategory: e.target.value })}
                className="flex-1 bg-neutral-700 text-white px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (!form.newCategory.trim()) return;
                  categories.push(form.newCategory.trim());
                  setForm({ ...form, category: form.newCategory.trim(), newCategory: "" });
                }}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        );
      case "baseUnit":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Base Unit</label>
            <select
              value={form.baseUnit}
              onChange={(e) => setForm({ ...form, baseUnit: e.target.value })}
              className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
            >
              {baseUnits.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        );
      case "stockQuantity":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Stock Quantity</label>
            <input
              type="number"
              min="0"
              value={form.stockQuantity}
              onChange={(e) => setForm({ ...form, stockQuantity: parseInt(e.target.value) || 0 })}
              className={`w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${hasError ? "border border-red-500" : "border border-neutral-600"}`}
            />
            {hasError && <p className="mt-1 text-xs text-red-400">{hasError}</p>}
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
      case "alternateUnits":
        return (
          <div key={field}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Alternate Units</label>
            <p className="text-xs text-gray-400 mb-4">Define alternate units (e.g. case, pack) with conversion ratios</p>
            {form.alternateUnits.length > 0 && (
              <div className="space-y-2 mb-4">
                {form.alternateUnits.map((unit, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-neutral-700/50 border border-neutral-600 rounded-lg">
                    <div>
                      <span className="font-medium text-white">{unit.unit}</span>
                      <span className="text-sm text-gray-400 ml-2">
                        1 {unit.unit} = {unit.conversionFactor} {form.baseUnit}s
                      </span>
                      <span className="text-sm text-gray-400 ml-2">
                        Sell: KES {unit.sellPrice}
                      </span>
                      {unit.costPrice && (
                        <span className="text-sm text-gray-400 ml-2">
                          Cost: KES {unit.costPrice}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAlternateUnit(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-neutral-600 rounded disabled:opacity-50"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="p-4 bg-neutral-700/30 border border-neutral-600/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Add Alternate Unit</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Unit Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Case"
                    value={form.newUnitName}
                    onChange={(e) => setForm({ ...form, newUnitName: e.target.value })}
                    className="w-full bg-neutral-700 text-white px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Conversion Factor</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g., 12"
                    value={form.newUnitFactor}
                    onChange={(e) => setForm({ ...form, newUnitFactor: e.target.value })}
                    className="w-full bg-neutral-700 text-white px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Sell Price per Unit</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 36000"
                    value={form.newUnitSellPrice}
                    onChange={(e) => setForm({ ...form, newUnitSellPrice: e.target.value })}
                    className="w-full bg-neutral-700 text-white px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Cost Price per Unit</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 24000"
                    value={form.newUnitCostPrice}
                    onChange={(e) => setForm({ ...form, newUnitCostPrice: e.target.value })}
                    className="w-full bg-neutral-700 text-white px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addAlternateUnit}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Unit
                </button>
              </div>
              {errors.newUnitName && <p className="mt-1 text-xs text-red-400">{errors.newUnitName}</p>}
            </div>
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
      <div className="bg-neutral-800 rounded-2xl border border-neutral-700 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Add New Product</h2>
            <p className="text-sm text-gray-400 mt-1">Set up product with flexible unit of measure support</p>
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

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 bg-neutral-900/50 border-r border-neutral-700 p-4 space-y-1">
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

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-neutral-700">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  {activeSection === 0 && <Package className="w-4 h-4" />}
                  {activeSection === 1 && <Scale className="w-4 h-4" />}
                  {activeSection === 2 && <DollarSign className="w-4 h-4" />}
                  {activeSection === 3 && <RefreshCw className="w-4 h-4" />}
                  {activeSection === 4 && <Building2 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{currentSection.title}</h3>
                  <p className="text-sm text-gray-400">
                    {activeSection === 0 && "Basic product identification details"}
                    {activeSection === 1 && "Define base unit and stock quantity"}
                    {activeSection === 2 && "Set pricing per base unit"}
                    {activeSection === 3 && "Add alternate units with conversion ratios"}
                    {activeSection === 4 && "Supplier information"}
                  </p>
                </div>
              </div>

              <div className={`
                activeSection === 0 ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                : activeSection === 1 ? "grid grid-cols-1 gap-4"
                : activeSection === 2 ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                : activeSection === 3 ? "grid grid-cols-1 gap-4"
                : "grid grid-cols-1 gap-4"
              }`}
              >
                {currentSection.fields.map((field) => renderField(field))}
              </div>

              {activeSection === 2 && form.costPrice > 0 && form.sellPrice > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Profit Margin per {form.baseUnit}</p>
                      <p className="text-2xl font-bold text-green-400">
                        {((form.sellPrice - form.costPrice) / form.sellPrice * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Profit per {form.baseUnit}</p>
                      <p className="text-2xl font-bold text-green-400">KES {(form.sellPrice - form.costPrice).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-700/50 text-sm text-gray-300">
                    Stock Value: <span className="font-bold text-green-400">KES {(form.stockQuantity * form.costPrice).toLocaleString()}</span>
                    {form.alternateUnits.length > 0 && (
                      <span className="ml-4">
                        Units: <span className="font-bold text-blue-400">{form.alternateUnits.length}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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
