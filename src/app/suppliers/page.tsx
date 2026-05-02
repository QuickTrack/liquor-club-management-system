"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  X,
  Phone,
  Mail,
  Package,
  Star,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { ISupplier } from "@/lib/db/models";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(null);
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    products: "",
    rating: 0,
    status: "Active" as "Active" | "Inactive",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/suppliers");
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setEditingSupplier(null);
    setForm({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      products: "",
      rating: 0,
      status: "Active",
    });
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (supplier: ISupplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      products: supplier.products || "",
      rating: supplier.rating || 0,
      status: supplier.status,
    });
    setErrors({});
    setShowModal(true);
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setForm({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      products: "",
      rating: 0,
      status: "Active",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Supplier name is required";
    if (!form.contactPerson.trim()) newErrors.contactPerson = "Contact person is required";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier._id}` : "/api/suppliers";
      const method = editingSupplier ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${editingSupplier ? "update" : "create"} supplier`);
      }

      closeModal();
      fetchSuppliers();
    } catch (error: any) {
      console.error("Submit error:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (supplier: ISupplier) => {
    if (!confirm(`Delete "${supplier.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/suppliers/${supplier._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete supplier");
      }
      fetchSuppliers();
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(error.message);
    }
    setOpenMenuId(null);
  };

  const toggleActive = async (supplier: ISupplier) => {
    try {
      const newStatus = supplier.status === "Active" ? "Inactive" : "Active";
      const res = await fetch(`/api/suppliers/${supplier._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update supplier");
      }
      fetchSuppliers();
    } catch (error: any) {
      console.error("Toggle error:", error);
      alert(error.message);
    }
    setOpenMenuId(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Suppliers</h1>
          <p className="text-neutral-500 mt-1">
            Manage vendor and supplier information
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{suppliers.length}</p>
              <p className="text-sm text-neutral-500">Total Suppliers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {suppliers.filter((s) => s.status === "Active").length}
              </p>
              <p className="text-sm text-neutral-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100">
              <XCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {suppliers.filter((s) => s.status === "Inactive").length}
              </p>
              <p className="text-sm text-neutral-500">Inactive</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-100">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {suppliers.filter((s) => (s.rating || 0) >= 4).length}
              </p>
              <p className="text-sm text-neutral-500">Top Rated (≥4)</p>
            </div>
          </div>
        </div>
       </div>

       {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search suppliers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all bg-white"
        />
      </div>

      {/* Suppliers Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-neutral-500">Loading suppliers...</div>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
          <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">{searchQuery ? "No matching suppliers found" : "No suppliers yet"}</p>
          <button
            onClick={openAddModal}
            className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {searchQuery ? "Clear search" : "Add your first supplier"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Supplier</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Phone</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Orders</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Rating</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier._id.toString()} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-neutral-900">{supplier.name}</p>
                        {supplier.products && (
                          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                            {supplier.products}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      {supplier.contactPerson}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`tel:${supplier.phone}`}
                        className="text-neutral-600 hover:text-emerald-600 flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {supplier.phone}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`mailto:${supplier.email}`}
                        className="text-neutral-600 hover:text-emerald-600 flex items-center gap-1"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {supplier.email}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-neutral-600">
                        <Package className="w-4 h-4" />
                        {supplier.totalOrders || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className={`w-4 h-4 ${supplier.rating && supplier.rating > 0 ? "text-amber-500 fill-amber-500" : "text-neutral-300"}`} />
                        <span className="text-neutral-600">{supplier.rating || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          supplier.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === supplier._id.toString() ? null : supplier._id.toString())}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-neutral-500" />
                        </button>
                         {openMenuId === supplier._id.toString() && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10">
                            <button
                              onClick={() => openEditModal(supplier)}
                              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => toggleActive(supplier)}
                              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                                supplier.status === "Active"
                                  ? "text-amber-600 hover:bg-amber-50"
                                  : "text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              {supplier.status === "Active" ? (
                                <>
                                  <XCircle className="w-4 h-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Activate
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(supplier)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-bold text-neutral-900">
                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white"
                  placeholder="e.g., East African Breweries Limited"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white"
                  placeholder="e.g., John Doe"
                />
                {errors.contactPerson && <p className="mt-1 text-sm text-red-600">{errors.contactPerson}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white"
                  placeholder="+254 700 000 000"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white"
                  placeholder="supplier@example.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Products
                </label>
                <input
                  type="text"
                  value={form.products}
                  onChange={(e) => setForm({ ...form, products: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white"
                  placeholder="Beer, spirits, wines, soft drinks"
                />
                <p className="mt-1 text-xs text-neutral-500">Comma-separated list of products supplied</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Rating (0-5)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="1"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "Active" | "Inactive" })}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                    : editingSupplier
                    ? "Update Supplier"
                    : "Create Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
