"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  ArrowRightLeft,
  FileText,
  CheckCircle,
  X,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";

interface StaffMember {
  _id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

interface ShiftOrder {
  _id: string;
  orderId: string;
  customer: { name: string; _id?: string };
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  assignedTo?: { _id: string; name: string };
}

interface EndOfShiftWizardProps {
  isOpen: boolean;
  onClose: () => void;
  currentStaff: StaffMember;
  staffList: StaffMember[];
  onShiftClosed?: () => void;
}

export default function EndOfShiftWizard({
  isOpen,
  onClose,
  currentStaff,
  staffList,
  onShiftClosed,
}: EndOfShiftWizardProps) {
  const { logout } = useAuth();
  const [wizardStep, setWizardStep] = useState(1);
  const [loadingShiftOrders, setLoadingShiftOrders] = useState(false);
  const [shiftOrders, setShiftOrders] = useState<ShiftOrder[]>([]);

  // Step 1: handover selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [handoverTo, setHandoverTo] = useState<StaffMember | null>(null);
  const [handoverPin, setHandoverPin] = useState("");
  const [handoverError, setHandoverError] = useState("");

  // Step 2: Sales summary
  const [salesSummary, setSalesSummary] = useState({
    totalSales: 0,
    cashTotal: 0,
    mpesaTotal: 0,
    cardTotal: 0,
    accountTotal: 0,
    transactionCount: 0,
  });

  // Step 3: Cash reconciliation
  const [openingCash, setOpeningCash] = useState("");
  const [countedCash, setCountedCash] = useState("");
  const [totalCashVariance, setTotalCashVariance] = useState(0);

  // Step 4: Payment reconciliation
  const [mpesaActual, setMpesaActual] = useState("");
  const [openingMpesa, setOpeningMpesa] = useState("");
  const [cardActual, setCardActual] = useState("");
  const [mpesaVariance, setMpesaVariance] = useState(0);
  const [cardVariance, setCardVariance] = useState(0);

  // Step 5: Stock reconciliation
  const [stockCounts, setStockCounts] = useState<Record<string, number>>({});
  const [totalStockVariance, setTotalStockVariance] = useState(0);

  // Step 6: Summary
  const [shiftNotes, setShiftNotes] = useState("");

  // Handover recipient PIN verification
  const [showHandoverPINVerification, setShowHandoverPINVerification] = useState(false);
  const [handoverRecipientPin, setHandoverRecipientPin] = useState("");
  const [verifyingHandover, setVerifyingHandover] = useState(false);
  const [handoverVerificationError, setHandoverVerificationError] = useState("");

  // Fetch shift orders when wizard opens
  useEffect(() => {
    if (!isOpen || !currentStaff) return;
    const fetchData = async () => {
      setLoadingShiftOrders(true);
      try {
        // Fetch shift orders
        const res = await fetch(`/api/orders?assignedTo=${currentStaff._id}&limit=100`);
        const data = await res.json();
        if (data.orders) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const shiftOrders = data.orders.filter((o: any) =>
            (o.status === "paid" || o.status === "billed") &&
            new Date(o.paidAt) >= today
          );
          setShiftOrders(shiftOrders);
          const summary = shiftOrders.reduce(
            (acc: any, order: ShiftOrder) => {
              acc.totalSales += order.total;
              acc.transactionCount += 1;
              switch (order.paymentMethod) {
                case "cash":
                  acc.cashTotal += order.total;
                  break;
                case "mpesa":
                  acc.mpesaTotal += order.total;
                  break;
                case "card":
                  acc.cardTotal += order.total;
                  break;
                case "account":
                case "bank_transfer":
                  acc.accountTotal = (acc.accountTotal || 0) + order.total;
                  break;
              }
              return acc;
            },
            { totalSales: 0, cashTotal: 0, mpesaTotal: 0, cardTotal: 0, accountTotal: 0, transactionCount: 0 }
          );
          setSalesSummary(summary);
        }

        // Fetch current shift opening to get opening balances
        const shiftRes = await fetch(`/api/shift-opening?cashierId=${currentStaff._id}&status=open`);
        if (shiftRes.ok) {
          const shiftData = await shiftRes.json();
          if (shiftData.length > 0) {
            const currentShift = shiftData[0];
            setOpeningCash(currentShift.openingCashFloat?.toString() || "");
            setOpeningMpesa(currentShift.openingMpesaBalance?.toString() || "");
          }
        }
      } catch (err) {
        console.error("Failed to fetch shift data", err);
       } finally {
         setLoadingShiftOrders(false);
       }
       }; // Close fetchData function
       fetchData();
       setWizardStep(1);
    setSelectedOrderIds([]);
    setHandoverTo(null);
    setHandoverPin("");
    setHandoverError("");
    setOpeningCash("");
    setOpeningMpesa("");
    setCountedCash("");
    setTotalCashVariance(0);
    setMpesaActual("");
    setCardActual("");
    setMpesaVariance(0);
    setCardVariance(0);
    setStockCounts({});
    setTotalStockVariance(0);
    setShiftNotes("");
   }, [isOpen, currentStaff]);

  // Verify handover recipient's PIN and complete logout
  const verifyHandoverPIN = async () => {
    if (!handoverTo || !handoverRecipientPin) return;
    setVerifyingHandover(true);
    setHandoverVerificationError("");
    try {
      const res = await fetch("/api/staff/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: handoverTo._id, pin: handoverRecipientPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "PIN verification failed");
      }
      // PIN verified, logout the original cashier
      await logout();
      // Close the wizard (will be unmounted after logout redirect)
      onClose();
    } catch (err: any) {
      setHandoverVerificationError(err.message || "Invalid PIN");
    } finally {
      setVerifyingHandover(false);
    }
  };

  // Compute products for stock reconciliation
  const productsForReconciliation = useMemo(() => {
    if (shiftOrders.length === 0) return [];
    const map = new Map<string, { name: string; openingStock: number; soldQty: number; category: string }>();
    shiftOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!map.has(item.id)) {
          map.set(item.id, { name: item.name, openingStock: 100, soldQty: 0, category: item.category });
        }
        map.get(item.id)!.soldQty += item.quantity;
      });
    });
    return Array.from(map.values()).map((p, idx) => ({ id: `stock-${idx}`, ...p }));
  }, [shiftOrders]);

  // Handover transfer via API
  const handleHandoverTransfer = async () => {
    if (!handoverTo || selectedOrderIds.length === 0) return;
    if (handoverPin.length < 4) {
      setHandoverError("Please enter your PIN");
      return;
    }
    try {
      const res = await fetch("/api/orders/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromStaffId: currentStaff._id, toStaffId: handoverTo._id, orderIds: selectedOrderIds, pin: handoverPin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Handover failed");
      alert(`Transferred ${data.transferredCount} order(s) to ${handoverTo.name}`);
      setWizardStep(2);
    } catch (err: any) {
      setHandoverError(err.message || "Handover error");
    }
  };

  const onCashCounted = () => {
    const variance = (parseFloat(countedCash) || 0) - salesSummary.cashTotal;
    setTotalCashVariance(variance);
  };

  const onPaymentBlur = () => {
    setMpesaVariance((parseFloat(mpesaActual) || 0) - salesSummary.mpesaTotal);
    setCardVariance((parseFloat(cardActual) || 0) - salesSummary.cardTotal);
  };

  const calculateStockVariance = () => {
    let total = 0;
    productsForReconciliation.forEach((product) => {
      const expected = product.openingStock - product.soldQty;
      const actual = stockCounts[product.id] ?? expected;
      total += actual - expected;
    });
    setTotalStockVariance(total);
  };

  const nextStep = () => {
    if (wizardStep === 3) onCashCounted();
    if (wizardStep === 4) onPaymentBlur();
    if (wizardStep === 5) calculateStockVariance();
    setWizardStep((s) => s + 1);
  };

  const completeShift = async () => {
    try {
      const res = await fetch("/api/shift/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: currentStaff._id,
          shift: "Evening",
          salesSummary: {
            totalSales: salesSummary.totalSales,
            cashTotal: salesSummary.cashTotal,
            mpesaTotal: salesSummary.mpesaTotal,
            cardTotal: salesSummary.cardTotal,
            accountTotal: salesSummary.accountTotal || 0,
            transactionCount: salesSummary.transactionCount,
            startingFloat: parseFloat(openingCash) || 0,
            cashInDrawer: parseFloat(countedCash) || 0,
            cashDrop: 0,
          },
          cashVariance: totalCashVariance,
          stockVariance: totalStockVariance,
          notes: shiftNotes,
          handover: handoverTo
            ? { from: currentStaff._id, to: handoverTo._id, orderIds: selectedOrderIds }
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to close shift");
      alert(`Shift closed. ${data.message || ""}`);
      if (onShiftClosed) onShiftClosed();
      // If handover was selected, require recipient to verify with PIN
      if (handoverTo) {
        setShowHandoverPINVerification(true);
      } else {
        // No handover, logout immediately
        await logout();
        onClose();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (!isOpen) return null;
  if (!currentStaff) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-6">
          <p className="text-white mb-4">No staff member selected. Please select a staff member first.</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
      <div className="bg-neutral-800 rounded-xl border border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">End of Shift</h2>
            <p className="text-gray-400 text-sm">{currentStaff.name} • {new Date().toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-4">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className={`w-2 h-2 rounded-full ${wizardStep >= step ? "bg-blue-500" : "bg-neutral-600"}`} />
              ))}
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6">
          {/* STEP 1: HANDOVER */}
          {wizardStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Step 1: Waiter Handover (Optional)</h3>
                <p className="text-gray-400 text-sm">Transfer your held orders to another staff member before closing shift.</p>
              </div>

              {shiftOrders.filter((o) => o.assignedTo && o.assignedTo._id === currentStaff._id && o.status === "held").length > 0 && (
                <div className="space-y-3">
                  <p className="text-gray-300 font-medium">Select orders to transfer:</p>
                  {shiftOrders.filter((o) => o.assignedTo && o.assignedTo._id === currentStaff._id && o.status === "held").map((order) => (
                    <label key={order._id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${selectedOrderIds.includes(order._id) ? "bg-blue-500/20 border-blue-500" : "bg-neutral-700 border-neutral-600 hover:bg-neutral-600"}`}>
                      <input type="checkbox" checked={selectedOrderIds.includes(order._id)} onChange={(e) => e.target.checked ? setSelectedOrderIds([...selectedOrderIds, order._id]) : setSelectedOrderIds(selectedOrderIds.filter((id) => id !== order._id))} className="w-4 h-4 rounded border-gray-300" />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{order.customer.name} — {order.items.length} items</p>
                        <p className="text-gray-400 text-xs">Total: Ksh {order.total.toFixed(2)} • {new Date(order.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </label>
                  ))}
                  <button onClick={() => setSelectedOrderIds(shiftOrders.filter((o) => o.assignedTo && o.assignedTo._id === currentStaff._id && o.status === "held").map((o) => o._id))} className="text-blue-400 text-sm hover:underline">Select All Held Orders</button>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-gray-300 font-medium">Transfer to: {selectedOrderIds.length > 0 && "(required if orders selected)"}</p>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {staffList.filter((s) => s._id !== currentStaff._id).map((staff) => (
                    <button key={staff._id} onClick={() => setHandoverTo(staff)} className={`p-3 rounded-lg border text-left ${handoverTo?._id === staff._id ? "bg-green-500/20 border-green-500" : "bg-neutral-700 border-neutral-600 hover:bg-neutral-600"}`}>
                      <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-lg font-bold text-white mb-2">{staff.name.charAt(0).toUpperCase()}</div>
                      <p className="text-white font-medium text-sm">{staff.name}</p>
                      <p className="text-gray-400 text-xs">{staff.role} • {staff.phone}</p>
                    </button>
                  ))}
                </div>
                {handoverError && <p className="text-red-500 text-sm">{handoverError}</p>}
              </div>

              {handoverTo && selectedOrderIds.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm">Enter your PIN to authorize transfer</label>
                  <input type="password" value={handoverPin} onChange={(e) => setHandoverPin(e.target.value)} placeholder="••••" maxLength={6} className="w-full bg-neutral-700 text-white px-4 py-2.5 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500" />
                  <p className="text-gray-500 text-xs">This action will be logged in the audit trail.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SALES SUMMARY */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Step 2: Sales Summary</h3>
                <p className="text-gray-400 text-sm">Review your total sales for this shift.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 rounded-lg border border-emerald-500/30">
                  <p className="text-emerald-200 text-xs uppercase tracking-wider mb-1">Total Sales</p>
                  <p className="text-2xl font-bold text-white">Ksh {salesSummary.totalSales.toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-lg border border-blue-500/30">
                  <p className="text-blue-200 text-xs uppercase tracking-wider mb-1">Transactions</p>
                  <p className="text-2xl font-bold text-white">{salesSummary.transactionCount}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-600 to-amber-700 p-4 rounded-lg border border-amber-500/30">
                  <p className="text-amber-200 text-xs uppercase tracking-wider mb-1">Avg. Transaction</p>
                  <p className="text-2xl font-bold text-white">Ksh {salesSummary.transactionCount > 0 ? (salesSummary.totalSales / salesSummary.transactionCount).toFixed(0) : "0"}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 rounded-lg border border-purple-500/30">
                  <p className="text-purple-200 text-xs uppercase tracking-wider mb-1">Items Sold</p>
                  <p className="text-2xl font-bold text-white">{shiftOrders.reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0), 0)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  Payment Method Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {["Total Cash", "Total M-Pesa", "Total Card", "Total Account/Credit"].map((label, idx) => {
                    const values = [salesSummary.cashTotal, salesSummary.mpesaTotal, salesSummary.cardTotal, salesSummary.accountTotal || 0];
                    const colors = ["green", "blue", "purple", "orange"];
                    const icons = ["💵", "📱", "💳", "🏦"];
                    return (
                      <div key={idx} className={`bg-${colors[idx]}-500/10 p-4 rounded-lg border border-${colors[idx]}-500/30`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{icons[idx]}</span>
                          <span className={`text-${colors[idx]}-400 text-sm font-medium`}>{label}</span>
                        </div>
                        <p className={`text-${colors[idx]}-400 text-xl font-bold`}>Ksh {values[idx].toFixed(2)}</p>
                        <p className="text-gray-500 text-xs mt-1">{values[idx] > 0 ? ((values[idx] / salesSummary.totalSales) * 100).toFixed(1) : "0"}% of total</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CASH RECONCILIATION */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Step 3: Cash Reconciliation</h3>
                <p className="text-gray-400 text-sm">Count your physical cash and reconcile with system totals.</p>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-neutral-700/50 p-4 rounded-lg border border-neutral-600">
                   <div className="flex items-center justify-between mb-2">
                     <label className="block text-gray-400 text-sm">Opening Cash Float</label>
                     {openingCash && (
                       <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">auto-fetched</span>
                     )}
                   </div>
                   <input 
                     type="number" 
                     value={openingCash} 
                     onChange={(e) => setOpeningCash(e.target.value)} 
                     placeholder="0.00" 
                     className="w-full bg-neutral-800 text-white text-xl text-center px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500" 
                   />
                   <p className="text-gray-500 text-xs mt-2">Cash you started the shift with</p>
                 </div>
                 <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                   <p className="text-gray-300 text-sm mb-2">Expected Cash</p>
                   <p className="text-3xl font-bold text-green-400">Ksh {salesSummary.cashTotal.toFixed(2)}</p>
                   <p className="text-gray-500 text-xs mt-2">From cash sales this shift</p>
                 </div>
                 <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                   <label className="block text-gray-300 text-sm mb-2">Actual Counted Cash</label>
                   <input type="number" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} onBlur={onCashCounted} placeholder="0.00" className="w-full bg-neutral-800 text-white text-xl text-center px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500" />
                   <p className="text-gray-500 text-xs mt-2">Physical cash count</p>
                  </div>
                </div>
               {countedCash && (
                <div className={`p-4 rounded-lg border ${totalCashVariance === 0 ? "bg-green-500/10 border-green-500/30" : totalCashVariance > 0 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-medium">Cash Variance</span>
                    <span className={`text-2xl font-bold ${totalCashVariance === 0 ? "text-green-400" : totalCashVariance > 0 ? "text-yellow-400" : "text-red-400"}`}>{(totalCashVariance > 0 ? "+" : "") + "Ksh " + totalCashVariance.toFixed(2)}</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{totalCashVariance === 0 ? "✅ Cash is balanced" : totalCashVariance > 0 ? "⚠️ Over: Ksh " + totalCashVariance.toFixed(2) : "❌ Short: Ksh " + Math.abs(totalCashVariance).toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: PAYMENT RECONCILIATION */}
          {wizardStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Step 4: Payment Reconciliation</h3>
                <p className="text-gray-400 text-sm">Verify M-Pesa and card totals against actual transaction records.</p>
              </div>
               <div className="space-y-4">
                 <div className="bg-neutral-700/30 p-4 rounded-lg border border-neutral-600">
                   <div className="flex items-center justify-between mb-3">
                     <h4 className="text-white font-medium">M-Pesa</h4>
                     <span className="text-blue-400 text-sm">System Sales: Ksh {salesSummary.mpesaTotal.toFixed(2)}</span>
                   </div>
                   {openingMpesa && (
                     <div className="mb-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded">
                       <p className="text-blue-300 text-xs">Opening Balance: Ksh {parseFloat(openingMpesa).toFixed(2)}</p>
                     </div>
                   )}
                   <input 
                     type="number" 
                     value={mpesaActual} 
                     onChange={(e) => setMpesaActual(e.target.value)} 
                     onBlur={onPaymentBlur} 
                     placeholder="Enter actual M-Pesa amount" 
                     className="w-full bg-neutral-800 text-white px-4 py-2.5 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500" 
                   />
                   {mpesaActual && (
                     <div className={`mt-2 p-2 rounded text-sm ${mpesaVariance === 0 ? "bg-green-500/10 text-green-400" : mpesaVariance > 0 ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                       Variance: {(mpesaVariance > 0 ? "+" : "") + "Ksh " + mpesaVariance.toFixed(2)}
                     </div>
                   )}
                 </div>
                <div className="bg-neutral-700/30 p-4 rounded-lg border border-neutral-600">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">Card</h4>
                    <span className="text-purple-400 text-sm">System: Ksh {salesSummary.cardTotal.toFixed(2)}</span>
                  </div>
                  <input type="number" value={cardActual} onChange={(e) => setCardActual(e.target.value)} onBlur={onPaymentBlur} placeholder="Enter actual card amount" className="w-full bg-neutral-800 text-white px-4 py-2.5 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500" />
                  {cardActual && (
                    <div className={`mt-2 p-2 rounded text-sm ${cardVariance === 0 ? "bg-green-500/10 text-green-400" : cardVariance > 0 ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                      Variance: {(cardVariance > 0 ? "+" : "") + "Ksh " + cardVariance.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: STOCK RECONCILIATION */}
          {wizardStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Step 5: Stock Reconciliation</h3>
                <p className="text-gray-400 text-sm">Verify physical stock counts against system. Critical for liquor control.</p>
              </div>
              {loadingShiftOrders ? (
                <p className="text-center text-gray-500 py-8">Loading stock data...</p>
              ) : (
                <div className="space-y-4">
                  {productsForReconciliation.map((product) => {
                    const expectedClosing = product.openingStock - product.soldQty;
                    return (
                      <div key={product.id} className="bg-neutral-700/30 p-4 rounded-lg border border-neutral-600">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-white font-medium">{product.name}</h4>
                          <span className="text-gray-400 text-sm">{product.category}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div><p className="text-gray-500 text-xs mb-1">Opening Stock</p><p className="text-white font-bold">{product.openingStock}</p></div>
                          <div><p className="text-gray-500 text-xs mb-1">Sold</p><p className="text-red-400 font-bold">-{product.soldQty}</p></div>
                          <div><p className="text-gray-500 text-xs mb-1">Expected Closing</p><p className="text-blue-400 font-bold">{expectedClosing}</p></div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-gray-300 text-sm mb-2">Actual Counted Stock</label>
                          <input type="number" value={stockCounts[product.id] ?? ""} onChange={(e) => setStockCounts({ ...stockCounts, [product.id]: parseInt(e.target.value) || 0 })} placeholder="0" className="w-full bg-neutral-800 text-white px-4 py-2 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500" />
                          {stockCounts[product.id] !== undefined && (
                            <div className={`mt-2 text-sm ${(stockCounts[product.id] ?? 0) === expectedClosing ? "text-green-400" : "text-red-400"}`}>Variance: {(stockCounts[product.id] ?? 0) - expectedClosing}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: SUMMARY */}
          {wizardStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Step 6: Shift Summary & Confirmation</h3>
                <p className="text-gray-400 text-sm">Review all data before closing shift. This action cannot be undone.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-700/50 p-4 rounded-lg border border-neutral-600"><p className="text-gray-400 text-sm">Total Sales</p><p className="text-2xl font-bold text-white">Ksh {salesSummary.totalSales.toFixed(2)}</p></div>
                <div className={`p-4 rounded-lg border ${totalCashVariance === 0 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}><p className="text-gray-400 text-sm">Cash Variance</p><p className={`text-2xl font-bold ${totalCashVariance === 0 ? "text-green-400" : "text-red-400"}`}>{(totalCashVariance > 0 ? "+" : "") + "Ksh " + totalCashVariance.toFixed(2)}</p></div>
                <div className={`p-4 rounded-lg border ${totalStockVariance === 0 ? "bg-green-500/10 border-green-500/30" : totalStockVariance > 0 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30"}`}><p className="text-gray-400 text-sm">Stock Variance</p><p className={`text-2xl font-bold ${totalStockVariance === 0 ? "text-green-400" : totalStockVariance > 0 ? "text-yellow-400" : "text-red-400"}`}>{(totalStockVariance > 0 ? "+" : "") + totalStockVariance.toFixed(0) + " units"}</p></div>
                <div className="bg-neutral-700/50 p-4 rounded-lg border border-neutral-600"><p className="text-gray-400 text-sm">Payment Methods</p><p className="text-2xl font-bold text-white">{salesSummary.transactionCount}</p></div>
              </div>
              <div className="space-y-3">
                <h4 className="text-white font-medium">Payment Breakdown:</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-green-500/10 p-3 rounded-lg"><span className="text-green-400 text-sm">Cash</span><p className="text-green-400 font-bold">Ksh {salesSummary.cashTotal.toFixed(2)}</p></div>
                  <div className="bg-blue-500/10 p-3 rounded-lg"><span className="text-blue-400 text-sm">M-Pesa</span><p className="text-blue-400 font-bold">Ksh {salesSummary.mpesaTotal.toFixed(2)}</p></div>
                  <div className="bg-purple-500/10 p-3 rounded-lg"><span className="text-purple-400 text-sm">Card</span><p className="text-purple-400 font-bold">Ksh {salesSummary.cardTotal.toFixed(2)}</p></div>
                  <div className="bg-orange-500/10 p-3 rounded-lg"><span className="text-orange-400 text-sm">Account/Credit</span><p className="text-orange-400 font-bold">Ksh {(salesSummary.accountTotal || 0).toFixed(2)}</p></div>
                </div>
              </div>
              {(totalCashVariance !== 0 || totalStockVariance !== 0) && (
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Explanation for variances (required)</label>
                  <textarea value={shiftNotes} onChange={(e) => setShiftNotes(e.target.value)} placeholder="Explain any cash or stock discrepancies..." rows={4} className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500" />
                </div>
              )}
              {(totalCashVariance !== 0 || totalStockVariance !== 0) && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"><p className="text-yellow-400 text-sm">⚠️ There are {(totalCashVariance !== 0 && totalStockVariance !== 0) ? "cash and stock" : totalCashVariance !== 0 ? "cash" : "stock"} variances. Please provide an explanation.</p></div>
              )}
              <div className="bg-neutral-700/20 p-4 rounded-lg border border-neutral-700"><h4 className="text-white font-medium mb-2">Audit Log</h4><ul className="space-y-1 text-sm text-gray-400"><li>• Staff: {currentStaff.name} ({currentStaff.role})</li><li>• Shift End: {new Date().toLocaleString()}</li><li>• Orders Processed: {salesSummary.transactionCount}</li><li>• Total Sales: Ksh {salesSummary.totalSales.toFixed(2)}</li><li>• Handover: {handoverTo ? `${selectedOrderIds.length} orders to ${handoverTo.name}` : "None"}</li></ul></div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setWizardStep((s) => s - 1)} disabled={wizardStep === 1} className="px-6 py-2.5 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 disabled:opacity-50">Back</button>
            <div className="flex items-center gap-2">
              {wizardStep < 6 ? (
                <button onClick={nextStep} disabled={wizardStep === 1 ? (handoverTo !== null && selectedOrderIds.length > 0 && handoverPin.length < 4) : false} className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium">{wizardStep === 1 && handoverTo && selectedOrderIds.length > 0 ? "Transfer & Continue" : "Continue"}</button>
              ) : (
                <button onClick={completeShift} disabled={(totalCashVariance !== 0 || totalStockVariance !== 0) && shiftNotes.trim().length === 0} className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold">✅ Confirm & Close Shift</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  // Handover PIN verification overlay
  if (showHandoverPINVerification && handoverTo) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 w-full max-w-md p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Handover Verification Required</h2>
            <p className="text-gray-400 text-sm">
              Orders have been transferred to <span className="text-white font-semibold">{handoverTo!.name}</span>.
              The recipient must enter their PIN to accept the handover.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Enter PIN for {handoverTo!.name}</label>
              <input
                type="password"
                value={handoverRecipientPin}
                onChange={(e) => {
                  setHandoverRecipientPin(e.target.value);
                  setHandoverVerificationError("");
                }}
                placeholder="••••"
                maxLength={4}
                className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:border-green-500 text-center text-2xl tracking-widest"
                disabled={verifyingHandover}
                autoFocus
              />
              {handoverVerificationError && (
                <p className="text-red-500 text-sm mt-2">{handoverVerificationError}</p>
              )}
            </div>

            <button
              onClick={verifyHandoverPIN}
              disabled={verifyingHandover || handoverRecipientPin.length < 4}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold"
            >
              {verifyingHandover ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify & Complete Handover"
              )}
            </button>

            <p className="text-gray-500 text-xs text-center">
              After verification, you will be logged out of the system.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
