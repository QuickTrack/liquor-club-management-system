import { ShoppingCart, Search, Plus, Filter } from "lucide-react";

const orders = [
  { id: "ORD-001", member: "John Doe", date: "2024-07-15", items: 3, total: "Ksh89.99", status: "Completed", payment: "Paid" },
  { id: "ORD-002", member: "Jane Smith", date: "2024-07-15", items: 5, total: "Ksh145.00", status: "Pending", payment: "Pending" },
  { id: "ORD-003", member: "Mike Johnson", date: "2024-07-14", items: 2, total: "Ksh65.50", status: "Completed", payment: "Paid" },
  { id: "ORD-004", member: "Sarah Williams", date: "2024-07-14", items: 4, total: "Ksh112.00", status: "Processing", payment: "Paid" },
  { id: "ORD-005", member: "Tom Brown", date: "2024-07-13", items: 6, total: "Ksh210.00", status: "Completed", payment: "Paid" },
  { id: "ORD-006", member: "Emily Davis", date: "2024-07-13", items: 1, total: "Ksh34.99", status: "Cancelled", payment: "Refunded" },
];

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Orders</h1>
          <p className="text-gray-400">Manage member orders</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-5 h-5" />
          New Order
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full bg-neutral-800 border border-neutral-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>
        <button className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors">
          <Filter className="w-5 h-5" />
          Filter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <ShoppingCart className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-white">156</p>
          <p className="text-gray-400 text-sm">Total Orders</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <p className="text-2xl font-bold text-green-500">98</p>
          <p className="text-gray-400 text-sm">Completed</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <p className="text-2xl font-bold text-yellow-500">12</p>
          <p className="text-gray-400 text-sm">Pending</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <p className="text-2xl font-bold text-blue-500">8</p>
          <p className="text-gray-400 text-sm">Processing</p>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-xl border border-neutral-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left text-gray-400 px-6 py-3 text-sm font-medium">Order ID</th>
                <th className="text-left text-gray-400 px-6 py-3 text-sm font-medium">Member</th>
                <th className="text-left text-gray-400 px-6 py-3 text-sm font-medium">Date</th>
                <th className="text-left text-gray-400 px-6 py-3 text-sm font-medium">Items</th>
                <th className="text-left text-gray-400 px-6 py-3 text-sm font-medium">Total</th>
                <th className="text-left text-gray-400 px-6 py-3 text-sm font-medium">Status</th>
                <th className="text-left text-gray-400 px-6 py-3 text-sm font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-neutral-700/50">
                  <td className="px-6 py-4 text-white font-medium">{order.id}</td>
                  <td className="px-6 py-4 text-gray-300">{order.member}</td>
                  <td className="px-6 py-4 text-gray-300">{order.date}</td>
                  <td className="px-6 py-4 text-gray-300">{order.items}</td>
                  <td className="px-6 py-4 text-gray-300">{order.total}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs Ksh{
                        order.status === "Completed"
                          ? "bg-green-500/10 text-green-500"
                          :                         order.status === "Pending"
                          ? "bg-blue-500/10 text-yellow-500"
                          : order.status === "Processing"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs Ksh{
                        order.payment === "Paid"
                          ? "bg-green-500/10 text-green-500"
                          : order.payment === "Pending"
                          ? "bg-blue-500/10 text-yellow-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {order.payment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}