"use client";

import { useState, useEffect, useRef } from "react";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  X,
  Save,
  Palette,
  Hash,
  FolderTree,
  Check,
  Smile,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import type { ICategory } from "@/lib/db/models";

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

const defaultForm: CategoryFormData = {
  name: "",
  description: "",
  color: "#64748b",
  icon: "",
  sortOrder: 0,
  isActive: true,
};

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#64748b", "#71717a", "#78716c",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [form, setForm] = useState<CategoryFormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories?active=true");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setEditingCategory(null);
    setForm(defaultForm);
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (category: ICategory) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description || "",
      color: category.color,
      icon: category.icon || "",
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive,
    });
    setErrors({});
    setShowModal(true);
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setForm(defaultForm);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Category name is required";
    if (form.sortOrder < 0) newErrors.sortOrder = "Sort order must be 0 or greater";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = { ...form };

      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update category");
        }
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create category");
        }
      }

      closeModal();
      fetchCategories();
    } catch (error: any) {
      console.error("Submit error:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category: ICategory) => {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/categories/${category._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete category");
      }
      fetchCategories();
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(error.message);
    }
    setOpenMenuId(null);
  };

   const toggleActive = async (category: ICategory) => {
     try {
       const res = await fetch(`/api/categories/${category._id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ isActive: !category.isActive }),
       });
       if (!res.ok) {
         const err = await res.json();
         throw new Error(err.error || "Failed to update category");
       }
       fetchCategories();
     } catch (error: any) {
       console.error("Toggle error:", error);
       alert(error.message);
     }
     setOpenMenuId(null);
   };

   // Close emoji picker when clicking outside
   useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
       if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
         setShowEmojiPicker(false);
       }
     };

     if (showEmojiPicker) {
       document.addEventListener("mousedown", handleClickOutside);
     }

     return () => {
       document.removeEventListener("mousedown", handleClickOutside);
     };
   }, [showEmojiPicker]);

  const getContrastColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Categories</h1>
          <p className="text-neutral-500 mt-1">
            Manage product categories and organization
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100">
              <FolderTree className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{categories.length}</p>
              <p className="text-sm text-neutral-500">Total Categories</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {categories.filter((c) => c.isActive).length}
              </p>
              <p className="text-sm text-neutral-500">Active Categories</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100">
              <Hash className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {categories.reduce((sum, c) => sum + (c.sortOrder || 0), 0)}
              </p>
              <p className="text-sm text-neutral-500">Total Sort Order</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all bg-white"
        />
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-neutral-500">Loading categories...</div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
          <FolderTree className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No categories found</p>
          <button
            onClick={openAddModal}
            className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Create your first category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category._id.toString()}
              className="group relative bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md hover:border-emerald-200 transition-all duration-200"
            >
              {/* Color accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                style={{ backgroundColor: category.color }}
              />

              {/* Header with icon and title */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 shadow-sm"
                  style={{
                    backgroundColor: `${category.color}20`,
                    borderColor: `${category.color}40`,
                    color: category.color,
                  }}
                >
                  {category.icon || "📁"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-neutral-900 truncate">
                    {category.name}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                    {category.description || "No description"}
                  </p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === category._id.toString() ? null : category._id.toString())}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-neutral-400" />
                  </button>
                  {openMenuId === category._id.toString() && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10">
                      <button
                        onClick={() => openEditModal(category)}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(category)}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                          category.isActive
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {category.isActive ? (
                          <>
                            <X className="w-4 h-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Activate
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-3 text-xs">
                <span
                  className="px-2 py-1 rounded-md font-medium"
                  style={{
                    backgroundColor: `${category.color}15`,
                    color: category.color,
                  }}
                >
                  Sort: {category.sortOrder || 0}
                </span>
                <span
                  className={`px-2 py-1 rounded-md ${
                    category.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {category.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-bold text-neutral-900">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white"
                  placeholder="e.g., Whiskey, Vodka, Gin"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white resize-none"
                  placeholder="Brief description of the category"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Color <Palette className="w-4 h-4 inline ml-1" />
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-12 h-10 rounded-lg border border-neutral-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white font-mono text-sm"
                    placeholder="#64748b"
                  />
                </div>
                <p className="mt-2 text-xs text-neutral-500">Preset colors:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setForm({ ...form, color: preset })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        form.color === preset ? "border-neutral-900" : "border-transparent"
                      }`}
                      style={{ backgroundColor: preset }}
                    />
                  ))}
                </div>
              </div>

               {/* Icon & Sort Order */}
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-neutral-700 mb-2">
                     Icon (emoji)
                   </label>
                   <div className="relative" ref={emojiPickerRef}>
                     <input
                       type="text"
                       value={form.icon}
                       onChange={(e) => setForm({ ...form, icon: e.target.value })}
                       className="w-full px-4 py-2.5 pr-12 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white"
                       placeholder="🥃"
                     />
                     <button
                       type="button"
                       onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                       className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                     >
                       <Smile className="w-5 h-5 text-neutral-500" />
                     </button>
                     {showEmojiPicker && (
                       <div className="absolute z-50 mt-2">
                         <EmojiPicker
                           onEmojiClick={(emojiData) => {
                             setForm({ ...form, icon: emojiData.emoji });
                             setShowEmojiPicker(false);
                           }}
                           theme={"light" as any}
                           width="100%"
                           height={350}
                           searchPlaceHolder="Search emoji..."
                           previewConfig={{ showPreview: false }}
                         />
                       </div>
                     )}
                   </div>
                 </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <div>
                  <p className="font-medium text-neutral-900">Active</p>
                  <p className="text-sm text-neutral-500">Show in product forms</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    form.isActive ? "bg-emerald-600" : "bg-neutral-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      form.isActive ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
