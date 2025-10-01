import { useMutation } from "@tanstack/react-query";
import { Check, LoaderIcon, MapPinIcon, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { acceptFriendRequestAPI, rejectFriendRequestAPI } from "../../lib/api";
import { capitalize, getFlagToLanguage, getLocaleById } from "../../lib/utils";
import CommonRoundedButton from "../buttons/CommonRoundedButton";
import CostumedModal from "../costumed/CostumedModal";
import { showToast } from "../costumed/CostumedToast";
import { getLanguageFlag } from "./FriendCard_Func";

const FriendCard_NotificationsPage_IncomingRequest = ({
  friend,
  request,
  onSuccess,
  onError,
}) => {
  const [isOpenRejectRequestModal, setIsOpenRejectRequestModal] =
    useState(false);
  const { i18n } = useTranslation();
  const getUserLocaleClient = () => {
    if (typeof window === "undefined") return "vi";
    return i18n.language || "vi";
  };
  const userLocale = getUserLocaleClient();
  const { t } = useTranslation("components", {
    keyPrefix: "friendCard_NotificationsPage_IncomingRequest",
  });
  const { mutate: acceptFriendRequestMutation, isPending: isAccepting } =
    useMutation({
      mutationFn: acceptFriendRequestAPI,
      onSuccess: async (data) => {
        showToast({
          message:
            data?.message || t("toast.acceptFriendRequestMutation.success"),
          type: "success",
        });
        await onSuccess({ data: data, isRejected: false });
      },
      onError: (error) => {
        onError();
        console.log("Error accepting friend request:", error);
        showToast({
          message:
            error?.response?.data?.message ||
            t("toast.acceptFriendRequestMutation.error"),
          type: "error",
        });
      },
    });

  const { mutate: rejectFriendRequestMutation, isPending: isRejecting } =
    useMutation({
      mutationFn: rejectFriendRequestAPI,
      onSuccess: async (data) => {
        await onSuccess({ data: data, isRejected: true });
        setIsOpenRejectRequestModal(false);
        showToast({
          message:
            data?.message || t("toast.rejectFriendRequestMutation.success"),
          type: "success",
        });
      },
      onError: (error) => {
        console.log("Error rejecting friend request:", error);
        onError();
        showToast({
          message:
            error?.response?.data?.message ||
            t("toast.rejectFriendRequestMutation.error"),
          type: "error",
        });
      },
    });

  return (
    <div
      key={friend._id}
      className={`card bg-base-200 hover:shadow-lg transition-all duration-300 relative h-full ${
        isAccepting || isRejecting ? "pointer-events-none" : ""
      }`}
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
          <span className="badge badge-secondary h-8 px-4 flex items-center gap-1 relative -top-[1px] whitespace-nowrap line-clamp-1">
            {getLanguageFlag(getLocaleById(friend.profile.nativeLanguage))}
            {t("languages.native")}:{" "}
            {capitalize(
              getFlagToLanguage(
                getLocaleById(friend.profile.nativeLanguage),
                userLocale
              )
            )}
          </span>
          <span className="badge badge-outline h-8 px-4 flex items-center gap-1 relative -top-[1px] whitespace-nowrap line-clamp-1">
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

        <CommonRoundedButton
          className={`absolute top-2 right-14 ${
            isAccepting ? "pointer-events-none opacity-70" : ""
          }`}
          onClick={(e) => {
            acceptFriendRequestMutation(request._id);
            e.stopPropagation();
          }}
        >
          {isAccepting ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
        </CommonRoundedButton>

        <CommonRoundedButton
          className={`absolute top-2 right-4 ${
            isRejecting ? "pointer-events-none opacity-70" : ""
          }`}
          onClick={(e) => {
            setIsOpenRejectRequestModal(true);
            e.stopPropagation();
          }}
        >
          <X className="size-4" />
        </CommonRoundedButton>
      </div>

      {/* REJECT FRIEND REQUEST MODAL */}
      <CostumedModal
        open={isOpenRejectRequestModal}
        onClose={() => {
          setIsOpenRejectRequestModal(false);
        }}
        title={t("rejectFriendRequestModal.title")}
      >
        {({ close }) => {
          return (
            <div className={`${isRejecting ? "pointer-events-none" : ""}`}>
              <div className={`pb-6 text-sm `}>
                {t("rejectFriendRequestModal.subtitle")}{" "}
                <span className="font-semibold">{friend.fullName}</span>?
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className="btn btn-outlined w-full"
                  onClick={() => {
                    setIsOpenRejectRequestModal(false);
                  }}
                >
                  {t("rejectFriendRequestModal.button.cancel")}
                </button>
                <button
                  className="btn btn-primary w-full hover:btn-primary"
                  onClick={() => {
                    rejectFriendRequestMutation(request._id);
                  }}
                >
                  {isRejecting ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : null}
                  {t("rejectFriendRequestModal.button.confirm")}
                </button>
              </div>
            </div>
          );
        }}
      </CostumedModal>
    </div>
  );
};

export default FriendCard_NotificationsPage_IncomingRequest;
