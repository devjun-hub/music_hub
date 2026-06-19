"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  { id: "cyan",    label: "Cyan",    color: "#06b6d4", desc: "Electric" },
  { id: "purple",  label: "Purple",  color: "#a855f7", desc: "Studio" },
  { id: "amber",   label: "Amber",   color: "#f59e0b", desc: "Warm" },
  { id: "emerald", label: "Emerald", color: "#10b981", desc: "Forest" },
  { id: "rose",    label: "Rose",    color: "#f43f5e", desc: "Club" },
] as const satisfies ReadonlyArray<{ id: string; label: string; color: string; desc: string }>;

export type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "music-hub-theme";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "cyan",
  setTheme: () => {},
});

function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("cyan");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (saved && THEMES.some((t) => t.id === saved)) {
      setTimeout(() => {
        setThemeState(saved);
      }, 0);
      applyTheme(saved);
    }
  }, []);

  function setTheme(id: ThemeId) {
    setThemeState(id);
    applyTheme(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
