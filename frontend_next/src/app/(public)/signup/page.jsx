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
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link.js";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SignUpPage = () => {
  const t = useTranslations("SignUpPage");
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
        message: data?.message || t("toast.signUpMutation.success"),
        type: "success",
      });
      setStep(2);
    },
    onError: (error) => {
      showToast({
        message:
          error?.response?.data?.message || t("toast.handleSignUp.error"),
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
        message:
          data?.message || t("toast.resendVerificationCodeMutation.success"),
        type: "success",
      });
    },
    onError: (error) => {
      showToast({
        message:
          error?.response?.data?.message ||
          t("toast.resendVerificationCodeMutation.error"),
        type: "error",
      });
    },
  });

  const { mutate: signUpVerificationMutation, isPending: isVerifyingCode } =
    useMutation({
      mutationFn: signUpVerificationAPI,
      onSuccess: (data) => {
        showToast({
          message:
            data?.message || t("toast.signUpVerificationMutation.success"),
          type: "success",
        });
        router.push("/signin");
      },
      onError: (error) => {
        console.error("Sign up verification error:", error);
        showToast({
          message:
            error?.response?.data?.message ||
            t("toast.signUpVerificationMutation.error"),
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
        message: t("toast.validateSignUpData.allFieldsAreRequired"),
        cleanedData: signUpData,
      };
    } else if (!nameIsValid) {
      return {
        message: t("toast.validateSignUpData.invalidFullName"),
        cleanedData: signUpData,
      };
    } else if (!emailIsValid) {
      return {
        message: t("toast.validateSignUpData.invalidEmail"),
        cleanedData: signUpData,
      };
    } else if (!passwordIsValid) {
      return {
        message: t("toast.validateSignUpData.invalidPassword"),
        cleanedData: signUpData,
      };
    } else if (!isCheckedPolicy) {
      return {
        message: t("toast.validateSignUpData.termsAndPolicyNotAgreed"),
        cleanedData: signUpData,
      };
    }

    return { message: null, cleanedData: signUpData };
  };

  const handleSignUp = (e) => {
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

    signUpMutation(cleanedData);
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

    resendVerificationCodeMutation(cleanedData);
  };

  const handleSignUpVerification = (e) => {
    e.preventDefault();
    const trimmedVerificationCode = verificationCode.trim();
    if (!trimmedVerificationCode) {
      showToast({
        message: t("validateSignUpData.emptyVerificationCode"),
        type: "error",
      });
      return;
    }

    signUpVerificationMutation({
      email: signUpData.email,
      fullName: signUpData.fullName,
      password: signUpData.password,
      otp: trimmedVerificationCode,
    });
  };

  return (
    <>
      <div
        className="flex items-center justify-center min-h-screen w-screen p-4 sm:p-6 lg:p-8"
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
                <form onSubmit={(e) => handleSignUp(e)} action="">
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
                            <span className="label-text">
                              {t("leftSide.form.fullName.label")}
                            </span>
                          </label>
                          <p className="text-xs opacity-70 mt-1">
                            *{t("leftSide.form.fullName.helperText")}
                          </p>
                        </div>

                        <input
                          type="text"
                          placeholder={t("leftSide.form.fullName.placeholder")}
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
                          <span className="label-text">
                            {t("leftSide.form.email.label")}
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder={t("leftSide.form.email.placeholder")}
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
                          <span className="label-text">
                            {t("leftSide.form.password.label")}
                          </span>
                        </label>

                        <CostumedPasswordInput
                          data={signUpData}
                          setData={setSignUpData}
                          placeholder={t("leftSide.form.password.placeholder")}
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
                            {t("leftSide.form.termsAndPolicy.label")}{" "}
                            <span className="text-primary hover:underline">
                              {t("leftSide.form.termsAndPolicy.terms")}
                            </span>{" "}
                            {t("leftSide.form.termsAndPolicy.and")}{" "}
                            <span className="text-primary hover:underline">
                              {t("leftSide.form.termsAndPolicy.privacyPolicy")}
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* SIGNUP BUTTON */}
                    <button
                      className={`btn btn-primary w-full ${
                        isSigningUp ? "pointer-events-none opacity-70" : ""
                      }`}
                      type="submit"
                      // disabled={isSigningUp}
                    >
                      {isSigningUp ? (
                        <>
                          <LoaderIcon className="animate-spin size-5" />
                          {t("leftSide.form.signUpButton.loadingText")}
                        </>
                      ) : (
                        t("leftSide.form.signUpButton.text")
                      )}
                    </button>

                    {/* REDIRECT LOGIN */}
                    <div className="text-center !mt-6">
                      <p className="text-sm">
                        {t("leftSide.prompt.alreadyHaveAccount.text")}{" "}
                        <Link
                          href="/signin"
                          className="text-primary hover:underline"
                        >
                          {t("leftSide.prompt.alreadyHaveAccount.linkText")}
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
                    width={1000}
                    height={1000}
                  />
                </div>

                <div className="text-center space-y-3 mt-6">
                  <h2 className="text-xl font-semibold">
                    {/* {t("rightSide.title")} */}
                    {t("leftSide.hero.title")}
                  </h2>
                  <p className="opacity-70 text-sm">
                    {/* {t("rightSide.subtitle")} */}
                    {t("leftSide.hero.subtitle")}
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
                        {t("verificationStep.title")}
                      </h2>
                      <p className="text-sm opacity-70">
                        {t("verificationStep.subtitle")}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
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
                        className={`text-sm text-primary hover:underline mt-2 text-end ${
                          isResendingVerificationCode
                            ? "pointer-events-none opacity-70"
                            : "cursor-pointer"
                        }`}
                        onClick={handleResendVerificationCode}
                      >
                        {t("verificationStep.form.resendCode.text")}
                      </p>
                    </div>
                  </div>

                  <button
                    className={`btn btn-primary w-full !mt-6 ${
                      isVerifyingCode ? "pointer-events-none opacity-70" : ""
                    }`}
                    type="submit"
                    // disabled={isVerifyingCode}
                  >
                    {!isVerifyingCode ? (
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
