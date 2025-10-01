import { capitalize, getFlagToLanguage, getLocaleById } from "../../lib/utils";

import { useMutation } from "@tanstack/react-query";
import { LoaderIcon, MapPinIcon, UserRoundPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sendFriendRequestAPI } from "../../lib/api";
import CommonRoundedButton from "../buttons/CommonRoundedButton";
import { showToast } from "../costumed/CostumedToast";
import { getLanguageFlag } from "./FriendCard_Func";

const RecommendedUserCard_HomePage = ({ user, onSuccess, onError }) => {
  const { t } = useTranslation("components", {
    keyPrefix: "recommendedUserCard_HomePage",
  });
  const { i18n } = useTranslation();
  const getUserLocaleClient = () => {
    if (typeof window === "undefined") return "vi";
    return i18n.language || "vi";
  };
  const userLocale = getUserLocaleClient();
  const {
    mutate: sendFriendRequestMutation,
    isPending: isSendingFriendRequest,
  } = useMutation({
    mutationFn: sendFriendRequestAPI,
    onSuccess: (data) => {
      onSuccess(data);
      showToast({
        message: data?.message || t("toast.sendFriendRequestMutation.success"),
        type: "success",
      });
    },
    onError: (error) => {
      onError();
      console.log("Error sending friend request:", error);
      showToast({
        message:
          error?.response?.data?.message ||
          t("toast.sendFriendRequestMutation.error"),
        type: "error",
      });
    },
  });
  return (
    <div
      key={user._id}
      className="card bg-base-200 hover:shadow-lg transition-all duration-300 relative h-full"
    >
      <div className="card-body p-4 space-y-2">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={user.profile.profilePic} alt={user.fullName} />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm">{user.fullName}</h3>
            {user.profile.location && (
              <div className="flex items-center text-xs opacity-70 mt-1">
                <MapPinIcon className="size-3 mr-1" />
                {user.profile.location}
              </div>
            )}
          </div>
        </div>

        {user.profile.bio && (
          <p className="text-sm line-clamp-2">{user.profile.bio}</p>
        )}

        {/* Languages with flags */}
        <div className="flex flex-wrap gap-2">
          <span className="badge badge-secondary h-8 px-4 flex items-center gap-1 relative -top-[1px] whitespace-nowrap line-clamp-1">
            {getLanguageFlag(getLocaleById(user.profile.nativeLanguage))}
            {t("languages.native")}:{" "}
            {capitalize(
              getFlagToLanguage(
                getLocaleById(user.profile.nativeLanguage),
                userLocale
              )
            )}
          </span>
          <span className="badge badge-outline h-8 px-4 flex items-center gap-1 relative -top-[1px] whitespace-nowrap line-clamp-1">
            {getLanguageFlag(getLocaleById(user.profile.learningLanguage))}
            {t("languages.learning")}:{" "}
            {capitalize(
              getFlagToLanguage(
                getLocaleById(user.profile.learningLanguage),
                userLocale
              )
            )}
          </span>
        </div>

        {/* Action button */}

        <CommonRoundedButton
          className={`absolute top-2 right-4 ${
            isSendingFriendRequest ? "pointer-events-none opacity-70" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            sendFriendRequestMutation(user._id);
          }}
        >
          {isSendingFriendRequest ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : (
            <UserRoundPlus className="size-4" />
          )}
        </CommonRoundedButton>
      </div>
    </div>
  );
};

export default RecommendedUserCard_HomePage;
