"use client";

import { useState } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  FileText,
  Scale,
  Building2,
  Clock,
  RefreshCw,
} from "lucide-react";

interface License {
  id: number;
  name: string;
  type: string;
  issueDate: string;
  expiryDate: string;
  status: "Valid" | "Expiring Soon" | "Expired";
}

const licenses: License[] = [
  { id: 1, name: "Liquor License", type: "Alcohol", issueDate: "2024-01-01", expiryDate: "2025-01-01", status: "Valid" },
  { id: 2, name: "Health Permit", type: "Health", issueDate: "2024-01-15", expiryDate: "2025-01-15", status: "Valid" },
  { id: 3, name: "Food Handler Permit", type: "Health", issueDate: "2024-03-01", expiryDate: "2024-09-01", status: "Expiring Soon" },
  { id: 4, name: "Music License", type: "Copyright", issueDate: "2024-01-01", expiryDate: "2025-01-01", status: "Valid" },
  { id: 5, name: "Outdoor Advertising", type: "Local Authority", issueDate: "2024-02-01", expiryDate: "2024-08-01", status: "Expired" },
];

interface AuditLog {
  id: number;
  action: string;
  user: string;
  date: string;
  details: string;
}

const auditLogs: AuditLog[] = [
  { id: 1, action: "Stock Adjustment", user: "James Wilson", date: "2024-07-15 14:30", details: "Adjusted Jack Daniel's stock +2 bottles" },
  { id: 2, action: "Discount Approved", user: "Mary Okonkwo", date: "2024-07-15 13:15", details: "15% discount for VIP customer" },
  { id: 3, action: "Void Order", user: "David Kiprop", date: "2024-07-15 12:45", details: "Voided order ORD-089 - customer left" },
  { id: 4, action: "Credit Sale", user: "Faith Kemunto", date: "2024-07-15 11:20", details: "Credit sale Ksh 5,000 to Jane Smith" },
  { id: 5, action: "Cash Drop", user: "James Wilson", date: "2024-07-15 10:00", details: "Safe drop Ksh 50,000" },
];

interface ExciseEntry {
  id: number;
  product: string;
  volume: number;
  exciseDuty: number;
  date: string;
}

const exciseDuties: ExciseEntry[] = [
  { id: 1, product: "Whiskey 750ml", volume: 24, exciseDuty: 48000, date: "2024-07-15" },
  { id: 2, product: "Vodka 750ml", volume: 18, exciseDuty: 27000, date: "2024-07-15" },
  { id: 3, product: "Beer Draft", volume: 50, exciseDuty: 25000, date: "2024-07-15" },
];

export default function CompliancePage() {
  const validLicenses = licenses.filter((l) => l.status === "Valid").length;
  const expiringLicenses = licenses.filter((l) => l.status === "Expiring Soon").length;
  const expiredLicenses = licenses.filter((l) => l.status === "Expired").length;
  const totalExcise = exciseDuties.reduce((sum, e) => sum + e.exciseDuty, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Compliance & Regulatory</h1>
          <p className="text-gray-400">Licenses, audit trails & excise duties</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <RefreshCw className="w-5 h-5" />
          Sync with KRA
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-white">{validLicenses}</p>
          <p className="text-gray-400 text-sm">Valid Licenses</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-yellow-500">{expiringLicenses}</p>
          <p className="text-gray-400 text-sm">Expiring Soon</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <Scale className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-2xl font-bold text-red-500">{expiredLicenses}</p>
          <p className="text-gray-400 text-sm">Expired</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-white">Ksh {(totalExcise / 1000).toFixed(0)}K</p>
          <p className="text-gray-400 text-sm">Today&apos;s Excise</p>
        </div>
      </div>

      {/* Licensing Overview */}
      <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Licenses & Permits</h3>
          <button className="text-amber-500 text-sm hover:underline">Renew All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {licenses.map((license) => (
            <div
              key={license.id}
              className={`p-3 rounded-lg border ${
                license.status === "Valid"
                  ? "bg-green-500/10 border-green-500/30"
                  : license.status === "Expiring Soon"
                  ? "bg-blue-500/10 border-yellow-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-medium text-sm">{license.name}</p>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    license.status === "Valid"
                      ? "bg-green-500/20 text-green-500"
                      : license.status === "Expiring Soon"
                      ? "bg-blue-500/20 text-yellow-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {license.status}
                </span>
              </div>
              <p className="text-gray-400 text-xs">{license.type}</p>
              <p className="text-gray-400 text-xs">
                Expires: {license.expiryDate}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Excise Duty Tracking */}
      <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Excise Duty Tracking</h3>
          <button className="text-amber-500 text-sm hover:underline">Generate Report</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left text-gray-400 px-4 py-2 text-sm font-medium">Product</th>
                <th className="text-left text-gray-400 px-4 py-2 text-sm font-medium">Volume</th>
                <th className="text-left text-gray-400 px-4 py-2 text-sm font-medium">Excise Duty</th>
                <th className="text-left text-gray-400 px-4 py-2 text-sm font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {exciseDuties.map((entry) => (
                <tr key={entry.id} className="border-b border-neutral-700/50">
                  <td className="px-4 py-2 text-white">{entry.product}</td>
                  <td className="px-4 py-2 text-gray-300">{entry.volume}</td>
                  <td className="px-4 py-2 text-yellow-500">Ksh {entry.exciseDuty.toLocaleString()}</td>
                  <td className="px-4 py-2 text-gray-300">{entry.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
        <h3 className="text-white font-medium mb-4">Activity Audit Trail</h3>
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between p-3 bg-neutral-700/30 rounded-lg"
            >
              <div>
                <p className="text-white font-medium">{log.action}</p>
                <p className="text-gray-400 text-sm">{log.details}</p>
                <p className="text-gray-500 text-xs">By: {log.user}</p>
              </div>
              <p className="text-gray-400 text-sm">{log.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}