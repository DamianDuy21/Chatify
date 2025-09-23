import { showToast } from "@/components/costumed/CostumedToast";
import { useAuthStore } from "@/stores/useAuthStore.js";
import { useChatStore } from "@/stores/useChatStore.js";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export const useLogin = () => {
  const t = useTranslations("SignInPage");
  const router = useRouter();
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
      router.replace("/");
    },
    onError: (error) => {
      console.error("useLogin error:", error);
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
