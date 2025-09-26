"use client";
import React from "react";
import { formatRelativeTime } from "../../lib/utils";
import { Check, ClockIcon, LoaderIcon, X } from "lucide-react";
import CommonRoundedButton from "../buttons/CommonRoundedButton";
import { useMutation } from "@tanstack/react-query";
import { acceptNotificationAPI, deleteNotificationAPI } from "../../lib/api";
import { showToast } from "../costumed/CostumedToast";
import Image from "next/image";
import { useTranslations } from "next-intl";

const NotificationCard_NotificationsPage = ({
  notification,
  user,
  onSuccessAccept,
  onSuccessDelete,
  onError,
}) => {
  const t = useTranslations("Components.notificationCard_notificationsPage");
  const { mutate: acceptNotificationMutation, isPending: isAccepting } =
    useMutation({
      mutationFn: acceptNotificationAPI,
      onSuccess: (data) => {
        onSuccessAccept(data);
        // showToast({
        //   message:
        //     data?.message || t("toast.acceptNotificationMutation.success"),
        //   type: "success",
        // });
      },
      onError: (error) => {
        onError();
        showToast({
          message:
            error?.response?.data?.message ||
            t("toast.acceptNotificationMutation.error"),
          type: "error",
        });
      },
    });

  const { mutate: deleteNotificationMutation, isPending: isDeleting } =
    useMutation({
      mutationFn: deleteNotificationAPI,
      onSuccess: (data) => {
        onSuccessDelete(data);
        showToast({
          message:
            data?.message || t("toast.deleteNotificationMutation.success"),
          type: "success",
        });
      },
      onError: (error) => {
        onError();
        showToast({
          message:
            error?.response?.data?.message ||
            t("toast.deleteNotificationMutation.error"),
          type: "error",
        });
      },
    });
  return (
    <div
      key={notification._id}
      className={`card ${
        notification?.status == "pending"
          ? "cursor-pointer bg-base-200 hover:shadow-md transition-all duration-300"
          : "border border-base-200"
      }`}
      onClick={() => {
        if (notification?.status == "pending") {
          acceptNotificationMutation(notification._id);
        }
      }}
    >
      <div className={`card-body p-4 pr-[106px]`}>
        <div className="flex items-start gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <Image
                src={user?.profile?.profilePic}
                alt={""}
                width={40}
                height={40}
              />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{user?.fullName}</h3>
            {notification.content && (
              <p className="text-sm mb-2">
                {user?.fullName}{" "}
                {notification.content === "friend_request_accepted"
                  ? t("status.friend_request_accepted")
                  : notification.content.startsWith("add_to_group-")
                  ? `${t("status.add_to_group")} "${
                      notification.content.split("add_to_group-")[1]
                    }"`
                  : notification.content.startsWith("delete_from_group-")
                  ? `${t("status.delete_from_group")} "${
                      notification.content.split("delete_from_group-")[1]
                    }"`
                  : notification.content.startsWith("delete_group-")
                  ? `${t("status.delete_group")} "${
                      notification.content.split("delete_group-")[1]
                    }"`
                  : notification.content === "delete_private_conversation"
                  ? t("status.delete_private_conversation")
                  : ""}
              </p>
            )}

            <p className="text-xs opacity-70 flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              <span>{formatRelativeTime(notification.createdAt)}</span>
            </p>
          </div>

          {/* {notification?.status == "pending" && (
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
          )} */}

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
