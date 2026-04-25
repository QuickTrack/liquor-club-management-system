"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function FloatingSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleMouseEnter() {
    setIsOpen(true);
  }

  function handleMouseLeave() {
    if (!isHovering) {
      setIsOpen(false);
    }
  }

  function handleSidebarMouseEnter() {
    setIsHovering(true);
    setIsOpen(true);
  }

  function handleSidebarMouseLeave() {
    setIsHovering(false);
    setIsOpen(false);
  }

  function closeSidebar() {
    setIsOpen(false);
  }

  if (!mounted) {
    return null;
  }

  return (
    <div>
      <div
        className="fixed left-0 top-0 w-6 h-full z-40"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      <aside
        className={`fixed left-0 top-0 h-full w-64 z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          borderRight: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <div
          className="flex items-center gap-3 px-5 py-6 border-b"
          style={{ borderColor: "rgba(0,0,0,0.06)" }}
        >
          <div
            className="p-2.5 rounded-xl"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow: "0 4px 14px rgba(59, 130, 246, 0.3)",
              }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 2L6 6V20C6 21.1046 6.89543 22 8 22H10C10.5523 22 11 21.5523 11 21V18H13V21C13 21.5523 13.4477 22 14 22H16C17.1046 22 18 21.1046 18 20V6L16 2H8Z"
                fill="white"
              />
              <path
                d="M9 2V6H15V2"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 10H14"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: "#1F2937" }}
          >
            Liquor Club
          </span>
        </div>
        <nav className="p-3 space-y-1" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: isActive
                    ? "rgba(59, 130, 246, 0.1)"
                    : "transparent",
                  color: isActive ? "#3b82f6" : "#6B7280",
                }}
              >
                <item.icon className="w-5 h-5" />
                <span
                  className="text-sm font-medium"
                  style={{ color: isActive ? "#B45309" : "inherit" }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#3b82f6" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div
          className="absolute bottom-0 left-0 right-0 p-4 border-t"
          style={{ borderColor: "rgba(0,0,0,0.06)" }}
        >
          <div
            className="p-4 rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(180, 83, 9, 0.08) 0%, rgba(217, 119, 6, 0.05) 100%)",
              border: "1px solid rgba(180, 83, 9, 0.1)",
            }}
          >
            <p className="text-xs font-medium" style={{ color: "#92400E" }}>
              Press{" "}
              <kbd
                className="px-1.5 py-0.5 rounded text-xs font-mono"
                style={{
                  backgroundColor: "rgba(180, 83, 9, 0.15)",
                  color: "#B45309",
                }}
              >
                Ctrl
              </kbd>
              {" + "}
              <kbd
                className="px-1.5 py-0.5 rounded text-xs font-mono"
                style={{
                  backgroundColor: "rgba(180, 83, 9, 0.15)",
                  color: "#B45309",
                }}
              >
                /
              </kbd>{" "}
              to toggle
            </p>
          </div>
        </div>
      </aside>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
}