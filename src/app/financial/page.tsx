"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Receipt,
} from "lucide-react";

interface Transaction {
  _id?: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
  status: "Completed" | "Pending";
}

export default function FinancialPage() {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, "_id">>({
    type: "income",
    category: "Sales",
    amount: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
    status: "Completed",
  });

  // Fetch transactions from database
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        if (data.transactions) {
          setTransactions(data.transactions);
        }
      } else {
        console.error("Failed to fetch transactions");
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTransaction,
          userId: "current-user",
          userName: "System",
        }),
      });
      if (res.ok) {
        setShowAddTransaction(false);
        setNewTransaction({
          type: "income",
          category: "Sales",
          amount: 0,
          description: "",
          date: new Date().toISOString().split("T")[0],
          status: "Completed",
        });
        await fetchTransactions();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add transaction");
      }
    } catch (err) {
      alert("Failed to add transaction");
    }
  };

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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Sales: "bg-green-500/20 text-green-400",
      Rent: "bg-red-500/20 text-red-400",
      Utilities: "bg-blue-500/20 text-blue-400",
      Supplies: "bg-amber-500/20 text-amber-400",
      Salaries: "bg-purple-500/20 text-purple-400",
      Marketing: "bg-pink-500/20 text-pink-400",
      Maintenance: "bg-cyan-500/20 text-cyan-400",
      Credit: "bg-indigo-500/20 text-indigo-400",
      Default: "bg-gray-500/20 text-gray-400",
    };
    return colors[category] || colors.Default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 border border-green-500/30">
          <p className="text-green-200 text-sm uppercase tracking-wider mb-1">Total Income</p>
          <p className="text-3xl font-bold text-white">Ksh {totalIncome.toLocaleString()}</p>
          <p className="text-green-200 text-sm flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4" /> From database
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-4 border border-red-500/30">
          <p className="text-red-200 text-sm uppercase tracking-wider mb-1">Total Expenses</p>
          <p className="text-3xl font-bold text-white">Ksh {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-4 border border-emerald-500/30">
          <p className="text-emerald-200 text-sm uppercase tracking-wider mb-1">Net Profit</p>
          <p className={`text-3xl font-bold ${netProfit >= 0 ? "text-white" : "text-red-300"}`}>
            {netProfit >= 0 ? "+" : ""}Ksh {netProfit.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 border border-blue-500/30">
          <p className="text-blue-200 text-sm uppercase tracking-wider mb-1">Profit Margin</p>
          <p className="text-3xl font-bold text-white">
            {totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0}%
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
          <Wallet className="w-5 h-5" />
          Expense Categories
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <Receipt className="w-5 h-5" />
          Credit Management
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <Receipt className="w-5 h-5" />
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

      {/* Transactions Table */}
      <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Date</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Type</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Category</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Description</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Amount</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              filteredTransactions.map((transaction) => (
                <tr
                  key={transaction._id}
                  className="border-b border-neutral-700/50 hover:bg-neutral-700/30"
                >
                  <td className="px-4 py-3 text-gray-300">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        transaction.type === "income"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                        transaction.category
                      )}`}
                    >
                      {transaction.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white">{transaction.description}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        transaction.type === "income"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      Ksh {transaction.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        transaction.status === "Completed"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-xl border border-neutral-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add Transaction</h2>
              <button
                onClick={() => setShowAddTransaction(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Type</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as "income" | "expense" })}
                  className="w-full bg-neutral-700 text-white px-4 py-2.5 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Category</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  className="w-full bg-neutral-700 text-white px-4 py-2.5 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500"
                >
                  {["Sales", "Rent", "Utilities", "Supplies", "Salaries", "Marketing", "Maintenance", "Credit"].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Amount</label>
                <input
                  type="number"
                  value={newTransaction.amount || ""}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full bg-neutral-700 text-white px-4 py-2.5 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Description</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  placeholder="Enter description"
                  className="w-full bg-neutral-700 text-white px-4 py-2.5 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Date</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  className="w-full bg-neutral-700 text-white px-4 py-2.5 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Status</label>
                <select
                  value={newTransaction.status}
                  onChange={(e) => setNewTransaction({ ...newTransaction, status: e.target.value as "Completed" | "Pending" })}
                  className="w-full bg-neutral-700 text-white px-4 py-2.5 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500"
                >
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTransaction(false)}
                  className="flex-1 py-2.5 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
