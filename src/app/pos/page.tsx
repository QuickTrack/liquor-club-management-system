"use client";

import { useState, useEffect } from "react";
import {
  ShoppingBasket,
  ShoppingCart,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  Users,
  Flame,
  Minus,
  Plus,
  X,
  Play,
  Pause,
  FileText,
  CheckCircle,
} from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface Order {
  id: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  tierDiscount: number;
  tax: number;
  total: number;
  status: "draft" | "held" | "billed" | "paid";
  createdAt: string;
  heldAt?: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  tier: "Bronze" | "Silver" | "Gold" | "VIP";
  creditLimit: number;
  creditUsed: number;
  points: number;
}

const customers: Customer[] = [
  { id: 1, name: "Walk-in Customer", phone: "", tier: "Bronze", creditLimit: 0, creditUsed: 0, points: 0 },
  { id: 2, name: "John Doe", phone: "+254 712 345 678", tier: "Gold", creditLimit: 10000, creditUsed: 2500, points: 4500 },
  { id: 3, name: "Jane Smith", phone: "+254 723 456 789", tier: "VIP", creditLimit: 50000, creditUsed: 12000, points: 15000 },
  { id: 4, name: "Mike Johnson", phone: "+254 734 567 890", tier: "Silver", creditLimit: 5000, creditUsed: 0, points: 1850 },
  { id: 5, name: "Sarah Williams", phone: "+254 745 678 901", tier: "Bronze", creditLimit: 2000, creditUsed: 0, points: 280 },
  { id: 6, name: "Tom Brown", phone: "+254 756 789 012", tier: "Gold", creditLimit: 15000, creditUsed: 3000, points: 6500 },
  { id: 7, name: "Emily Davis", phone: "+254 767 890 123", tier: "VIP", creditLimit: 30000, creditUsed: 8000, points: 10500 },
];

const tierDiscounts: Record<Customer["tier"], number> = {
  Bronze: 0,
  Silver: 0,
  Gold: 0,
  VIP: 0,
};

const products = [
  { id: 1, name: "Jack Daniel's", price: 300, category: "Bourbon", stock: 24 },
  { id: 2, name: "Grey Goose", price: 450, category: "Vodka", stock: 18 },
  { id: 3, name: "Johnnie Walker", price: 500, category: "Scotch", stock: 12 },
  { id: 4, name: "Moet & Chandon", price: 1200, category: "Champagne", stock: 6 },
  { id: 5, name: "Hennessy VS", price: 400, category: "Cognac", stock: 15 },
  { id: 6, name: "Patron Silver", price: 450, category: "Tequila", stock: 20 },
  { id: 7, name: "Heineken (Draft)", price: 150, category: "Beer", stock: 50 },
  { id: 8, name: "Guinness", price: 200, category: "Beer", stock: 30 },
  { id: 9, name: "Jameson", price: 350, category: "Irish", stock: 16 },
  { id: 10, name: "Vodka Pump", price: 100, category: "Shot", stock: 100 },
  { id: 11, name: "Tequila Shot", price: 150, category: "Shot", stock: 80 },
  { id: 12, name: "Rum Shot", price: 150, category: "Shot", stock: 75 },
  { id: 13, name: "Wine (Glass)", price: 250, category: "Wine", stock: 24 },
  { id: 14, name: "Soda", price: 50, category: "Mixer", stock: 100 },
  { id: 15, name: "Energy Drink", price: 150, category: "Mixer", stock: 40 },
  { id: 16, name: "Tonic Water", price: 80, category: "Mixer", stock: 36 },
];

const categories = ["All", "Bourbon", "Vodka", "Scotch", "Champagne", "Cognac", "Tequila", "Beer", "Shot", "Wine", "Mixer"];

function generateOrderId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return "ORD-" + timestamp.substring(timestamp.length - 4) + random.toUpperCase();
}

const initialOrder: Order = {
  id: "",
  customer: customers[0],
  items: [],
  subtotal: 0,
  tierDiscount: 0,
  tax: 0,
  total: 0,
  status: "draft",
  createdAt: "",
};

function getOrderId(customerName: string) {
  const cleanName = customerName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().substring(0, 8);
  const timestamp = Date.now().toString(36);
  return cleanName + "-" + timestamp.substring(timestamp.length - 4);
}

export default function POSPage() {
  const [currentOrder, setCurrentOrder] = useState<Order>(initialOrder);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const walkInCustomer = customers[0];
    setCurrentOrder({
      id: getOrderId(walkInCustomer.name),
      customer: walkInCustomer,
      items: [],
      subtotal: 0,
      tierDiscount: 0,
      tax: 0,
      total: 0,
      status: "draft",
      createdAt: new Date().toISOString(),
    });
    setMounted(true);
  }, []);

  const [heldOrders, setHeldOrders] = useState<Order[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isHappyHour, setIsHappyHour] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa" | "account">("cash");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [billedOrder, setBilledOrder] = useState<Order | null>(null);
  const [changeAmount, setChangeAmount] = useState("");
  const [showChangeInput, setShowChangeInput] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const updatePricesWithCustomer = (customer: Customer) => {
    const newItems = currentOrder.items.map((item) => {
      const basePrice = products.find((p) => p.id === item.id)?.price || item.price;
      return { ...item, price: basePrice };
    });
    const subtotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.16;
    setCurrentOrder({ ...currentOrder, id: getOrderId(customer.name), items: newItems, customer, subtotal, tierDiscount: 0, tax, total: subtotal + tax });
  };

  const addToOrder = (product: typeof products[0]) => {
    let price = product.price;
    if (isHappyHour && product.category === "Shot") price = price * 0.8;

    const newItems = [...currentOrder.items];
    const existing = newItems.find((item) => item.id === product.id);
    if (existing) existing.quantity += 1;
    else newItems.push({ ...product, price, quantity: 1 });

    const subtotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.16;

    setCurrentOrder({ ...currentOrder, items: newItems, subtotal, tierDiscount: 0, tax, total: subtotal + tax });
  };

  const updateQuantity = (id: number, delta: number) => {
    const newItems = currentOrder.items.map((item) => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter((item) => item.quantity > 0);
    const subtotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.16;
    setCurrentOrder({ ...currentOrder, items: newItems, subtotal, tax, total: subtotal + tax });
  };

  const removeItem = (id: number) => {
    const newItems = currentOrder.items.filter((item) => item.id !== id);
    const subtotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.16;
    setCurrentOrder({ ...currentOrder, items: newItems, subtotal, tax, total: subtotal + tax });
  };

  const clearOrder = () => {
    setCurrentOrder({ id: getOrderId(currentOrder.customer.name), customer: currentOrder.customer, items: [], subtotal: 0, tierDiscount: 0, tax: 0, total: 0, status: "draft", createdAt: new Date().toISOString() });
  };

  const holdOrder = () => {
    if (currentOrder.items.length === 0) return;
    const held: Order = { ...currentOrder, status: "held", heldAt: new Date().toISOString() };
    setHeldOrders([held, ...heldOrders]);
    clearOrder();
  };

  const resumeOrder = (order: Order) => {
    setCurrentOrder({ ...order, status: "draft", createdAt: new Date().toISOString() });
    setHeldOrders(heldOrders.filter((o) => o.id !== order.id));
    setShowHeldOrders(false);
  };

  const convertToBill = () => {
    if (currentOrder.items.length === 0) return;
    setBilledOrder({ ...currentOrder, status: "billed" });
    setShowChangeInput(true);
  };

const completeSale = () => {
    if (!billedOrder) return;
    if (paymentMethod === "account") {
      const updatedCustomer = {
        ...billedOrder.customer,
        creditUsed: billedOrder.customer.creditUsed + billedOrder.total,
      };
      setBilledOrder({ ...billedOrder, status: "paid", customer: updatedCustomer });
      setShowReceipt(true);
      setShowChangeInput(false);
      clearOrder();
      return;
    }
    const amountPaid = parseFloat(changeAmount) || 0;
    if (amountPaid < billedOrder.total) { alert("Insufficient payment"); return; }
    setBilledOrder({ ...billedOrder, status: "paid" });
    setShowReceipt(true);
    setShowChangeInput(false);
    clearOrder();
  };

  const getChange = () => parseFloat(changeAmount) - (billedOrder?.total || 0);

  return (
    <div className="h-[calc(100vh-3rem)] flex gap-4">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">New Order</h1>
            <p className="text-gray-400 text-sm">Order {mounted ? currentOrder.id : '...'} for {currentOrder.customer.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHeldOrders(true)} className="flex items-center gap-2 px-3 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600">
              <Pause className="w-4 h-4" /> Held ({heldOrders.length})
            </button>
            <button onClick={() => setIsHappyHour(!isHappyHour)} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${isHappyHour ? "bg-blue-500 text-white" : "bg-neutral-700 text-gray-300 hover:bg-neutral-600"}`}>
              <Flame className="w-4 h-4" /> Happy Hour
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowCustomerSelect(true)} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${currentOrder.customer.tier === "VIP" ? "bg-purple-500 text-white" : currentOrder.customer.tier === "Gold" ? "bg-blue-500 text-white" : currentOrder.customer.tier === "Silver" ? "bg-gray-400 text-black" : "bg-blue-700 text-white"}`}>
            <Users className="w-4 h-4" /> {currentOrder.customer.name}
          </button>
          
        </div>

        <input type="text" placeholder="Search drinks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-neutral-800 border border-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500" />

        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (<button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeCategory === cat ? "bg-blue-500 text-white" : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"}`}>{cat}</button>))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 gap-2">
            {filteredProducts.map((product) => (<button key={product.id} onClick={() => addToOrder(product)} className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-amber-500 p-3 rounded-lg text-left transition-colors"><p className="text-white font-medium text-sm truncate">{product.name}</p><p className="text-amber-500 font-bold">Ksh {product.price}</p><p className="text-gray-500 text-xs">Stock: {product.stock}</p></button>))}
          </div>
        </div>
      </div>

      {/* Right Panel - Current Order */}
      <div className="w-96 bg-neutral-800 rounded-xl border border-neutral-700 flex flex-col">
        <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Current Order</h2>
          <span className="text-gray-400 text-sm">{currentOrder.items.length} items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {currentOrder.items.length === 0 ? (
            <div className="text-center text-gray-500 py-8"><ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>No items yet</p><p className="text-sm">Click products to add</p></div>
          ) : (
            currentOrder.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-neutral-700/50 p-2 rounded-lg">
                <div className="flex-1"><p className="text-white text-sm font-medium">{item.name}</p><p className="text-gray-400 text-xs">Ksh {item.price} each</p></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-neutral-600 rounded text-white"><Minus className="w-4 h-4" /></button>
                  <span className="text-white w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-neutral-600 rounded text-white"><Plus className="w-4 h-4" /></button>
                  <button onClick={() => removeItem(item.id)} className="w-7 h-7 flex items-center justify-center bg-red-500/20 rounded text-red-500"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-neutral-700 space-y-2">
          <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>Ksh {currentOrder.subtotal.toFixed(2)}</span></div>
          
          <div className="flex justify-between text-gray-400"><span>Tax (VAT 16%)</span><span>Ksh {currentOrder.tax.toFixed(2)}</span></div>
          <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-neutral-700"><span>Total</span><span>Ksh {currentOrder.total.toFixed(2)}</span></div>
        </div>

        <div className="p-4 border-t border-neutral-700 space-y-2">
          <div className="flex gap-2">
            <button onClick={holdOrder} disabled={currentOrder.items.length === 0} className="flex-1 flex items-center justify-center gap-2 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 disabled:opacity-50"><Pause className="w-4 h-4" /> Hold</button>
            <button onClick={clearOrder} disabled={currentOrder.items.length === 0} className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 disabled:opacity-50"><Trash2 className="w-4 h-4" /> Clear</button>
          </div>
           <button onClick={convertToBill} disabled={currentOrder.items.length === 0} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-bold"><FileText className="w-5 h-5" /> Convert to Bill</button>
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerSelect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 rounded-xl p-6 w-[450px] border border-neutral-700">
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold text-white">Select Customer</h2><button onClick={() => setShowCustomerSelect(false)} className="text-gray-400 hover:text-white text-2xl">×</button></div>
            <div className="relative mb-4"><Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Search customers..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="w-full bg-neutral-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-amber-500" /></div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customers.filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)).map((customer) => (
                <button key={customer.id} onClick={() => { updatePricesWithCustomer(customer); setShowCustomerSelect(false); setCustomerSearch(""); }} className={`w-full flex items-center justify-between p-3 rounded-lg text-left ${currentOrder.customer.id === customer.id ? "bg-blue-500 text-white" : "bg-neutral-700 text-white hover:bg-neutral-600"}`}>
                  <div><p className="font-medium">{customer.name}</p><p className="text-sm opacity-70">{customer.phone || "Walk-in"}</p></div>
                   <span className={`px-2 py-1 rounded-full text-xs ${customer.tier === "VIP" ? "bg-purple-500/30 text-purple-300" : customer.tier === "Gold" ? "bg-blue-500/30 text-yellow-300" : customer.tier === "Silver" ? "bg-gray-400/30 text-gray-300" : "bg-blue-700/30 text-amber-300"}`}>{customer.tier}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Held Orders Modal */}
      {showHeldOrders && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 rounded-xl p-6 w-[450px] border border-neutral-700">
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold text-white">Held Orders</h2><button onClick={() => setShowHeldOrders(false)} className="text-gray-400 hover:text-white text-2xl">×</button></div>
            {heldOrders.length === 0 ? <p className="text-center text-gray-500 py-8">No held orders</p> : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {heldOrders.map((order) => (
                  <div key={order.id} className="bg-neutral-700 p-3 rounded-lg flex items-center justify-between">
                    <div><p className="text-white font-medium">{order.id} ({order.customer.name})</p><p className="text-sm text-gray-400">{order.items.length} items | Ksh {order.total.toFixed(2)}</p><p className="text-xs text-gray-500">{order.heldAt ? new Date(order.heldAt).toLocaleString() : ""}</p></div>
                    <button onClick={() => resumeOrder(order)} className="flex items-center gap-2 px-3 py-2 bg-green-500 text-black rounded-lg hover:bg-green-600"><Play className="w-4 h-4" /> Resume</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showChangeInput && billedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 rounded-xl p-6 w-[400px] border border-neutral-700">
            <h2 className="text-xl font-bold text-white mb-4">Payment</h2>
            <div className="text-center mb-6"><p className="text-gray-400">Total Due</p><p className="text-4xl font-bold text-white">Ksh {billedOrder.total.toFixed(2)}</p></div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => setPaymentMethod("cash")} className={`flex flex-col items-center gap-1 py-3 rounded-lg ${paymentMethod === "cash" ? "bg-green-500 text-black" : "bg-neutral-700 text-gray-300"}`}><Banknote className="w-6 h-6" /><span className="text-sm">Cash</span></button>
              <button onClick={() => setPaymentMethod("mpesa")} className={`flex flex-col items-center gap-1 py-3 rounded-lg ${paymentMethod === "mpesa" ? "bg-green-500 text-black" : "bg-neutral-700 text-gray-300"}`}><Smartphone className="w-6 h-6" /><span className="text-sm">M-Pesa</span></button>
              <button onClick={() => {
                  const availableCredit = billedOrder!.customer.creditLimit - billedOrder!.customer.creditUsed;
                  if (availableCredit < billedOrder!.total) {
                    alert(`Insufficient credit. Available: Ksh ${availableCredit.toFixed(2)}`);
                    return;
                  }
                  setPaymentMethod("account");
                }} className={`flex flex-col items-center gap-1 py-3 rounded-lg ${paymentMethod === "account" ? "bg-blue-500 text-white" : "bg-neutral-700 text-gray-300"}`}><CreditCard className="w-6 h-6" /><span className="text-sm">Account</span></button>
            </div>
            {paymentMethod !== "account" && (
              <>
                <div className="mb-4"><label className="text-gray-400 text-sm">Amount Received</label><input type="number" value={changeAmount} onChange={(e) => setChangeAmount(e.target.value)} placeholder="Ksh 0.00" className="w-full bg-neutral-700 text-white text-2xl text-center px-4 py-3 rounded-lg mt-1" autoFocus /></div>
                {parseFloat(changeAmount) > billedOrder.total && <div className="mb-4 p-3 bg-green-500/20 rounded-lg text-center"><p className="text-gray-400 text-sm">Change</p><p className="text-2xl font-bold text-green-500">Ksh {getChange().toFixed(2)}</p></div>}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[100, 500, 1000, 2000].map((amt) => <button key={amt} onClick={() => setChangeAmount(String(amt))} className="py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600">+{amt}</button>)}
                  <button onClick={() => setChangeAmount(String(Math.ceil(billedOrder.total / 100) * 100))} className="py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 col-span-2">Exact</button>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setShowChangeInput(false); setBilledOrder(null); }} className="flex-1 py-3 bg-neutral-700 text-white rounded-lg">Cancel</button>
              {paymentMethod === "account" ? (
                <button onClick={completeSale} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600"><CheckCircle className="w-5 h-5" /> Charge to Account</button>
              ) : (
                <button onClick={completeSale} disabled={parseFloat(changeAmount) < billedOrder.total} className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-black rounded-lg font-bold hover:bg-green-600 disabled:opacity-50"><CheckCircle className="w-5 h-5" /> Complete</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && billedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 rounded-xl p-6 w-96 border border-neutral-700">
            <div className="text-center mb-6"><CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" /><h2 className="text-2xl font-bold text-white">Payment Complete!</h2><p className="text-gray-400">Order {billedOrder.id}</p></div>
            <div className="border-t border-b border-neutral-700 py-4 mb-4 space-y-2">
              <div className="flex justify-between text-gray-400 text-sm"><span>Customer</span><span>{billedOrder.customer.name}</span></div>
              <div className="flex justify-between text-gray-400 text-sm"><span>Items</span><span>{billedOrder.items.length}</span></div>
              <div className="flex justify-between text-gray-400 text-sm"><span>Paid via</span><span className="capitalize">{paymentMethod === "account" ? "Account (Credit)" : paymentMethod}</span></div>
            </div>
            <div className="flex justify-between text-white text-2xl font-bold mb-6"><span>Total Paid</span><span>Ksh {billedOrder.total.toFixed(2)}</span></div>
            <div className="text-center text-green-400 mb-4">+{Math.floor(billedOrder.total / 10)} points earned!</div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600"><Printer className="w-5 h-5" /> Print</button>
               <button onClick={() => { setShowReceipt(false); setBilledOrder(null); setChangeAmount(""); }} className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600">New Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}