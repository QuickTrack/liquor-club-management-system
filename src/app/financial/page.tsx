"use client";

import { useState } from "react";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Receipt,
} from "lucide-react";

interface Transaction {
  id: number;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
  status: "Completed" | "Pending";
}

const transactions: Transaction[] = [
  { id: 1, type: "income", category: "Sales", amount: 45000, description: "Bar Sales - Friday", date: "2024-07-15", status: "Completed" },
  { id: 2, type: "expense", category: "Rent", amount: 25000, description: "July Rent", date: "2024-07-01", status: "Completed" },
  { id: 3, type: "income", category: "Sales", amount: 38000, description: "Bar Sales - Saturday", date: "2024-07-14", status: "Completed" },
  { id: 4, type: "expense", category: "Utilities", amount: 8500, description: "Electricity Bill", date: "2024-07-10", status: "Completed" },
  { id: 5, type: "expense", category: "Supplies", amount: 12000, description: "Stock Replenishment", date: "2024-07-12", status: "Completed" },
  { id: 6, type: "income", category: "Sales", amount: 52000, description: "Bar Sales - Thursday", date: "2024-07-13", status: "Completed" },
  { id: 7, type: "expense", category: "Salaries", amount: 85000, description: "Staff Wages", date: "2024-07-15", status: "Completed" },
  { id: 8, type: "income", category: "Credit", amount: 15000, description: "Credit Payment - Jane Smith", date: "2024-07-14", status: "Completed" },
];

const categories = ["Sales", "Rent", "Utilities", "Supplies", "Salaries", "Marketing", "Maintenance"];

export default function FinancialPage() {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "all") return true;
    return t.type === filter;
  });

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Financial Management</h1>
          <p className="text-gray-400">Income, expenses & cash flow</p>
        </div>
        <button
          onClick={() => setShowAddTransaction(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-gray-400 text-sm">Total Income</p>
          <p className="text-2xl font-bold text-green-500">Ksh {totalIncome.toLocaleString()}</p>
          <p className="text-green-500 text-sm flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +15% vs last month
          </p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-gray-400 text-sm">Total Expenses</p>
          <p className="text-2xl font-bold text-red-500">Ksh {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-gray-400 text-sm">Net Profit</p>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
            Ksh {netProfit.toLocaleString()}
          </p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-gray-400 text-sm">Profit Margin</p>
          <p className="text-2xl font-bold text-white">
            {Math.round((netProfit / totalIncome) * 100)}%
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <Receipt className="w-5 h-5" />
          View Invoices
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <DollarSign className="w-5 h-5" />
          Expense Categories
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <CreditCard className="w-5 h-5" />
          Credit Management
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <TrendingUp className="w-5 h-5" />
          P&L Statement
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "income", "expense"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              filter === f
                ? "bg-blue-500 text-white"
                : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Date</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Category</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Description</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Amount</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-neutral-700/50 hover:bg-neutral-700/30">
                <td className="px-4 py-3 text-gray-300">{transaction.date}</td>
                <td className="px-4 py-3 text-gray-300">{transaction.category}</td>
                <td className="px-4 py-3 text-white">{transaction.description}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {transaction.type === "income" ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <span
                      className={
                        transaction.type === "income" ? "text-green-500" : "text-red-500"
                      }
                    >
                      Ksh {transaction.amount.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      transaction.status === "Completed"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-blue-500/10 text-yellow-500"
                    }`}
                  >
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}