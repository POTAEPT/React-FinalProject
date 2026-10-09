"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { THEME_COOKIE } from "@/lib/theme";

// Global client state for the theme ("system" | "light" | "dark").
// The root layout reads the saved choice from the cookie and passes it in, so
// the first paint already has the right theme. Any client component can read
// or change it with useTheme(), without passing props down through the shell,
// the header and each menu.
const ThemeContext = createContext(null);

// Writes the choice where the server reads it (cookie, for the first paint)
// and applies it at once through data-theme on <html> (see globals.css).
function applyTheme(value) {
  const root = document.documentElement;

  if (value === "system") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = value;
  }

  document.cookie = `${THEME_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function ThemeProvider({ initialTheme, children }) {
  const [theme, setThemeState] = useState(initialTheme);

  const value = useMemo(
    () => ({
      theme,
      setTheme(next) {
        applyTheme(next);
        setThemeState(next);
      },
    }),
    [theme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

// { theme, setTheme } from the nearest ThemeProvider (the root layout).
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }

  return context;
}
