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
      <div
        className="fixed left-0 top-0 w-16 h-full z-40"
        onMouseEnter={() => setIsOpen(true)}
      />
      <aside
        className={`fixed left-0 top-0 h-full w-64 p-4 flex flex-col border-r z-50 transition-transform duration-300 bg-card border-default ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div className="flex items-center gap-3 mb-8 px-3 py-2">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <GlassWater className="w-7 h-7 text-amber-600" />
          </div>
          <span
            className="text-xl font-bold tracking-tight"
            style={{ color: "rgb(var(--foreground))" }}
          >
            Liquor Club
          </span>
        </div>
        
        <nav className="space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-item"
              style={{ color: "rgb(var(--muted-foreground))" }}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-4 pt-4" style={{ borderTopColor: "rgb(var(--border))" }}>
          {isAuthenticated && user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-800/50">
                <div className="p-2 rounded-full bg-amber-500/10">
                  <User className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">
                    {user.role}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="sidebar-item justify-center"
              style={{ color: "rgb(var(--muted-foreground))" }}
            >
              Sign In
            </Link>
          )}
          <ThemeToggle />
        </div>
      </aside>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}