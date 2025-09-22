"use client";

import { Hexagon, LoaderIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { showToast } from "@/components/costumed/CostumedToast.jsx";
import Cookies from "js-cookie";
import { useLogin } from "@/hooks/useLogin.js";
import { deepTrimObj } from "@/lib/utils.js";
import LocaleSwitcher from "@/components/buttons/LocaleSwitcher.jsx";
import ThemesSelector from "@/components/buttons/ThemeSelector.jsx";
import { useThemeStore } from "@/stores/useThemeStore.js";
import CostumedPasswordInput from "@/components/costumed/CostumedPasswordInput.jsx";
import Link from "next/link.js";
import Image from "next/image";

const SignInPage = () => {
  const { t } = useTranslation("signInPage");
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
        message: "Tất cả các trường là bắt buộc",
        type: "error",
      });
      return;
    } else if (!isCheckedPolicy) {
      showToast({
        message: "Bạn cần đồng ý với điều khoản dịch vụ và chính sách bảo mật",
        type: "error",
      });
      return;
    }
    try {
      loginMutation(cleanedLoginData);
    } catch (error) {
      console.error(error);
      showToast({
        message: error?.message || "Đã xảy ra lỗi, vui lòng thử lại",
        type: "error",
      });
    }
  };

  Cookies.remove("jwt");
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
                        <span className="label-text">Email</span>
                      </label>
                      <input
                        type="text"
                        placeholder={"email@example.com"}
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
                        <span className="label-text">Mật khẩu</span>
                      </label>

                      <CostumedPasswordInput
                        data={loginData}
                        setData={setLoginData}
                        placeholder={"********"}
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
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <>
                        <LoaderIcon className="animate-spin size-5" />
                        Đang đăng nhập...
                      </>
                    ) : (
                      "Đăng nhập"
                    )}
                  </button>

                  {/* REDIRECT SIGNIN */}
                  <div className="text-center !mt-6">
                    <p className="text-sm">
                      Chưa có tài khoản?{" "}
                      <Link
                        href="/signup"
                        className="text-primary hover:underline"
                      >
                        Đăng ký
                      </Link>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-600"></div>
                    <span className="text-gray-600 text-sm">hoặc</span>
                    <div className="flex-1 h-px bg-gray-600"></div>
                  </div>

                  <div className="text-center mt-4">
                    <p className="text-sm">
                      Quên mật khẩu?{" "}
                      <Link
                        href="/forgot-password"
                        className="text-primary hover:underline"
                      >
                        Khôi phục
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
                  Chào mừng trở lại
                </h2>
                <p className="opacity-70 text-sm">
                  {/* {t("rightSide.subtitle")} */}
                  Đăng nhập để tiếp tục hành trình học ngôn ngữ của bạn
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
