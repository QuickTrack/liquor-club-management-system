"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="group relative w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: "rgb(var(--secondary))",
        border: "1px solid rgb(var(--border))",
      }}
      aria-label={`Switch to ${theme === "dark" ? "bright" : "dark"} theme`}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-700/0 via-neutral-700/10 to-neutral-700/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Icon container */}
      <div
        className={`
          relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300
          ${
            theme === "dark"
              ? "bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30"
              : "bg-gradient-to-br from-slate-500/20 to-slate-600/10 border border-slate-500/30"
          }
        `}
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-slate-300" />
        )}
      </div>

      {/* Label */}
      <span className="relative text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}
