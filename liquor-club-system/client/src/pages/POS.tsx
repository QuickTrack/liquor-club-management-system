export default function POS() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Point of Sale</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            Balance: <span className="text-white font-mono">KES 0.00</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Products Grid - 2/3 width */}
        <div className="lg:col-span-2 bg-dark-200 rounded-xl border border-gray-800 p-4 overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <input
              type="search"
              placeholder="Search products..."
              className="w-64 px-4 py-2 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-dark-100 text-white rounded-lg hover:bg-dark-100/80">Categories</button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg">All Items</button>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-20rem)]">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <button
                key={i}
                className="bg-dark-100 border border-gray-800 rounded-xl p-4 hover:border-primary transition text-left group"
              >
                <div className="h-24 bg-dark-200 rounded-lg mb-3 flex items-center justify-center text-gray-500 group-hover:border-primary border border-dashed border-gray-700">
                  📦
                </div>
                <h3 className="font-medium text-white mb-1 truncate">Product {i}</h3>
                <p className="text-sm text-gray-400 mb-2">Category</p>
                <p className="text-lg font-bold text-primary">KES {(i * 250).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Stock: {i * 10}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart - 1/3 width */}
        <div className="bg-dark-200 rounded-xl border border-gray-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Current Order</h2>
              <button className="text-sm text-gray-400 hover:text-white">Clear</button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-dark-100 rounded-lg">
                <div>
                  <p className="text-white font-medium">Product {i}</p>
                  <p className="text-sm text-gray-400">KES {(i * 250).toFixed(2)} × {i}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="w-8 h-8 rounded bg-dark-200 text-white hover:bg-primary">-</button>
                  <span className="w-8 text-center text-white">{i}</span>
                  <button className="w-8 h-8 rounded bg-dark-200 text-white hover:bg-primary">+</button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals & Payment */}
          <div className="p-4 border-t border-gray-800 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">KES 0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tax (16%)</span>
                <span className="text-white">KES 0.00</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-primary">KES 0.00</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button className="py-3 bg-dark-100 text-white rounded-lg hover:bg-dark-200 font-medium">Cash</button>
              <button className="py-3 bg-primary text-white rounded-lg hover:bg-primary-600 font-medium">M-Pesa</button>
              <button className="py-3 bg-dark-100 text-white rounded-lg hover:bg-dark-200 font-medium">Card</button>
              <button className="py-3 bg-dark-100 text-white rounded-lg hover:bg-dark-200 font-medium">Credit</button>
            </div>

            <button className="w-full py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition">
              CHARGE KES 0.00
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
