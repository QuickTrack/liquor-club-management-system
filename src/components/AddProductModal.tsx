"use client";

import { useState, useEffect, useRef } from "react";
import { Package, DollarSign, Building2, RefreshCw, Plus, Scale, Search, X } from "lucide-react";

interface UnitConversion {
  unit: string;
  conversionFactor: number;
  sellPrice: number;
  costPrice?: number;
}

interface Product {
  _id?: string;
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

interface Category {
  _id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  parentId?: string;
}

interface Supplier {
  _id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  products?: string;
  totalOrders?: number;
  totalSpent?: number;
  creditBalance?: number;
  rating?: number;
  status: "Active" | "Inactive";
}

interface UnitDefinition {
  _id: string;
  name: string;
  abbreviation: string;
  description?: string;
  isActive: boolean;
}

interface AddProductModalProps {
  onClose: () => void;
  onSave: (p: Omit<Product, "id" | "status">) => void;
  product?: Product;
}

export function AddProductModal({ onClose, onSave, product }: AddProductModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<UnitDefinition[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [unitSearchQuery, setUnitSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unitDropdownRef = useRef<HTMLDivElement>(null);
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
    category: "",
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
  const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null);
  const [editUnitForm, setEditUnitForm] = useState<{
    unit: string;
    conversionFactor: string;
    sellPrice: string;
    costPrice: string;
  }>({
    unit: "",
    conversionFactor: "",
    sellPrice: "",
    costPrice: "",
  });

  // New supplier form state
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    products: "",
    rating: 0,
    status: "Active" as "Active" | "Inactive",
  });
   const [supplierErrors, setSupplierErrors] = useState<Record<string, string>>({});
   const [isAddingSupplier, setIsAddingSupplier] = useState(false);

   // New unit form state
   const [newUnit, setNewUnit] = useState({
     name: "",
     abbreviation: "",
     description: "",
   });
   const [unitErrors, setUnitErrors] = useState<Record<string, string>>({});
   const [isAddingUnit, setIsAddingUnit] = useState(false);

  // Set initial form values when product is provided (edit mode)
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        category: product.category,
        baseUnit: product.baseUnit,
        stockQuantity: product.stockQuantity,
        reorderLevel: product.reorderLevel,
        costPrice: product.costPrice,
        sellPrice: product.sellPrice,
        supplier: product.supplier,
        alternateUnits: product.alternateUnits || [],
        newCategory: "",
        newUnitName: "",
        newUnitFactor: "",
        newUnitSellPrice: "",
        newUnitCostPrice: "",
      });
    }
  }, [product]);

   // Fetch categories from database
   useEffect(() => {
     const fetchCategories = async () => {
       try {
         const res = await fetch("/api/categories");
         if (res.ok) {
           const data = await res.json();
           setCategories(data);
         }
       } catch (error) {
         console.error("Failed to fetch categories:", error);
       } finally {
         setLoadingCategories(false);
       }
     };
     fetchCategories();
   }, []);

   // Fetch suppliers from database
   useEffect(() => {
     const fetchSuppliers = async () => {
       try {
         const res = await fetch("/api/suppliers?status=Active");
         if (res.ok) {
           const data = await res.json();
           setSuppliers(data);
         }
       } catch (error) {
         console.error("Failed to fetch suppliers:", error);
       } finally {
         setLoadingSuppliers(false);
       }
     };
     fetchSuppliers();
   }, []);

   // Fetch units from database
   useEffect(() => {
     const fetchUnits = async () => {
       try {
         const res = await fetch("/api/units?activeOnly=true");
         if (res.ok) {
           const data = await res.json();
           setUnits(data);
         }
       } catch (error) {
         console.error("Failed to fetch units:", error);
       } finally {
         setLoadingUnits(false);
       }
     };
     fetchUnits();
   }, []);

   // Close dropdown when clicking outside
   useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
         setShowDropdown(false);
       }
       if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
         setShowUnitDropdown(false);
       }
     };

     if (showDropdown || showUnitDropdown) {
       document.addEventListener("mousedown", handleClickOutside);
     }

     return () => {
       document.removeEventListener("mousedown", handleClickOutside);
     };
   }, [showDropdown, showUnitDropdown]);

  // Set default category when categories load (only for add mode)
  useEffect(() => {
    if (categories.length > 0 && !product) {
      setForm((prev) => ({
        ...prev,
        category: prev.category || categories[0].name,
      }));
    }
  }, [categories, product]);

   const sections = [
     { id: 0, title: "Basic Info", fields: ["name", "category"] },
     { id: 1, title: "Inventory", fields: ["baseUnit", "stockQuantity", "reorderLevel"] },
     { id: 2, title: "Pricing", fields: ["costPrice", "sellPrice"] },
     { id: 3, title: "Units", fields: ["alternateUnits"] },
     { id: 4, title: "Supplier", fields: ["supplier"] },
   ];

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

  const startEditUnit = (index: number) => {
    const unit = form.alternateUnits[index];
    if (!unit) {
      console.error("[startEditUnit] No unit found at index", index, "alternateUnits length:", form.alternateUnits.length);
      return;
    }
    setEditUnitForm({
      unit: unit.unit,
      conversionFactor: unit.conversionFactor?.toString() ?? "",
      sellPrice: unit.sellPrice != null ? String(unit.sellPrice) : "",
      costPrice: unit.costPrice != null ? String(unit.costPrice) : "",
    });
    setEditingUnitIndex(index);
  };

  const saveEditUnit = () => {
    if (!editUnitForm.unit.trim() || !editUnitForm.conversionFactor || parseFloat(editUnitForm.conversionFactor) <= 0) {
      setErrors({ ...errors, editUnit: "Invalid unit data" });
      return;
    }
    const updatedUnits = [...form.alternateUnits];
    updatedUnits[editingUnitIndex!] = {
      unit: editUnitForm.unit.trim(),
      conversionFactor: parseFloat(editUnitForm.conversionFactor),
      sellPrice: parseFloat(editUnitForm.sellPrice) || 0,
      costPrice: editUnitForm.costPrice ? parseFloat(editUnitForm.costPrice) : undefined,
    };
    // Check for duplicate unit names (excluding current)
    const duplicates = updatedUnits.filter((u, i) => i !== editingUnitIndex && u.unit.toLowerCase() === editUnitForm.unit.toLowerCase());
    if (duplicates.length > 0) {
      setErrors({ ...errors, editUnit: "Unit name already exists" });
      return;
    }
    setForm({ ...form, alternateUnits: updatedUnits });
    setEditingUnitIndex(null);
    setEditUnitForm({ unit: "", conversionFactor: "", sellPrice: "", costPrice: "" });
  };

  const cancelEditUnit = () => {
    setEditingUnitIndex(null);
    setEditUnitForm({ unit: "", conversionFactor: "", sellPrice: "", costPrice: "" });
  };

  const removeAlternateUnit = (index: number) => {
    setForm({
      ...form,
      alternateUnits: form.alternateUnits.filter((_, i) => i !== index),
    });
  };

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(supplierSearchQuery.toLowerCase())
  );

  // Handle adding a new supplier
  const handleAddSupplier = async () => {
    const newErrors: Record<string, string> = {};

    if (!newSupplier.name.trim()) {
      newErrors.name = "Supplier name is required";
    }
    if (!newSupplier.contactPerson.trim()) {
      newErrors.contactPerson = "Contact person is required";
    }
    if (!newSupplier.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!newSupplier.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSupplier.email)) {
      newErrors.email = "Invalid email format";
    }

    if (Object.keys(newErrors).length > 0) {
      setSupplierErrors(newErrors);
      return;
    }

    setIsAddingSupplier(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSupplier),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create supplier");
      }

      const createdSupplier = await res.json();
      setSuppliers([...suppliers, createdSupplier]);
      setForm({ ...form, supplier: createdSupplier.name });
      setShowSupplierModal(false);
      setNewSupplier({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        products: "",
        rating: 0,
        status: "Active",
      });
      setSupplierErrors({});
    } catch (error: any) {
      console.error("Failed to add supplier:", error);
      alert(error.message);
    } finally {
      setIsAddingSupplier(false);
    }
  };

   const selectSupplier = (supplierName: string) => {
     setForm({ ...form, supplier: supplierName });
     setShowDropdown(false);
     setSupplierSearchQuery("");
   };

   // Filter units based on search query
   const filteredUnits = units.filter((unit) =>
     unit.name.toLowerCase().includes(unitSearchQuery.toLowerCase()) ||
     unit.abbreviation.toLowerCase().includes(unitSearchQuery.toLowerCase())
   );

   // Handle adding a new unit
   const handleAddUnit = async () => {
     const newErrors: Record<string, string> = {};

     if (!newUnit.name.trim()) {
       newErrors.name = "Unit name is required";
     }
     if (!newUnit.abbreviation.trim()) {
       newErrors.abbreviation = "Abbreviation is required";
     }

     if (Object.keys(newErrors).length > 0) {
       setUnitErrors(newErrors);
       return;
     }

     setIsAddingUnit(true);
     try {
       const res = await fetch("/api/units", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(newUnit),
       });

       if (!res.ok) {
         const err = await res.json();
         throw new Error(err.error || "Failed to create unit");
       }

       const createdUnit = await res.json();
       setUnits([...units, createdUnit]);
       setForm({ ...form, baseUnit: createdUnit.name });
       setShowUnitModal(false);
       setNewUnit({ name: "", abbreviation: "", description: "" });
       setUnitErrors({});
     } catch (error: any) {
       console.error("Failed to add unit:", error);
       alert(error.message);
     } finally {
       setIsAddingUnit(false);
     }
   };

   const selectUnit = (unitName: string) => {
     setForm({ ...form, baseUnit: unitName });
     setShowUnitDropdown(false);
     setUnitSearchQuery("");
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
               disabled={loadingCategories}
             >
               {categories.map((c) => (
                 <option key={c._id} value={c.name}>{c.name}</option>
               ))}
             </select>
             {loadingCategories && (
               <p className="mt-1 text-xs text-gray-400">Loading categories...</p>
             )}
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
                 onClick={async () => {
                   if (!form.newCategory.trim()) return;
                   try {
                     const res = await fetch("/api/categories", {
                       method: "POST",
                       headers: { "Content-Type": "application/json" },
                       body: JSON.stringify({ name: form.newCategory.trim() }),
                     });
                     if (res.ok) {
                       const newCat = await res.json();
                       setCategories([...categories, newCat]);
                       setForm({ ...form, category: form.newCategory.trim(), newCategory: "" });
                     }
                   } catch (error) {
                     console.error("Failed to add category:", error);
                   }
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
             <div className="relative" ref={unitDropdownRef}>
               <div className="flex gap-2">
                 <div className="flex-1 relative">
                   {/* Main select button */}
                   <div
                     onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                     className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center justify-between"
                   >
                     <span className={form.baseUnit ? "text-white" : "text-gray-400"}>
                       {form.baseUnit || "Select a unit..."}
                     </span>
                     <Search className="w-4 h-4 text-gray-400" />
                   </div>

                   {/* Dropdown */}
                   {showUnitDropdown && (
                     <div className="absolute z-50 w-full mt-2 bg-neutral-700 border border-neutral-600 rounded-lg shadow-xl max-h-80 overflow-hidden flex flex-col">
                       {/* Search input */}
                       <div className="p-3 border-b border-neutral-600">
                         <input
                           type="text"
                           value={unitSearchQuery}
                           onChange={(e) => setUnitSearchQuery(e.target.value)}
                           onClick={(e) => e.stopPropagation()}
                           placeholder="Search units..."
                           className="w-full bg-neutral-800 text-white px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:border-blue-500 text-sm"
                         />
                       </div>

                       {/* Results list */}
                       <div className="overflow-y-auto max-h-56">
                         {loadingUnits ? (
                           <div className="p-4 text-center text-gray-400">Loading units...</div>
                         ) : filteredUnits.length === 0 ? (
                           <div className="p-4 text-center text-gray-400">
                             {unitSearchQuery ? "No matching units" : "No units found"}
                           </div>
                         ) : (
                           filteredUnits.map((unit) => (
                             <div
                               key={unit._id}
                               onClick={() => selectUnit(unit.name)}
                               className={`px-4 py-3 cursor-pointer transition-colors border-b border-neutral-600/50 last:border-b-0 ${
                                 form.baseUnit === unit.name
                                   ? "bg-blue-500 text-white"
                                   : "hover:bg-neutral-600 text-white"
                               }`}
                             >
                               <div className="font-medium text-sm">{unit.name}</div>
                               <div className="text-xs text-gray-300 mt-0.5">
                                 {unit.abbreviation}
                                 {unit.description && ` • ${unit.description}`}
                               </div>
                             </div>
                           ))
                         )}
                       </div>

                       {/* Quick-add footer when no results */}
                       {unitSearchQuery && filteredUnits.length === 0 && (
                         <div className="p-3 border-t border-neutral-600 bg-neutral-700/50">
                           <button
                             type="button"
                             onClick={() => {
                               setNewUnit({
                                 name: unitSearchQuery,
                                 abbreviation: "",
                                 description: "",
                               });
                               setShowUnitModal(true);
                             }}
                             className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                           >
                             <Plus className="w-4 h-4" />
                             Create new unit
                           </button>
                         </div>
                       )}
                     </div>
                   )}
                 </div>

                 {/* Add New Unit button */}
                 <button
                   type="button"
                   onClick={() => setShowUnitModal(true)}
                   className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                 >
                   <Plus className="w-4 h-4" />
                   Add New
                 </button>
               </div>

               {/* Clear button when unit selected */}
               {form.baseUnit && (
                 <button
                   type="button"
                   onClick={() => setForm({ ...form, baseUnit: "" })}
                   className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                 >
                   <X className="w-4 h-4" />
                 </button>
               )}
             </div>
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
             <p className="text-xs text-gray-400 mb-4">Define alternate units (e.g. case, pack) with conversion ratios and pricing</p>
             {form.alternateUnits.length > 0 && (
               <div className="space-y-2 mb-4">
                 {form.alternateUnits.map((unit, index) => (
                   editingUnitIndex === index ? (
                     // Edit Mode
                     <div key={index} className="p-4 bg-neutral-700/70 border border-blue-500 rounded-lg space-y-3">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div>
                           <label className="text-xs text-gray-400 mb-1 block">Unit Name</label>
                           <input
                             type="text"
                             value={editUnitForm.unit}
                             onChange={(e) => setEditUnitForm({ ...editUnitForm, unit: e.target.value })}
                             className="w-full bg-neutral-800 text-white px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:border-blue-500"
                           />
                         </div>
                         <div>
                           <label className="text-xs text-gray-400 mb-1 block">Conversion Factor (1 unit = X {form.baseUnit}s)</label>
                           <input
                             type="number"
                             step="0.01"
                             min="0.01"
                             value={editUnitForm.conversionFactor}
                             onChange={(e) => setEditUnitForm({ ...editUnitForm, conversionFactor: e.target.value })}
                             className="w-full bg-neutral-800 text-white px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:border-blue-500"
                           />
                         </div>
                         <div>
                           <label className="text-xs text-gray-400 mb-1 block">Sell Price (KES)</label>
                           <input
                             type="number"
                             step="0.01"
                             min="0"
                             value={editUnitForm.sellPrice}
                             onChange={(e) => setEditUnitForm({ ...editUnitForm, sellPrice: e.target.value })}
                             className="w-full bg-neutral-800 text-white px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:border-blue-500"
                           />
                         </div>
                         <div>
                           <label className="text-xs text-gray-400 mb-1 block">Cost Price (KES, optional)</label>
                           <input
                             type="number"
                             step="0.01"
                             min="0"
                             value={editUnitForm.costPrice}
                             onChange={(e) => setEditUnitForm({ ...editUnitForm, costPrice: e.target.value })}
                             className="w-full bg-neutral-800 text-white px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:border-blue-500"
                           />
                         </div>
                       </div>
                       {errors.editUnit && <p className="mt-1 text-xs text-red-400">{errors.editUnit}</p>}
                       <div className="flex gap-2">
                         <button
                           type="button"
                           onClick={saveEditUnit}
                           className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors"
                         >
                           Save
                         </button>
                         <button
                           type="button"
                           onClick={cancelEditUnit}
                           className="px-3 py-1.5 bg-neutral-600 hover:bg-neutral-700 text-white text-sm rounded-lg font-medium transition-colors"
                         >
                           Cancel
                         </button>
                       </div>
                     </div>
                   ) : (
                     // View Mode
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
                       <div className="flex items-center gap-2">
                         <button
                           type="button"
                           onClick={() => startEditUnit(index)}
                           className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-neutral-600 rounded text-sm font-medium transition-colors"
                         >
                           Edit
                         </button>
                         <button
                           type="button"
                           onClick={() => removeAlternateUnit(index)}
                           className="p-2 text-red-400 hover:text-red-300 hover:bg-neutral-600 rounded disabled:opacity-50"
                         >
                           ×
                         </button>
                       </div>
                     </div>
                   )
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
              <div className="relative" ref={dropdownRef}>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    {/* Main select button */}
                    <div
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center justify-between"
                    >
                      <span className={form.supplier ? "text-white" : "text-gray-400"}>
                        {form.supplier || "Select a supplier..."}
                      </span>
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>

                    {/* Dropdown */}
                    {showDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-neutral-700 border border-neutral-600 rounded-lg shadow-xl max-h-80 overflow-hidden flex flex-col">
                        {/* Search input */}
                        <div className="p-3 border-b border-neutral-600">
                          <input
                            type="text"
                            value={supplierSearchQuery}
                            onChange={(e) => setSupplierSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Search suppliers..."
                            className="w-full bg-neutral-800 text-white px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:border-blue-500 text-sm"
                          />
                        </div>

                        {/* Results list */}
                        <div className="overflow-y-auto max-h-56">
                          {loadingSuppliers ? (
                            <div className="p-4 text-center text-gray-400">Loading suppliers...</div>
                          ) : filteredSuppliers.length === 0 ? (
                            <div className="p-4 text-center text-gray-400">
                              {supplierSearchQuery ? "No matching suppliers" : "No suppliers found"}
                            </div>
                          ) : (
                            filteredSuppliers.map((supplier) => (
                              <div
                                key={supplier._id}
                                onClick={() => selectSupplier(supplier.name)}
                                className={`px-4 py-3 cursor-pointer transition-colors border-b border-neutral-600/50 last:border-b-0 ${
                                  form.supplier === supplier.name
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-neutral-600 text-white"
                                }`}
                              >
                                <div className="font-medium text-sm">{supplier.name}</div>
                                <div className="text-xs text-gray-300 mt-0.5">
                                  {supplier.contactPerson} • {supplier.phone}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Quick-add footer when no results */}
                        {supplierSearchQuery && filteredSuppliers.length === 0 && (
                          <div className="p-3 border-t border-neutral-600 bg-neutral-700/50">
                            <button
                              type="button"
                              onClick={() => {
                                setNewSupplier({
                                  name: supplierSearchQuery,
                                  contactPerson: "",
                                  phone: "",
                                  email: "",
                                  products: "",
                                  rating: 0,
                                  status: "Active",
                                });
                                setShowSupplierModal(true);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Create new supplier
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add New Supplier button */}
                  <button
                    type="button"
                    onClick={() => setShowSupplierModal(true)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New
                  </button>
                </div>

                {/* Clear button when supplier selected */}
                {form.supplier && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, supplier: "" })}
                    className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
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

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-2xl border border-neutral-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-700">
              <h2 className="text-xl font-bold text-white">Add New Supplier</h2>
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
                  placeholder="e.g., East African Breweries Limited"
                />
                {supplierErrors.name && (
                  <p className="mt-1 text-xs text-red-400">{supplierErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                  className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
                  placeholder="e.g., John Doe"
                />
                {supplierErrors.contactPerson && (
                  <p className="mt-1 text-xs text-red-400">{supplierErrors.contactPerson}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
                  placeholder="+254 700 000 000"
                />
                {supplierErrors.phone && (
                  <p className="mt-1 text-xs text-red-400">{supplierErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
                  placeholder="supplier@example.com"
                />
                {supplierErrors.email && (
                  <p className="mt-1 text-xs text-red-400">{supplierErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Products
                </label>
                <input
                  type="text"
                  value={newSupplier.products}
                  onChange={(e) => setNewSupplier({ ...newSupplier, products: e.target.value })}
                  className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
                  placeholder="Beer, spirits, wines, soft drinks"
                />
                <p className="mt-1 text-xs text-gray-400">Comma-separated list of products supplied</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rating (0-5)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="1"
                  value={newSupplier.rating}
                  onChange={(e) => setNewSupplier({ ...newSupplier, rating: parseInt(e.target.value) || 0 })}
                  className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={newSupplier.status}
                  onChange={(e) => setNewSupplier({ ...newSupplier, status: e.target.value as "Active" | "Inactive" })}
                  className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-700">
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="px-4 py-2.5 border border-neutral-600 text-gray-300 rounded-lg hover:bg-neutral-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSupplier}
                disabled={isAddingSupplier}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isAddingSupplier ? "Adding..." : "Add Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-2xl border border-neutral-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-700">
              <h2 className="text-xl font-bold text-white">Add New Unit</h2>
              <button
                type="button"
                onClick={() => setShowUnitModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Unit Name *
                </label>
                <input
                  type="text"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                  className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
                  placeholder="e.g., BOTTLE, CASE, LITER"
                />
                <p className="mt-1 text-xs text-gray-400">Use uppercase for consistency</p>
                {unitErrors.name && (
                  <p className="mt-1 text-xs text-red-400">{unitErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Abbreviation *
                </label>
                <input
                  type="text"
                  value={newUnit.abbreviation}
                  onChange={(e) => setNewUnit({ ...newUnit, abbreviation: e.target.value })}
                  className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
                  placeholder="e.g., BT, CS, L"
                />
                {unitErrors.abbreviation && (
                  <p className="mt-1 text-xs text-red-400">{unitErrors.abbreviation}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newUnit.description}
                  onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                  className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
                  placeholder="e.g., Standard 750ml bottle"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-700">
              <button
                type="button"
                onClick={() => setShowUnitModal(false)}
                className="px-4 py-2.5 border border-neutral-600 text-gray-300 rounded-lg hover:bg-neutral-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddUnit}
                disabled={isAddingUnit}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isAddingUnit ? "Adding..." : "Add Unit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
