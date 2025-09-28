"use client";

import { Hexagon, LoaderIcon } from "lucide-react";
import { useState } from "react";
import LocaleSwitcher from "@/components/buttons/LocaleSwitcher.jsx";
import ThemesSelector from "@/components/buttons/ThemeSelector.jsx";
import CostumedPasswordInput from "@/components/costumed/CostumedPasswordInput.jsx";
import { showToast } from "@/components/costumed/CostumedToast.jsx";
import { useLogin } from "@/hooks/useLogin.js";
import { deepTrimObj } from "@/lib/utils.js";
import { useThemeStore } from "@/stores/useThemeStore.js";
import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link.js";

const SignInPage = () => {
  const t = useTranslations("SignInPage");
  const { theme } = useThemeStore();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [isCheckedPolicy, setIsCheckedPolicy] = useState(false);

  const { mutate: loginMutation, isPending: isLoggingIn } = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanedLoginData = deepTrimObj(loginData);
    if (!cleanedLoginData.email || !cleanedLoginData.password) {
      showToast({
        message: t("toast.handleLogin.allFieldsAreRequired"),
        type: "error",
      });
      return;
    } else if (!isCheckedPolicy) {
      showToast({
        message: t("toast.handleLogin.termsAndPolicyNotAgreed"),
        type: "error",
      });
      return;
    }

    loginMutation(cleanedLoginData);
  };

  // Cookies.remove("jwt_chatify");
  return (
    <>
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
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
              <form onSubmit={(e) => handleLogin(e)} action="">
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
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
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
                        data={loginData}
                        setData={setLoginData}
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
                          onChange={() => {
                            setIsCheckedPolicy(!isCheckedPolicy);
                          }}
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
                      isLoggingIn ? "pointer-events-none opacity-70" : ""
                    }`}
                    type="submit"
                    // disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <>
                        <LoaderIcon className="animate-spin size-5" />
                        {t("leftSide.form.signInButton.loadingText")}
                      </>
                    ) : (
                      t("leftSide.form.signInButton.text")
                    )}
                  </button>

                  {/* REDIRECT SIGNIN */}
                  <div className="text-center !mt-6">
                    <p className="text-sm">
                      {t("leftSide.prompt.noAccount.text")}{" "}
                      <Link
                        href="/signup"
                        className="text-primary hover:underline"
                      >
                        {t("leftSide.prompt.noAccount.linkText")}
                      </Link>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-600"></div>
                    <span className="text-gray-600 text-sm">
                      {" "}
                      {t("leftSide.prompt.or")}
                    </span>
                    <div className="flex-1 h-px bg-gray-600"></div>
                  </div>

                  <div className="text-center mt-4">
                    <p className="text-sm">
                      {t("leftSide.prompt.forgotPassword.text")}{" "}
                      <Link
                        href="/forgot-password"
                        className="text-primary hover:underline"
                      >
                        {t("leftSide.prompt.forgotPassword.linkText")}
                      </Link>
                    </p>
                  </div>
                </div>
              </form>
              <div className="flex items-center justify-center mt-4 gap-2">
                <ThemesSelector />
                <LocaleSwitcher />
              </div>
            </div>
          </div>

          {/* SIGNUP FORM - RIGHT SIDE */}
          {/* !min-h-[684px] */}
          <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center rounded-r-card">
            <div className="max-w-md p-8">
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
      </div>
    </>
  );
};

export default SignInPage;
