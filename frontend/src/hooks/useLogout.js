import { useMutation } from "@tanstack/react-query";
import { showToast } from "../components/costumed/CostumedToast";
import { useAuthStore } from "../stores/useAuthStore.js";
export const useLogout = () => {
  const logoutAuthStore = useAuthStore((s) => s.logoutAuthStore);
  const { mutate, isPending, error } = useMutation({
    mutationFn: logoutAuthStore,
    onSuccess: async () => {
      showToast({ message: "Logout successful!", type: "success" });
    },
    onError: (error) => {
      showToast({
        message: error?.response?.data?.message || "Error logging out!",
        type: "error",
      });
    },
  });
  return { mutate, isPending, error };
};
