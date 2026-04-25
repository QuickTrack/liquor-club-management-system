"use client";

import { useState } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Filter,
} from "lucide-react";

interface SalesData {
  day: string;
  sales: number;
  orders: number;
  profit: number;
}

const salesData: SalesData[] = [
  { day: "Mon", sales: 45000, orders: 28, profit: 18000 },
  { day: "Tue", sales: 38000, orders: 22, profit: 15200 },
  { day: "Wed", sales: 52000, orders: 35, profit: 20800 },
  { day: "Thu", sales: 41000, orders: 26, profit: 16400 },
  { day: "Fri", sales: 68000, orders: 48, profit: 27200 },
  { day: "Sat", sales: 85000, orders: 62, profit: 34000 },
  { day: "Sun", sales: 32000, orders: 18, profit: 12800 },
];

const topProducts = [
  { name: "Vodka Tonic", sold: 125, revenue: 31250, profit: 12500 },
  { name: "Whiskey Sour", sold: 89, revenue: 40050, profit: 16020 },
  { name: "Martini", sold: 72, revenue: 36000, profit: 14400 },
  { name: "Mojito", sold: 65, revenue: 26000, profit: 10400 },
  { name: "Pina Colada", sold: 48, revenue: 24000, profit: 9600 },
];

const staffPerformance = [
  { name: "David Kiprop", sales: 85000, orders: 52 },
  { name: "Faith Kemunto", sales: 72000, orders: 48 },
  { name: "Paul Ochieng", sales: 68000, orders: 45 },
  { name: "Grace Akinyi", sales: 45000, orders: 32 },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("week");
  const [reportType, setReportType] = useState("sales");

  const totalSales = salesData.reduce((sum, d) => sum + d.sales, 0);
  const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);
  const totalProfit = salesData.reduce((sum, d) => sum + d.profit, 0);
  const avgOrder = totalSales / totalOrders;

  const maxSales = Math.max(...salesData.map((d) => d.sales));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-400">Sales, inventory & staff performance</p>
        </div>
        <button className="flex items-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg transition-colors">
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Date Range & Report Type */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {["today", "week", "month", "year"].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                dateRange === range
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["sales", "inventory", "staff", "financial"].map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                reportType === type
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <DollarSign className="w-8 h-8 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-white">Ksh {(totalSales / 1000).toFixed(0)}K</p>
          <p className="text-gray-400 text-sm">Total Sales</p>
          <p className="text-green-500 text-sm flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +12% vs last week
          </p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <Package className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-white">{totalOrders}</p>
          <p className="text-gray-400 text-sm">Total Orders</p>
          <p className="text-green-500 text-sm flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +8% vs last week
          </p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-white">Ksh {Math.round(avgOrder)}</p>
          <p className="text-gray-400 text-sm">Avg Order Value</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-green-500">Ksh {(totalProfit / 1000).toFixed(0)}K</p>
          <p className="text-gray-400 text-sm">Total Profit</p>
          <p className="text-gray-400 text-sm">~30% margin</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
        <h3 className="text-white font-medium mb-4">Daily Sales This Week</h3>
        <div className="flex items-end gap-2 h-48">
          {salesData.map((data, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-blue-500 rounded-t-lg"
                style={{ height: `${(data.sales / maxSales) * 100}%` }}
              />
              <span className="text-gray-400 text-xs">{data.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <h3 className="text-white font-medium mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-4">{idx + 1}.</span>
                  <span className="text-white">{product.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-white">{product.sold} sold</p>
                  <p className="text-green-500 text-sm">
                    Ksh {product.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <h3 className="text-white font-medium mb-4">Staff Performance</h3>
          <div className="space-y-3">
            {staffPerformance.map((staff, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-4">{idx + 1}.</span>
                  <span className="text-white">{staff.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-white">{staff.orders} orders</p>
                  <p className="text-green-500 text-sm">
                    Ksh {staff.sales.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Hours */}
      <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
        <h3 className="text-white font-medium mb-4">Peak Hours Analysis</h3>
        <div className="grid grid-cols-8 gap-2">
          {["6PM", "7PM", "8PM", "9PM", "10PM", "11PM", "12AM", "1AM"].map((hour, idx) => {
            const heights = [15, 25, 45, 65, 85, 95, 70, 30];
            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div
                  className="w-full bg-blue-500 rounded-t-lg"
                  style={{ height: `${heights[idx]}%` }}
                />
                <span className="text-gray-400 text-xs">{hour}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}