"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="group w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 hover:bg-neutral-50 active:scale-[0.98] border border-transparent hover:border-neutral-200"
      aria-label={`Switch to ${theme === "dark" ? "bright" : "dark"} theme`}
    >
      {theme === "dark" ? (
        <>
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-600">
            <Sun className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-medium text-neutral-700">Light</span>
        </>
      ) : (
        <>
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600">
            <Moon className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-medium text-neutral-700">Dark</span>
        </>
      )}
    </button>
  );
}
