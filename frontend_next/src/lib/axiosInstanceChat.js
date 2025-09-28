import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { getUserLocale, getUserToken } from "@/services/locale";

const BACKEND_CHAT_URL = process.env.NEXT_PUBLIC_BACKEND_CHAT_URL;

export const axiosInstanceChat = axios.create({
  baseURL: `${BACKEND_CHAT_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstanceChat.interceptors.request.use(async (config) => {
  const token = await getUserToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  const locale = await getUserLocale();
  if (locale) {
    config.headers["X-Locale"] = locale;
  }
  return config;
});

axiosInstanceChat.interceptors.response.use(
  (response) => response,
  async (error) => {
    const msg = error?.status === 401 || error?.response?.status === 401;
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
