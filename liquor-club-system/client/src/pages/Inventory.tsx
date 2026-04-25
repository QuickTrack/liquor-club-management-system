"use client";

import { useState, useEffect } from 'react';
import AddProductModal from '../components/AddProductModal';
import api from '../services/api';

interface Product {
  _id: string;
  sku: string;
  name: string;
  category: string;
  currentStock?: number;
  costPrice: number;
  sellingPrice: number;
  isActive: boolean;
}

export default function Inventory() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=100');
      const data = response.data;
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSuccess = () => {
    fetchProducts();
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-dark-100 text-white rounded-lg hover:bg-dark-200 transition-colors">
            Export
          </button>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-white">{products.length}</p>
        </div>
        <div className="bg-dark-200 p-6 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm mb-2">Stock Value</h3>
          <p className="text-3xl font-bold text-white">
            KES {products.reduce((sum, p) => sum + (p.costPrice * (p.currentStock || 0)), 0).toFixed(2)}
          </p>
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No products found. Add your first product.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-dark-100 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">
                      {product.category.toLowerCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {product.currentStock || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      KES {product.costPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      KES {product.sellingPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        product.isActive
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-red-900/50 text-red-400'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
