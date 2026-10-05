// Theme handling: persisted in localStorage, applied as <html data-theme="...">.
export const THEMES = [
  { id: "black", label: "Black", desc: "Pure black, OLED friendly", swatch: ["#000000", "#0a0a0a", "#22d3ee"] },
  { id: "midnight", label: "Midnight", desc: "Deep navy blue", swatch: ["#060a14", "#0e1728", "#22d3ee"] },
  { id: "light", label: "Light", desc: "Bright daytime view", swatch: ["#f1f5f9", "#ffffff", "#0891b2"] },
];

const KEY = "cellguard.theme";
export const DEFAULT_THEME = "black";

export function getTheme() {
  try {
    const t = window.localStorage.getItem(KEY);
    return THEMES.some((x) => x.id === t) ? t : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(id) {
  document.documentElement.setAttribute("data-theme", id);
  document.documentElement.style.colorScheme = id === "light" ? "light" : "dark";
}

export function setTheme(id) {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {}
  applyTheme(id);
}
