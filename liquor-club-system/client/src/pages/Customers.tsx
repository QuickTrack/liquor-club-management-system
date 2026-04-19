export default function Customers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-dark-100 text-white rounded-lg hover:bg-dark-200">
            Export
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600">
            + Add Customer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm mb-2">Total Customers</h3>
          <p className="text-3xl font-bold text-white">0</p>
        </div>
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm mb-2">Credit Accounts</h3>
          <p className="text-3xl font-bold text-red-400">0</p>
        </div>
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm mb-2">Loyalty Members</h3>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-dark-200 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Customer List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Credit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  No customers found. Add your first customer.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
