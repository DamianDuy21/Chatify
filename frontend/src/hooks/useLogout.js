import { useMutation } from "@tanstack/react-query";
import { showToast } from "../components/costumed/CostumedToast";
import { useAuthStore } from "../stores/useAuthStore.js";
import { useChatStore } from "../stores/useChatStore.js";
export const useLogout = () => {
  const logoutAuthStore = useAuthStore((s) => s.logoutAuthStore);
  const setConversations = useChatStore((s) => s.setConversations);
  const { mutate, isPending, error } = useMutation({
    mutationFn: logoutAuthStore,
    onSuccess: async () => {
      setConversations([]);
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
