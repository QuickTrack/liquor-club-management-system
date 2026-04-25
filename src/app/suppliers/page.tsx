"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Search,
  Plus,
  Phone,
  Mail,
  Edit,
  Trash2,
  Package,
  CreditCard,
} from "lucide-react";

interface Supplier {
  _id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  products: string;
  totalOrders: number;
  totalSpent: number;
  creditBalance: number;
  rating: number;
  status: "Active" | "Inactive";
  createdAt: string;
}

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    products: "",
  });

  const [showPurchaseOrder, setShowPurchaseOrder] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [orderItems, setOrderItems] = useState<{product: string; quantity: number; cost: number}[]>([]);
  const [products, setProducts] = useState<{_id: string; name: string; costPrice: number; category: string}[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Demo fallback data
  const demoProducts: {_id: string; name: string; costPrice: number; category: string}[] = [
    { _id: "1", name: "Jack Daniel's", category: "Bourbon", costPrice: 250 },
    { _id: "2", name: "Grey Goose", category: "Vodka", costPrice: 380 },
    { _id: "3", name: "Johnnie Walker", category: "Scotch", costPrice: 420 },
    { _id: "4", name: "Moet & Chandon", category: "Champagne", costPrice: 1000 },
    { _id: "5", name: "Hennessy VS", category: "Cognac", costPrice: 340 },
    { _id: "6", name: "Patron Silver", category: "Tequila", costPrice: 380 },
    { _id: "7", name: "Heineken (Draft)", category: "Beer", costPrice: 120 },
    { _id: "8", name: "Guinness", category: "Beer", costPrice: 160 },
    { _id: "9", name: "Jameson", category: "Irish", costPrice: 290 },
    { _id: "10", name: "Vodka Pump", category: "Shot", costPrice: 80 },
    { _id: "11", name: "Tequila Shot", category: "Shot", costPrice: 120 },
    { _id: "12", name: "Rum Shot", category: "Shot", costPrice: 120 },
    { _id: "13", name: "Wine (Glass)", category: "Wine", costPrice: 200 },
    { _id: "14", name: "Soda", category: "Mixer", costPrice: 40 },
    { _id: "15", name: "Energy Drink", category: "Mixer", costPrice: 120 },
    { _id: "16", name: "Tonic Water", category: "Mixer", costPrice: 65 },
  ];

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSuppliers(data);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.status === "Active").length;
  const totalSpent = suppliers.reduce((sum, s) => sum + s.totalSpent, 0);
  const totalCredit = suppliers.reduce((sum, s) => sum + s.creditBalance, 0);

  const handleSaveSupplier = async () => {
    if (!newSupplier.name || !newSupplier.contactPerson) {
      alert("Please fill in supplier name and contact person");
      return;
    }
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSupplier),
      });
      if (res.ok) {
        await fetchSuppliers();
        setShowAddSupplier(false);
        setNewSupplier({ name: "", contactPerson: "", phone: "", email: "", products: "" });
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
      alert("Failed to save supplier");
    }
  };

  const openPurchaseOrder = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowPurchaseOrder(true);
    setOrderItems([]);
    setProductsLoading(true);
    
    // Fetch products from inventory, fallback to demo data
    let productData = demoProducts;
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          productData = data;
        }
      }
    } catch (e) {
      console.log("Using demo products (MongoDB unavailable)");
    }
    
    setProducts(productData as any);
    if (productData.length > 0) {
      setOrderItems([{ product: productData[0].name, quantity: 1, cost: productData[0].costPrice }]);
    }
    setProductsLoading(false);
  };

  const addOrderItem = () => {
    // Add a new empty item row
    setOrderItems([...orderItems, { product: "", quantity: 1, cost: 0 }]);
  };

  const submitPurchaseOrder = async () => {
    // Filter out empty items
    const validItems = orderItems.filter(item => item.product && item.quantity > 0);
    if (!selectedSupplier || validItems.length === 0) {
      alert("Please add at least one item to the order");
      return;
    }
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier: selectedSupplier._id,
          items: validItems,
        }),
      });
      if (res.ok) {
        alert("Purchase order created successfully!");
        setShowPurchaseOrder(false);
        setOrderItems([]);
        setSelectedSupplier(null);
        // Refresh suppliers to see updated totals
        fetchSuppliers();
      }
    } catch (error) {
      console.error("Error creating purchase order:", error);
      alert("Failed to create purchase order");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Supplier Management</h1>
          <p className="text-gray-400">Supplier database & purchase orders</p>
        </div>
        <button
          onClick={() => setShowAddSupplier(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Supplier
        </button>

        {showAddSupplier && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-neutral-800 rounded-xl p-6 w-[500px] border border-neutral-700">
              <h2 className="text-xl font-bold text-white mb-4">Add New Supplier</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Supplier Name *</label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    placeholder="Enter supplier name"
                    className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Contact Person *</label>
                  <input
                    type="text"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                    placeholder="Enter contact name"
                    className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Phone</label>
                    <input
                      type="text"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                      placeholder="+254 XXX XXX XXX"
                      className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Email</label>
                    <input
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Products Supplied</label>
                  <input
                    type="text"
                    value={newSupplier.products}
                    onChange={(e) => setNewSupplier({ ...newSupplier, products: e.target.value })}
                    placeholder="e.g. Beer, Vodka, Wine"
                    className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
<button
                  onClick={() => {
                    setShowAddSupplier(false);
                    setNewSupplier({ name: "", contactPerson: "", phone: "", email: "", products: "" });
                  }}
                  className="flex-1 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSupplier}
                   className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600"
                >
                  Save Supplier
                </button>
              </div>
            </div>
          </div>
        )}

        <button onClick={() => {
          if (suppliers.length > 0) {
            openPurchaseOrder(suppliers[0]);
          }
        }} className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <Plus className="w-5 h-5" />
          New Purchase Order
        </button>

        {showPurchaseOrder && selectedSupplier && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-neutral-800 rounded-xl p-6 w-[600px] border border-neutral-700 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-4">Purchase Order - {selectedSupplier.name}</h2>
              
              {productsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading products...</p>
                </div>
) : products.length === 0 ? (
                <div className="text-center py-8 mb-4">
                  <p className="text-yellow-500 mb-2">No products in database</p>
                  <p className="text-gray-400 text-sm mb-4">Click "Seed Database" button below</p>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                {orderItems.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No items. Click "+ Add Item" to add products.</p>
                ) : orderItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={item.product}
                      onChange={(e) => {
                        const updated = [...orderItems];
                        const prod = products.find(p => p.name === e.target.value);
                        updated[idx].product = e.target.value;
                        updated[idx].cost = prod?.costPrice || 0;
                        setOrderItems(updated);
                      }}
                      className="flex-1 bg-neutral-700 text-white px-3 py-2 rounded-lg"
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p._id} value={p.name}>{p.name} - {p.category}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...orderItems];
                        updated[idx].quantity = parseInt(e.target.value) || 1;
                        setOrderItems(updated);
                      }}
                      className="w-20 bg-neutral-700 text-white px-3 py-2 rounded-lg"
                      placeholder="Qty"
                    />
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={item.cost}
                      onChange={(e) => {
                        const updated = [...orderItems];
                        updated[idx].cost = parseFloat(e.target.value) || 0;
                        setOrderItems(updated);
                      }}
                      className="w-24 bg-neutral-700 text-white px-3 py-2 rounded-lg"
                      placeholder="Ksh"
                    />
                    <button 
                      onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))} 
                      className="p-2 text-red-500 hover:bg-neutral-700 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))} 
                </div>)}

              <button 
                onClick={() => {
                  const newItem = { product: products[0]?.name || "", quantity: 1, cost: products[0]?.costPrice || 0 };
                  setOrderItems([...orderItems, newItem]);
                }} 
                className="w-full py-2 border border-dashed border-neutral-600 text-gray-400 rounded-lg hover:border-blue-500 hover:text-blue-500 mb-4 cursor-pointer"
              >
                + Add Item ({products.length} available)
              </button>

              <div className="border-t border-neutral-700 pt-4 mb-4">
                <p className="text-white font-bold">Total: Ksh {orderItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0).toLocaleString()}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setShowPurchaseOrder(false); setOrderItems([]); }} className="flex-1 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600">Cancel</button>
                <button onClick={submitPurchaseOrder} className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600">Submit Order</button>
              </div>
            </div>
          </div>
        )}
        <button onClick={async () => {
          if (confirm("This will seed the database with demo data. Continue?")) {
            try {
              const res = await fetch("/api/seed", { method: "POST" });
              if (res.ok) {
                alert("Database seeded successfully!");
                fetchSuppliers();
              }
            } catch (e) {
              alert("Failed to seed database");
            }
          }
        }} className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <Package className="w-5 h-5" />
          Seed Database
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <CreditCard className="w-5 h-5" />
          Pay Suppliers
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-700">
          <Truck className="w-5 h-5" />
          Price Comparison
        </button>
      </div>
    </div>
  );
}