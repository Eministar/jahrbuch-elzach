"use client";
import { createContext, useContext, PropsWithChildren } from "react";

type Theme = "dark" | "light";
interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const theme: Theme = "dark";

  // Leere Funktionen, da das Theme nicht mehr geändert werden kann
  const toggle = () => {};
  const set = () => {};

  return (
    <ThemeContext.Provider value={{ theme, toggle, set }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
