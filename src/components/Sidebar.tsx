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
      {/* Hover Trigger Zone */}
      <div
        className="fixed left-0 top-0 w-6 h-full z-40"
        onMouseEnter={() => setIsOpen(true)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Main Container with Glassmorphism */}
        <div className="h-full w-full p-5 flex flex-col bg-gradient-to-b from-neutral-900/95 via-neutral-900/90 to-neutral-900/95 backdrop-blur-2xl border-r border-neutral-800/50 shadow-2xl">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4 mb-10 group cursor-pointer">
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-emerald-500/20">
              <GlassWater className="w-6 h-6 text-emerald-400" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span
              className="text-xl font-bold tracking-[-0.02em] bg-gradient-to-r from-white via-neutral-100 to-neutral-300 bg-clip-text text-transparent"
            >
              Liquor Club
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group relative flex items-center gap-3 px-4 py-3 rounded-2xl
                    transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                    border border-transparent
                    ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-500/15 to-transparent text-white shadow-sm shadow-emerald-500/5 border-emerald-500/20"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700/50"
                    }
                  `}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30" />
                  )}

                  {/* Icon */}
                  <div
                    className={`
                      relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300
                      ${
                        isActive
                          ? "bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 text-emerald-400 shadow-lg shadow-emerald-500/10"
                          : "bg-neutral-800/50 text-neutral-500 group-hover:text-neutral-300 group-hover:bg-neutral-700/50"
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/20 to-transparent opacity-50" />
                    )}
                  </div>

                  {/* Label */}
                  <span className="flex-1 text-sm font-medium tracking-wide">
                    {item.label}
                  </span>

                  {/* Chevron for active state */}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-emerald-400/80 animate-pulse" />
                  )}

                  {/* Hover glow effect */}
                  <div
                    className={`
                      absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none
                      ${
                        isActive
                          ? "bg-gradient-to-r from-emerald-500/5 to-transparent"
                          : "group-hover:bg-gradient-to-r from-white/5 to-transparent"
                      }
                    `}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="mt-6 pt-6 space-y-3 border-t border-neutral-800/50">
            {/* User Profile Card */}
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-neutral-800/70 to-neutral-800/40 border border-neutral-700/50 hover:border-emerald-500/30 transition-all duration-300">
                  <div className="relative">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-600/10 border border-amber-500/20">
                      <User className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-neutral-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate font-medium">
                      {user.role}
                    </p>
                  </div>
                </div>

                {/* Primary CTA Button - Vibrant Green with Reddish Border */}
                <button
                  onClick={logout}
                  className="group relative w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl overflow-hidden transition-all duration-300"
                  style={{
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    border: "1.5px solid transparent",
                    backgroundClip: "padding-box",
                    WebkitMask:
                      "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                >
                  {/* Reddish gradient border overlay */}
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(135deg, #dc2626 0%, #f59e0b 50%, #10b981 100%)",
                      WebkitMask:
                        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                      padding: "1.5px",
                    }}
                  />

                  <LogOut className="w-4 h-4 text-white/90" />
                  <span className="text-sm font-bold text-white tracking-wide">
                    Sign Out
                  </span>

                  {/* Hover shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="group relative flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  border: "1.5px solid transparent",
                  backgroundClip: "padding-box",
                  WebkitMask:
                    "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              >
                {/* Reddish gradient border overlay */}
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, #dc2626 0%, #f59e0b 50%, #10b981 100%)",
                    WebkitMask:
                      "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                      padding: "1.5px",
                  }}
                />

                <User className="w-4 h-4 text-white/90" />
                <span className="text-sm font-bold text-white tracking-wide">
                  Sign In
                </span>

                {/* Hover shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
              </Link>
            )}

            {/* Theme Toggle */}
            <div className="pt-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gradient-to-br from-black/60 via-neutral-900/40 to-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
