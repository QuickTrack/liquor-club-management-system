export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-dark-100 text-white rounded-lg hover:bg-dark-200">
            Export All
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600">
            + Custom Report
          </button>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800 hover:border-primary cursor-pointer transition">
          <h3 className="text-lg font-semibold text-white mb-2">Sales Summary</h3>
          <p className="text-gray-400 text-sm">Daily, weekly, monthly sales reports with breakdown by product and payment method.</p>
        </div>
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800 hover:border-primary cursor-pointer transition">
          <h3 className="text-lg font-semibold text-white mb-2">Product Performance</h3>
          <p className="text-gray-400 text-sm">Top-selling and slow-moving items with profit margins.</p>
        </div>
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800 hover:border-primary cursor-pointer transition">
          <h3 className="text-lg font-semibold text-white mb-2">Inventory Audit</h3>
          <p className="text-gray-400 text-sm">Stock aging, expiry tracking, and variance reports.</p>
        </div>
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800 hover:border-primary cursor-pointer transition">
          <h3 className="text-lg font-semibold text-white mb-2">Credit Aging</h3>
          <p className="text-gray-400 text-sm">Customer debt aging report for collections.</p>
        </div>
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800 hover:border-primary cursor-pointer transition">
          <h3 className="text-lg font-semibold text-white mb-2">Tax Reports</h3>
          <p className="text-gray-400 text-sm">VAT and excise duty reports for KRA compliance.</p>
        </div>
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800 hover:border-primary cursor-pointer transition">
          <h3 className="text-lg font-semibold text-white mb-2">Staff Performance</h3>
          <p className="text-gray-400 text-sm">Sales per cashier, average ticket size, and commissions.</p>
        </div>
      </div>
    </div>
  );
}
