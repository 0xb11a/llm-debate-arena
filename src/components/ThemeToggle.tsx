"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="w-8 h-8 rounded-lg border border-ink/10 text-ink/40 hover:text-ink/70 hover:border-ink/20 font-mono text-sm transition-colors cursor-pointer flex items-center justify-center"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? "\u2600" : "\u263E"}
    </button>
  );
}
