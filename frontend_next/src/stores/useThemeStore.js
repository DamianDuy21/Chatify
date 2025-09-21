"use client";

import { create } from "zustand";

// --- Helpers cho cookie ---
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift() || null;
  return null;
}

function setCookie(name, value, days = 365) {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; path=/; expires=${date.toUTCString()}; samesite=lax`;
}

export const useThemeStore = create((set) => ({
  theme: null,

  setTheme: (theme) => {
    // lưu vào cookie
    setCookie("chatify-theme", theme);
    set({ theme });

    if (typeof document !== "undefined") {
      const el = document.documentElement;
      el.setAttribute("data-theme", theme);

      const darks = new Set([
        "night",
        "halloween",
        "black",
        "dracula",
        "business",
        "dark",
      ]);
      el.style.colorScheme = darks.has(theme) ? "dark" : "light";
    }
  },

  hydrateTheme: () => {
    const saved = getCookie("chatify-theme");
    if (saved) {
      set({ theme: saved });

      if (typeof document !== "undefined") {
        const el = document.documentElement;
        el.setAttribute("data-theme", saved);

        const darks = new Set([
          "night",
          "halloween",
          "black",
          "dracula",
          "business",
          "dark",
        ]);
        el.style.colorScheme = darks.has(saved) ? "dark" : "light";
      }
    }
  },
}));
