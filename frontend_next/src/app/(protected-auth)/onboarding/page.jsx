"use client";

import { useMutation } from "@tanstack/react-query";
import { LoaderIcon, MapPinIcon, ShuffleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";
import CostumedSelect from "@/components/costumed/CostumedSelect.jsx";
import { showToast } from "@/components/costumed/CostumedToast.jsx";
import { onboardingAPI } from "@/lib/api";
import { deepTrimObj, getProfilePicUrl } from "@/lib/utils.js";

import LocaleSwitcher from "@/components/buttons/LocaleSwitcher.jsx";
import ThemesSelector from "@/components/buttons/ThemeSelector.jsx";

import { useAuthStore } from "@/stores/useAuthStore.js";
import { useLanguageStore } from "@/stores/useLanguageStore.js";
import { useRouter } from "next/navigation";
import Image from "next/image";

const OnboardingPage = () => {
  const { t } = useTranslation("onboardingPage");
  const router = useRouter();

  const authUser = useAuthStore((s) => s.authUser);
  const setAuthUser = useAuthStore((s) => s.setAuthUser);

  const languages = useLanguageStore((s) => s.languages);

  const [formState, setFormState] = useState({
    bio: authUser?.user?.profile?.bio || "",
    nativeLanguage: authUser?.user?.profile?.nativeLanguage || "",
    learningLanguage: authUser?.user?.profile?.learningLanguage || "",
    location: authUser?.user?.profile?.location || "",
  });

  const [nativeLanguageSelection, setNativeLanguageSelection] = useState([]);
  const [learningLanguageSelection, setLearningLanguageSelection] = useState(
    []
  );

  const [profilePic, setProfilePic] = useState(null);
  const profilePicInputRef = useRef(null);

  const [nativeLanguage, setNativeLanguage] = useState(
    authUser?.user?.profile?.nativeLanguage || ""
  );
  const [learningLanguage, setLearningLanguage] = useState(
    authUser?.user?.profile?.learningLanguage || ""
  );

  const { mutateAsync: onboardingMutation, isPending: isOnboarding } =
    useMutation({
      mutationFn: onboardingAPI,
      onSuccess: (data) => {
        setAuthUser(data?.data);
        router.replace("/");
        showToast({
          message: data?.message || "Chào mừng bạn đến với Chatify!",
          type: "success",
        });
      },
      onError: (error) => {
        console.error("Onboarding failed:", error);
        showToast({
          message:
            error.response.data.message || "Có lỗi xảy ra, vui lòng thử lại",
          type: "error",
        });
      },
    });

  const validateOnboardingData = () => {
    const trimmedFormState = deepTrimObj(formState);
    trimmedFormState.nativeLanguage = nativeLanguage?._id;
    trimmedFormState.learningLanguage = learningLanguage?._id;
    const onboardingData = {
      bio: trimmedFormState.bio,
      location: trimmedFormState.location,
      nativeLanguage: trimmedFormState.nativeLanguage,
      learningLanguage: trimmedFormState.learningLanguage,
    };
    if (
      !trimmedFormState.nativeLanguage ||
      !trimmedFormState.learningLanguage
    ) {
      return {
        message: "Vui lòng chọn ngôn ngữ",
        cleanedData: onboardingData,
      };
    }
    if (!trimmedFormState.bio || !trimmedFormState.location) {
      return {
        message: "Tất cả các trường đều bắt buộc",
        cleanedData: onboardingData,
      };
    }
    return { message: null, cleanedData: onboardingData };
  };

  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 10) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    setProfilePic(randomAvatar);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { message, cleanedData: onboardingData } = validateOnboardingData();
    if (message) {
      showToast({
        message,
        type: "error",
      });
      return;
    }
    try {
      const payload = {
        ...onboardingData,
        profilePic,
      };

      await onboardingMutation(payload);
    } catch (error) {
      console.error("Onboarding failed:", error);
      showToast({
        message: error?.message || "Có lỗi xảy ra, vui lòng thử lại",
        type: "error",
      });
    }
  };

  useEffect(() => {
    setNativeLanguageSelection(languages);
    setLearningLanguageSelection(languages);
    handleRandomAvatar();
  }, [languages]);

  return (
    <>
      <div className="min-h-screen  flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="card bg-base-200 w-full max-w-3xl shadow-lg">
          <div className="card-body p-8 pb-4">
            <h1 className="text-3xl font-bold text-center mb-4">
              Hoàn thiện hồ sơ
            </h1>

            <form action="" onSubmit={handleSubmit} className="space-y-3">
              {/* PROFILE PIC CONTAINER */}
              <div className="flex flex-col items-center justify-center space-y-4 relative">
                {/* IMAGE PREVIEW */}
                <div className="size-32 rounded-full bg-base-200 overflow-hidden">
                  {profilePic && (
                    <Image
                      src={getProfilePicUrl(profilePic)}
                      alt=""
                      className="w-full h-full object-cover"
                      width={128}
                      height={128}
                    />
                  )}
                </div>

                {/* <CommonRoundedButton
                  className={
                    "absolute top-[calc(50%-16px)] right-[calc(50%-64px)]"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    profilePicInputRef.current.click();
                  }}
                >
                  <Pencil className="size-4" />
                </CommonRoundedButton> */}

                <input
                  ref={profilePicInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      setProfilePic(e.target.files[0]);
                    }
                  }}
                />

                {/* Generate Random Avatar Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRandomAvatar}
                    className="btn btn-accent"
                  >
                    <ShuffleIcon className="size-4" />
                    Tạo hình đại diện ngẫu nhiên
                  </button>
                </div>
              </div>

              {/* FULL NAME */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Họ và tên</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={authUser?.user?.fullName || ""}
                  onChange={() => {}}
                  className="input input-bordered w-full pointer-events-none text-sm"
                  placeholder="Nhập họ và tên"
                  maxLength={50}
                />
              </div>

              {/* BIO */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Giới thiệu</span>
                </label>
                <textarea
                  name="bio"
                  value={formState.bio}
                  onChange={(e) =>
                    setFormState({ ...formState, bio: e.target.value })
                  }
                  className="textarea textarea-bordered h-24"
                  placeholder={
                    "Giới thiệu bản thân và mục tiêu học ngoại ngữ của bạn"
                  }
                />
              </div>

              {/* LANGUAGES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NATIVE LANGUAGE */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Ngôn ngữ mẹ đẻ</span>
                  </label>

                  <CostumedSelect
                    placeholder="Chọn ngôn ngữ mẹ đẻ"
                    options={nativeLanguageSelection}
                    onSelect={(option) => setNativeLanguage(option)}
                  />
                </div>

                {/* LEARNING LANGUAGE */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Ngôn ngữ đang học</span>
                  </label>

                  <CostumedSelect
                    placeholder="Chọn ngôn ngữ đang học"
                    options={learningLanguageSelection}
                    onSelect={(option) => setLearningLanguage(option)}
                  />
                </div>
              </div>

              {/* LOCATION */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Vị trí</span>
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2 left-3 size-5 text-base-content opacity-70" />
                  <input
                    type="text"
                    name="location"
                    value={formState.location}
                    onChange={(e) =>
                      setFormState({ ...formState, location: e.target.value })
                    }
                    className="input input-bordered w-full pl-10 text-sm"
                    placeholder="Thành phố, bang hoặc khu vực bạn đang sống"
                    maxLength={50}
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                className="btn btn-primary w-full !mt-6"
                disabled={isOnboarding}
                type="submit"
              >
                {!isOnboarding ? (
                  <>Lưu và tiếp tục</>
                ) : (
                  <>
                    <LoaderIcon className="animate-spin size-5" />
                    Đang lưu...
                  </>
                )}
              </button>
            </form>
            <div className="flex items-center justify-center mt-2 gap-2">
              <ThemesSelector />
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingPage;
