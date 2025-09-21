"use client";

import { useThemeStore } from "@/stores/useThemeStore";
import { useEffect } from "react";

export default function PublicClientProvider({ children }) {
  const { hydrateTheme } = useThemeStore();

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  return children;
}
