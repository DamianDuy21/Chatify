import { useMutation } from "@tanstack/react-query";
import { showToast } from "../components/costumed/CostumedToast";
import { useAuthStore } from "../stores/useAuthStore.js";
import { useTranslation } from "react-i18next";
export const useLogout = () => {
  const { t } = useTranslation("navbar");
  const logoutAuthStore = useAuthStore((s) => s.logoutAuthStore);
  const { mutate, isPending, error } = useMutation({
    mutationFn: logoutAuthStore,
    onSuccess: async () => {
      showToast({ message: t("useLogout.success"), type: "success" });
    },
    onError: (error) => {
      showToast({
        message: error?.response?.data?.message || t("useLogout.error"),
        type: "error",
      });
    },
  });
  return { mutate, isPending, error };
};
