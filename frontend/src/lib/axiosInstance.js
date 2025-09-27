import axios from "axios";
import Cookies from "js-cookie";
import { useAuthStore } from "../stores/useAuthStore";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const JWT_NAME = "jwt_chatify";

export const axiosInstance = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const raw = Cookies.get(JWT_NAME);
  if (raw) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${raw}`,
    };
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
        }
      } catch (error) {
        console.error("Error during forced logout:", error);
      }
    }
    return Promise.reject(error);
  }
);
