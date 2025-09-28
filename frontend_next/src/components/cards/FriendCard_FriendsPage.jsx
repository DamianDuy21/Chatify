"use client";

import { useMutation } from "@tanstack/react-query";
import { LoaderIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image.js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createPrivateConversationAPI,
  deleteFriendAPI,
  getConversationsAPI,
} from "../../lib/api.js";
import {
  capitalize,
  getFlagToLanguage,
  getLocaleById,
  getUserLocaleClient,
} from "../../lib/utils.js";
import { useChatStore } from "../../stores/useChatStore";
import CommonRoundedButton from "../buttons/CommonRoundedButton.jsx";
import CountAndMessageBadge from "../buttons/CountAndMessageBadge.jsx";
import CostumedModal from "../costumed/CostumedModal.jsx";
import { showToast } from "../costumed/CostumedToast.jsx";
import { getLanguageFlag } from "./FriendCard_Func.jsx";
const FriendCard_v2_FriendsPage = ({
  friend,
  isOnline = false,
  onSuccess,
  onError,
}) => {
  const t = useTranslations("Components.friendCard_FriendsPage");
  const router = useRouter();
  const NEXT_LOCALE = getUserLocaleClient() || "vi";
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenDeleteFriendModal, setIsOpenDeleteFriendModal] = useState(false);
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const setConversationsHaveUnSeenMessages = useChatStore(
    (s) => s.setConversationsHaveUnSeenMessages
  );
  const conversationsHaveUnSeenMessages = useChatStore(
    (s) => s.conversationsHaveUnSeenMessages
  );

  const { mutate: deleteFriendMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteFriendAPI,
    onSuccess: (data) => {
      onSuccess(data);
      setIsOpenDeleteFriendModal(false);
      showToast({
        message: data?.message || t("toast.deleteFriendMutation.success"),
        type: "success",
      });
    },
    onError: (error) => {
      console.error("Error deleting friend:", error);
      onError();
      showToast({
        message:
          error?.response?.data?.message ||
          t("toast.deleteFriendMutation.error"),
        type: "error",
      });
    },
  });

  const handleGetPrivateConversation = async () => {
    try {
      setIsLoading(true);
      const { data } = await getConversationsAPI({
        userId: friend._id,
      });
      if (data && data.conversations.length > 0) {
        setConversations(
          conversations.map((c) =>
            c.conversation._id === data.conversations[0].conversation._id
              ? { ...c, unSeenMessageQuantity: 0 }
              : c
          )
        );
        setSelectedConversation(data.conversations[0]);
        setConversationsHaveUnSeenMessages(
          conversationsHaveUnSeenMessages.filter(
            (id) => id !== data.conversations[0].conversation._id
          )
        );
        router.push(`/chats`);
      } else {
        const { data: newConvData } = await createPrivateConversationAPI(
          friend._id
        );
        if (
          newConvData &&
          newConvData.isNewCreated &&
          newConvData.conversation
        ) {
          setConversations([newConvData.conversation, ...conversations]);
          setSelectedConversation(newConvData.conversation);
          router.push(`/chats`);
        }
      }
    } catch (error) {
      console.error("Error fetching or creating private conversation:", error);
      showToast({
        message:
          error?.response?.data?.message ||
          t("toast.handleGetPrivateConversation.error"),
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      key={friend._id}
      className="card bg-base-200 hover:shadow-lg transition-all duration-300 relative h-full"
    >
      <div className="card-body p-4 space-y-2">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <Image
                // src={friend.profile.profilePic}
                src={
                  friend?.profile?.profilePic
                    ? `/images/avatar/${friend?.profile?.profilePic}.png`
                    : `/images/avatar/1.png`
                }
                alt={friend.fullName}
                width={40}
                height={40}
              />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm">{friend.fullName}</h3>
            {isOnline ? (
              <p className="text-xs text-success flex items-center gap-1">
                <span className="size-2 rounded-full bg-success inline-block" />
                {t("status.online")}
              </p>
            ) : (
              <p className="text-xs opacity-70 flex items-center gap-1">
                <span className="size-2 rounded-full bg-gray-600 opacity-70 inline-block" />
                {t("status.offline")}
              </p>
            )}
          </div>
        </div>

        {friend.profile.bio && (
          <p className="text-sm line-clamp-2">{friend.profile.bio}</p>
        )}

        {/* Languages with flags */}
        <div className="flex flex-wrap gap-2">
          <span className="badge badge-secondary h-8 px-4 flex items-center gap-1 relative -top-[1px]">
            {getLanguageFlag(getLocaleById(friend.profile.nativeLanguage))}
            {t("languages.native")}:{" "}
            {capitalize(
              getFlagToLanguage(
                getLocaleById(friend.profile.nativeLanguage),
                NEXT_LOCALE
              )
            )}
          </span>
          <span className="badge badge-outline h-8 px-4 flex items-center gap-1 relative -top-[1px]">
            {getLanguageFlag(getLocaleById(friend.profile.learningLanguage))}
            {t("languages.learning")}:{" "}
            {capitalize(
              getFlagToLanguage(
                getLocaleById(friend.profile.learningLanguage),
                NEXT_LOCALE
              )
            )}
          </span>
        </div>

        <CountAndMessageBadge
          // conversation={conversation}
          onClick={handleGetPrivateConversation}
          isLoading={isLoading}
          className={"absolute top-2 right-14"}
        ></CountAndMessageBadge>

        <CommonRoundedButton
          className={`absolute top-2 right-4 ${
            isDeleting ? "pointer-events-none opacity-70" : ""
          }`}
          onClick={() => {
            setIsOpenDeleteFriendModal(true);
          }}
        >
          <X className="size-4" />
        </CommonRoundedButton>
      </div>

      {/* DELETE FRIEND MODAL */}
      <CostumedModal
        open={isOpenDeleteFriendModal}
        onClose={() => {
          setIsOpenDeleteFriendModal(false);
        }}
        title={t("deleteFriendModal.title")}
      >
        {({ close }) => {
          return (
            <div>
              <div
                className={`pb-6 text-sm ${
                  isDeleting ? "pointer-events-none" : ""
                }`}
              >
                {t("deleteFriendModal.subtitle")}{" "}
                <span className="font-semibold">{friend.fullName}</span> ?
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className="btn btn-outlined w-full"
                  onClick={() => {
                    setIsOpenDeleteFriendModal(false);
                  }}
                >
                  {t("deleteFriendModal.button.cancel")}
                </button>
                <button
                  className="btn btn-primary w-full hover:btn-primary"
                  onClick={() => {
                    deleteFriendMutation(friend._id);
                  }}
                >
                  {isDeleting ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : null}
                  {t("deleteFriendModal.button.confirm")}
                </button>
              </div>
            </div>
          );
        }}
      </CostumedModal>
    </div>
  );
};

export default FriendCard_v2_FriendsPage;
