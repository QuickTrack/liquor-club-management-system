"use client";

import { useState } from "react";
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
} from "lucide-react";

interface Staff {
  id: number;
  name: string;
  role: "Admin" | "Manager" | "Cashier" | "Bartender" | "Waiter";
  phone: string;
  email: string;
  shift: "Morning" | "Evening" | "Night";
  hireDate: string;
  sales: number;
  commission: number;
  status: "Active" | "Inactive";
}

const staff: Staff[] = [
  { id: 1, name: "James Wilson", role: "Admin", phone: "+254 700 111 111", email: "james@club.com", shift: "Morning", hireDate: "2023-01-15", sales: 0, commission: 0, status: "Active" },
  { id: 2, name: "Mary Okonkwo", role: "Manager", phone: "+254 700 222 222", email: "mary@club.com", shift: "Evening", hireDate: "2023-03-20", sales: 0, commission: 0, status: "Active" },
  { id: 3, name: "David Kiprop", role: "Cashier", phone: "+254 700 333 333", email: "david@club.com", shift: "Evening", hireDate: "2023-06-10", sales: 156000, commission: 15600, status: "Active" },
  { id: 4, name: "Faith Kemunto", role: "Bartender", phone: "+254 700 444 444", email: "faith@club.com", shift: "Evening", hireDate: "2023-08-05", sales: 98000, commission: 9800, status: "Active" },
  { id: 5, name: "Paul Ochieng", role: "Bartender", phone: "+254 700 555 555", email: "paul@club.com", shift: "Night", hireDate: "2023-09-12", sales: 124000, commission: 12400, status: "Active" },
  { id: 6, name: "Grace Akinyi", role: "Waiter", phone: "+254 700 666 666", email: "grace@club.com", shift: "Evening", hireDate: "2024-01-08", sales: 45000, commission: 4500, status: "Active" },
];

const roles = ["Admin", "Manager", "Cashier", "Bartender", "Waiter"];
const shifts = ["Morning", "Evening", "Night"];

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | "All">("All");

  const filteredStaff = staff.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "All" || s.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const totalStaff = staff.length;
  const activeStaff = staff.filter((s) => s.status === "Active").length;
  const totalSales = staff.reduce((sum, s) => sum + s.sales, 0);
  const totalCommission = staff.reduce((sum, s) => sum + s.commission, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Staff Management</h1>
          <p className="text-gray-400">User roles, shifts & activity tracking</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
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
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-neutral-700/50 p-3 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Morning (6AM - 2PM)</p>
            <div className="space-y-1">
              <p className="text-white text-sm">James Wilson</p>
            </div>
          </div>
          <div className="bg-neutral-700/50 p-3 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Evening (2PM - 10PM)</p>
            <div className="space-y-1">
              <p className="text-white text-sm">Mary Okonkwo</p>
              <p className="text-white text-sm">David Kiprop</p>
              <p className="text-white text-sm">Faith Kemunto</p>
              <p className="text-white text-sm">Grace Akinyi</p>
            </div>
          </div>
          <div className="bg-neutral-700/50 p-3 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Night (10PM - 6AM)</p>
            <div className="space-y-1">
              <p className="text-white text-sm">Paul Ochieng</p>
            </div>
          </div>
        </div>
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
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((member) => (
              <tr key={member.id} className="border-b border-neutral-700/50 hover:bg-neutral-700/30">
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
                <td className="px-4 py-3 text-white">
                  Ksh {member.sales.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-green-500">
                  Ksh {member.commission.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-gray-300">{member.hireDate}</td>
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
                  <div className="flex gap-2">
                    <button className="text-gray-400 hover:text-amber-500">
                      <Edit className="w-4 h-4" />
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
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
    </div>
  );
}