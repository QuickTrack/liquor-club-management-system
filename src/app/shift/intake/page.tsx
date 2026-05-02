"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { useShift } from "@/components/ShiftContext";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  Smartphone,
  ClipboardCheck,
  User,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Lock,
  LogIn,
} from "lucide-react";

interface Product {
  _id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  costPrice: number;
  sellPrice: number;
  status: string;
  uom?: {
    baseUnit: string;
    units: Array<{
      name: string;
      abbreviation: string;
      isBase: boolean;
      conversionFactor: number;
      isActive: boolean;
      sellPrice: number;
      costPrice?: number;
    }>;
  };
}

interface StockItem {
  productId: string;
  productName: string;
  category: string;
  unit: string;
  systemQuantity: number;
  physicalCount: number | null;
  physicalUnit: string; // Unit in which count was taken (e.g., "bottles", "cases")
  conversionFactor: number; // Factor to convert physical count to base unit
  notes?: string;
}

 interface ShiftOpeningData {
   cashierId: string;
   cashierName: string;
   shift: "Morning" | "Evening" | "Night";
   openingCashFloat: number | null;
   openingMpesaBalance: number | null;
   stockChecklist: StockItem[];
   cashierSignature: string;
 }

 const DEFERRAL_KEY = "shift_intake_checklist_deferred_until";
 const DEFERRAL_DURATION_MS = 60 * 60 * 1000; // 1 hour

 const initialFormState: ShiftOpeningData = {
   cashierId: "",
   cashierName: "",
   shift: "Evening",
   openingCashFloat: null,
   openingMpesaBalance: null,
   stockChecklist: [],
   cashierSignature: "",
 };

const shifts = ["Morning", "Evening", "Night"];

interface GradientBorderWrapperProps {
  children: React.ReactNode;
  hasError?: boolean;
  className?: string;
}

function GradientBorderWrapper({ children, hasError = false, className = "" }: GradientBorderWrapperProps) {
  return (
    <div
      className={`
        relative rounded-lg p-[2px]
        ${hasError ? 'opacity-100' : 'opacity-100'}
        transition-opacity duration-300 animate-gradient-shift
        ${className}
      `}
      style={{
        background: "linear-gradient(135deg, #3B82F6 0%, #22C55E 50%, #EF4444 100%)",
        backgroundSize: "200% 200%",
      }}
    >
      <div className="bg-white w-full h-full rounded-md overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default function ShiftIntakePage() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .animate-gradient-shift {
        animation: gradient-shift 4s ease infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { setActiveShift } = useShift();
  const router = useRouter();
   const [products, setProducts] = useState<Product[]>([]);
   const [loadingProducts, setLoadingProducts] = useState(true);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");
   const [success, setSuccess] = useState("");
   const [formData, setFormData] = useState<ShiftOpeningData>(initialFormState);
   const [discrepancies, setDiscrepancies] = useState<
     { productId: string; system: number; physical: number | null; diff: number }[]
   >([]);
   const [deferredUntil, setDeferredUntil] = useState<Date | null>(null);
   const [showDeferredBanner, setShowDeferredBanner] = useState(false);
   const [deferredCountdown, setDeferredCountdown] = useState<string>("");

   // Fetch products on mount (always runs)
   useEffect(() => {
     const fetchProducts = async () => {
       try {
         const res = await fetch("/api/products");
         if (res.ok) {
           const data = await res.json();
           setProducts(data);
           // Initialize stock checklist with system quantities
           const initialChecklist: StockItem[] = data.map((p: Product) => {
             // Default to base unit (product.unit or first UOM unit's abbreviation)
             const baseUnit = p.unit;
             const uomUnits = p.uom?.units || [];
             const defaultUnit = uomUnits.find((u) => u.isBase) || uomUnits[0];
             
             return {
               productId: p._id,
               productName: p.name,
               category: p.category,
               unit: baseUnit,
               systemQuantity: p.stock,
               physicalCount: null,
               physicalUnit: defaultUnit ? defaultUnit.abbreviation || defaultUnit.name : baseUnit,
               conversionFactor: defaultUnit ? defaultUnit.conversionFactor : 1,
               notes: "",
             };
           });
           setFormData((prev) => ({ ...prev, stockChecklist: initialChecklist }));
         }
       } catch (err) {
         console.error("Failed to fetch products:", err);
         setError("Failed to load products");
       } finally {
         setLoadingProducts(false);
       }
     };
     fetchProducts();
   }, []);

   // Set cashier info from auth context (always runs)
   useEffect(() => {
     if (user) {
       const userId = (user as any)._id || (user as any).id || "";
       const userName = user.name || "";
       setFormData((prev) => ({
         ...prev,
         cashierId: userId,
         cashierName: userName,
         cashierSignature: userName, // Auto-fill signature with cashier's name
       }));
     }
   }, [user]);

   // Load and check deferred status on mount
   useEffect(() => {
     if (typeof window === "undefined") return;
     
     try {
       const stored = localStorage.getItem(DEFERRAL_KEY);
       if (stored) {
         const expiryTime = new Date(stored);
         const now = new Date();
         
         if (expiryTime > now) {
           // Still valid - set deferred state
           setDeferredUntil(expiryTime);
           setShowDeferredBanner(true);
         } else {
           // Expired - clear from storage
           localStorage.removeItem(DEFERRAL_KEY);
         }
       }
     } catch (e) {
       console.error("Failed to load deferred status from localStorage:", e);
     }
   }, []);

   // Periodic check to update countdown and banner visibility
   useEffect(() => {
     if (!deferredUntil) return;
     
     const formatRemainingTime = (ms: number): string => {
       const totalSeconds = Math.max(0, Math.floor(ms / 1000));
       const hours = Math.floor(totalSeconds / 3600);
       const minutes = Math.floor((totalSeconds % 3600) / 60);
       const seconds = totalSeconds % 60;
       
       if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
       if (minutes > 0) return `${minutes}m ${seconds}s`;
       return `${seconds}s`;
     };
     
     const updateDeferredCount = () => {
       const remaining = Math.max(0, deferredUntil.getTime() - Date.now());
       setDeferredCountdown(formatRemainingTime(remaining));
       
       // If time is up, clear deferral and hide banner
       if (remaining <= 0) {
         localStorage.removeItem(DEFERRAL_KEY);
         setDeferredUntil(null);
         setShowDeferredBanner(false);
         setError("Stock verification reminder: Please complete the checklist before starting your shift.");
       }
     };
     
     const interval = setInterval(updateDeferredCount, 1000);
     updateDeferredCount(); // Update immediately
     
     return () => clearInterval(interval);
   }, [deferredUntil]);

    // Recalculate discrepancies whenever physical counts change
    // Note: Only SHORTAGES (diff < 0) are considered true discrepancies
    // Surplus (diff > 0) is allowed and shown in table but not flagged as an issue
    // Physical counts are converted to base units using conversionFactor before comparison
    useEffect(() => {
      const disc = formData.stockChecklist
        .filter((item) => item.physicalCount !== null) // only count entered items
        .map((item) => {
          const physicalInBase = item.physicalCount! * item.conversionFactor;
          const diff = physicalInBase - item.systemQuantity;
          return {
            productId: item.productId,
            system: item.systemQuantity,
            physical: item.physicalCount!,
            diff: diff,
          };
        })
        .filter((d) => d.diff < 0); // Only shortages are discrepancies
      setDiscrepancies(disc);
    }, [formData.stockChecklist]);

  const handlePhysicalCountChange = (productId: string, value: number | null) => {
    setFormData((prev) => ({
      ...prev,
      stockChecklist: prev.stockChecklist.map((item) =>
        item.productId === productId
          ? { ...item, physicalCount: value }
          : item
      ),
    }));
  };

  const handlePhysicalUnitChange = (productId: string, unitAbbr: string) => {
    setFormData((prev) => {
      const product = products.find(p => p._id === productId);
      if (!product) return prev;

      const uomUnits = product.uom?.units || [];
      const selectedUnit = uomUnits.find(u => (u.abbreviation || u.name) === unitAbbr) || 
                          uomUnits.find(u => u.name === unitAbbr);

      if (!selectedUnit) return prev;

      return {
        ...prev,
        stockChecklist: prev.stockChecklist.map((item) =>
          item.productId === productId
            ? { 
                ...item, 
                physicalUnit: unitAbbr,
                conversionFactor: selectedUnit.conversionFactor 
              }
            : item
        ),
      };
    });
  };

  const handleNotesChange = (productId: string, notes: string) => {
    setFormData((prev) => ({
      ...prev,
      stockChecklist: prev.stockChecklist.map((item) =>
        item.productId === productId ? { ...item, notes } : item
      ),
    }));
  };

  const handleRemindMeLater = () => {
    const expiryDate = new Date(Date.now() + DEFERRAL_DURATION_MS);
    
    // Store in localStorage
    localStorage.setItem(DEFERRAL_KEY, expiryDate.toISOString());
    
    // Update state
    setDeferredUntil(expiryDate);
    setShowDeferredBanner(true);
    
    // Log the deferral event
    console.log(`[Stock Checklist Deferred] User deferred stock verification until ${expiryDate.toISOString()}`);
    
    // Request notification permission and schedule notification
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Stock Verification Reminder", {
          body: `You'll be reminded to complete the stock checklist at ${expiryDate.toLocaleTimeString()}.`,
          icon: "/icon-192x192.png", // Fallback if available
          tag: "stock-checklist-deferral",
          requireInteraction: false,
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            // Schedule notification for later
            setTimeout(() => {
              if (document.hidden) {
                new Notification("Stock Verification Reminder", {
                  body: "Time to complete your stock verification checklist.",
                  tag: "stock-checklist-deferral",
                });
              }
            }, DEFERRAL_DURATION_MS);
          }
        });
      }
    }
    
    // Optionally, send to backend for audit trail (best effort, don't block)
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "stock_checklist_deferred",
        timestamp: new Date().toISOString(),
        cashierId: formData.cashierId,
        cashierName: formData.cashierName,
        expiryTime: expiryDate.toISOString(),
        shift: formData.shift,
      }),
    }).catch(err => console.warn("Failed to log deferral:", err));
  };

   // Helper to get current active deferral expiry from localStorage (always fresh)
   const getActiveDeferral = (): Date | null => {
     if (typeof window === "undefined") return null;
     try {
       const stored = localStorage.getItem(DEFERRAL_KEY);
       if (!stored) return null;
       const expiry = new Date(stored);
       return expiry > new Date() ? expiry : null;
     } catch (e) {
       console.error("Failed to parse deferral:", e);
       return null;
     }
   };

   const handleCompleteChecklist = () => {
     // Clear deferral status when user marks checklist as done
     localStorage.removeItem(DEFERRAL_KEY);
     setDeferredUntil(null);
     setShowDeferredBanner(false);
   };

     const validateForm = (): boolean => {
       if (!formData.cashierId) {
         setError("Cashier not authenticated");
         return false;
       }
       const validShifts = ["Morning", "Evening", "Night"];
       if (!formData.shift || !validShifts.includes(formData.shift)) {
         setError("Please select a valid shift (Morning, Evening, or Night)");
         return false;
       }
       if (formData.openingCashFloat === null || formData.openingMpesaBalance === null) {
         setError("Please enter both opening cash and M-Pesa balances");
         return false;
       }
       if (formData.openingCashFloat < 0 || formData.openingMpesaBalance < 0) {
         setError("Opening balances cannot be negative");
         return false;
       }
       if (!formData.stockChecklist || formData.stockChecklist.length === 0) {
         setError("No stock items found");
         return false;
       }
       
       // Check physical counts if not deferred
       const activeDeferral = getActiveDeferral();
       if (!activeDeferral) {
         const missingCounts = formData.stockChecklist.filter((item) => item.physicalCount === null);
         if (missingCounts.length > 0) {
           setError("Please enter physical count for all items");
           return false;
         }
       }
       
       if (!formData.cashierSignature.trim()) {
         setError("Please provide your signature");
         return false;
       }
       return true;
     };

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setError("");
     setSuccess("");

     if (!validateForm()) return;

     setLoading(true);
     try {
        // Determine if currently deferred using fresh localStorage read
        const activeDeferral = getActiveDeferral();
        const isDeferred = !!activeDeferral;

        // Prepare checklist payload; if deferred, fill missing counts with systemQuantity (converted to raw units)
        const processedChecklist = formData.stockChecklist.map(item => {
          if (isDeferred && item.physicalCount === null) {
            // Compute raw physical count that would result in system quantity after conversion
            const computedPhysicalCount = item.conversionFactor ? item.systemQuantity / item.conversionFactor : item.systemQuantity;
            return {
              ...item,
              physicalCount: computedPhysicalCount,
            };
          }
          return item;
        });

        const payload = {
          cashierId: formData.cashierId,
          shift: formData.shift,
          openingCashFloat: formData.openingCashFloat,
          openingMpesaBalance: formData.openingMpesaBalance,
          stockChecklist: processedChecklist,
          cashierSignature: formData.cashierSignature,
          checklistDeferred: isDeferred,
          deferredAt: isDeferred ? new Date().toISOString() : undefined,
          deferredUntil: isDeferred ? activeDeferral!.toISOString() : undefined,
        };

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch("/api/shift-opening", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (!res.ok) {
          // Create error with details if available
          const apiError = new Error(result.error || result.details || "Failed to save shift opening");
          // Attach additional error info
          if (result.details) (apiError as any).details = result.details;
          if (result.validationErrors) (apiError as any).validationErrors = result.validationErrors;
          if (result.stack) (apiError as any).stack = result.stack;
          // Log full error for debugging
          console.error('API error response:', result);
          throw apiError;
        }

       setSuccess(`Shift opening recorded successfully. Opening ID: ${result.openingId || result._id}`);

       // Set active shift in context and localStorage
        setActiveShift({
          _id: result._id,
          openingId: result.openingId,
          cashier: result.cashier._id || result.cashier,
          shift: result.shift,
          startTime: result.startTime,
          openingCashFloat: result.openingCashFloat,
          openingMpesaBalance: result.openingMpesaBalance,
          status: "open",
          cashierSignature: result.cashierSignature,
          confirmedAt: result.confirmedAt,
        });

        // Sync current staff ID for POS
        const cashierId = result.cashier?._id || result.cashier;
        if (cashierId) {
          localStorage.setItem("pos_current_staff_id", cashierId.toString());
        }

        // Clear deferred status on successful submission
        localStorage.removeItem(DEFERRAL_KEY);
       setDeferredUntil(null);
       setShowDeferredBanner(false);

       // Redirect after short delay
       setTimeout(() => {
         const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/pos";
         router.push(returnTo);
       }, 1000);
       } catch (err: any) {
         console.error('Submit error:', err);
         
         let errorMessage = "Failed to create shift opening";
         
         // Check for validation errors from backend
         if (err.validationErrors && Array.isArray(err.validationErrors)) {
           const Fields = err.validationErrors.map((v: any) => `${v.field}: ${v.message}`).join(', ');
           errorMessage = `Please fix: ${Fields}`;
         } else if (err.details) {
           errorMessage = err.details;
         } else if (err.message) {
           errorMessage = err.message;
         }
         
         setError(errorMessage);
         
         // Log full error for debugging
         console.warn('Full error object:', {
           message: err.message,
           details: err.details,
           validationErrors: err.validationErrors,
           stack: err.stack,
         });
       } finally {
         setLoading(false);
       }
   };

  const totalDiscrepancyItems = discrepancies.reduce((sum, d) => sum + Math.abs(d.diff), 0);

   // Show loading while auth or products loading
   if (authLoading || loadingProducts) {
     return (
       <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
         <div className="text-slate-500 text-sm">Loading...</div>
       </div>
     );
   }

   // Redirect if not authenticated
   if (!isAuthenticated || !user) {
     return (
       <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
         <div className="text-slate-500 text-sm">Access denied. Please log in.</div>
       </div>
     );
   }

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with refined styling */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-400/20 rounded-xl blur-lg" />
              <div className="relative bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-xl shadow-md shadow-purple-500/20">
                <Lock className="w-5 h-5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Cashier Shift Opening
            </h1>
          </div>
          <p className="text-slate-500 text-sm max-w-2xl">
            Complete inventory verification and financial reconciliation before starting your shift
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 shadow-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-sm whitespace-pre-wrap">{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Financial Opening Balances */}
          <section className="relative">
            <div className="relative bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg shadow-md shadow-purple-500/20">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Financial Opening Balances</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-purple-700 text-xs font-semibold tracking-wide uppercase">
                    Opening Cash Float (KES)
                  </label>
                  <GradientBorderWrapper>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 font-semibold text-sm pointer-events-none">Ksh</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.openingCashFloat ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            openingCashFloat: val === "" ? null : Number(val),
                          });
                        }}
                        className="w-full bg-transparent text-slate-800 pl-12 pr-4 py-3 rounded-md border-none focus:outline-none font-mono text-sm placeholder:text-slate-400"
                        placeholder=""
                        required
                      />
                    </div>
                  </GradientBorderWrapper>
                  <p className="text-slate-500 text-xs flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-purple-500" />
                    Enter cash physically in drawer before shift
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-purple-700 text-xs font-semibold tracking-wide uppercase">
                    Opening M-Pesa Balance (KES)
                  </label>
                  <GradientBorderWrapper>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-semibold text-sm pointer-events-none">Ksh</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.openingMpesaBalance ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            openingMpesaBalance: val === "" ? null : Number(val),
                          });
                        }}
                        className="w-full bg-transparent text-slate-800 pl-12 pr-4 py-3 rounded-md border-none focus:outline-none font-mono text-sm placeholder:text-slate-400"
                        placeholder=""
                        required
                      />
                    </div>
                  </GradientBorderWrapper>
                  <p className="text-slate-500 text-xs flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    Check current balance on your M-Pesa device
                  </p>
                </div>
              </div>
            </div>
          </section>

           {/* Section 2: Stock Verification Checklist */}
           <section className="relative">
             <div className="relative bg-white rounded-xl p-6 shadow-sm border border-slate-200">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                   <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg shadow-md shadow-purple-500/20">
                     <ClipboardCheck className="w-5 h-5 text-white" />
                   </div>
                   <h2 className="text-lg font-bold text-slate-800">Stock Verification Checklist</h2>
                 </div>
                 
                 {/* Remind Me Later Button */}
                 <button
                   type="button"
                   onClick={handleRemindMeLater}
                   disabled={deferredUntil !== null}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                     deferredUntil
                       ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                       : "bg-white text-amber-700 border-amber-300 hover:bg-amber-50 hover:border-amber-400"
                   }`}
                 >
                   <Clock className={`w-3.5 h-3.5 ${deferredUntil ? "text-slate-400" : "text-amber-600"}`} />
                   {deferredUntil ? "Deferred" : "Remind Me Later"}
                 </button>
               </div>

               {/* Deferred Checklist Banner */}
               {showDeferredBanner && (
                 <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                   <div className="flex items-start gap-3">
                     <div className="bg-amber-100 p-1.5 rounded-lg mt-0.5">
                       <Clock className="w-4 h-4 text-amber-600" />
                     </div>
                     <div className="flex-1">
                       <p className="text-amber-800 text-sm font-semibold mb-1">
                         Stock Verification Skipped
                       </p>
                        <p className="text-amber-700 text-xs">
                          You&apos;ve chosen to defer the stock checklist. Reminder will appear in <span className="font-mono font-bold text-amber-800">{deferredCountdown}</span>.
                          You can complete the checklist at any time before starting your shift.
                        </p>
                       {deferredUntil && (
                         <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                           <span>Resume at:</span>
                           <span className="font-mono font-medium">{deferredUntil.toLocaleTimeString()}</span>
                         </div>
                       )}
                     </div>
                     <button
                       type="button"
                       onClick={handleCompleteChecklist}
                       className="px-3 py-1.5 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-md border border-amber-300 transition-colors"
                     >
                       Mark as Complete
                     </button>
                   </div>
                 </div>
               )}

               {/* Incomplete Counts Warning */}
               {!deferredUntil && discrepancies.length === 0 && formData.stockChecklist.some(item => item.physicalCount === null) && (
                 <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                   <div className="flex items-start gap-3">
                     <div className="bg-blue-100 p-1 rounded-lg mt-0.5">
                       <ClipboardCheck className="w-4 h-4 text-blue-600" />
                     </div>
                     <p className="text-blue-700 text-sm">
                       Complete physical counts for all products. Use <kbd className="px-1.5 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono ml-1">Tab</kbd> to navigate quickly.
                     </p>
                   </div>
                 </div>
               )}

               {discrepancies.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3 text-red-700 mb-2">
                    <div className="bg-red-100 p-1 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="font-bold text-red-800 text-sm">
                      {discrepancies.length} shortage(s) detected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <p className="text-slate-600">
                      Total missing units: <span className="font-bold text-red-600">{totalDiscrepancyItems}</span>
                    </p>
                    <p className="text-slate-600">
                      Est. missing value: <span className="font-bold text-red-600">Ksh {discrepancies.reduce((sum, d) => sum + Math.abs(d.diff) * (products.find(p => p._id === d.productId)?.costPrice || 0), 0).toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                   <table className="w-full">
                     <thead className="bg-slate-50 border-b border-slate-200">
                       <tr>
                         <th className="text-left text-purple-700 px-2 py-2 text-xs font-semibold tracking-wide">Product</th>
                         <th className="text-left text-purple-700 px-2 py-2 text-xs font-semibold tracking-wide">Category</th>
                         <th className="text-right text-purple-700 px-2 py-2 text-xs font-semibold tracking-wide">Sys Qty</th>
                         <th className="text-center text-purple-700 px-2 py-2 text-xs font-semibold tracking-wide">Unit</th>
                         <th className="text-right text-purple-700 px-2 py-2 text-xs font-semibold tracking-wide">Count</th>
                         <th className="text-right text-purple-700 px-2 py-2 text-xs font-semibold tracking-wide">Diff</th>
                         <th className="text-left text-purple-700 px-2 py-2 text-xs font-semibold tracking-wide">Notes</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {formData.stockChecklist.map((item, idx) => {
                         const product = products.find((p) => p._id === item.productId);
                         const physical = item.physicalCount === null ? null : item.physicalCount;
                         // Convert physical count to base units for diff
                         const diff = physical !== null ? (physical * item.conversionFactor) - item.systemQuantity : 0;
                         const isEven = idx % 2 === 0;
                         const availableUnits = product?.uom?.units.filter(u => u.isActive) || [];
                         
                         return (
                           <tr
                             key={item.productId}
                             className={`transition-colors hover:bg-purple-50/30 ${isEven ? 'bg-slate-50' : 'bg-white'}`}
                           >
                             <td className="px-2 py-2 text-slate-700 text-sm font-medium truncate max-w-[120px]">{item.productName}</td>
                             <td className="px-2 py-2">
                               <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600 font-medium border border-slate-200">
                                 {item.category}
                               </span>
                             </td>
                             <td className="px-2 py-2 text-center text-slate-700 font-mono text-sm">
                               {item.systemQuantity}
                             </td>
                             <td className="px-2 py-2">
                               {availableUnits.length > 1 ? (
                                 <select
                                   value={item.physicalUnit}
                                   onChange={(e) => handlePhysicalUnitChange(item.productId, e.target.value)}
                                   className="w-full bg-white text-slate-600 px-1.5 py-1.5 rounded border border-slate-300 focus:border-purple-400 focus:outline-none text-xs"
                                 >
                                   {availableUnits.map(u => (
                                     <option key={u.abbreviation || u.name} value={u.abbreviation || u.name} className="text-slate-800">
                                       {u.abbreviation || u.name}
                                     </option>
                                   ))}
                                 </select>
                               ) : (
                                 <span className="text-slate-600 text-xs text-center block">
                                   {availableUnits[0]?.abbreviation || item.physicalUnit}
                                 </span>
                               )}
                             </td>
                             <td className="px-2 py-2">
                               <GradientBorderWrapper className="w-20">
                                 <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.physicalCount === null ? "" : item.physicalCount}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "") {
                                          handlePhysicalCountChange(item.productId, null);
                                        } else {
                                          handlePhysicalCountChange(item.productId, Number(val));
                                        }
                                      }}
                                      className="w-full bg-transparent text-slate-800 px-2 py-1.5 rounded text-center border-none focus:outline-none font-mono text-sm"
                                    />
                                 </div>
                               </GradientBorderWrapper>
                             </td>
                             <td className={`px-2 py-2 text-right font-mono text-sm font-semibold ${
                               item.physicalCount === null
                                 ? "text-slate-400"
                                 : diff > 0
                                 ? "text-emerald-600"
                                 : diff < 0
                                 ? "text-red-600"
                                 : "text-slate-600"
                             }`}>
                               {item.physicalCount === null ? "-" : `${diff > 0 ? "+" : ""}${Math.round(diff)}`}
                             </td>
                             <td className="px-2 py-2">
                               <GradientBorderWrapper>
                                 <div className="relative">
                                   <input
                                     type="text"
                                     value={item.notes || ""}
                                     onChange={(e) => handleNotesChange(item.productId, e.target.value)}
                                     placeholder="Damaged, missing..."
                                     className="w-full bg-transparent text-slate-600 px-2 py-1.5 rounded border-none focus:outline-none text-sm"
                                   />
                                 </div>
                               </GradientBorderWrapper>
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                  </table>
                </div>
              </div>

                {/* Discrepancy alert styling */}
              {discrepancies.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                    <span>
                      <strong className="text-red-800">Attention:</strong> You have {totalDiscrepancyItems} shortage(s) across {discrepancies.length} product(s). Verify physical counts and add notes for any variances.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Authentication & Timestamping */}
          <section className="relative">
            <div className="relative bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-md shadow-blue-500/20">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Authentication & Timestamp</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="block text-blue-700 text-xs font-semibold tracking-wide uppercase">Cashier Name</label>
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-800 font-semibold text-base">{formData.cashierName || "Unknown"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-blue-700 text-xs font-semibold tracking-wide uppercase">Shift</label>
                  <GradientBorderWrapper>
                    <div className="relative">
                      <select
                        value={formData.shift}
                        onChange={(e) => setFormData(prev => ({ ...prev, shift: e.target.value as any }))}
                        className="w-full bg-transparent text-slate-800 px-4 py-3 rounded-md border-none focus:outline-none appearance-none cursor-pointer font-medium text-sm"
                        required
                      >
                        {shifts.map((s) => (
                          <option key={s} value={s} className="bg-white text-slate-800">
                            {s}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </GradientBorderWrapper>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-blue-700 text-xs font-semibold tracking-wide uppercase mb-2">
                  Digital Signature <span className="text-red-500 text-sm">*</span>
                </label>
                <p className="text-slate-600 text-xs mb-3 flex items-start gap-2">
                  <span className="text-blue-500">●</span>
                  By typing your full name below, you confirm all inventory counts and financial figures are accurate.
                </p>
                <GradientBorderWrapper>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.cashierSignature}
                      onChange={(e) => setFormData(prev => ({ ...prev, cashierSignature: e.target.value }))}
                      placeholder="Type your full legal name"
                      className="w-full bg-transparent text-slate-800 px-4 py-3 rounded-md border-none focus:outline-none text-sm"
                      required
                    />
                  </div>
                </GradientBorderWrapper>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 w-fit">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Timestamp: {new Date().toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-slate-500 text-xs">
              {discrepancies.length > 0 && (
                <span className="flex items-center gap-2 text-red-600 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {discrepancies.length} shortage(s) detected
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-sm transition-all duration-300 shadow-sm ${
                loading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              <LogIn className="w-4 h-4" />
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                "Start Shift"
              )}
            </button>
          </div>
          </form>

          {/* Deferred Completion Notice (shown when form is deferred) */}
          {deferredUntil && deferredUntil > new Date() && (
            <div className="mt-6 p-4 bg-amber-50 border-t border-amber-200 rounded-b-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Stock checklist deferred
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      You&apos;ll be reminded to complete verification shortly.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCompleteChecklist}
                  className="px-4 py-2 text-sm bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  Complete Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
