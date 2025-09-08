import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { showToast } from "../components/costumed/CostumedToast";
import { useAuthStore } from "../stores/useAuthStore.js";
import { useChatStore } from "../stores/useChatStore.js";
export const useLogin = () => {
  const { t } = useTranslation("loginPage");
  const signInAuthStore = useAuthStore((s) => s.signInAuthStore);
  const getConversations = useChatStore((s) => s.getConversations);
  const { mutate, isPending, error } = useMutation({
    mutationFn: (loginData) => signInAuthStore(loginData),
    onSuccess: (data) => {
      getConversations();
      showToast({
        message: data?.message || t("toast.useLogin.success"),
        type: "success",
      });
    },
    onError: (error) => {
      showToast({
        message: error?.response?.data?.message || t("toast.useLogin.error"),
        type: "error",
      });
    },
  });
  return {
    mutate,
    isPending,
    error,
  };
};
