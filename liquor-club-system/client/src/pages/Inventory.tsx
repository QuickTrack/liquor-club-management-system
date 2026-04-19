export default function Inventory() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-dark-100 text-white rounded-lg hover:bg-dark-200">
            Export
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600">
            + Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-white">0</p>
        </div>
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm mb-2">Stock Value</h3>
          <p className="text-3xl font-bold text-white">KES 0</p>
        </div>
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm mb-2">Low Stock</h3>
          <p className="text-3xl font-bold text-red-400">0</p>
        </div>
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm mb-2">Expiring Soon</h3>
          <p className="text-3xl font-bold text-yellow-400">0</p>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-dark-200 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Product List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                  No products found. Add your first product.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
