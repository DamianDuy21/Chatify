"use client";

import { create } from "zustand";
import { getLanguagesAPI } from "@/lib/api";

export const useLanguageStore = create((set) => ({
  languages: [],

  getLanguages: async () => {
    try {
      const { data } = await getLanguagesAPI();
      set({ languages: data.languages });
    } catch (error) {
      console.error("Failed to fetch languages:", error);
    }
  },
}));
