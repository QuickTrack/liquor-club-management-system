export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Settings */}
        <div className="bg-dark-200 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Branch Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Branch Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-dark-100 border border-gray-700 rounded-lg text-white"
                placeholder="Enter branch name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contact Phone</label>
              <input
                type="tel"
                className="w-full px-4 py-2 bg-dark-100 border border-gray-700 rounded-lg text-white"
                placeholder="07..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Receipt Header</label>
              <textarea
                className="w-full px-4 py-2 bg-dark-100 border border-gray-700 rounded-lg text-white"
                rows={3}
                placeholder="Header text shown on receipts"
              />
            </div>
            <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600">
              Save Changes
            </button>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-dark-200 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Payment Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">M-Pesa Till Number</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-dark-100 border border-gray-700 rounded-lg text-white"
                placeholder="Enter till number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">M-Pesa Business Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-dark-100 border border-gray-700 rounded-lg text-white"
                placeholder="Business name"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="enableCredit" className="rounded" />
              <label htmlFor="enableCredit" className="text-sm text-gray-300">
                Enable Credit Sales
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="enableLoyalty" className="rounded" defaultChecked />
              <label htmlFor="enableLoyalty" className="text-sm text-gray-300">
                Enable Loyalty Program
              </label>
            </div>
            <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600">
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
