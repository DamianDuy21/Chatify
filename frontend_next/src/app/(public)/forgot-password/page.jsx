"use client";

import LocaleSwitcher from "@/components/buttons/LocaleSwitcher";
import ThemesSelector from "@/components/buttons/ThemeSelector.jsx";
import CostumedPasswordInput from "@/components/costumed/CostumedPasswordInput.jsx";
import { showToast } from "@/components/costumed/CostumedToast";
import { resetPasswordAPI, resetPasswordVerificationAPI } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, LoaderIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ForgotPasswordPage = () => {
  const t = useTranslations("ForgotPasswordPage");
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const { mutate: resetPasswordMutation, isPending: isResettingPassword } =
    useMutation({
      mutationFn: resetPasswordAPI,
      onSuccess: (data) => {
        showToast({
          message: data?.message || t("toast.resetPasswordMutation.success"),
          type: "success",
        });
        setStep(2);
      },
      onError: (error) => {
        showToast({
          message:
            error?.response?.data?.message ||
            t("toast.resetPasswordMutation.error"),
          type: "error",
        });
      },
    });

  const {
    mutate: resetPasswordVerificationMutation,
    isPending: isResetPasswordVerifying,
  } = useMutation({
    mutationFn: resetPasswordVerificationAPI,
    onSuccess: (data) => {
      showToast({
        message:
          data?.message || t("toast.resetPasswordVerificationMutation.success"),
        type: "success",
      });
      router.replace("/signin");
    },
    onError: (error) => {
      console.error(error);
      showToast({
        message:
          error?.response?.data?.message ||
          t("toast.resetPasswordVerificationMutation.error"),
        type: "error",
      });
    },
  });

  const validateResetPasswordData = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return {
        message: t("toast.validateResetPasswordData.allFieldsAreRequired"),
        type: "error",
      };
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      return {
        message: t("toast.validateResetPasswordData.invalidEmail"),
        type: "error",
      };
    }
    return { message: "" };
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    const { message } = validateResetPasswordData();
    if (message) {
      showToast({
        message,
        type: "error",
      });
      return;
    }
    try {
      const trimmedEmail = email.trim();
      resetPasswordMutation({ email: trimmedEmail });
    } catch (error) {
      console.error(error);
      showToast({
        message: error?.message || t("toast.handleResetPassword.error"),
        type: "error",
      });
    }
  };

  const validateResetPasswordVerificationData = () => {
    const trimmedNewPassword = newPassword.trim();
    const trimmedVerificationCode = verificationCode.trim();
    if (!trimmedNewPassword || !trimmedVerificationCode) {
      return {
        message: t(
          "toast.validateResetPasswordVerificationData.allFieldsAreRequired"
        ),
        type: "error",
      };
    }
    const passwordIsValid =
      trimmedNewPassword.length >= 8 &&
      /[A-Z]/.test(trimmedNewPassword) &&
      /[a-z]/.test(trimmedNewPassword) &&
      /[0-9]/.test(trimmedNewPassword) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(trimmedNewPassword);
    if (!passwordIsValid) {
      return {
        message: t(
          "toast.validateResetPasswordVerificationData.invalidPassword"
        ),
        type: "error",
      };
    }
    return { message: "" };
  };

  const handleResetPasswordVerification = (e) => {
    e.preventDefault();
    const { message } = validateResetPasswordVerificationData();
    if (message) {
      showToast({
        message,
        type: "error",
      });
      return;
    }

    try {
      const trimmedNewPassword = newPassword.trim();
      const trimmedVerificationCode = verificationCode.trim();
      resetPasswordVerificationMutation({
        email: email.trim(),
        newPassword: trimmedNewPassword,
        otp: trimmedVerificationCode,
      });
    } catch (error) {
      console.error(error);
      showToast({
        message:
          error?.message || t("toast.handleResetPasswordVerification.error"),
        type: "error",
      });
    }
  };

  return (
    <>
      <div
        className="flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8"
        // data-theme="night"
      >
        <div className="flex flex-col lg:flex-row w-full max-w-xl mx-auto bg-base-200 rounded-card shadow-lg">
          <div className="w-full p-8 pb-4 flex flex-col">
            {step === 1 ? (
              <>
                <form onSubmit={(e) => handleResetPassword(e)} action="">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {t("emailStep.title")}
                      </h2>
                      <p className="text-sm opacity-70">
                        {t("emailStep.subtitle")}
                      </p>
                    </div>
                    <div className="space-y-3">
                      {/* EMAIL */}
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text">
                            {t("emailStep.form.email.label")}
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder={t("emailStep.form.email.placeholder")}
                          className="input input-bordered w-full text-sm"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* SIGNUP BUTTON */}
                    <button
                      className="btn btn-primary w-full !mt-6"
                      type="submit"
                      disabled={isResettingPassword}
                    >
                      {!isResettingPassword ? (
                        t("emailStep.form.sendButton.text")
                      ) : (
                        <>
                          <LoaderIcon className="animate-spin size-5" />
                          {t("emailStep.form.sendButton.loadingText")}
                        </>
                      )}
                    </button>

                    {/* REDIRECT SIGNIN */}
                    <div className="text-center !mt-6">
                      <p className="text-sm">
                        <Link
                          href="/signin"
                          className="text-primary hover:underline"
                        >
                          {t("emailStep.form.backButton.text")}
                        </Link>
                      </p>
                    </div>
                  </div>
                </form>
                <div className="flex items-center justify-center mt-4 gap-2">
                  <ThemesSelector />
                  <LocaleSwitcher />
                </div>
              </>
            ) : (
              <>
                <form
                  onSubmit={(e) => handleResetPasswordVerification(e)}
                  action=""
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <ArrowLeft
                        className="text-primary size-6 cursor-pointer"
                        onClick={() => setStep(1)}
                      />
                      <div>
                        <h2 className="text-xl font-semibold">
                          {t("verificationStep.title")}
                        </h2>
                        <p className="text-sm opacity-70">
                          {t("verificationStep.subtitle")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {/* NEW PASSWORD */}
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text">
                            {t("verificationStep.form.newPassword.label")}
                          </span>
                        </label>

                        <CostumedPasswordInput
                          data={newPassword}
                          setData={setNewPassword}
                          placeholder={t(
                            "verificationStep.form.newPassword.placeholder"
                          )}
                        />
                      </div>
                      {/* REST CODE */}
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text">
                            {t("verificationStep.form.verificationCode.label")}
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder={t(
                            "verificationStep.form.verificationCode.placeholder"
                          )}
                          className="input input-bordered w-full text-sm"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          maxLength={6}
                        />
                        <p
                          className="text-sm text-primary hover:underline mt-2 text-end cursor-pointer"
                          onClick={handleResetPassword}
                        >
                          {t("verificationStep.form.resendCode.text")}
                        </p>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary w-full !mt-6"
                      type="submit"
                      disabled={isResetPasswordVerifying}
                    >
                      {!isResetPasswordVerifying ? (
                        t("verificationStep.form.verifyButton.text")
                      ) : (
                        <>
                          <LoaderIcon className="animate-spin size-5" />
                          {t("verificationStep.form.verifyButton.loadingText")}
                        </>
                      )}
                    </button>
                  </div>
                </form>
                <div className="flex items-center justify-center mt-4 gap-2">
                  <ThemesSelector />
                  <LocaleSwitcher />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
