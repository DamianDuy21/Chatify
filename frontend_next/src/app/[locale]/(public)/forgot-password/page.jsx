"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, LoaderIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAPI, resetPasswordVerificationAPI } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { showToast } from "@/components/costumed/CostumedToast";
import LocaleSwitcher from "@/components/buttons/LocaleSwitcher";
import ThemesSelector from "@/components/buttons/ThemeSelector.jsx";
import CostumedPasswordInput from "@/components/costumed/CostumedPasswordInput.jsx";
import Link from "next/link";

const ForgotPasswordPage = () => {
  const { t } = useTranslation("forgotPasswordPage");
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
          message:
            data?.message ||
            "Vui lòng kiểm tra email của bạn để lấy mã xác minh",
          type: "success",
        });
        setStep(2);
      },
      onError: (error) => {
        showToast({
          message:
            error?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại",
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
        message: data?.message || "Đặt lại mật khẩu thành công!",
        type: "success",
      });
      router.replace("/signin");
    },
    onError: (error) => {
      console.error(error);
      showToast({
        message:
          error?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại",
        type: "error",
      });
    },
  });

  const validateResetPasswordData = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return {
        message: "Tất cả các trường là bắt buộc",
        type: "error",
      };
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      return {
        message: "Email không hợp lệ",
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
        message: error?.message || "Có lỗi xảy ra, vui lòng thử lại",
        type: "error",
      });
    }
  };

  const validateResetPasswordVerificationData = () => {
    const trimmedNewPassword = newPassword.trim();
    const trimmedVerificationCode = verificationCode.trim();
    if (!trimmedNewPassword || !trimmedVerificationCode) {
      return {
        message: "Tất cả các trường là bắt buộc",
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
        message: "Mật khẩu không hợp lệ",
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
        message: error?.message || "Có lỗi xảy ra, vui lòng thử lại",
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
                      <h2 className="text-xl font-semibold">Quên mật khẩu</h2>
                      <p className="text-sm opacity-70">
                        Nhập email của bạn để nhận mã xác thực
                      </p>
                    </div>
                    <div className="space-y-3">
                      {/* EMAIL */}
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text">Email</span>
                        </label>
                        <input
                          type="text"
                          placeholder={"email@example.com"}
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
                        "Gửi mã"
                      ) : (
                        <>
                          <LoaderIcon className="animate-spin size-5" />
                          Đang gửi...
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
                          Quay lại đăng nhập
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
                          Xác thực khôi phục mật khẩu
                        </h2>
                        <p className="text-sm opacity-70">
                          Nhập mật khẩu mới và mã xác thực
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {/* NEW PASSWORD */}
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text">Mật khẩu mới</span>
                        </label>

                        <CostumedPasswordInput
                          data={newPassword}
                          setData={setNewPassword}
                          placeholder={"Nhập mật khẩu mới"}
                        />
                      </div>
                      {/* REST CODE */}
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text">Mã xác thực</span>
                        </label>
                        <input
                          type="text"
                          placeholder={"Nhập mã xác thực"}
                          className="input input-bordered w-full text-sm"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          maxLength={6}
                        />
                        <p
                          className="text-sm text-primary hover:underline mt-2 text-end cursor-pointer"
                          onClick={handleResetPassword}
                        >
                          Gửi lại
                        </p>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary w-full !mt-6"
                      type="submit"
                      disabled={isResetPasswordVerifying}
                    >
                      {!isResetPasswordVerifying ? (
                        "Xác thực"
                      ) : (
                        <>
                          <LoaderIcon className="animate-spin size-5" />
                          "Đang xác thực..."
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
