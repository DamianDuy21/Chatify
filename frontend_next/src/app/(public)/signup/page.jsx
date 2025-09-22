"use client";

import LocaleSwitcher from "@/components/buttons/LocaleSwitcher.jsx";
import ThemeSelector from "@/components/buttons/ThemeSelector.jsx";
import CostumedPasswordInput from "@/components/costumed/CostumedPasswordInput";
import { showToast } from "@/components/costumed/CostumedToast.jsx";
import { signUpAPI, signUpVerificationAPI } from "@/lib/api.js";
import { deepTrimObj } from "@/lib/utils.js";
import { useThemeStore } from "@/stores/useThemeStore.js";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Hexagon, LoaderIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link.js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const SignUpPage = () => {
  const { t } = useTranslation("signUpPage");
  const { theme } = useThemeStore();
  const router = useRouter();

  const [signUpData, setSignUpData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState("");
  const [isCheckedPolicy, setIsCheckedPolicy] = useState(false);

  const { mutate: signUpMutation, isPending: isSigningUp } = useMutation({
    mutationFn: (data) => signUpAPI(data),
    onSuccess: (data) => {
      showToast({
        message:
          data?.message ||
          "Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác minh",
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
    mutate: resendVerificationCodeMutation,
    isPending: isResendingVerificationCode,
  } = useMutation({
    mutationFn: (data) => signUpAPI(data),
    onSuccess: (data) => {
      showToast({
        message: data?.message || "Vui lòng kiểm tra email để lấy mã xác minh",
        type: "success",
      });
    },
    onError: (error) => {
      showToast({
        message:
          error?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại",
        type: "error",
      });
    },
  });

  const { mutate: signUpVerificationMutation, isPending: isVerifyingCode } =
    useMutation({
      mutationFn: signUpVerificationAPI,
      onSuccess: (data) => {
        showToast({
          message: data?.message || "Xác minh đăng ký thành công!",
          type: "success",
        });
        router.replace("/signin");
      },
      onError: (error) => {
        console.error("Sign up verification error:", error);
        showToast({
          message:
            error?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại",
          type: "error",
        });
      },
    });

  const validateSignUpData = (rawData, isCheckedPolicy) => {
    const signUpData = deepTrimObj(rawData);

    const nameIsValid = /^[A-Za-zÀ-ỹ\s]+$/.test(signUpData.fullName);
    const emailIsValid =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(signUpData.email);
    const passwordIsValid =
      signUpData.password.length >= 8 &&
      /[A-Z]/.test(signUpData.password) &&
      /[a-z]/.test(signUpData.password) &&
      /[0-9]/.test(signUpData.password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(signUpData.password);

    if (!signUpData.fullName || !signUpData.email || !signUpData.password) {
      return {
        message: "Tất cả các trường là bắt buộc",
        cleanedData: signUpData,
      };
    } else if (!nameIsValid) {
      return {
        message: "Họ và tên không hợp lệ",
        cleanedData: signUpData,
      };
    } else if (!emailIsValid) {
      return {
        message: "Email không hợp lệ",
        cleanedData: signUpData,
      };
    } else if (!passwordIsValid) {
      return {
        message: "Mật khẩu không hợp lệ",
        cleanedData: signUpData,
      };
    } else if (!isCheckedPolicy) {
      return {
        message: "Bạn cần đồng ý với điều khoản dịch vụ và chính sách bảo mật",
        cleanedData: signUpData,
      };
    }

    return { message: null, cleanedData: signUpData };
  };

  const handleSignup = (e) => {
    e.preventDefault();
    const { message, cleanedData } = validateSignUpData(
      signUpData,
      isCheckedPolicy
    );

    if (message) {
      showToast({
        message,
        type: "error",
      });
      return;
    }
    try {
      signUpMutation(cleanedData);
    } catch (error) {
      console.error("Sign up failed:", error);
      showToast({
        message: error?.message || "Có lỗi xảy ra, vui lòng thử lại",
        type: "error",
      });
    }
  };

  const handleResendVerificationCode = () => {
    const { message, cleanedData } = validateSignUpData(
      signUpData,
      isCheckedPolicy
    );
    if (message) {
      showToast({
        message,
        type: "error",
      });
      return;
    }
    try {
      resendVerificationCodeMutation(cleanedData);
    } catch (error) {
      console.error("Resend verification code failed:", error);
      showToast({
        message: error?.message || "Có lỗi xảy ra, vui lòng thử lại",
        type: "error",
      });
    }
  };

  const handleSignUpVerification = (e) => {
    e.preventDefault();
    const trimmedVerificationCode = verificationCode.trim();
    if (!trimmedVerificationCode) {
      showToast({
        message: "Tất cả các trường là bắt buộc",
        type: "error",
      });
      return;
    }
    try {
      signUpVerificationMutation({
        email: signUpData.email,
        fullName: signUpData.fullName,
        password: signUpData.password,
        otp: trimmedVerificationCode,
      });
    } catch (error) {
      console.error("Sign up verification failed:", error);
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
        {step === 1 ? (
          <div className="flex flex-col lg:flex-row w-full max-w-xl lg:max-w-5xl mx-auto bg-base-200 rounded-card shadow-lg">
            {/* SIGNUP FORM - LEFT SIDE */}
            <div className="w-full lg:w-1/2 p-8 pb-4 flex flex-col">
              {/* LOGO */}
              <div className="mb-4 flex items-center justify-start gap-2">
                <Hexagon className="size-8 text-primary" />
                <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                  Chatify
                </span>
              </div>

              <div className="w-full">
                {/* arrow function need to pass event or else not working in onSubmit? */}
                <form onSubmit={(e) => handleSignup(e)} action="">
                  <div className="space-y-4">
                    {/* <div>
                      <h2 className="text-xl font-semibold">
                        {t("leftSide.hero.title")}
                      </h2>
                      <p className="text-sm opacity-70">
                        {t("leftSide.hero.subtitle")}
                      </p>
                    </div> */}
                    <div className="space-y-3">
                      {/* FULL NAME */}
                      <div className="form-control w-full">
                        <div className="flex items-center justify-between">
                          <label className="label">
                            <span className="label-text">Họ và tên</span>
                          </label>
                          <p className="text-xs opacity-70 mt-1">
                            *Bạn sẽ không thể thay đổi họ và tên của mình
                          </p>
                        </div>

                        <input
                          type="text"
                          placeholder="Nhập họ và tên"
                          className="input input-bordered w-full text-sm"
                          value={signUpData.fullName}
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              fullName: e.target.value,
                            })
                          }
                          maxLength={50}
                        />
                      </div>

                      {/* EMAIL */}
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text">Email</span>
                        </label>
                        <input
                          type="text"
                          placeholder="email@example.com"
                          className="input input-bordered w-full text-sm"
                          value={signUpData.email}
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>

                      {/* PASSWORD */}
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text">Mật khẩu</span>
                        </label>

                        <CostumedPasswordInput
                          data={signUpData}
                          setData={setSignUpData}
                          placeholder="********"
                        />
                      </div>

                      {/* ACCEPT TERMS */}
                      <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-2">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={isCheckedPolicy}
                            onChange={() =>
                              setIsCheckedPolicy(!isCheckedPolicy)
                            }
                          />
                          <span className="text-xs leading-tight">
                            Tôi đồng ý với{" "}
                            <span className="text-primary hover:underline">
                              điều khoản dịch vụ
                            </span>{" "}
                            và{" "}
                            <span className="text-primary hover:underline">
                              chính sách bảo mật
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* SIGNUP BUTTON */}
                    <button
                      className="btn btn-primary w-full"
                      type="submit"
                      disabled={isSigningUp}
                    >
                      {isSigningUp ? (
                        <>
                          <LoaderIcon className="animate-spin size-5" />
                          Đang đăng ký...
                        </>
                      ) : (
                        "Đăng ký"
                      )}
                    </button>

                    {/* REDIRECT LOGIN */}
                    <div className="text-center !mt-6">
                      <p className="text-sm">
                        Đã có tài khoản?{" "}
                        <Link
                          href="/signin"
                          className="text-primary hover:underline"
                        >
                          Đăng nhập
                        </Link>
                      </p>
                    </div>
                  </div>
                </form>
                <div className="flex items-center justify-center mt-4 gap-2">
                  <ThemeSelector />
                  <LocaleSwitcher />
                </div>
              </div>
            </div>

            {/* SIGNUP FORM - RIGHT SIDE */}
            <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center rounded-r-card">
              <div className="max-w-md py-8 px-6">
                {/* Illustration */}
                <div className="relative aspect-square max-w-sm mx-auto">
                  <Image
                    src={`/images/signup_pic/${theme}.png`}
                    alt="Language connection illustration"
                    className="w-full h-full"
                    width={360}
                    height={360}
                  />
                </div>

                <div className="text-center space-y-3 mt-6">
                  <h2 className="text-xl font-semibold">
                    {/* {t("rightSide.title")} */}
                    Tạo tài khoản
                  </h2>
                  <p className="opacity-70 text-sm">
                    {/* {t("rightSide.subtitle")} */}
                    Tham gia Chatify và bắt đầu hành trình học ngôn ngữ của bạn!
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row w-full max-w-xl mx-auto bg-base-200 rounded-card shadow-l">
            <div className="w-full p-8 pb-4 flex flex-col">
              <form onSubmit={(e) => handleSignUpVerification(e)} action="">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <ArrowLeft
                      className="text-primary size-6 cursor-pointer"
                      onClick={() => setStep(1)}
                    />
                    <div>
                      <h2 className="text-xl font-semibold">
                        Xác thực đăng ký
                      </h2>
                      <p className="text-sm opacity-70">
                        Nhập mã xác thực đã gửi đến email của bạn
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text">Mã xác thực</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập mã xác thực"
                        className="input input-bordered w-full text-sm"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        maxLength={6}
                      />
                      <p
                        className={`text-sm text-primary hover:underline mt-2 text-end ${
                          isResendingVerificationCode
                            ? "pointer-events-none opacity-70"
                            : "cursor-pointer"
                        }`}
                        onClick={handleResendVerificationCode}
                      >
                        Gửi lại
                      </p>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary w-full !mt-6"
                    type="submit"
                    disabled={isVerifyingCode}
                  >
                    {!isVerifyingCode ? (
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
                <ThemeSelector />
                <LocaleSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SignUpPage;
