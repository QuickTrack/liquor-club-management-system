"use client";

import { useState, useEffect } from "react";
import {
  UserCog,
  Search,
  Plus,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  Shield,
  Fingerprint,
  Calendar,
  X,
  Save,
  Lock,
} from "lucide-react";

interface Staff {
  _id?: string;
  id?: number;
  name: string;
  role: "Admin" | "Manager" | "Cashier" | "Bartender" | "Waiter";
  phone: string;
  email: string;
  shift: "Morning" | "Evening" | "Night";
  hireDate: string;
  totalSales: number;
  commission: number;
  pin?: string | null;
  status: "Active" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
}

interface StaffFormData {
  name: string;
  role: string;
  phone: string;
  email: string;
  shift: string;
  hireDate: string;
  pin?: string;
  status: string;
}

const initialFormData: StaffFormData = {
  name: "",
  role: "Cashier",
  phone: "",
  email: "",
  shift: "Evening",
  hireDate: "",
  pin: "",
  status: "Active",
};

const roles = ["Admin", "Manager", "Cashier", "Bartender", "Waiter"];
const shifts = ["Morning", "Evening", "Night"];

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | "All">("All");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<StaffFormData>(initialFormData);
  const [pinValue, setPinValue] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch staff from API
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff");
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      } else {
        console.error("Failed to fetch staff");
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "All" || s.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.status === "Active").length;
  const totalSales = staffList.reduce((sum, s) => sum + s.totalSales, 0);
  const totalCommission = staffList.reduce((sum, s) => sum + s.commission, 0);

  const handleOpenModal = (staff?: Staff) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        name: staff.name,
        role: staff.role,
        phone: staff.phone,
        email: staff.email,
        shift: staff.shift,
        hireDate: staff.hireDate.split("T")[0], // Format as YYYY-MM-DD
        pin: staff.pin || "",
        status: staff.status,
      });
    } else {
      setEditingStaff(null);
      setFormData(initialFormData);
      setFormData((prev) => ({ ...prev, hireDate: new Date().toISOString().split("T")[0] }));
    }
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
    setFormData(initialFormData);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate PIN format if provided
    if (formData.pin && !/^\d{4}$/.test(formData.pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    try {
      const payload = {
        ...formData,
        hireDate: formData.hireDate,
      };

      const url = editingStaff && editingStaff._id ? `/api/staff/${editingStaff._id}` : "/api/staff";
      const method = editingStaff ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to save staff");
      }

      await fetchStaff();
      handleCloseModal();
      setSuccess(editingStaff ? "Staff updated successfully" : "Staff added successfully");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOpenPinModal = (staff: Staff) => {
    setEditingStaff(staff);
    setPinValue(staff.pin || "");
    setError("");
    setSuccess("");
    setShowPinModal(true);
  };

  const handleSavePin = async () => {
    setError("");
    setSuccess("");

    if (!/^\d{4}$/.test(pinValue)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    try {
      if (!editingStaff || !editingStaff._id) return;

      const res = await fetch(`/api/staff/${editingStaff._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinValue }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to update PIN");
      }

      await fetchStaff();
      setShowPinModal(false);
      setEditingStaff(null);
      setPinValue("");
      setSuccess("PIN updated successfully");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Staff Management</h1>
          <p className="text-gray-400">User roles, shifts & activity tracking</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <UserCog className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-white">{totalStaff}</p>
          <p className="text-gray-400 text-sm">Total Staff</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-green-500">{activeStaff}</p>
          <p className="text-gray-400 text-sm">Active</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-white">Ksh {(totalSales / 1000).toFixed(0)}K</p>
          <p className="text-gray-400 text-sm">Total Sales</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-green-500">Ksh {(totalCommission / 1000).toFixed(0)}K</p>
          <p className="text-gray-400 text-sm">Commission</p>
        </div>
      </div>

      {/* Shifts Schedule */}
      <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Today&apos;s Shift Schedule</h3>
          <button className="text-amber-500 text-sm hover:underline">Edit Schedule</button>
        </div>
        {loading ? (
          <p className="text-gray-400">Loading schedule...</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-neutral-700/50 p-3 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Morning (6AM - 2PM)</p>
              <div className="space-y-1">
                {staffList
                  .filter((s) => s.shift === "Morning" && s.status === "Active")
                  .map((s) => (
                    <p key={s._id || s.id} className="text-white text-sm">
                      {s.name}
                    </p>
                  ))}
              </div>
            </div>
            <div className="bg-neutral-700/50 p-3 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Evening (2PM - 10PM)</p>
              <div className="space-y-1">
                {staffList
                  .filter((s) => s.shift === "Evening" && s.status === "Active")
                  .map((s) => (
                    <p key={s._id || s.id} className="text-white text-sm">
                      {s.name}
                    </p>
                  ))}
              </div>
            </div>
            <div className="bg-neutral-700/50 p-3 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Night (10PM - 6AM)</p>
              <div className="space-y-1">
                {staffList
                  .filter((s) => s.shift === "Night" && s.status === "Active")
                  .map((s) => (
                    <p key={s._id || s.id} className="text-white text-sm">
                      {s.name}
                    </p>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedRole("All")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedRole === "All"
                ? "bg-blue-500 text-white"
                : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
            }`}
          >
            All
          </button>
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedRole === role
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Name</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Role</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Phone</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Shift</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Sales</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Commission</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Hire Date</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">PIN</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((member) => (
              <tr key={member._id || member.id} className="border-b border-neutral-700/50 hover:bg-neutral-700/30">
                <td className="px-4 py-3 text-white font-medium">{member.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      member.role === "Admin"
                        ? "bg-purple-500/20 text-purple-400"
                        : member.role === "Manager"
                        ? "bg-blue-500/20 text-blue-400"
                        : member.role === "Cashier"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {member.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">{member.phone}</td>
                <td className="px-4 py-3 text-gray-300">{member.shift}</td>
                <td className="px-4 py-3 text-white">Ksh {member.totalSales.toLocaleString()}</td>
                <td className="px-4 py-3 text-green-500">Ksh {member.commission.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-300">
                  {new Date(member.hireDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      member.status === "Active"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-gray-500/10 text-gray-500"
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-sm font-mono ${
                      member.pin
                        ? "text-amber-500"
                        : "text-gray-500 italic"
                    }`}
                  >
                    {member.pin ? "••••" : "Not set"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(member)}
                      className="text-gray-400 hover:text-amber-500"
                      title="Edit staff"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenPinModal(member)}
                      className="text-gray-400 hover:text-blue-500"
                      title="Manage PIN"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-500"
                      title="Delete staff"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && staffList.length === 0 && (
        <div className="text-center py-8 text-gray-400">Loading staff...</div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700"
        >
          <Fingerprint className="w-5 h-5" />
          Manage PINs
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <Calendar className="w-5 h-5" />
          Shift Schedule
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <DollarSign className="w-5 h-5" />
          Commission Settings
        </button>
      </div>

      {/* Staff Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-xl border border-neutral-700 w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingStaff ? "Edit Staff" : "Add Staff"}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-neutral-700 text-white px-3 py-2 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-neutral-700 text-white px-3 py-2 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-neutral-700 text-white px-3 py-2 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-neutral-700 text-white px-3 py-2 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full bg-neutral-700 text-white px-3 py-2 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500"
                  >
                    {shifts.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Hire Date</label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full bg-neutral-700 text-white px-3 py-2 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">PIN (4 digits)</label>
                  <input
                    type="text"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="Leave blank to clear"
                    maxLength={4}
                    className="w-full bg-neutral-700 text-white px-3 py-2 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-neutral-700 text-white px-3 py-2 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                >
                  <Save className="w-4 h-4" />
                  {editingStaff ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN Edit Modal */}
      {showPinModal && editingStaff && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-xl border border-neutral-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Manage PIN</h2>
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setEditingStaff(null);
                  setPinValue("");
                }}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Set or update the 4-digit PIN for <span className="text-white font-medium">{editingStaff.name}</span>
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
                {success}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">4-Digit PIN</label>
              <input
                type="text"
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500 font-mono text-2xl text-center tracking-widest"
              />
              <p className="text-gray-500 text-xs mt-2">
                Used for staff authentication at POS. Must be exactly 4 digits.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setEditingStaff(null);
                  setPinValue("");
                }}
                className="flex-1 py-2.5 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePin}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
              >
                <Lock className="w-4 h-4" />
                Save PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
