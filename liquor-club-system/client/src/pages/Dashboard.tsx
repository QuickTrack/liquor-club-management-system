export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="text-sm text-gray-400">
          {new Date().toLocaleDateString('en-KE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm mb-2">Today's Sales</h3>
          <p className="text-3xl font-bold text-white">KES 0</p>
        </div>
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm mb-2">Transactions</h3>
          <p className="text-3xl font-bold text-white">0</p>
        </div>
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm mb-2">Credit Balance</h3>
          <p className="text-3xl font-bold text-white">KES 0</p>
        </div>
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm mb-2">Low Stock Items</h3>
          <p className="text-3xl font-bold text-white">0</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-200 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Sales</h2>
          <div className="text-gray-400 text-sm">No recent sales</div>
        </div>
        <div className="bg-dark-200 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Stock Alerts</h2>
          <div className="text-gray-400 text-sm">All stock levels OK</div>
        </div>
      </div>
    </div>
  );
}
