import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "vgc.theme";
const EVENT_NAME = "vgc-theme-change";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent<Theme>(EVENT_NAME, { detail: theme }));
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    const sync = (event: Event) => setTheme((event as CustomEvent<Theme>).detail);
    window.addEventListener(EVENT_NAME, sync);
    return () => window.removeEventListener(EVENT_NAME, sync);
  }, []);

  return {
    theme,
    toggleTheme: () => applyTheme(theme === "light" ? "dark" : "light"),
  };
}

