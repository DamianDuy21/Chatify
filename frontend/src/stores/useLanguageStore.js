import { create } from "zustand";
import { getLanguagesAPI } from "../lib/api";
import { getFlagToLanguage } from "../lib/utils";

export const useLanguageStore = create((set) => ({
  languages: [],

  getLanguages: async () => {
    try {
      const { data } = await getLanguagesAPI();
      const langData = data.languages.map((lang) => ({
        ...lang,
        name: {
          vi: getFlagToLanguage(lang.locale, "vi"),
          en: getFlagToLanguage(lang.locale, "en"),
        },
      }));
      set({ languages: langData });
    } catch (error) {
      console.error("Failed to fetch languages:", error);
    }
  },
}));
