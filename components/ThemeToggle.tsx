"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "efc-theme";

export default function ThemeToggle() {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setMode(isDark ? "dark" : "light");
  }, []);

  function toggle() {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem(KEY, next);
    } catch {}
  }

  return (
    <button
      type="button"
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-surface text-fg-subtle hover:text-fg hover:border-border-strong transition-colors"
      onClick={toggle}
    >
      {mode === "dark" ? <Sun className="w-4 h-4" aria-hidden /> : <Moon className="w-4 h-4" aria-hidden />}
    </button>
  );
}
