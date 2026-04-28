"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/components/AuthContext";
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
  User,
  LogOut,
  SwitchCamera,
  ArrowRightLeft,
} from "lucide-react";
import EndOfShiftWizard from "@/components/EndOfShiftWizard";

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
  assignedTo?: {
    _id: string;
    name: string;
    role: string;
  };
}

interface Customer {
  _id?: string;
  id?: number | string;
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

interface StaffMember {
  _id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
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

export default function POSPage() {
  const { user, isAuthenticated } = useAuth();
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

  // Staff assignment states
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [showSwitchUserModal, setShowSwitchUserModal] = useState(false);
   const [showHandoverModal, setShowHandoverModal] = useState(false);
   const [showEndOfShiftWizard, setShowEndOfShiftWizard] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
   const [handoverFrom, setHandoverFrom] = useState<StaffMember | null>(null);
   const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

    // Generate order ID with optional staff code
    const getOrderId = useCallback((customerName: string) => {
      const cleanName = customerName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().substring(0, 8);
      const timestamp = Date.now().toString(36);
      const staffCode = currentStaff ? `-${currentStaff.name.substring(0, 3).toUpperCase()}` : "";
      return cleanName + staffCode + "-" + timestamp.substring(timestamp.length - 4);
    }, [currentStaff]);

    // Load held orders from localStorage on mount
    useEffect(() => {
      try {
        const savedHeldOrders = localStorage.getItem("pos_held_orders");
        if (savedHeldOrders) {
          setHeldOrders(JSON.parse(savedHeldOrders));
        }
      } catch (e) {
        console.error("Failed to load held orders from localStorage:", e);
      }
    }, []);

    // Save held orders to localStorage on change
    useEffect(() => {
      try {
        localStorage.setItem("pos_held_orders", JSON.stringify(heldOrders));
      } catch (e) {
        console.error("Failed to save held orders to localStorage:", e);
      }
    }, [heldOrders]);

    // Load held orders from database when staff changes
    useEffect(() => {
      if (!currentStaff) return;
      const loadHeldOrdersFromDB = async () => {
        try {
          const response = await fetch(`/api/orders?status=held&assignedTo=${currentStaff._id}`);
          if (response.ok) {
            const data = await response.json();
            // Replace heldOrders with database state (overwrites localStorage)
            setHeldOrders(data.orders || []);
          }
        } catch (error) {
          console.error("Failed to load held orders from database:", error);
        }
      };
      loadHeldOrdersFromDB();
    }, [currentStaff]);

    useEffect(() => {
      const initializeData = async () => {
        try {
          const [customersRes, productsRes, staffRes] = await Promise.all([
            fetch("/api/customers"),
            fetch("/api/products"),
            fetch("/api/staff"),
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

          if (staffRes.ok) {
            const staffData = await staffRes.json();
            setStaffList(staffData);
            
            // If there's a staff ID in localStorage, use it
            const savedStaffId = localStorage.getItem("pos_current_staff_id");
            if (savedStaffId) {
              const savedStaff = staffData.find((s: StaffMember) => s._id === savedStaffId);
              if (savedStaff) {
                setCurrentStaff(savedStaff);
              } else if (staffData.length > 0) {
                // Fallback to first staff member
                setCurrentStaff(staffData[0]);
                localStorage.setItem("pos_current_staff_id", staffData[0]._id);
              }
            } else if (staffData.length > 0) {
              setCurrentStaff(staffData[0]);
              localStorage.setItem("pos_current_staff_id", staffData[0]._id);
            }
          } else {
            console.error("Failed to fetch staff");
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoadingCustomers(false);
          setLoadingProducts(false);
          setLoadingStaff(false);
          setMounted(true);
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
   }, [loadingCustomers, mounted, customers, getOrderId]);

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

  const holdOrder = async () => {
    if (currentOrder.items.length === 0) return;
    const held: Order = { 
      ...currentOrder, 
      status: "held", 
      heldAt: new Date().toISOString(),
      assignedTo: currentStaff ? { _id: currentStaff._id, name: currentStaff.name, role: currentStaff.role } : undefined,
    };
    try {
      const payload = {
        customerId: currentOrder.customer._id || currentOrder.customer.id || null,
        items: currentOrder.items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.basePrice,
          quantity: item.quantity,
          category: item.category,
          unit: item.unit,
          conversionFactor: item.conversionFactor,
          unitPrice: item.unitPrice,
        })),
        paymentMethod: "cash",
        status: "held",
        assignedTo: currentStaff?._id || null,
        userId: user?._id,
        userName: user?.name,
      };
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to hold order");
      }
      const newOrder = await response.json();
      // Update held order with the saved order ID from DB
      held.id = newOrder.orderId;
    } catch (error) {
      console.error("Failed to save held order to database:", error);
      // Continue with local storage only
    }
    setHeldOrders([held, ...heldOrders]);
    clearOrder();
  };

  const resumeOrder = async (order: Order) => {
    setCurrentOrder({ ...order, status: "draft", createdAt: new Date().toISOString() });
    setHeldOrders(heldOrders.filter((o) => o.id !== order.id));
    setShowHeldOrders(false);
    if (!order.id) return;
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status: "draft" }),
      });
      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to update order status:", error);
        // Not critical, continue
      }
    } catch (error) {
      console.error("Failed to update order status in DB:", error);
    }
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

  // Switch current staff member
  const handleSwitchStaff = (staff: StaffMember) => {
    // Clear current draft order to avoid confusion
    clearOrder();
    setCurrentStaff(staff);
    localStorage.setItem("pos_current_staff_id", staff._id);
    setShowSwitchUserModal(false);
  };

  // Perform handover: transfer held orders from one staff to another
  const handleHandover = async (toStaff: StaffMember) => {
    if (!handoverFrom) return;

    try {
      const ordersToTransfer = selectedOrderIds.length > 0
        ? selectedOrderIds
          : heldOrders.filter(o => (o.customer._id || o.customer.id) !== undefined && o.items.length > 0 && o.assignedTo?._id === handoverFrom._id).map(o => o.id).filter(Boolean);

      if (ordersToTransfer.length === 0) {
        alert("No orders to transfer");
        return;
      }

      const response = await fetch("/api/orders/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromStaffId: handoverFrom._id,
          toStaffId: toStaff._id,
          orderIds: ordersToTransfer,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Handover failed");
      }

      // Update local state: reassign orders to new staff
      setHeldOrders(prev => prev.map(o =>
        ordersToTransfer.includes(o.id)
          ? { ...o, assignedTo: { _id: toStaff._id, name: toStaff.name, role: toStaff.role } }
          : o
      ));

      // Update current staff if handing over from current
      if (handoverFrom._id === currentStaff?._id) {
        setCurrentStaff(toStaff);
        localStorage.setItem("pos_current_staff_id", toStaff._id);
      }

      // Close modals and reset selections
      setShowHandoverModal(false);
      setHandoverFrom(null);
      setSelectedOrderIds([]);
    } catch (error: any) {
      alert(`Handover failed: ${error.message}`);
    }
  };

  // Initiate handover from a specific staff member
  const openHandoverFromStaff = (staff: StaffMember) => {
    setHandoverFrom(staff);
    setSelectedOrderIds([]); // Will select orders when modal opens
    setShowHandoverModal(true);
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col gap-1">
      {/* Top Section - Products - Ultra Compact Layout */}
      <div className="flex-1 flex flex-col gap-1 min-h-0">
         {/* Header Row - All in one horizontal line */}
         <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-base font-bold text-white truncate">New Order</h1>
              <span className="text-sm text-gray-400 truncate hidden sm:inline">{mounted ? currentOrder.id : '...'}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Current Staff Display */}
              {currentStaff && (
                <div className="flex items-center gap-1 px-2 py-1.5 bg-neutral-700 rounded text-sm">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-white hidden sm:inline max-w-[80px] truncate">{currentStaff.name}</span>
                  <span className="text-gray-400 text-xs hidden lg:inline">({currentStaff.role})</span>
                </div>
              )}
              
              <button 
                onClick={() => setShowSwitchUserModal(true)} 
                title="Switch User"
                className="flex items-center gap-1 px-2 py-1.5 bg-neutral-700 text-white text-sm rounded hover:bg-neutral-600"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
              </button>
              
              <button 
                onClick={() => {
                  setHandoverFrom(currentStaff);
                  setShowHandoverModal(true);
                }}
                disabled={!currentStaff}
                title="Waiter Handover"
                className="flex items-center gap-1 px-2 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Handover</span>
               </button>
               
               <button
                 onClick={() => setShowEndOfShiftWizard(true)}
                 disabled={!currentStaff}
                 title="End of Shift"
                 className="flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <FileText className="w-3.5 h-3.5" />
                 <span className="hidden sm:inline">End Shift</span>
               </button>
               
               <button onClick={() => setShowHeldOrders(true)} className="flex items-center gap-1 px-2 py-1.5 bg-neutral-700 text-white text-sm rounded hover:bg-neutral-600">
                <Pause className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{heldOrders.length}</span>
              </button>
              
              <button onClick={() => setIsHappyHour(!isHappyHour)} className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm font-medium ${isHappyHour ? "bg-blue-500 text-white" : "bg-neutral-700 text-gray-300 hover:bg-neutral-600"}`}>
                <Flame className="w-3.5 h-3.5" /> <span className="hidden sm:inline">HH</span>
              </button>
            </div>
         </div>

        {/* Controls Row - Single horizontal line with all controls */}
        <div className="flex items-center gap-1">
          <button onClick={() => setShowCustomerSelect(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium shrink-0 ${currentOrder.customer.tier === "VIP" ? "bg-purple-500 text-white" : currentOrder.customer.tier === "Gold" ? "bg-blue-500 text-white" : currentOrder.customer.tier === "Silver" ? "bg-gray-400 text-black" : "bg-neutral-700 text-gray-300 hover:bg-neutral-600"}`}>
            <Users className="w-3.5 h-3.5" /> <span className="truncate max-w-[80px]">{currentOrder.customer.name}</span>
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
               className="w-full bg-neutral-800 border border-neutral-700 text-white text-sm px-3 py-1.5 rounded focus:outline-none focus:border-blue-500"
             />

            {/* Floating search results dropdown */}
            {isSearchOpen && (
              <div 
                ref={searchDropdownRef}
                className="absolute left-0 right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded shadow-lg z-[100] max-h-60 overflow-y-auto"
              >
                 {loadingProducts ? (
                   <div className="p-3 text-center text-gray-500 text-sm">
                     <p>Loading...</p>
                   </div>
                 ) : filteredProducts.length === 0 ? (
                   <div className="p-3 text-center text-gray-500 text-sm">
                     <p>No products</p>
                   </div>
                 ) : (
                   <div className="p-2">
                     {filteredProducts.map((product) => {
                       const baseUnit = product.uom.units.find(u => u.isBase) || product.uom.units[0];
                       return (
                         <button 
                           key={product.id} 
                           onClick={() => addToOrder(product)} 
                           className="w-full text-left p-2.5 hover:bg-neutral-700 rounded transition-colors"
                         >
                           <p className="text-white text-sm truncate">{product.name}</p>
                           <div className="flex items-center justify-between mt-1">
                             <p className="text-amber-500 text-sm font-bold">Ksh {(product.price || 0).toFixed(2)}</p>
                             <p className="text-gray-500 text-xs">Stock: {product.stock} {baseUnit?.abbreviation || 'u'}</p>
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
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={`px-2 py-1 rounded text-sm font-medium ${activeCategory === cat ? "bg-blue-500 text-white" : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Compact Shopping Cart - stretched to fill remaining space */}
        <div className="flex-1 flex flex-col bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden min-h-0">
          {/* Cart Header - Column labels */}
          <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-neutral-900/70 border-b border-neutral-700 text-sm font-semibold text-gray-400 uppercase tracking-wider items-center">
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
              <div className="text-center py-6 text-gray-500">
                <ShoppingCart className="w-8 h-8 mx-auto mb-1.5 opacity-50" />
                <p className="text-sm">Empty</p>
              </div>
            ) : (
               <div className="divide-y divide-neutral-700/50">
                 {currentOrder.items.map((item) => {
                   const product = products.find(p => p.id === item.id);
                   const availableUnits = product?.uom.units.filter(u => u.isActive) || [];
                   const itemTotal = (item.unitPrice || 0) * item.quantity;
                   const isOnSale = product?.category === "Shot" && isHappyHour;
                   
                   return (
                     <div key={item.id} className="grid grid-cols-12 gap-1 px-3 py-2 items-center text-sm font-bold">
                       {/* Item Name */}
                       <div className={`col-span-4 truncate ${isOnSale ? "text-amber-500 text-base" : "text-white"}`}>
                         {item.name}
                       </div>
                       
                       {/* Unit Selector */}
                       <div className="col-span-2">
                         <select 
                           value={item.unit}
                           onChange={(e) => changeUnit(item.id, e.target.value)}
                           className="w-full bg-neutral-700 text-gray-300 text-xs px-1.5 py-1 rounded border border-neutral-600 focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
                         >
                            {availableUnits.map((unit, idx) => (
                              <option key={unit.abbreviation || idx} value={unit.abbreviation}>
                                {unit.abbreviation}
                              </option>
                            ))}
                         </select>
                       </div>
                       
                       {/* Unit Price */}
                       <div className={`col-span-2 text-right ${isOnSale ? "text-amber-600 text-base" : "text-gray-300"}`}>
                         Ksh {(item.unitPrice || 0).toFixed(0)}
                       </div>
                       
                       {/* Quantity Controls */}
                       <div className="col-span-2 flex items-center justify-center gap-1">
                         <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-neutral-700 rounded text-white text-sm hover:bg-neutral-600"><Minus className="w-3.5 h-3.5" /></button>
                         <span className="text-white text-sm w-5 text-center font-mono font-bold">{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-neutral-700 rounded text-white text-sm hover:bg-neutral-600"><Plus className="w-3.5 h-3.5" /></button>
                       </div>
                       
                       {/* Amount (line total) */}
                       <div className={`col-span-1 text-right ${isOnSale ? "text-amber-600 text-base" : "text-amber-500"}`}>
                         Ksh {itemTotal.toFixed(0)}
                       </div>
                       
                       {/* Delete button */}
                       <div className="col-span-1 flex justify-end">
                         <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-500 p-0.5 font-bold"><X className="w-4 h-4" /></button>
                       </div>
                     </div>
                   );
                 })}
              </div>
            )}
          </div>

          {/* Compact Summary Footer */}
          <div className="border-t border-neutral-700 px-3 py-2 space-y-1">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span><span>Ksh {(currentOrder.subtotal || 0).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>VAT 16%</span><span>Ksh {(currentOrder.tax || 0).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white pt-1 border-t border-neutral-700">
              <span>Total</span><span>Ksh {(currentOrder.total || 0).toFixed(0)}</span>
            </div>
          </div>

          {/* Compact Action Buttons */}
          <div className="px-3 py-2 border-t border-neutral-700">
            <div className="flex gap-1.5 mb-1.5">
              <button onClick={holdOrder} disabled={currentOrder.items.length === 0} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-green-500 text-white text-sm rounded-full hover:bg-green-600 disabled:opacity-50 disabled:hover:bg-green-500 transition-colors"><Pause className="w-3.5 h-3.5" /> Hold</button>
              <button onClick={clearOrder} disabled={currentOrder.items.length === 0} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-500/20 text-red-500 text-sm rounded hover:bg-red-500/30 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /> Clear</button>
            </div>
            <button onClick={convertToBill} disabled={currentOrder.items.length === 0} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-500 text-white text-base rounded-lg hover:bg-blue-600 disabled:opacity-50 font-bold"><FileText className="w-4 h-4" /> Bill</button>
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
            <input type="text" placeholder="Search customers..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="w-full bg-neutral-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
            <button onClick={() => setShowNewCustomer(!showNewCustomer)} className="w-full py-2 mt-2 text-blue-400 text-sm hover:text-blue-300">+ Create new customer</button>
          </div>
          {showNewCustomer && (
            <div className="mb-4">
              <input type="text" placeholder="Name" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full bg-neutral-700 text-white px-4 py-2.5 rounded-lg mb-2 focus:outline-none focus:border-blue-500 text-sm" />
              <input type="text" placeholder="Phone" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full bg-neutral-700 text-white px-4 py-2.5 rounded-lg mb-2 focus:outline-none focus:border-blue-500 text-sm" />
              {customerError && <p className="text-red-500 text-sm mb-2">{customerError}</p>}
              <button onClick={handleAddCustomer} className="w-full py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">Add Customer</button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto max-h-64">
            {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).map((customer) => (
              <button key={customer._id || customer.id} onClick={() => { updatePricesWithCustomer(customer); setShowCustomerSelect(false); }} className="w-full text-left p-2.5 hover:bg-neutral-700 rounded-lg mb-1">
                <p className="text-white text-sm">{customer.name}</p>
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
                <p className="text-center text-gray-500 py-8 text-sm">No held orders</p>
              ) : (
                heldOrders
                  .filter(o => 
                    // Show orders assigned to current staff, or unassigned (legacy orders)
                    !o.assignedTo || o.assignedTo._id === currentStaff?._id
                  )
                  .map((order) => (
                    <div key={order.id} className="bg-neutral-700/50 p-3 rounded-lg mb-2">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-medium text-sm">{order.customer.name}</p>
                          <p className="text-gray-400 text-xs">{order.items.length} items • Ksh {order.total.toFixed(2)}</p>
                          {order.assignedTo && (
                            <p className="text-blue-400 text-xs mt-1">
                              Assigned to: {order.assignedTo.name}
                            </p>
                          )}
                        </div>
                        {currentStaff && order.assignedTo && order.assignedTo._id !== currentStaff._id && (
                          <button
                            onClick={() => openHandoverFromStaff(order.assignedTo!)}
                            title="Transfer this order"
                            className="p-1 text-green-400 hover:text-green-300"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
               </button>

                        )}
                      </div>
                      <button 
                        onClick={() => resumeOrder(order)} 
                        className="w-full mt-2 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                      >
                        Resume
                      </button>
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
             <p className="text-gray-400 text-sm">Total Amount</p>
             <p className="text-3xl font-bold text-white">Ksh {billedOrder.total.toFixed(2)}</p>
           </div>
           <div className="grid grid-cols-3 gap-2 mb-4">
             <button onClick={() => setPaymentMethod("cash")} className={`flex flex-col items-center gap-1 py-3 rounded-lg ${paymentMethod === "cash" ? "bg-blue-500 text-white" : "bg-neutral-700 text-gray-300"}`}><Banknote className="w-6 h-6" /><span className="text-base">Cash</span></button>
             <button onClick={() => setPaymentMethod("mpesa")} className={`flex flex-col items-center gap-1 py-3 rounded-lg ${paymentMethod === "mpesa" ? "bg-blue-500 text-white" : "bg-neutral-700 text-gray-300"}`}><Smartphone className="w-6 h-6" /><span className="text-base">M-Pesa</span></button>
             <button onClick={() => setPaymentMethod("account")} className={`flex flex-col items-center gap-1 py-3 rounded-lg ${paymentMethod === "account" ? "bg-blue-500 text-white" : "bg-neutral-700 text-gray-300"}`}><CreditCard className="w-6 h-6" /><span className="text-base">Account</span></button>
           </div>
           {paymentMethod !== "account" && (
             <>
               <div className="mb-4"><label className="text-gray-400 text-sm">Amount Received</label><input type="number" value={changeAmount} onChange={(e) => setChangeAmount(e.target.value)} placeholder="Ksh 0.00" className="w-full bg-neutral-700 text-white text-2xl text-center px-4 py-3 rounded-lg mt-1" autoFocus /></div>
               {parseFloat(changeAmount) > billedOrder.total && <div className="mb-4 p-3 bg-green-500/20 rounded-lg text-center"><p className="text-gray-400 text-sm">Change</p><p className="text-2xl font-bold text-green-500">Ksh {getChange().toFixed(2)}</p></div>}
               <div className="grid grid-cols-4 gap-2 mb-4">
                 {[100, 500, 1000, 2000].map((amt) => <button key={amt} onClick={() => setChangeAmount(String(amt))} className="py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 text-sm">+{amt}</button>)}
                 <button onClick={() => setChangeAmount(String(Math.ceil(billedOrder.total / 100) * 100))} className="py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 col-span-2 text-sm">Exact</button>
               </div>
             </>
           )}
           <div className="flex gap-2">
             <button onClick={() => { setShowChangeInput(false); setBilledOrder(null); }} className="flex-1 py-3 bg-neutral-700 text-white rounded-lg text-sm">Cancel</button>
             {paymentMethod === "account" ? (
               <button onClick={completeSale} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 text-sm"><CheckCircle className="w-5 h-5" /> Charge to Account</button>
             ) : (
               <button onClick={completeSale} disabled={parseFloat(changeAmount) < billedOrder.total} className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-black rounded-lg font-bold hover:bg-green-600 disabled:opacity-50 text-sm"><CheckCircle className="w-5 h-5" /> Complete</button>
             )}
           </div>
         </div>
       </div>
     )}

     {/* Receipt Modal */}
     {showReceipt && billedOrder && (
       <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
         <div className="bg-neutral-800 rounded-xl p-6 w-96 border border-neutral-700">
           <div className="text-center mb-6"><CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" /><h2 className="text-2xl font-bold text-white">Payment Complete!</h2><p className="text-gray-400 text-sm">Order {billedOrder.id}</p></div>
           <div className="border-t border-b border-neutral-700 py-4 mb-4 space-y-2">
             <div className="flex justify-between text-gray-400 text-sm"><span>Customer</span><span>{billedOrder.customer.name}</span></div>
             <div className="flex justify-between text-gray-400 text-sm"><span>Items</span><span>{billedOrder.items.length}</span></div>
             <div className="flex justify-between text-gray-400 text-sm"><span>Paid via</span><span className="capitalize">{paymentMethod === "account" ? "Account (Credit)" : paymentMethod}</span></div>
           </div>
           <div className="flex justify-between text-white text-2xl font-bold mb-6"><span>Total Paid</span><span>Ksh {billedOrder.total.toFixed(2)}</span></div>
           <div className="text-center text-green-400 mb-4 text-sm">+{Math.floor(billedOrder.total / 10)} points earned!</div>
           <div className="flex gap-2">
             <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 text-sm"><Printer className="w-5 h-5" /> Print</button>
              <button onClick={() => { setShowReceipt(false); setBilledOrder(null); setChangeAmount(""); }} className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 text-sm">New Order</button>
           </div>
         </div>
        </div>
      )}

      {/* Switch User Modal */}
      {showSwitchUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 rounded-xl p-6 w-96 border border-neutral-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Switch User</h2>
              <button onClick={() => setShowSwitchUserModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="mb-2 text-sm text-gray-400">
              Currently signed in as: <span className="text-white font-medium">{currentStaff?.name}</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {staffList.map((staff) => (
                <button
                  key={staff._id}
                  onClick={() => handleSwitchStaff(staff)}
                  className={`w-full text-left p-3 rounded-lg mb-2 flex items-center gap-3 ${
                    currentStaff?._id === staff._id
                      ? "bg-blue-500/20 border border-blue-500"
                      : "bg-neutral-700 hover:bg-neutral-600"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-600 flex items-center justify-center text-lg font-bold text-white">
                    {staff.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{staff.name}</p>
                    <p className="text-gray-400 text-sm truncate">{staff.role} • {staff.phone}</p>
                  </div>
                  {currentStaff?._id === staff._id && (
                    <User className="w-5 h-5 text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Waiter Handover Modal */}
      {showHandoverModal && handoverFrom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 rounded-xl p-6 w-[500px] border border-neutral-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Waiter Handover</h2>
              <button onClick={() => { setShowHandoverModal(false); setHandoverFrom(null); setSelectedOrderIds([]); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {/* Source Staff Info */}
            <div className="mb-4 p-3 bg-neutral-700/50 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Transferring orders from:</p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-lg font-bold text-white">
                  {handoverFrom.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{handoverFrom.name}</p>
                  <p className="text-gray-400 text-sm">{handoverFrom.role}</p>
                </div>
              </div>
            </div>

            {/* Order Selection */}
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-2">Select orders to transfer:</p>
              <div className="max-h-60 overflow-y-auto space-y-2">
                  {heldOrders
                    .filter(o => 
                      o.assignedTo && 
                      o.assignedTo._id === handoverFrom._id && 
                      (o.customer._id || o.customer.id) !== undefined && 
                      o.items.length > 0
                    )
                  .map((order) => (
                    <label
                      key={order.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                        selectedOrderIds.includes(order.id)
                          ? "bg-blue-500/20 border-blue-500"
                          : "bg-neutral-700 border-neutral-600 hover:bg-neutral-600"
                      }`}
                    >
                       <input
                         type="checkbox"
                         checked={selectedOrderIds.includes(order.id)}
                         onChange={(e) =>
                           setSelectedOrderIds(
                             e.target.checked
                               ? [...selectedOrderIds, order.id]
                               : selectedOrderIds.filter(id => id !== order.id)
                           )
                         }
                         className="w-4 h-4 rounded border-gray-300"
                       />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">
                          {order.customer.name} - {order.items.length} items
                        </p>
                        <p className="text-gray-400 text-xs">
                          Total: Ksh {order.total.toFixed(2)} • {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </label>
                  ))}
                  {heldOrders.filter(o => 
                    o.assignedTo && 
                    o.assignedTo._id === handoverFrom._id && 
                    (o.customer._id || o.customer.id) !== undefined && 
                    o.items.length > 0
                  ).length === 0 && (
                    <p className="text-center text-gray-500 py-4">No held orders to transfer from {handoverFrom.name}</p>
                  )}
               </div>
             </div>

             {/* Target Staff Selection */}
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-2">Transfer to:</p>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {staffList
                  .filter(s => s._id !== handoverFrom._id)
                  .map((staff) => (
                    <button
                      key={staff._id}
                      onClick={() => handleHandover(staff)}
                      disabled={selectedOrderIds.length === 0}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-lg font-bold text-white">
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">{staff.name}</p>
                        <p className="text-gray-400 text-sm">{staff.role} • {staff.phone}</p>
                      </div>
                      <ArrowRightLeft className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                  {staffList.filter(s => s._id !== handoverFrom._id).length === 0 && (
                    <p className="text-center text-gray-500 py-2">No other staff available</p>
                  )}
              </div>
            </div>

            {/* Quick Transfer All Button */}
            <button
              onClick={() => {
                 const allOrderIds = heldOrders
                   .filter(o => 
                     o.assignedTo && 
                     o.assignedTo._id === handoverFrom._id && 
                     (o.customer._id || o.customer.id) !== undefined && 
                     o.items.length > 0
                   )
                  .map(o => o.id)
                  .filter(Boolean) as string[];
                setSelectedOrderIds(allOrderIds);
              }}
              className="w-full py-2 mb-3 bg-neutral-700 text-gray-300 rounded text-sm hover:bg-neutral-600"
            >
              Select All Held Orders from {handoverFrom.name}
            </button>

            {/* Close button */}
            <button
              onClick={() => { setShowHandoverModal(false); setHandoverFrom(null); setSelectedOrderIds([]); }}
              className="w-full py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
       {showEndOfShiftWizard && (
         <EndOfShiftWizard
           isOpen={showEndOfShiftWizard}
           onClose={() => setShowEndOfShiftWizard(false)}
           currentStaff={currentStaff!}
           staffList={staffList}
           onShiftClosed={() => {
             // Refresh page or fetch new data after shift close
             window.location.reload();
           }}
         />
       )}
    </div>
  );
}