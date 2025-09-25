import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";
import { getUserLocale } from "@/services/locale";

const BACKEND_CHAT_URL = process.env.NEXT_PUBLIC_BACKEND_CHAT_URL;

export const axiosInstanceChat = axios.create({
  baseURL: `${BACKEND_CHAT_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

axiosInstanceChat.interceptors.request.use(async (config) => {
  const locale = await getUserLocale();
  if (locale) {
    config.headers["X-Locale"] = locale;
  }
  return config;
});

axiosInstanceChat.interceptors.response.use(
  (response) => response,
  async (error) => {
    const msg = error?.status === 401;
    if (msg) {
      try {
        const logout = useAuthStore.getState().logoutAuthStore;
        if (logout) {
          await logout({ skipRemote: true });
          window.location.href = "/signin";
        }
      } catch (error) {
        console.error("Error during forced logout:", error);
      }
    }
    return Promise.reject(error);
  }
);
