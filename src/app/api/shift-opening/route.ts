import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { ShiftOpening, Product, Staff, IShiftOpening, User } from "@/lib/db/models";
import mongoose from "mongoose";

/**
 * GET /api/shift-opening
 * Fetch all shift opening records (filtered by cashier if needed)
 */
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const cashierId = searchParams.get("cashierId");
    const status = searchParams.get("status");
    const shift = searchParams.get("shift");

    const filters: Record<string, any> = {};
    if (cashierId) filters.cashier = cashierId;
    if (status) filters.status = status;
    if (shift) filters.shift = shift;

    const openings = await ShiftOpening.find(filters)
      .sort({ startTime: -1 })
      .populate("cashier", "name role")
      .limit(50);

    return NextResponse.json(openings);
  } catch (error) {
    console.error("Error fetching shift openings:", error);
    return NextResponse.json({ error: "Failed to fetch shift openings" }, { status: 500 });
  }
}

/**
 * POST /api/shift-opening
 * Create a new shift opening record (cashier login intake)
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    const {
      cashierId,
      shift,
      openingCashFloat,
      openingMpesaBalance,
      stockChecklist,
      cashierSignature,
      checklistDeferred = false,
      deferredAt,
      deferredUntil,
    } = data;

    // Required field validation
    if (!cashierId || !shift || openingCashFloat === undefined || openingMpesaBalance === undefined || !stockChecklist || !Array.isArray(stockChecklist) || !cashierSignature) {
      const missing = [];
      if (!cashierId) missing.push("cashierId");
      if (!shift) missing.push("shift");
      if (openingCashFloat === undefined) missing.push("openingCashFloat");
      if (openingMpesaBalance === undefined) missing.push("openingMpesaBalance");
      if (!stockChecklist || !Array.isArray(stockChecklist)) missing.push("stockChecklist");
      if (!cashierSignature) missing.push("cashierSignature");
       return NextResponse.json(
         { error: "Missing required fields", missingFields: missing },
         { status: 400 }
       );
    }

    // Validate cashier exists - accept either a direct Staff ID or a User ID (which we map to Staff by email)
    let cashier = await Staff.findById(cashierId);
    if (!cashier) {
      // Attempt to resolve via User collection: find User by ID, then find Staff with matching email (case-insensitive)
      try {
        const user = await User.findById(cashierId);
        if (!user) {
          return NextResponse.json({ error: "User not found. Please log in again." }, { status: 404 });
        }
        console.log('Resolving cashier: User found', { userId: user._id, userEmail: user.email, userName: user.name });
        
        // Try case-insensitive email match
        if (user.email) {
          const allStaff = await Staff.find({});
          const emailMatch = allStaff.find(s => 
            (s.email || "").toLowerCase().trim() === user.email.toLowerCase().trim()
          );
          if (emailMatch) {
            cashier = emailMatch;
            console.log('Email lookup result: found');
          } else {
            console.log('Email lookup result: not found');
          }
        }
      } catch (err) {
        console.error("Error resolving cashier from User:", err);
      }
    }
    
     if (!cashier) {
       // Final fallback: try name match
       try {
         const user = await User.findById(cashierId);
         if (user && user.name) {
           const allStaff = await Staff.find({});
           const nameMatch = allStaff.find(s => 
             (s.name || "").toLowerCase().trim() === user.name.toLowerCase().trim()
           );
           if (nameMatch) {
             cashier = nameMatch;
             console.log('Name lookup result: found');
           } else {
             console.log('Name lookup result: not found');
           }
         }
       } catch (err) {
         console.error("Error in name fallback:", err);
       }
     }
    
     if (!cashier) {
       // As a last resort, try to create a minimal Staff record from the User data
       // This ensures shift opening can proceed even if Staff profile not manually created
       try {
         const user = await User.findById(cashierId);
         if (user) {
           console.log('Creating automatic Staff record for User:', user._id, user.name, user.email);
           // Provide fallback values for required fields
           const newStaff = await Staff.create({
             name: user.name || "Unknown Staff",
             role: user.role === "Manager" || user.role === "Admin" ? "Manager" : "Cashier",
             email: user.email || `${user._id}@auto.local`,
             phone: user.phone || "0000000000",
             shift: "Evening",
             hireDate: new Date(),
             totalSales: 0,
             commission: 0,
             status: "Active",
           });
           cashier = newStaff;
           console.log('Auto-created Staff record:', newStaff._id);
         }
       } catch (err) {
         console.error("Failed to auto-create Staff:", err);
       }
     }
    
    if (!cashier) {
      return NextResponse.json(
        { 
          error: "Cashier not found. Please ensure your account is linked to a staff profile. Contact an admin to create your staff record." },
        { status: 404 }
      );
    }

    // Validate numeric ranges
    if (openingCashFloat < 0 || openingMpesaBalance < 0) {
      return NextResponse.json(
        { error: "Opening balances cannot be negative" },
        { status: 400 }
      );
    }

     // Validate stock checklist items
     if (stockChecklist.length === 0) {
       return NextResponse.json(
         { error: "At least one stock item must be verified" },
         { status: 400 }
       );
     }

      // Process stock checklist with system quantity validation
      const processedChecklist: IShiftOpening["stockChecklist"] = [];
      let totalDiscrepancies = 0;
      let totalMissingValue = 0;

      for (let i = 0; i < stockChecklist.length; i++) {
        const item = stockChecklist[i];
        if (!item || typeof item !== 'object') {
          return NextResponse.json({ error: `Invalid stock checklist item at index ${i}` }, { status: 400 });
        }
        const { productId, physicalCount, physicalUnit, conversionFactor } = item;
        if (!productId) {
          return NextResponse.json({ error: `Missing productId in stock checklist item ${i + 1}` }, { status: 400 });
        }
        
        const product = await Product.findById(productId);
        if (!product) {
          return NextResponse.json(
            { error: `Product not found: ${item.productName || item.productId}` },
            { status: 400 }
          );
        }

        const systemQty = product.stock || 0;
        const rawPhysicalCount = Math.max(0, Number(physicalCount) || 0);
        const conversionFactorNum = Number(conversionFactor) || 1;
        
        // Convert physical count to base units using conversion factor
        const physicalCountInBase = rawPhysicalCount * conversionFactorNum;
        const discrepancy = physicalCountInBase - systemQty;

        // Safely compute missing value (costPrice may be undefined)
        const costPrice = Number(product.costPrice) || 0;
        const missingValue = (discrepancy < 0) ? Math.abs(discrepancy) * costPrice : 0;

        processedChecklist.push({
          productId: item.productId,
          productName: item.productName || product.name || "Unknown Product",
          category: item.category || product.category || "Uncategorized",
          unit: product.unit || "pcs",
          systemQuantity: systemQty,
          physicalCount: physicalCountInBase,
          physicalUnit: item.physicalUnit || product.unit || "pcs",
          conversionFactor: conversionFactorNum,
          discrepancy,
          notes: item.notes || "",
        });

        totalDiscrepancies += Math.abs(discrepancy);
        totalMissingValue += missingValue;
      }

       // Ensure totals are finite numbers
       if (!isFinite(totalDiscrepancies)) totalDiscrepancies = 0;
       if (!isFinite(totalMissingValue)) totalMissingValue = 0;

        // Create shift opening record - use the resolved Staff _id
       try {
         // Convert iso strings to Date objects if needed
         const parsedDeferredAt = deferredAt ? (typeof deferredAt === 'string' ? new Date(deferredAt) : deferredAt) : undefined;
         const parsedDeferredUntil = deferredUntil ? (typeof deferredUntil === 'string' ? new Date(deferredUntil) : deferredUntil) : undefined;
         
         // Generate openingId upfront to satisfy required validation
         const timestamp = Date.now().toString(36).toUpperCase();
         const random = Math.random().toString(36).substring(2, 6).toUpperCase();
         const openingId = `SO-${timestamp}-${random}`;
         
         const shiftOpeningData = {
           openingId,
           cashier: cashier._id,  // Use resolved Staff document ID
           shift,
           startTime: new Date(),
           openingCashFloat: Number(openingCashFloat),
           openingMpesaBalance: Number(openingMpesaBalance),
           stockChecklist: processedChecklist,
           totalDiscrepancies,
           totalMissingValue,
           cashierSignature: cashierSignature.trim(),
           confirmedAt: new Date(),
           status: "open",
           checklistDeferred: checklistDeferred || false,
           deferredAt: parsedDeferredAt,
           deferredUntil: parsedDeferredUntil,
         };
         
         console.log('Creating ShiftOpening with cashier:', cashier._id.toString(), 'shift:', shift);
         console.log('Stock checklist sample:', processedChecklist.slice(0, 2));
         
         const shiftOpening = await ShiftOpening.create(shiftOpeningData);
         console.log('ShiftOpening created successfully:', shiftOpening._id);
         return NextResponse.json(shiftOpening, { status: 201 });
      } catch (createErr: any) {
        console.error("Mongoose create error:", createErr);
        console.error("Error name:", createErr.name);
        console.error("Error code:", createErr.code);
        if (createErr.errors) {
          console.error("Validation errors:", createErr.errors);
        }
        // Handle validation errors specifically
        if (createErr.name === 'ValidationError' || createErr.name === 'ValidatorError') {
          const validationErrors = Object.keys(createErr.errors || {}).map(key => ({
            field: key,
            message: (createErr.errors as any)[key]?.message || String(createErr),
          }));
          return NextResponse.json(
            { 
              error: "Validation failed",
              validationErrors,
            },
            { status: 400 }
          );
         }
         // Handle CastError (invalid ObjectId format, etc.)
         if (createErr.name === 'CastError') {
           return NextResponse.json(
             { error: `Invalid data format for field "${createErr.path}": ${createErr.message}` },
             { status: 400 }
           );
         }
         // Handle duplicate key error
         if (createErr.code === 11000) {
          return NextResponse.json(
            { error: "Duplicate key error. A record with the same ID already exists." },
            { status: 409 }
          );
        }
        throw createErr; // re-throw to outer catch
      }
   } catch (error) {
     console.error("Error creating shift opening:", error);
     const errorMessage = error instanceof Error ? error.message : String(error);
     let errorStack: string | undefined;
     if (process.env.NODE_ENV === "development" && error instanceof Error) {
       errorStack = error.stack;
     }
     return NextResponse.json(
       { 
         error: "Failed to create shift opening",
         details: errorMessage,
         stack: errorStack,
       }, 
       { status: 500 }
     );
   }
}
