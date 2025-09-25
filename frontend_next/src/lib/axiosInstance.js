import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { getUserLocale } from "@/services/locale";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const axiosInstance = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(async (config) => {
  const locale = await getUserLocale();
  if (locale) {
    config.headers["X-Locale"] = locale;
  }
  return config;
});

axiosInstance.interceptors.response.use(
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
      } catch (e) {
        console.error("Error during forced logout:", e);
      }
    }
    return Promise.reject(error);
  }
);
