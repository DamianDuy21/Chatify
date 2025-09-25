import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const axiosInstance = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
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
