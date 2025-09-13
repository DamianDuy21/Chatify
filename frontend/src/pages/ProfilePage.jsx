import { useMutation } from "@tanstack/react-query";
import {
  LoaderIcon,
  MapPinIcon,
  Pencil,
  RotateCcwKey,
  ShuffleIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import CommonRoundedButton from "../components/buttons/CommonRoundedButton.jsx";
import CostumedSelect from "../components/costumed/CostumedSelect.jsx";
import { showToast } from "../components/costumed/CostumedToast.jsx";
import { updateProfileAPI } from "../lib/api.js";
import { deepTrimObj } from "../lib/utils.js";
import { useAuthStore } from "../stores/useAuthStore.js";
import { useLanguageStore } from "../stores/useLanguageStore.js";

const ProfilePage = () => {
  const setAuthUser = useAuthStore((s) => s.setAuthUser);
  const authUser = useAuthStore((s) => s.authUser);

  const languages = useLanguageStore((s) => s.languages);

  const { t } = useTranslation("profilePage");

  const [formState, setFormState] = useState({
    bio: authUser?.user?.profile?.bio || "",
    nativeLanguage: authUser?.user?.profile?.nativeLanguage || "",
    learningLanguage: authUser?.user?.profile?.learningLanguage || "",
    location: authUser?.user?.profile?.location || "",
  });

  const [profilePic, setProfilePic] = useState(null);
  const profilePicInputRef = useRef(null);

  const [nativeLanguageSelection, setNativeLanguageSelection] = useState([]);
  const [learningLanguageSelection, setLearningLanguageSelection] = useState(
    []
  );

  const [nativeLanguage, setNativeLanguage] = useState(
    authUser?.user?.profile?.nativeLanguage || ""
  );
  const [learningLanguage, setLearningLanguage] = useState(
    authUser?.user?.profile?.learningLanguage || ""
  );

  const { mutateAsync: updateProfileMutation, isPending: isUpdatingProfile } =
    useMutation({
      mutationFn: updateProfileAPI,
      onSuccess: (data) => {
        showToast({
          message: data.message || "Cập nhật hồ sơ thành công",
          type: "success",
        });
      },
      onError: (error) => {
        showToast({
          message:
            error.response.data.message ||
            "Cập nhật hồ sơ thất bại. Vui lòng thử lại sau.",
          type: "error",
        });
      },
    });

  const validateProfileData = () => {
    const trimmedFormState = deepTrimObj(formState);
    trimmedFormState.nativeLanguage =
      nativeLanguage?._id ||
      nativeLanguageSelection.find((lang) => lang._id === nativeLanguage)?._id;
    trimmedFormState.learningLanguage =
      learningLanguage?._id ||
      learningLanguageSelection.find((lang) => lang._id === learningLanguage)
        ?._id;
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
    const idx = Math.floor(Math.random() * 10) + 1; // 1-10 included
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    setProfilePic(randomAvatar);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { message, cleanedData: onboardingData } = validateProfileData();
    if (message) {
      showToast({
        message,
        type: "error",
      });
      return;
    }
    try {
      await updateProfileMutation({
        ...onboardingData,
        profilePic,
      });

      await setAuthUser({
        ...authUser,
        user: {
          ...authUser.user,
          profile: {
            ...authUser.user.profile,
            ...onboardingData,
            profilePic,
          },
        },
      });
    } catch (error) {
      console.error("Onboarding failed:", error);
      showToast({
        message: error.message || "Onboarding failed",
        type: "error",
      });
    }
  };

  useEffect(() => {
    setProfilePic(authUser?.user?.profile?.profilePic || "");
  }, [authUser]);

  useEffect(() => {
    setNativeLanguageSelection(languages);
    setLearningLanguageSelection(languages);
  }, [languages]);

  return (
    <>
      <div className="min-h-[calc(100vh-64px)]  flex items-center justify-center p-4 sm:p-6 lg:p-6">
        <div className="card bg-base-200 w-full max-w-3xl shadow-lg">
          <div className="card-body p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              {t("hero.title")}
            </h1>
            <form action="" onSubmit={handleSubmit} className="space-y-3">
              {/* PROFILE PIC CONTAINER */}
              <div className="flex flex-col items-center justify-center space-y-4 relative">
                {/* IMAGE PREVIEW */}
                <div className="size-32 rounded-full bg-base-200 overflow-hidden">
                  {profilePic && (
                    <img
                      src={profilePic}
                      alt=""
                      className="w-full h-full object-cover"
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
                    className="btn btn-secondary"
                  >
                    <ShuffleIcon className="size-4" />
                    {t("hero.genAvatarButton")}
                  </button>
                </div>
              </div>

              {/* EMAIL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("form.email.label")}</span>
                  </label>
                  <input
                    type="text"
                    name="email"
                    value={authUser?.user.email}
                    className="input input-bordered w-full pointer-events-none text-sm"
                    placeholder={t("form.email.placeholder")}
                    onChange={() => {}}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">
                      {t("form.fullName.label")}
                    </span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={authUser?.user.fullName}
                    onChange={() => {}}
                    className="input input-bordered w-full pointer-events-none text-sm"
                    placeholder={t("form.fullName.placeholder")}
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="!mt-6">
                <Link to="/change-password" className="btn btn-primary">
                  <RotateCcwKey className="size-4" />
                  {t("form.changePasswordButton")}
                </Link>
              </div>

              {/* BIO */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("form.bio.label")}</span>
                </label>
                <textarea
                  name="bio"
                  value={formState.bio}
                  onChange={(e) =>
                    setFormState({ ...formState, bio: e.target.value })
                  }
                  className="textarea textarea-bordered h-24"
                  placeholder={t("form.bio.placeholder")}
                />
              </div>

              {/* LANGUAGES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NATIVE LANGUAGE */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">
                      {t("form.nativeLanguage.label")}
                    </span>
                  </label>

                  <CostumedSelect
                    placeholder={t("form.nativeLanguage.placeholder")}
                    options={nativeLanguageSelection}
                    onSelect={(option) => setNativeLanguage(option)}
                    defaultValue={nativeLanguageSelection.find(
                      (lang) => lang._id == nativeLanguage
                    )}
                  />
                </div>

                {/* LEARNING LANGUAGE */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">
                      {t("form.learningLanguage.label")}
                    </span>
                  </label>

                  <CostumedSelect
                    placeholder={t("form.learningLanguage.placeholder")}
                    options={learningLanguageSelection}
                    onSelect={(option) => setLearningLanguage(option)}
                    defaultValue={learningLanguageSelection.find(
                      (lang) => lang._id == learningLanguage
                    )}
                  />
                </div>
              </div>

              {/* LOCATION */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("form.location.label")}</span>
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
                    placeholder={t("form.location.placeholder")}
                    maxLength={50}
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                className="btn btn-primary w-full !mt-6"
                disabled={isUpdatingProfile}
                type="submit"
              >
                {!isUpdatingProfile ? (
                  <>{t("form.submitButton.text")}</>
                ) : (
                  <>
                    <LoaderIcon className="animate-spin size-5" />
                    {t("form.submitButton.loadingText")}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
