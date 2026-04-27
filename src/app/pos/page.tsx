"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  id: string;
  name: string;
  basePrice: number; // Price per base unit
  quantity: number;
  category: string;
  unit: string;
  conversionFactor: number; // Conversion factor for selected unit relative to base unit
  unitPrice: number; // Computed: basePrice * conversionFactor (used for display)
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

interface ProductWithUOM {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  uom: {
    baseUnit: string;
    units: {
      name: string;
      abbreviation: string;
      isBase: boolean;
      conversionFactor: number;
      isActive: boolean;
      sellPrice: number;
      costPrice?: number;
    }[];
  };
}

const tierDiscounts: Record<Customer["tier"], number> = {
  Bronze: 0,
  Silver: 0,
  Gold: 0,
  VIP: 0,
};

const initialCustomers: Customer[] = [
  { id: 1, name: "Walk-in Customer", phone: "", tier: "Bronze", creditLimit: 0, creditUsed: 0, points: 0 },
  { id: 2, name: "John Doe", phone: "+254 712 345 678", tier: "Gold", creditLimit: 10000, creditUsed: 2500, points: 4500 },
  { id: 3, name: "Jane Smith", phone: "+254 723 456 789", tier: "VIP", creditLimit: 50000, creditUsed: 12000, points: 15000 },
  { id: 4, name: "Mike Johnson", phone: "+254 734 567 890", tier: "Silver", creditLimit: 5000, creditUsed: 0, points: 1850 },
  { id: 5, name: "Sarah Williams", phone: "+254 745 678 901", tier: "Bronze", creditLimit: 2000, creditUsed: 0, points: 280 },
  { id: 6, name: "Tom Brown", phone: "+254 756 789 012", tier: "Gold", creditLimit: 15000, creditUsed: 3000, points: 6500 },
  { id: 7, name: "Emily Davis", phone: "+254 767 890 123", tier: "VIP", creditLimit: 30000, creditUsed: 8000, points: 10500 },
];

const categories = ["All", "Bourbon", "Vodka", "Scotch", "Champagne", "Cognac", "Tequila", "Beer", "Shot", "Wine", "Mixer"];

function generateOrderId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return "ORD-" + timestamp.substring(timestamp.length - 4) + random.toUpperCase();
}

const initialOrder: Order = {
  id: "",
  customer: {
    id: 1,
    name: "Walk-in Customer",
    phone: "",
    tier: "Bronze",
    creditLimit: 0,
    creditUsed: 0,
    points: 0,
  },
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
  const [heldOrders, setHeldOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [products, setProducts] = useState<ProductWithUOM[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isHappyHour, setIsHappyHour] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const searchInputRef = useRef<HTMLInputElement>(null);
   const searchDropdownRef = useRef<HTMLDivElement>(null);
   const incrementButtonRef = useRef<HTMLButtonElement>(null);
   const focusedItemId = useRef<string | null>(null);
  
   const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa" | "account">("cash");
   const [showReceipt, setShowReceipt] = useState(false);
   const [showCustomerSelect, setShowCustomerSelect] = useState(false);
   const [showHeldOrders, setShowHeldOrders] = useState(false);
   const [customerSearch, setCustomerSearch] = useState("");
   const [billedOrder, setBilledOrder] = useState<Order | null>(null);
   const [changeAmount, setChangeAmount] = useState("");
   const [showChangeInput, setShowChangeInput] = useState(false);
   const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    tier: "Bronze" as "Bronze" | "Silver" | "Gold" | "VIP",
  });
  const [customerError, setCustomerError] = useState<string>("");

   useEffect(() => {
     const initializeData = async () => {
       try {
         const [customersRes, productsRes] = await Promise.all([
           fetch("/api/customers"),
           fetch("/api/products"),
         ]);
         
         if (customersRes.ok) {
           const customersData = await customersRes.json();
           setCustomers(customersData);
         } else {
           console.error("Failed to fetch customers, using initial data");
         }
         
          if (productsRes.ok) {
            const productsData = await productsRes.json();
            setProducts(productsData);
          } else {
            console.error("Failed to fetch products, using initial data");
          }
       } catch (error) {
         console.error("Error fetching data:", error);
       } finally {
         setLoadingCustomers(false);
         setLoadingProducts(false);
       }
     };

     initializeData();
   }, []);

   // Handle click outside to close search dropdown
   useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
       if (
         searchDropdownRef.current && 
         !searchDropdownRef.current.contains(event.target as Node) &&
         searchInputRef.current &&
         !searchInputRef.current.contains(event.target as Node)
       ) {
         setIsSearchOpen(false);
       }
     };

     if (isSearchOpen) {
       document.addEventListener('mousedown', handleClickOutside);
     }

     return () => {
       document.removeEventListener('mousedown', handleClickOutside);
     };
   }, [isSearchOpen]);

   // Focus the increment button of newly added item
   useEffect(() => {
     if (focusedItemId.current && incrementButtonRef.current) {
       incrementButtonRef.current.focus();
       focusedItemId.current = null;
     }
   }, [currentOrder.items]);

  useEffect(() => {
    if (!loadingCustomers && !mounted && customers.length > 0) {
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
    }
  }, [loadingCustomers, mounted, customers]);

  const filteredProducts = useMemo(() => {
    // If no products loaded yet, return empty array
    if (!products || products.length === 0) {
      return [];
    }
    
    // Filter by category
    const categoryFiltered = activeCategory === "All" 
      ? products 
      : products.filter(p => p.category === activeCategory);
    
    // If no search term, return category-filtered results
    if (!searchTerm || searchTerm.trim() === "") {
      console.log("No search term, returning", categoryFiltered.length, "products out of", products.length, "total");
      return categoryFiltered;
    }
    
    // Filter by search term
    const searchLower = searchTerm.toLowerCase().trim();
    const result = categoryFiltered.filter((p) => {
      const productName = p.name ? p.name.toLowerCase() : "";
      return productName.includes(searchLower);
    });
    
    console.log(`Search "${searchTerm}": found`, result.length, "products out of", products.length, "total");
    return result;
  }, [products, searchTerm, activeCategory]);

    const updatePricesWithCustomer = (customer: Customer) => {
      const newItems = currentOrder.items.map((item) => {
        const product = products.find((p) => p.id === item.id);
        if (!product) return item;

        // Find the currently selected unit (fallback to base unit)
        const selectedUnit = product.uom.units.find(u => u.abbreviation === item.unit)
          || product.uom.units.find(u => u.isBase)
          || product.uom.units[0];

        // Use the predefined fixed price from unit configuration (no computation)
        const unitPrice = selectedUnit.sellPrice;

        // Apply happy hour if applicable (only for Shot category)
        let finalUnitPrice = unitPrice;
        if (isHappyHour && product.category === "Shot") {
          finalUnitPrice = unitPrice * 0.8;
        }

        return {
          ...item,
          basePrice: product.price,
          unitPrice: finalUnitPrice,
          conversionFactor: selectedUnit.conversionFactor,
          unit: selectedUnit.abbreviation,
        };
      });

      const grossSubtotal = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const netSubtotal = grossSubtotal / 1.16;
      const tax = grossSubtotal - netSubtotal;

      setCurrentOrder({ ...currentOrder, id: getOrderId(customer.name), items: newItems, customer, subtotal: netSubtotal, tierDiscount: 0, tax, total: grossSubtotal });
    };

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      setCustomerError("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomer.name.trim(),
          phone: newCustomer.phone.trim(),
          email: newCustomer.email.trim(),
          tier: newCustomer.tier,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create customer");
      }

      const createdCustomer = await response.json();
      setCustomers([...customers, createdCustomer]);
      setNewCustomer({
        name: "",
        phone: "",
        email: "",
        tier: "Bronze",
      });
      setCustomerError("");
      setShowNewCustomer(false);
      setCustomerSearch("");
    } catch (error: any) {
      setCustomerError(error.message || "Failed to create customer");
    }
  };

   const addToOrder = (product: ProductWithUOM) => {
      // Get the base unit (isBase: true) as default
      const baseUnit = product.uom.units.find(u => u.isBase) || product.uom.units[0];

      // Use predefined fixed price from unit configuration (no computation)
      const unitPrice = baseUnit.sellPrice;

      // Apply happy hour if applicable (shots only)
      let finalUnitPrice = unitPrice;
      if (isHappyHour && product.category === "Shot") finalUnitPrice = finalUnitPrice * 0.8;

      const newItems = [...currentOrder.items];
      const existing = newItems.find((item) => item.id === product.id);
      let isNewItem = false;

      if (existing) existing.quantity += 1;
      else {
        newItems.push({
          id: product.id,
          name: product.name,
          basePrice: product.price,
          quantity: 1,
          category: product.category,
          unit: baseUnit.abbreviation,
          conversionFactor: baseUnit.conversionFactor,
          unitPrice: finalUnitPrice,
        });
        isNewItem = true;
      }

      const grossSubtotal = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const netSubtotal = grossSubtotal / 1.16;
      const tax = grossSubtotal - netSubtotal;
      setCurrentOrder({ ...currentOrder, items: newItems, subtotal: netSubtotal, tax, total: grossSubtotal });
    };

   const updateQuantity = (id: string, delta: number) => {
     const newItems = currentOrder.items.map((item) => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter((item) => item.quantity > 0);
     const grossSubtotal = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
     const netSubtotal = grossSubtotal / 1.16;
     const tax = grossSubtotal - netSubtotal;
     setCurrentOrder({ ...currentOrder, items: newItems, subtotal: netSubtotal, tax, total: grossSubtotal });
   };

    const changeUnit = (id: string, unitAbbreviation: string) => {
      const newItems = currentOrder.items.map((item) => {
        if (item.id !== id) return item;

        // Find the product to get base price and available units
        const product = products.find(p => p.id === item.id);
        if (!product) return item;

        // Find the selected unit
        const selectedUnit = product.uom.units.find(u => u.abbreviation === unitAbbreviation);
        if (!selectedUnit) return item;

        // Use predefined fixed price from unit configuration (no computation)
        const newConversionFactor = selectedUnit.conversionFactor;
        const newUnitPrice = selectedUnit.sellPrice;

        // Apply happy hour discount if applicable (shots only)
        let finalUnitPrice = newUnitPrice;
        if (isHappyHour && product.category === "Shot") {
          finalUnitPrice = finalUnitPrice * 0.8;
        }

        return {
          ...item,
          unit: unitAbbreviation,
          conversionFactor: newConversionFactor,
          unitPrice: finalUnitPrice,
        };
      });

      const grossSubtotal = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const netSubtotal = grossSubtotal / 1.16;
      const tax = grossSubtotal - netSubtotal;
      setCurrentOrder({ ...currentOrder, items: newItems, subtotal: netSubtotal, tax, total: grossSubtotal });
    };

   const removeItem = (id: string) => {
     const newItems = currentOrder.items.filter((item) => item.id !== id);
     const grossSubtotal = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
     const netSubtotal = grossSubtotal / 1.16;
     const tax = grossSubtotal - netSubtotal;
     setCurrentOrder({ ...currentOrder, items: newItems, subtotal: netSubtotal, tax, total: grossSubtotal });
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
    <div className="h-[calc(100vh-3rem)] flex flex-col gap-1">
      {/* Top Section - Products - Ultra Compact Layout */}
      <div className="flex-1 flex flex-col gap-1 min-h-0">
        {/* Header Row - All in one horizontal line */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-bold text-white truncate">New Order</h1>
            <span className="text-xs text-gray-400 truncate hidden sm:inline">{mounted ? currentOrder.id : '...'}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setShowHeldOrders(true)} className="flex items-center gap-1 px-1.5 py-1 bg-neutral-700 text-white text-xs rounded hover:bg-neutral-600">
              <Pause className="w-3 h-3" /> <span className="hidden sm:inline">{heldOrders.length}</span>
            </button>
            <button onClick={() => setIsHappyHour(!isHappyHour)} className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs font-medium ${isHappyHour ? "bg-blue-500 text-white" : "bg-neutral-700 text-gray-300 hover:bg-neutral-600"}`}>
              <Flame className="w-3 h-3" /> <span className="hidden sm:inline">HH</span>
            </button>
          </div>
        </div>

        {/* Controls Row - Single horizontal line with all controls */}
        <div className="flex items-center gap-1">
          <button onClick={() => setShowCustomerSelect(true)} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium shrink-0 ${currentOrder.customer.tier === "VIP" ? "bg-purple-500 text-white" : currentOrder.customer.tier === "Gold" ? "bg-blue-500 text-white" : currentOrder.customer.tier === "Silver" ? "bg-gray-400 text-black" : "bg-neutral-700 text-gray-300 hover:bg-neutral-600"}`}>
            <Users className="w-3 h-3" /> <span className="truncate max-w-[80px]">{currentOrder.customer.name}</span>
          </button>

          {/* Search with floating dropdown overlay */}
          <div className="relative flex-1 min-w-0">
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full bg-neutral-800 border border-neutral-700 text-white text-xs px-2 py-1 rounded focus:outline-none focus:border-blue-500"
            />

            {/* Floating search results dropdown */}
            {isSearchOpen && (
              <div 
                ref={searchDropdownRef}
                className="absolute left-0 right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded shadow-lg z-[100] max-h-60 overflow-y-auto"
              >
                {loadingProducts ? (
                  <div className="p-2 text-center text-gray-500 text-xs">
                    <p>Loading...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-2 text-center text-gray-500 text-xs">
                    <p>No products</p>
                  </div>
                ) : (
                  <div className="p-1">
                    {filteredProducts.map((product) => {
                      const baseUnit = product.uom.units.find(u => u.isBase) || product.uom.units[0];
                      return (
                        <button 
                          key={product.id} 
                          onClick={() => addToOrder(product)} 
                          className="w-full text-left p-2 hover:bg-neutral-700 rounded transition-colors"
                        >
                          <p className="text-white text-xs truncate">{product.name}</p>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-amber-500 text-xs font-bold">Ksh {(product.price || 0).toFixed(2)}</p>
                            <p className="text-gray-500 text-[10px]">Stock: {product.stock} {baseUnit?.abbreviation || 'u'}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Compact Category Filters */}
        <div className="flex gap-1 flex-wrap">
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${activeCategory === cat ? "bg-blue-500 text-white" : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Compact Shopping Cart - stretched to fill remaining space */}
        <div className="flex-1 flex flex-col bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden min-h-0">
          {/* Cart Header - Column labels */}
          <div className="grid grid-cols-12 gap-1 px-2 py-1 bg-neutral-900/70 border-b border-neutral-700 text-[10px] font-semibold text-gray-400 uppercase tracking-wider items-center">
            <div className="col-span-4">Item</div>
            <div className="col-span-2 text-center">Unit</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-1 text-center">Amt</div>
            <div className="col-span-1"></div>
          </div>

          {/* Cart Items - Single-row table layout */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {currentOrder.items.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <ShoppingCart className="w-6 h-6 mx-auto mb-1 opacity-50" />
                <p className="text-xs">Empty</p>
              </div>
            ) : (
               <div className="divide-y divide-neutral-700/50">
                {currentOrder.items.map((item) => {
                  const product = products.find(p => p.id === item.id);
                  const availableUnits = product?.uom.units.filter(u => u.isActive) || [];
                  const itemTotal = (item.unitPrice || 0) * item.quantity;
                  const isOnSale = product?.category === "Shot" && isHappyHour;
                  
                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-1 px-2 py-1.5 items-center text-xs">
                      {/* Item Name */}
                      <div className={`col-span-4 truncate ${isOnSale ? "text-amber-500 font-bold text-base" : "text-white"}`}>
                        {item.name}
                      </div>
                      
                      {/* Unit Selector */}
                      <div className="col-span-2">
                        <select 
                          value={item.unit}
                          onChange={(e) => changeUnit(item.id, e.target.value)}
                          className="w-full bg-neutral-700 text-gray-300 text-[10px] px-1 py-0.5 rounded border border-neutral-600 focus:outline-none focus:border-blue-500 cursor-pointer h-5"
                        >
                          {availableUnits.map(unit => (
                            <option key={unit.abbreviation} value={unit.abbreviation}>
                              {unit.abbreviation}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Unit Price */}
                      <div className={`col-span-2 text-right ${isOnSale ? "text-amber-600 font-bold text-base" : "text-gray-400"}`}>
                        Ksh {(item.unitPrice || 0).toFixed(0)}
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="col-span-2 flex items-center justify-center gap-0.5">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center bg-neutral-700 rounded text-white text-xs hover:bg-neutral-600"><Minus className="w-3 h-3" /></button>
                        <span className="text-white text-xs w-4 text-center font-mono">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center bg-neutral-700 rounded text-white text-xs hover:bg-neutral-600"><Plus className="w-3 h-3" /></button>
                      </div>
                      
                      {/* Amount (line total) */}
                      <div className={`col-span-1 text-right ${isOnSale ? "text-amber-600 font-bold text-base" : "text-amber-500 font-bold"}`}>
                        Ksh {itemTotal.toFixed(0)}
                      </div>
                      
                      {/* Delete button */}
                      <div className="col-span-1 flex justify-end">
                        <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-500 p-0.5"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Compact Summary Footer */}
          <div className="border-t border-neutral-700 px-2 py-1.5 space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Subtotal</span><span>Ksh {(currentOrder.subtotal || 0).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>VAT 16%</span><span>Ksh {(currentOrder.tax || 0).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-neutral-700">
              <span>Total</span><span>Ksh {(currentOrder.total || 0).toFixed(0)}</span>
            </div>
          </div>

          {/* Compact Action Buttons */}
          <div className="px-2 py-1.5 border-t border-neutral-700">
            <div className="flex gap-1 mb-1">
              <button onClick={holdOrder} disabled={currentOrder.items.length === 0} className="flex-1 flex items-center justify-center gap-1 py-1 bg-neutral-700 text-white text-xs rounded hover:bg-neutral-600 disabled:opacity-50"><Pause className="w-3 h-3" /> Hold</button>
              <button onClick={clearOrder} disabled={currentOrder.items.length === 0} className="flex-1 flex items-center justify-center gap-1 py-1 bg-red-500/20 text-red-500 text-xs rounded hover:bg-red-500/30 disabled:opacity-50"><Trash2 className="w-3 h-3" /> Clear</button>
            </div>
            <button onClick={convertToBill} disabled={currentOrder.items.length === 0} className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 font-bold"><FileText className="w-4 h-4" /> Bill</button>
          </div>
        </div>
      </div>

{showCustomerSelect && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-neutral-800 rounded-xl p-6 w-96 border border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Select Customer</h2>
            <button onClick={() => setShowCustomerSelect(false)}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="mb-4">
            <input type="text" placeholder="Search customers..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500" />
            <button onClick={() => setShowNewCustomer(!showNewCustomer)} className="w-full py-2 mt-2 text-blue-400 text-sm hover:text-blue-300">+ Create new customer</button>
          </div>
          {showNewCustomer && (
            <div className="mb-4">
              <input type="text" placeholder="Name" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mb-2 focus:outline-none focus:border-blue-500" />
              <input type="text" placeholder="Phone" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg mb-2 focus:outline-none focus:border-blue-500" />
              {customerError && <p className="text-red-500 text-sm mb-2">{customerError}</p>}
              <button onClick={handleAddCustomer} className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Add Customer</button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto max-h-64">
            {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).map((customer) => (
              <button key={customer.id} onClick={() => { updatePricesWithCustomer(customer); setShowCustomerSelect(false); }} className="w-full text-left p-2 hover:bg-neutral-700 rounded-lg mb-1">
                <p className="text-white">{customer.name}</p>
                <p className="text-gray-400 text-sm">{customer.phone}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Held Orders Modal */}
    {showHeldOrders && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-neutral-800 rounded-xl p-6 w-96 border border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Held Orders</h2>
            <button onClick={() => setShowHeldOrders(false)}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-64">
            {heldOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No held orders</p>
            ) : (
              heldOrders.map((order) => (
                <div key={order.id} className="bg-neutral-700/50 p-3 rounded-lg mb-2">
                  <p className="text-white font-medium">{order.customer.name}</p>
                  <p className="text-gray-400 text-sm">{order.items.length} items</p>
                  <p className="text-amber-500 font-bold">Ksh {order.total.toFixed(2)}</p>
                  <button onClick={() => resumeOrder(order)} className="w-full mt-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Resume</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )}

    {/* Payment Modal */}
    {billedOrder && showChangeInput && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-neutral-800 rounded-xl p-6 w-96 border border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Payment</h2>
            <button onClick={() => { setShowChangeInput(false); setBilledOrder(null); }}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="mb-4 text-center">
            <p className="text-gray-400">Total Amount</p>
            <p className="text-3xl font-bold text-white">Ksh {billedOrder.total.toFixed(2)}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button onClick={() => setPaymentMethod("cash")} className={`flex flex-col items-center gap-1 py-3 rounded-lg ${paymentMethod === "cash" ? "bg-blue-500 text-white" : "bg-neutral-700 text-gray-300"}`}><Banknote className="w-6 h-6" /><span className="text-sm">Cash</span></button>
            <button onClick={() => setPaymentMethod("mpesa")} className={`flex flex-col items-center gap-1 py-3 rounded-lg ${paymentMethod === "mpesa" ? "bg-blue-500 text-white" : "bg-neutral-700 text-gray-300"}`}><Smartphone className="w-6 h-6" /><span className="text-sm">M-Pesa</span></button>
            <button onClick={() => setPaymentMethod("account")} className={`flex flex-col items-center gap-1 py-3 rounded-lg ${paymentMethod === "account" ? "bg-blue-500 text-white" : "bg-neutral-700 text-gray-300"}`}><CreditCard className="w-6 h-6" /><span className="text-sm">Account</span></button>
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