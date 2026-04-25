"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Building2,
  DollarSign,
  Bell,
  Shield,
  Palette,
  Database,
  Globe,
  Save,
  RotateCcw,
} from "lucide-react";

const tabs = [
  { id: "general", label: "General", icon: Building2 },
  { id: "business", label: "Business", icon: DollarSign },
  { id: "tax", label: "Tax & Finance", icon: Shield },
  { id: "pos", label: "POS Settings", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "data", label: "Data & Backup", icon: Database },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">System configuration and preferences</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 bg-neutral-800 rounded-xl border border-neutral-700 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-neutral-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-neutral-800 rounded-xl border border-neutral-700 p-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">General Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Business Name</label>
                  <input
                    type="text"
                    defaultValue="Liquor Club"
                    className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Contact Email</label>
                  <input
                    type="email"
                    defaultValue="info@liquorclub.co.ke"
                    className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Phone Number</label>
                  <input
                    type="text"
                    defaultValue="+254 700 000 000"
                    className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Address</label>
                  <input
                    type="text"
                    defaultValue="Nairobi, Kenya"
                    className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "business" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Business Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Currency</label>
                  <select className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1">
                    <option>Ksh - Kenyan Shilling</option>
                    <option>USD - US Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Time Zone</label>
                  <select className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1">
                    <option>Africa/Nairobi (GMT+3)</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Date Format</label>
                  <select className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Tax Identifier (KRA PIN)</label>
                  <input
                    type="text"
                    defaultValue="A0000000000"
                    className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "tax" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Tax & Financial Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">VAT Rate (%)</label>
                  <input
                    type="number"
                    defaultValue={16}
                    className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Default Discount (%)</label>
                  <input
                    type="number"
                    defaultValue={0}
                    className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Service Charge (%)</label>
                  <input
                    type="number"
                    defaultValue={0}
                    className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Tips Handling</label>
                  <select className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1">
                    <option>Add to server</option>
                    <option>Share among staff</option>
                    <option>Business revenue</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pos" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">POS Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-700/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Require Age Verification</p>
                    <p className="text-gray-400 text-sm">Prompt for ID check when selling alcohol</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-amber-500" />
                </div>
                <div className="flex items-center justify-between p-4 bg-neutral-700/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Enable Offline Mode</p>
                    <p className="text-gray-400 text-sm">Process sales without internet</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-amber-500" />
                </div>
                <div className="flex items-center justify-between p-4 bg-neutral-700/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Auto Print Receipts</p>
                    <p className="text-gray-400 text-sm">Automatically print after payment</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-amber-500" />
                </div>
                <div className="flex items-center justify-between p-4 bg-neutral-700/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Allow Split Bills</p>
                    <p className="text-gray-400 text-sm">Enable bill splitting feature</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-amber-500" />
                </div>
                <div className="flex items-center justify-between p-4 bg-neutral-700/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Enable Open Tabs</p>
                    <p className="text-gray-400 text-sm">Allow customers to run tabs</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-amber-500" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Data & Backup</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="p-4 bg-neutral-700/30 rounded-lg text-left hover:bg-neutral-700">
                  <Database className="w-8 h-8 text-amber-500 mb-2" />
                  <p className="text-white font-medium">Export Data</p>
                  <p className="text-gray-400 text-sm">Download all business data</p>
                </button>
                <button className="p-4 bg-neutral-700/30 rounded-lg text-left hover:bg-neutral-700">
                  <RotateCcw className="w-8 h-8 text-amber-500 mb-2" />
                  <p className="text-white font-medium">Backup Settings</p>
                  <p className="text-gray-400 text-sm">Export system configuration</p>
                </button>
              </div>
            </div>
          )}

          {/* Default fallback for other tabs */}
          {!["general", "business", "tax", "pos", "data"].includes(activeTab) && (
            <div className="text-center text-gray-500 py-12">
              <p>Settings for {activeTab} coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}