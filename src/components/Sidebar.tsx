"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthContext";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBasket,
  FlaskConical,
  UserCog,
  BarChart3,
  Wallet,
  Truck,
  Shield,
  Bell,
  Settings,
  GlassWater,
  LogOut,
  User,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "POS & Billing", icon: ShoppingBasket },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/drinks", label: "Bar & Drinks", icon: FlaskConical },
  { href: "/members", label: "Customers", icon: Users },
  { href: "/staff", label: "Staff", icon: UserCog },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/financial", label: "Financial", icon: Wallet },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/compliance", label: "Compliance", icon: Shield },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Hover Trigger Zone - thin strip */}
      <div
        className="fixed left-0 top-0 w-5 h-full z-40"
        onMouseEnter={() => setIsOpen(true)}
      />

      {/* Sidebar - Thin, clean white design */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 z-50 transition-all duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Main Container - Clean white with subtle shadow */}
        <div className="h-full w-full flex flex-col bg-white border-r border-neutral-200 shadow-xl">
          {/* Logo & Brand - Compact */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-neutral-100">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
              <GlassWater className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-neutral-900 tracking-tight">
              Liquor Club
            </span>
          </div>

          {/* Navigation - Tight spacing, clean typography */}
          <nav className="flex-1 overflow-y-auto py-3 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                    transition-all duration-200 ease-out
                    ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    }
                  `}
                >
                  {/* Icon */}
                  <div
                    className={`
                      flex items-center justify-center w-9 h-9 rounded-lg transition-colors
                      ${
                        isActive
                          ? "bg-emerald-100 text-emerald-600"
                          : "text-neutral-400 group-hover:text-neutral-600"
                      }
                    `}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                  </div>

                  {/* Label */}
                  <span className="flex-1 text-sm leading-none">
                    {item.label}
                  </span>

                  {/* Active chevron */}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-emerald-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="pt-3 pb-5 px-4 border-t border-neutral-100">
            {/* User Profile - Minimal */}
            {isAuthenticated && user ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {user.role}
                    </p>
                  </div>
                </div>

                {/* Primary CTA - Vibrant green with crisp white text */}
                <button
                  onClick={logout}
                  className="group w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm tracking-wide">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="group flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                }}
              >
                <User className="w-4 h-4" />
                <span className="text-sm tracking-wide">Sign In</span>
              </Link>
            )}

            {/* Theme Toggle - Compact */}
            <div className="mt-2.5">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop - Subtle blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/15 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
