"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Star,
  CreditCard,
  Gift,
  MessageSquare,
  Edit,
  Trash2,
  Crown,
  Gem,
  Coffee,
  X,
  AlertTriangle,
} from "lucide-react";

interface Customer {
  _id?: string;
  id?: number;
  name: string;
  phone: string;
  email: string;
  totalSpent: number;
  visits: number;
  lastVisit: string;
  tier: "Bronze" | "Silver" | "Gold" | "VIP";
  creditLimit: number;
  creditUsed: number;
  points: number;
  preferences: string;
  status: "Active" | "Inactive";
}

interface EditableCustomer extends Omit<Customer, 'totalSpent' | 'visits' | 'creditUsed' | 'points' | 'lastVisit'> {}

const initialCustomers: Customer[] = [
  { _id: "1", id: 1, name: "John Doe", phone: "+254 712 345 678", email: "john@example.com", totalSpent: 45000, visits: 25, lastVisit: "2024-07-15", tier: "Gold", creditLimit: 10000, creditUsed: 2500, points: 4500, preferences: "Whiskey, Bourbon", status: "Active" },
  { _id: "2", id: 2, name: "Jane Smith", phone: "+254 723 456 789", email: "jane@example.com", totalSpent: 120000, visits: 58, lastVisit: "2024-07-14", tier: "VIP", creditLimit: 50000, creditUsed: 12000, points: 15000, preferences: "Champagne, Cocktails", status: "Active" },
  { _id: "3", id: 3, name: "Mike Johnson", phone: "+254 734 567 890", email: "mike@example.com", totalSpent: 18500, visits: 12, lastVisit: "2024-07-13", tier: "Silver", creditLimit: 5000, creditUsed: 0, points: 1850, preferences: "Beer, Shots", status: "Active" },
  { _id: "4", id: 4, name: "Sarah Williams", phone: "+254 745 678 901", email: "sarah@example.com", totalSpent: 2800, visits: 3, lastVisit: "2024-07-10", tier: "Bronze", creditLimit: 2000, creditUsed: 0, points: 280, preferences: "Wine", status: "Inactive" },
  { _id: "5", id: 5, name: "Tom Brown", phone: "+254 756 789 012", email: "tom@example.com", totalSpent: 65000, visits: 35, lastVisit: "2024-07-15", tier: "Gold", creditLimit: 15000, creditUsed: 3000, points: 6500, preferences: "Vodka, Cocktails", status: "Active" },
  { _id: "6", id: 6, name: "Emily Davis", phone: "+254 767 890 123", email: "emily@example.com", totalSpent: 85000, visits: 42, lastVisit: "2024-07-14", tier: "VIP", creditLimit: 30000, creditUsed: 8000, points: 10500, preferences: "Tequila, Shots", status: "Active" },
];

const tiers = [
  { name: "Bronze", color: "amber-700", icon: Coffee, discount: "2%" },
  { name: "Silver", color: "gray-400", icon: Gem, discount: "5%" },
  { name: "Gold", color: "yellow-500", icon: Star, discount: "10%" },
  { name: "VIP", color: "purple-500", icon: Crown, discount: "15%" },
];

export default function MembersPage() {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTier, setSelectedTier] = useState<string | "All">("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState<EditableCustomer>({
    name: "", phone: "", email: "", tier: "Bronze", creditLimit: 0, preferences: "", status: "Active"
  });

  // Load customers from API on mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        if (response.ok) {
          const data = await response.json();
          setCustomersList(data);
        } else {
          console.error("Failed to load customers");
        }
      } catch (err) {
        console.error("Error loading customers:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, []);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    tier: "Bronze" as "Bronze" | "Silver" | "Gold" | "VIP",
    creditLimit: 0,
  });

  const filteredCustomers = customersList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);
    const matchesTier = selectedTier === "All" || c.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const totalCustomers = customersList.length;
  const activeCustomers = customersList.filter((c) => c.status === "Active").length;
  const totalRevenue = customersList.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalCredit = customersList.reduce((sum, c) => sum + c.creditUsed, 0);

   const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const name = newCustomer.name.trim();
    const phone = newCustomer.phone.trim();

    if (!name || !phone) {
      setError("Please fill in both name and phone");
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 9) {
      setError("Phone number must have at least 9 digits");
      return;
    }

    // Check for duplicate phone number locally
    const phoneExists = customersList.some(
      (c) => c.phone.toLowerCase() === phone.toLowerCase()
    );
    if (phoneExists) {
      setError("A customer with this phone number already exists");
      return;
    }

    if (!token) {
      setError("Session expired. Please log in again.");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone,
          email: newCustomer.email.trim(),
          tier: newCustomer.tier,
          creditLimit: newCustomer.creditLimit || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create customer");
      }

      // Add to local state
      setCustomersList(prev => [...prev, data]);
      
      // Show success message
      setSuccess(`Customer "${name}" added successfully!`);
      
      // Reset form
      setNewCustomer({ name: "", phone: "", email: "", tier: "Bronze", creditLimit: 0 });
      
      // Close modal after short delay
      setTimeout(() => {
        setShowAddModal(false);
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      console.error("Create customer error:", err);
      setError(err.message || "Failed to create customer");
     } finally {
       setIsCreating(false);
     }
   };

   const handleEditClick = (customer: Customer) => {
     setSelectedCustomer(customer);
     setEditForm({
       name: customer.name,
       phone: customer.phone,
       email: customer.email,
       tier: customer.tier,
       creditLimit: customer.creditLimit,
       preferences: customer.preferences,
       status: customer.status,
     });
     setError("");
     setSuccess("");
     setEditModalOpen(true);
   };

   const handleUpdateCustomer = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!selectedCustomer || !token) return;

     setError("");
     setSuccess("");

     const name = editForm.name.trim();
     const phone = editForm.phone.trim();

     if (!name || !phone) {
       setError("Name and phone are required");
       return;
     }

     const phoneDigits = phone.replace(/\D/g, "");
     if (phoneDigits.length < 9) {
       setError("Phone number must have at least 9 digits");
       return;
     }

     // Check for duplicate phone number (exclude current customer)
     const phoneExists = customersList.some(
       (c) => c.phone.toLowerCase() === phone.toLowerCase() && c._id !== selectedCustomer._id
     );
     if (phoneExists) {
       setError("Another customer with this phone number already exists");
       return;
     }

     try {
       const response = await fetch(`/api/customers/${selectedCustomer._id}`, {
         method: "PATCH",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({
           name,
           phone,
           email: editForm.email.trim(),
           tier: editForm.tier,
           creditLimit: editForm.creditLimit,
           preferences: editForm.preferences,
           status: editForm.status,
         }),
       });

       const data = await response.json();

       if (!response.ok) {
         throw new Error(data.error || "Failed to update customer");
       }

       // Update local state
       setCustomersList(prev => prev.map(c => c._id === selectedCustomer._id ? { ...c, ...data } : c));
       
       setSuccess("Customer updated successfully!");
       setTimeout(() => {
         setEditModalOpen(false);
         setSelectedCustomer(null);
         setSuccess("");
       }, 1500);
     } catch (err: any) {
       console.error("Update customer error:", err);
       setError(err.message || "Failed to update customer");
     }
   };

   const handleDeleteClick = (customer: Customer) => {
     setSelectedCustomer(customer);
     setDeleteModalOpen(true);
   };

   const handleDeleteCustomer = async () => {
     if (!selectedCustomer || !token) return;

     try {
       const response = await fetch(`/api/customers/${selectedCustomer._id}`, {
         method: "DELETE",
         headers: {
           Authorization: `Bearer ${token}`,
         },
       });

       const data = await response.json();

       if (!response.ok) {
         throw new Error(data.error || "Failed to delete customer");
       }

       // Remove from local state
       setCustomersList(prev => prev.filter(c => c._id !== selectedCustomer._id));
       
       setSuccess("Customer deleted successfully!");
       setTimeout(() => {
         setDeleteModalOpen(false);
         setSelectedCustomer(null);
         setSuccess("");
       }, 1500);
     } catch (err: any) {
       console.error("Delete customer error:", err);
       setError(err.message || "Failed to delete customer");
     }
   };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Customers & Membership</h1>
          <p className="text-gray-400">Customer profiles and loyalty programs</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <Users className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-white">{totalCustomers}</p>
          <p className="text-gray-400 text-sm">Total Customers</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-green-500">{activeCustomers}</p>
          <p className="text-gray-400 text-sm">Active Members</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-white">Ksh {(totalRevenue / 1000).toFixed(0)}K</p>
          <p className="text-gray-400 text-sm">Total Spent</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <p className="text-2xl font-bold text-yellow-500">Ksh {(totalCredit / 1000).toFixed(0)}K</p>
          <p className="text-gray-400 text-sm">Credit Outstanding</p>
        </div>
      </div>

      {/* Tier Overview */}
      <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
        <h3 className="text-white font-medium mb-4">Membership Tiers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
           {tiers.map((tier) => {
             const count = customersList.filter((c) => c.tier === tier.name).length;
            return (
              <div key={tier.name} className="bg-neutral-700/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <tier.icon className={`w-5 h-5 text-${tier.color}`} />
                  <p className="text-white font-medium">{tier.name}</p>
                </div>
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-gray-400 text-sm">{tier.discount} discount</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTier("All")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedTier === "All"
                ? "bg-blue-500 text-white"
                : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
            }`}
          >
            All
          </button>
          {tiers.map((tier) => (
            <button
              key={tier.name}
              onClick={() => setSelectedTier(tier.name)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedTier === tier.name
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
              }`}
            >
              {tier.name}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Customer</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Phone</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Tier</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Total Spent</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Visits</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Credit</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Points</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Last Visit</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left text-gray-400 px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer._id || customer.id} className="border-b border-neutral-700/50 hover:bg-neutral-700/30">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white font-medium">{customer.name}</p>
                    <p className="text-gray-400 text-xs">{customer.preferences}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300">{customer.phone}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      customer.tier === "VIP"
                        ? "bg-purple-500/20 text-purple-400"
                        : customer.tier === "Gold"
                        ? "bg-blue-500/20 text-yellow-400"
                        : customer.tier === "Silver"
                        ? "bg-gray-400/20 text-gray-400"
                        : "bg-blue-700/20 text-amber-600"
                    }`}
                  >
                    {customer.tier === "VIP" && <Crown className="w-3 h-3" />}
                    {customer.tier}
                  </span>
                </td>
                <td className="px-4 py-3 text-white font-medium">
                  Ksh {customer.totalSpent.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-gray-300">{customer.visits}</td>
                <td className="px-4 py-3">
                  <span className={customer.creditUsed > 0 ? "text-yellow-500" : "text-gray-300"}>
                    Ksh {customer.creditUsed.toLocaleString()} / {customer.creditLimit.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-green-500">{customer.points.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-300">{customer.lastVisit}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      customer.status === "Active"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-gray-500/10 text-gray-500"
                    }`}
                  >
                    {customer.status}
                  </span>
                </td>
                 <td className="px-4 py-3">
                   <div className="flex gap-2">
                     <button 
                       onClick={() => handleEditClick(customer)}
                       className="text-gray-400 hover:text-amber-500 transition-colors"
                       title="Edit customer"
                     >
                       <Edit className="w-4 h-4" />
                     </button>
                     <button 
                       className="text-gray-400 hover:text-amber-500 transition-colors"
                       title="Send message"
                     >
                       <MessageSquare className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => handleDeleteClick(customer)}
                       className="text-gray-400 hover:text-red-500 transition-colors"
                       title="Delete customer"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 rounded-xl p-6 w-[450px] border border-neutral-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add New Customer</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white text-2xl">
                ×
              </button>
            </div>
            
             {error && (
               <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded">
                 <p className="text-red-400 text-sm flex items-center gap-2">
                   <AlertTriangle className="w-4 h-4" />
                   {error}
                 </p>
               </div>
             )}

             {success && (
               <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded">
                 <p className="text-green-400 text-sm flex items-center gap-2">
                   ✓ {success}
                 </p>
               </div>
             )}

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Name *</label>
                <input
                  type="text"
                  className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 border border-neutral-600"
                  placeholder="Enter name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Phone *</label>
                <input
                  type="tel"
                  className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 border border-neutral-600"
                  placeholder="+254 xxx xxx xxx"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Email</label>
                <input
                  type="email"
                  className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 border border-neutral-600"
                  placeholder="email@example.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Credit Limit (Ksh)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 border border-neutral-600"
                  placeholder="0"
                  value={newCustomer.creditLimit}
                  onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Tier</label>
                <select
                  className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 border border-neutral-600"
                  value={newCustomer.tier}
                  onChange={(e) => setNewCustomer({ ...newCustomer, tier: e.target.value as any })}
                >
                  <option value="Bronze">Bronze</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? "Creating..." : "Add Customer"}
              </button>
             </form>
           </div>
         </div>
       )}

       {/* Edit Customer Modal */}
       {editModalOpen && selectedCustomer && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-neutral-800 rounded-xl p-6 w-[450px] border border-neutral-700">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-bold text-white">Edit Customer</h2>
               <button onClick={() => { setEditModalOpen(false); setSelectedCustomer(null); }} className="text-gray-400 hover:text-white text-2xl">
                 ×
               </button>
             </div>

             {error && (
               <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded">
                 <p className="text-red-400 text-sm flex items-center gap-2">
                   <AlertTriangle className="w-4 h-4" />
                   {error}
                 </p>
               </div>
             )}

             {success && (
               <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded">
                 <p className="text-green-400 text-sm flex items-center gap-2">
                   ✓ {success}
                 </p>
               </div>
             )}

             <form onSubmit={handleUpdateCustomer} className="space-y-4">
               <div>
                 <label className="text-gray-400 text-sm block mb-1">Name *</label>
                 <input
                   type="text"
                   className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 border border-neutral-600"
                   placeholder="Enter name"
                   value={editForm.name}
                   onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                   required
                 />
               </div>
               <div>
                 <label className="text-gray-400 text-sm block mb-1">Phone *</label>
                 <input
                   type="tel"
                   className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 border border-neutral-600"
                   placeholder="+254 xxx xxx xxx"
                   value={editForm.phone}
                   onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                   required
                 />
               </div>
               <div>
                 <label className="text-gray-400 text-sm block mb-1">Email</label>
                 <input
                   type="email"
                   className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 border border-neutral-600"
                   placeholder="email@example.com"
                   value={editForm.email}
                   onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                 />
               </div>
               <div>
                 <label className="text-gray-400 text-sm block mb-1">Credit Limit (Ksh)</label>
                 <input
                   type="number"
                   min="0"
                   className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 border border-neutral-600"
                   placeholder="0"
                   value={editForm.creditLimit}
                   onChange={(e) => setEditForm({ ...editForm, creditLimit: Number(e.target.value) })}
                 />
               </div>
               <div>
                 <label className="text-gray-400 text-sm block mb-1">Tier</label>
                 <select
                   className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 border border-neutral-600"
                   value={editForm.tier}
                   onChange={(e) => setEditForm({ ...editForm, tier: e.target.value as any })}
                 >
                   <option value="Bronze">Bronze</option>
                   <option value="Silver">Silver</option>
                   <option value="Gold">Gold</option>
                   <option value="VIP">VIP</option>
                 </select>
               </div>
               <div>
                 <label className="text-gray-400 text-sm block mb-1">Status</label>
                 <select
                   className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 border border-neutral-600"
                   value={editForm.status}
                   onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "Active" | "Inactive" })}
                 >
                   <option value="Active">Active</option>
                   <option value="Inactive">Inactive</option>
                 </select>
               </div>
               <div>
                 <label className="text-gray-400 text-sm block mb-1">Preferences</label>
                 <input
                   type="text"
                   className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 border border-neutral-600"
                   placeholder="e.g. Whiskey, Gin"
                   value={editForm.preferences}
                   onChange={(e) => setEditForm({ ...editForm, preferences: e.target.value })}
                 />
               </div>
               <button
                 type="submit"
                 className="w-full py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors"
               >
                 Save Changes
               </button>
             </form>
           </div>
         </div>
       )}

       {/* Delete Confirmation Modal */}
       {deleteModalOpen && selectedCustomer && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-neutral-800 rounded-xl p-6 w-[400px] border border-neutral-700">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-bold text-white">Delete Customer</h2>
               <button onClick={() => { setDeleteModalOpen(false); setSelectedCustomer(null); }} className="text-gray-400 hover:text-white text-2xl">
                 ×
               </button>
             </div>

             {error && (
               <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded">
                 <p className="text-red-400 text-sm flex items-center gap-2">
                   <AlertTriangle className="w-4 h-4" />
                   {error}
                 </p>
               </div>
             )}

             <p className="text-gray-300 mb-6">
               Are you sure you want to delete <span className="font-bold text-white">{selectedCustomer.name}</span>? This action cannot be undone.
             </p>

             <div className="flex gap-3">
               <button
                 onClick={() => { setDeleteModalOpen(false); setSelectedCustomer(null); }}
                 className="flex-1 py-2.5 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={handleDeleteCustomer}
                 className="flex-1 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-bold"
               >
                 Delete
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }