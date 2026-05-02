"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface Shift {
  _id: string;
  openingId?: string;
  cashier: string;
  shift: "Morning" | "Evening" | "Night";
  startTime: string;
  openingCashFloat: number;
  openingMpesaBalance: number;
  status: "open" | "closed";
  cashierSignature?: string;
  confirmedAt?: string;
}

interface ShiftContextType {
  activeShift: Shift | null;
  setActiveShift: (shift: Shift | null) => void;
  clearActiveShift: () => void;
  shiftLoaded: boolean;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export function ShiftProvider({ children }: { children: ReactNode }) {
  const [activeShift, setActiveShift] = useState<Shift | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("activeShift");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Failed to parse activeShift from localStorage:", e);
      return null;
    }
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Persist activeShift to localStorage whenever it changes
    if (typeof window !== "undefined") {
      if (activeShift) {
        localStorage.setItem("activeShift", JSON.stringify(activeShift));
      } else {
        localStorage.removeItem("activeShift");
      }
    }
  }, [activeShift]);

  useEffect(() => {
    // Mark as loaded after initial render on client
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoaded(true);
  }, []);

  const clearActiveShift = () => {
    setActiveShift(null);
    localStorage.removeItem("activeShift");
  };

  if (!loaded) {
    return (
      <ShiftContext.Provider value={{ activeShift: null, setActiveShift: () => {}, clearActiveShift, shiftLoaded: false }}>
        {children}
      </ShiftContext.Provider>
    );
  }

  return (
    <ShiftContext.Provider value={{ activeShift, setActiveShift, clearActiveShift, shiftLoaded: true }}>
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error("useShift must be used within ShiftProvider");
  }
  return context;
}
