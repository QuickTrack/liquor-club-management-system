"use client";

import { useState } from "react";
import {
  Bell,
  AlertTriangle,
  Package,
  TrendingUp,
  MessageSquare,
  Phone,
  CheckCircle,
  X,
  Settings,
} from "lucide-react";

interface Alert {
  id: number;
  type: "low_stock" | "sales" | "fraud" | "system" | "customer";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const alerts: Alert[] = [
  { id: 1, type: "low_stock", title: "Low Stock Alert", message: "Hennessy VS is running low (8 bottles remaining)", time: "2 hours ago", read: false },
  { id: 2, type: "low_stock", title: "Low Stock Alert", message: "Patron Silver Tequila below reorder level", time: "2 hours ago", read: false },
  { id: 3, type: "sales", title: "High Sales", message: "Sales target reached for today - Ksh 85,000", time: "4 hours ago", read: true },
  { id: 4, type: "system", title: "Daily Summary", message: "Total sales: Ksh 45,200 | Orders: 28 | Profit: Ksh 18,080", time: "10 PM", read: true },
  { id: 5, type: "customer", title: "Credit Payment", message: "Jane Smith paid Ksh 15,000 towards credit", time: "Yesterday", read: true },
  { id: 6, type: "fraud", title: "Unusual Activity", message: "Multiple voids detected for user David Kiprop", time: "Yesterday", read: false },
];

interface NotificationSetting {
  id: number;
  name: string;
  email: boolean;
  sms: boolean;
  push: boolean;
}

const notificationSettings: NotificationSetting[] = [
  { id: 1, name: "Low Stock Alerts", email: true, sms: true, push: true },
  { id: 2, name: "Daily Sales Summary", email: true, sms: false, push: true },
  { id: 3, name: "Credit Alerts", email: true, sms: true, push: true },
  { id: 4, name: "Fraud Detection", email: true, sms: true, push: true },
  { id: 5, name: "New Orders", email: false, sms: false, push: true },
];

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<"alerts" | "settings">("alerts");
  const readAlerts = alerts.filter((a) => a.read).length;
  const unreadAlerts = alerts.filter((a) => !a.read).length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "low_stock":
        return <Package className="w-5 h-5 text-yellow-500" />;
      case "sales":
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "fraud":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "customer":
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Alerts & Notifications</h1>
          <p className="text-gray-400">System alerts and notification preferences</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <Bell className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-white">{alerts.length}</p>
          <p className="text-gray-400 text-sm">Total Alerts</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-white">{unreadAlerts}</p>
          <p className="text-gray-400 text-sm">Unread</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-red-500">{alerts.filter((a) => a.type === "fraud").length}</p>
          <p className="text-gray-400 text-sm">Fraud Alerts</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <Package className="w-8 h-8 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-yellow-500">
            {alerts.filter((a) => a.type === "low_stock").length}
          </p>
          <p className="text-gray-400 text-sm">Low Stock</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === "alerts"
              ? "bg-blue-500 text-white"
              : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
          }`}
        >
          Alerts
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === "settings"
              ? "bg-blue-500 text-white"
              : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
          }`}
        >
          Notification Settings
        </button>
      </div>

      {/* Alerts List */}
      {activeTab === "alerts" && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-4 p-4 rounded-xl border ${
                alert.read
                  ? "bg-neutral-800 border-neutral-700"
                  : "bg-neutral-700/30 border-amber-500/30"
              }`}
            >
              <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium">{alert.title}</p>
                  {!alert.read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <p className="text-gray-400 text-sm">{alert.message}</p>
                <p className="text-gray-500 text-xs mt-1">{alert.time}</p>
              </div>
              <button className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === "settings" && (
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Notification Type</th>
                <th className="text-center text-gray-400 px-4 py-3 text-sm font-medium">Email</th>
                <th className="text-center text-gray-400 px-4 py-3 text-sm font-medium">SMS</th>
                <th className="text-center text-gray-400 px-4 py-3 text-sm font-medium">Push</th>
              </tr>
            </thead>
            <tbody>
              {notificationSettings.map((setting) => (
                <tr key={setting.id} className="border-b border-neutral-700/50">
                  <td className="px-4 py-3 text-white">{setting.name}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={setting.email}
                      className="w-4 h-4 accent-blue-500"
                      readOnly
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={setting.sms}
                      className="w-4 h-4 accent-blue-500"
                      readOnly
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={setting.push}
                      className="w-4 h-4 accent-blue-500"
                      readOnly
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <Bell className="w-5 h-5" />
          Test Notifications
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <MessageSquare className="w-5 h-5" />
          SMS Test
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <Phone className="w-5 h-5" />
          WhatsApp Alerts
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <Settings className="w-5 h-5" />
          More Settings
        </button>
      </div>
    </div>
  );
}