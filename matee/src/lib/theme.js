// Theme preference: "system" follows prefers-color-scheme, "light" and "dark"
// force a scheme through data-theme on <html> (see globals.css). Stored in a
// cookie so the server renders the right theme on the first paint.
export const THEME_COOKIE = "matee-theme";
export const THEMES = [
  { value: "system", label: "ตามระบบ" },
  { value: "light", label: "สว่าง" },
  { value: "dark", label: "มืด" },
];

export function readTheme(value) {
  return value === "light" || value === "dark" ? value : "system";
}
