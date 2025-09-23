import { useMutation } from "@tanstack/react-query";
import { showToast } from "@/components/costumed/CostumedToast";
import { useAuthStore } from "@/stores/useAuthStore.js";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
export const useLogout = () => {
  const t = useTranslations("Navbar");
  const router = useRouter();
  const logoutAuthStore = useAuthStore((s) => s.logoutAuthStore);
  const { mutate, isPending, error } = useMutation({
    mutationFn: logoutAuthStore,
    onSuccess: async () => {
      showToast({ message: t("useLogout.success"), type: "success" });
      router.replace("/signin");
    },
    onError: (error) => {
      console.error("useLogout error:", error);
      showToast({
        message: error?.response?.data?.message || t("useLogout.error"),
        type: "error",
      });
    },
  });
  return { mutate, isPending, error };
};
