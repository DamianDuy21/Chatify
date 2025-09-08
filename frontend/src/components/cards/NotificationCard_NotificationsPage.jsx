import React from "react";
import { formatRelativeTime } from "../../lib/utils";
import { Check, ClockIcon, LoaderIcon, X } from "lucide-react";
import CommonRoundedButton from "../buttons/CommonRoundedButton";
import { useMutation } from "@tanstack/react-query";
import { acceptNotificationAPI, deleteNotificationAPI } from "../../lib/api";
import { showToast } from "../costumed/CostumedToast";

const NotificationCard_NotificationsPage = ({
  notification,
  user,
  onSuccessAccept,
  onSuccessDelete,
  onError,
}) => {
  const { mutate: acceptNotificationMutation, isPending: isAccepting } =
    useMutation({
      mutationFn: acceptNotificationAPI,
      onSuccess: (data) => {
        onSuccessAccept();
        showToast({
          message: data?.message || "Notification accepted successfully!",
          type: "success",
        });
      },
      onError: (error) => {
        onError();
        showToast({
          message:
            error?.response?.data?.message || "Failed to accept notification",
          type: "error",
        });
      },
    });

  const { mutate: deleteNotificationMutation, isPending: isDeleting } =
    useMutation({
      mutationFn: deleteNotificationAPI,
      onSuccess: (data) => {
        onSuccessDelete();
        showToast({
          message: data?.message || "Notification deleted successfully!",
          type: "success",
        });
      },
      onError: (error) => {
        onError();
        showToast({
          message:
            error?.response?.data?.message || "Failed to delete notification",
          type: "error",
        });
      },
    });
  return (
    <div key={notification._id} className="card bg-base-200 shadow-sm">
      <div className={`card-body p-4 pr-[106px]`}>
        <div className="flex items-start gap-3">
          <div className="avatar size-10 rounded-full">
            <img src={user?.profile?.profilePic} alt={""} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{user?.fullName}</h3>
            {notification.content && (
              <p className="text-sm mb-2">
                {user?.fullName}{" "}
                {notification.content == "friend_request_accepted"
                  ? "đã chấp nhận lời mời kết bạn"
                  : ""}
              </p>
            )}
            <p className="text-xs flex items-center opacity-70">
              <ClockIcon className="h-3 w-3 mr-1" />
              <span className="relative -top-[0.5px]">
                {formatRelativeTime(notification.createdAt)}
              </span>
            </p>
          </div>

          {notification?.status == "pending" && (
            <CommonRoundedButton
              className={`absolute top-4 right-14 ${
                isAccepting ? "pointer-events-none opacity-70" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                acceptNotificationMutation(notification._id);
              }}
            >
              {isAccepting ? (
                <LoaderIcon className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
            </CommonRoundedButton>
          )}

          <CommonRoundedButton
            className={`absolute top-4 right-4 ${
              isDeleting ? "pointer-events-none opacity-70" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              deleteNotificationMutation(notification._id);
            }}
          >
            {isDeleting ? (
              <LoaderIcon className="size-4 animate-spin" />
            ) : (
              <X className="size-4" />
            )}
          </CommonRoundedButton>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard_NotificationsPage;
