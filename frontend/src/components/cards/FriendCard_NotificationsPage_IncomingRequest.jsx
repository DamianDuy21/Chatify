import { Check, LoaderIcon, MapPinIcon, X } from "lucide-react";
import { capitalize, getLocaleById } from "../../lib/utils";
import CommonRoundedButton from "../buttons/CommonRoundedButton";
import { getFlagLanguage, getLanguageFlag } from "./FriendCard_Func";
import CostumedModal from "../costumed/CostumedModal";
import { useMutation } from "@tanstack/react-query";
import { acceptFriendRequestAPI, rejectFriendRequestAPI } from "../../lib/api";
import { showToast } from "../costumed/CostumedToast";
import { useRef } from "react";
import { useChatStore } from "../../stores/useChatStore";

const FriendCard_NotificationsPage_IncomingRequest = ({
  friend,
  request,
  onSuccess,
  onError,
}) => {
  const closeRef = useRef(null);
  const getConversations = useChatStore((s) => s.getConversations);
  const { mutate: acceptFriendRequestMutation, isPending: isAccepting } =
    useMutation({
      mutationFn: acceptFriendRequestAPI,
      onSuccess: async (data) => {
        await onSuccess({ data: null, isRejected: false });
        await getConversations();
        showToast({
          message: data?.message || "Friend request accepted successfully!",
          type: "success",
        });
      },
      onError: (error) => {
        onError();
        console.log("Error accepting friend request:", error);
        showToast({
          message:
            error?.response?.data?.message || "Failed to accept friend request",
          type: "error",
        });
      },
    });

  const { mutate: rejectFriendRequestMutation, isPending: isRejecting } =
    useMutation({
      mutationFn: rejectFriendRequestAPI,
      onSuccess: async (data) => {
        await onSuccess({ data: data, isRejected: true });
        if (closeRef.current) closeRef.current();
        showToast({
          message: data?.message || "Friend request rejected successfully!",
          type: "success",
        });
      },
      onError: (error) => {
        onError();
        showToast({
          message:
            error?.response?.data?.message || "Failed to reject friend request",
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
          <span className="badge badge-secondary h-8 px-4 flex items-center gap-1 relative -top-[1px]">
            {getLanguageFlag(getLocaleById(friend.profile.nativeLanguage))}
            Native:{" "}
            {capitalize(
              getFlagLanguage(getLocaleById(friend.profile.nativeLanguage))
            )}
          </span>
          <span className="badge badge-outline h-8 px-4 flex items-center gap-1 relative -top-[1px]">
            {getLanguageFlag(getLocaleById(friend.profile.learningLanguage))}
            Learning:{" "}
            {capitalize(
              getFlagLanguage(getLocaleById(friend.profile.learningLanguage))
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

        <CostumedModal
          trigger={
            <CommonRoundedButton
              className={`absolute top-2 right-4 ${
                isRejecting ? "pointer-events-none opacity-70" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <X className="size-4" />
            </CommonRoundedButton>
          }
          title="Thông báo"
        >
          {({ close }) => {
            closeRef.current = close;
            return (
              <div className={`${isRejecting ? "pointer-events-none" : ""}`}>
                <div className={`pb-6 text-sm `}>
                  Bạn có chắc muốn từ chối lời mời kết bạn của{" "}
                  <span className="font-semibold">{friend.fullName}</span>{" "}
                  không?
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    className="btn btn-outlined w-full"
                    onClick={() => {
                      close();
                    }}
                  >
                    Để sau
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
                    Từ chối lời mời
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

export default FriendCard_NotificationsPage_IncomingRequest;
