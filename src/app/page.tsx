import { Package, Users, ShoppingCart, DollarSign } from "lucide-react";

const stats = [
  { label: "Total Products", value: "156", icon: Package, change: "+12%" },
  { label: "Active Members", value: "89", icon: Users, change: "+5%" },
  { label: "Orders Today", value: "23", icon: ShoppingCart, change: "+18%" },
  { label: "Revenue", value: "$4,250", icon: DollarSign, change: "+8%" },
];

const recentOrders = [
  { id: "ORD-001", member: "John Doe", items: 3, total: "$89.99", status: "Completed" },
  { id: "ORD-002", member: "Jane Smith", items: 5, total: "$145.00", status: "Pending" },
  { id: "ORD-003", member: "Mike Johnson", items: 2, total: "$65.50", status: "Completed" },
  { id: "ORD-004", member: "Sarah Williams", items: 4, total: "$112.00", status: "Processing" },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome to Liquor Club Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="w-8 h-8 text-amber-500" />
              <span className="text-sm text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-gray-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-neutral-800 rounded-xl border border-neutral-700">
        <div className="p-6 border-b border-neutral-700">
          <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left text-gray-400 px-6 py-3 text-sm font-medium">Order ID</th>
                <th className="text-left text-gray-400 px-6 py-3 text-sm font-medium">Member</th>
                <th className="text-left text-gray-400 px-6 py-3 text-sm font-medium">Items</th>
                <th className="text-left text-gray-400 px-6 py-3 text-sm font-medium">Total</th>
                <th className="text-left text-gray-400 px-6 py-3 text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-neutral-700/50">
                  <td className="px-6 py-4 text-white">{order.id}</td>
                  <td className="px-6 py-4 text-gray-300">{order.member}</td>
                  <td className="px-6 py-4 text-gray-300">{order.items}</td>
                  <td className="px-6 py-4 text-gray-300">{order.total}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        order.status === "Completed"
                          ? "bg-green-500/10 text-green-500"
                          : order.status === "Pending"
                          ? "bg-blue-500/10 text-yellow-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {order.status}
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