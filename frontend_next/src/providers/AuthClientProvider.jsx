"use client";

import { useEffect } from "react";

import { useLanguageStore } from "@/stores/useLanguageStore";
import { useThemeStore } from "@/stores/useThemeStore";

export default function AuthClientProvider({ children }) {
  const { hydrateTheme } = useThemeStore();

  const getLanguages = useLanguageStore((s) => s.getLanguages);

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    getLanguages();
  }, [getLanguages]);

  return children;
}
