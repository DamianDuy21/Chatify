import { useMutation } from "@tanstack/react-query";
import { LoaderIcon, MapPinIcon, Undo2 } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { cancelFriendRequestAPI } from "../../lib/api";
import { capitalize, getFlagToLanguage, getLocaleById } from "../../lib/utils";
import CommonRoundedButton from "../buttons/CommonRoundedButton";
import CostumedModal from "../costumed/CostumedModal";
import { showToast } from "../costumed/CostumedToast";
import { getLanguageFlag } from "./FriendCard_Func";

const FriendCard_HomePage_OutgoingRequest = ({
  friend,
  request,
  onSuccess,
  onError,
}) => {
  const { t } = useTranslation("components", {
    keyPrefix: "friendCard_HomePage_OutgoingRequest",
  });
  const { i18n } = useTranslation();
  const getUserLocaleClient = () => {
    if (typeof window === "undefined") return "vi";
    return i18n.language || "vi";
  };
  const userLocale = getUserLocaleClient();
  const closeRef = useRef(null);
  const {
    mutate: cancelFriendRequestMutation,
    isPending: isCancellingFriendRequest,
  } = useMutation({
    mutationFn: cancelFriendRequestAPI,
    onSuccess: (data) => {
      onSuccess(data);
      if (closeRef.current) closeRef.current();
      showToast({
        message:
          data?.message || t("toast.cancelFriendRequestMutation.success"),
        type: "success",
      });
    },
    onError: (error) => {
      onError();
      console.log("Cancel friend request error:", error);
      showToast({
        message:
          error?.response?.data?.message ||
          t("toast.cancelFriendRequestMutation.error"),
        type: "error",
      });
    },
  });
  return (
    <div
      key={friend._id}
      className="card bg-base-200 hover:shadow-lg transition-all duration-300 relative h-full"
    >
      <div className="card-body p-4 space-y-2">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={friend.profile.profilePic} alt={friend.fullName} />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm">{friend.fullName}</h3>
            {friend.profile.location && (
              <div className="flex items-center text-xs opacity-70 mt-1">
                <MapPinIcon className="size-3 mr-1" />
                {friend.profile.location}
              </div>
            )}
          </div>
        </div>

        {/* {friend.bio && <p className="text-sm line-clamp-2">{friend.bio}</p>} */}

        {/* Languages with flags */}
        <div className="flex flex-wrap gap-2">
          <span className="badge badge-secondary h-8 px-4 flex items-center gap-1 relative -top-[1px]">
            {getLanguageFlag(getLocaleById(friend.profile.nativeLanguage))}
            {t("languages.native")}:{" "}
            {capitalize(
              getFlagToLanguage(
                getLocaleById(friend.profile.nativeLanguage),
                userLocale
              )
            )}
          </span>
          <span className="badge badge-outline h-8 px-4 flex items-center gap-1 relative -top-[1px]">
            {getLanguageFlag(getLocaleById(friend.profile.learningLanguage))}
            {t("languages.learning")}:{" "}
            {capitalize(
              getFlagToLanguage(
                getLocaleById(friend.profile.learningLanguage),
                userLocale
              )
            )}
          </span>
        </div>

        <CostumedModal
          trigger={
            <CommonRoundedButton
              className={`absolute top-2 right-4 ${
                isCancellingFriendRequest
                  ? "pointer-events-none opacity-70"
                  : ""
              }`}
            >
              <Undo2 className="size-4" />
            </CommonRoundedButton>
          }
          title={t("cancelRequestModal.title")}
        >
          {({ close }) => {
            closeRef.current = close;
            return (
              <div
                className={`${
                  isCancellingFriendRequest ? "pointer-events-none" : ""
                }`}
              >
                <div className={`pb-6 text-sm `}>
                  {t("cancelRequestModal.subtitle")}{" "}
                  <span className="font-semibold">{friend.fullName}</span>?
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    className="btn btn-outlined w-full"
                    onClick={() => {
                      close();
                    }}
                  >
                    {t("cancelRequestModal.button.cancel")}
                  </button>
                  <button
                    className="btn btn-primary w-full hover:btn-primary"
                    onClick={() => {
                      cancelFriendRequestMutation(request._id);
                    }}
                  >
                    {isCancellingFriendRequest ? (
                      <LoaderIcon className="size-4 animate-spin" />
                    ) : null}
                    {t("cancelRequestModal.button.confirm")}
                  </button>
                </div>
              </div>
            );
          }}
        </CostumedModal>
      </div>
    </div>
  );
};

export default FriendCard_HomePage_OutgoingRequest;
