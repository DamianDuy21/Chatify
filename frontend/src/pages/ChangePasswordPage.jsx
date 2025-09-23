import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, LoaderIcon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { useTranslation } from "react-i18next";
import CostumedPasswordInput from "../components/costumed/CostumedPasswordInput";
import { showToast } from "../components/costumed/CostumedToast";
import { changePasswordAPI, changePasswordVerificationAPI } from "../lib/api";

const ChangePasswordPage = () => {
  const { t } = useTranslation("changePasswordPage");
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [oldPassword, setOldPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const { mutate: changePasswordMutation, isPending: isChangingPassword } =
    useMutation({
      mutationFn: changePasswordAPI,
      onSuccess: (data) => {
        showToast({
          message: data?.message || t("toast.changePasswordMutation.success"),
          type: "success",
        });
        setStep(2);
      },
      onError: (error) => {
        showToast({
          message:
            error?.response?.data?.message ||
            t("toast.changePasswordMutation.error"),
          type: "error",
        });
      },
    });

  const {
    mutate: changePasswordVerificationMutation,
    isPending: isVerifyingCode,
  } = useMutation({
    mutationFn: changePasswordVerificationAPI,
    onSuccess: (data) => {
      showToast({
        message:
          data?.message ||
          t("toast.changePasswordVerificationMutation.success"),
        type: "success",
      });

      navigate("/profile");
    },
    onError: (error) => {
      showToast({
        message:
          error?.response?.data?.message ||
          t("toast.changePasswordVerificationMutation.error"),
        type: "error",
      });
    },
  });

  const handleChangePassword = (e) => {
    e.preventDefault();
    const trimmedOldPassword = oldPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    if (!trimmedOldPassword || !trimmedNewPassword) {
      showToast({
        message: t("toast.validateChangePassword.allFieldsRequired"),
        type: "error",
      });
      return;
    }
    try {
      changePasswordMutation({
        currentPassword: trimmedOldPassword,
        newPassword: trimmedNewPassword,
      });
    } catch (error) {
      showToast({
        message: error?.message || t("toast.changePasswordMutation.error"),
        type: "error",
      });
    }
  };
  const handleChangePasswordVerification = (e) => {
    e.preventDefault();
    const trimmedVerificationCode = verificationCode.trim();
    if (!trimmedVerificationCode) {
      showToast({
        message: t(
          "toast.validateChangePasswordVerification.allFieldsRequired"
        ),
        type: "error",
      });
      return;
    }
    try {
      changePasswordVerificationMutation(trimmedVerificationCode);
    } catch (error) {
      showToast({
        message:
          error?.message || t("toast.handleChangePasswordVerification.error"),
        type: "error",
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-6">
        <div className="flex flex-col lg:flex-row w-full max-w-xl mx-auto bg-base-200 rounded-card shadow-lg overflow-hidden">
          <div className="w-full p-8 flex flex-col">
            {step === 1 ? (
              <form onSubmit={(e) => handleChangePassword(e)} action="">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Link to="/profile">
                      <ArrowLeft className="text-primary size-6 cursor-pointer" />
                    </Link>
                    <div>
                      <h2 className="text-xl font-semibold">
                        {t("step1.hero.title")}
                      </h2>
                      <p className="text-sm opacity-70">
                        {t("step1.hero.subtitle")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* OLD PASSWORD */}
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text">
                          {t("step1.form.currentPassword.label")}
                        </span>
                      </label>
                      {/* <input
                        type="password"
                        placeholder={t(
                          "step1.form.currentPassword.placeholder"
                        )}
                        className="input input-bordered w-full text-sm"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                      /> */}
                      <CostumedPasswordInput
                        data={oldPassword}
                        setData={setOldPassword}
                        placeholder={t(
                          "step1.form.currentPassword.placeholder"
                        )}
                      />
                    </div>
                    {/* NEW PASSWORD */}
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text">
                          {t("step1.form.newPassword.label")}
                        </span>
                      </label>
                      {/* <input
                        type="password"
                        placeholder={t("step1.form.newPassword.placeholder")}
                        className="input input-bordered w-full text-sm"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      /> */}
                      <CostumedPasswordInput
                        data={newPassword}
                        setData={setNewPassword}
                        placeholder={t("step1.form.newPassword.placeholder")}
                      />
                    </div>
                  </div>

                  <button
                    className="btn btn-primary w-full !mt-6"
                    type="submit"
                  >
                    {!isChangingPassword ? (
                      t("step1.form.submitButton.text")
                    ) : (
                      <>
                        <LoaderIcon className="animate-spin size-5" />
                        {t("step1.form.submitButton.loadingText")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(e) => handleChangePasswordVerification(e)}
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
                        {t("step2.hero.title")}
                      </h2>
                      <p className="text-sm opacity-70">
                        {t("step2.hero.subtitle")}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {/* VERIFICATION CODE */}
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text">
                          {t("step2.form.verificationCode.label")}
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder={t(
                          "step2.form.verificationCode.placeholder"
                        )}
                        className="input input-bordered w-full text-sm"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        maxLength={6}
                      />
                      <p
                        className="text-sm text-primary hover:underline mt-2 text-end cursor-pointer"
                        onClick={handleChangePassword}
                      >
                        {t("step2.form.resend")}
                      </p>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary w-full !mt-6"
                    type="submit"
                  >
                    {!isVerifyingCode ? (
                      t("step2.form.submitButton.text")
                    ) : (
                      <>
                        <LoaderIcon className="animate-spin size-5" />
                        {t("step2.form.submitButton.loadingText")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangePasswordPage;
