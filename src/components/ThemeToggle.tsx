"use client";

import { Sun, Moon, Sparkles } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      style={{ 
        backgroundColor: "rgb(var(--secondary))",
        color: "rgb(var(--secondary-foreground))",
        boxShadow: "var(--shadow-sm)"
      }}
      aria-label={`Switch to ${theme === "dark" ? "bright" : "dark"} theme`}
    >
      {theme === "dark" ? (
        <>
          <div className="p-1 rounded-lg bg-blue-500/20">
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-sm font-medium">Light Mode</span>
        </>
      ) : (
        <>
          <div className="p-1 rounded-lg bg-slate-500/20">
            <Moon className="w-4 h-4 text-slate-600" />
          </div>
          <span className="text-sm font-medium">Dark Mode</span>
        </>
      )}
    </button>
  );
}