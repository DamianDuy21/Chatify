"use client";
import { useTranslations } from "next-intl";
import { useAuthStore } from "../../stores/useAuthStore";
import { useChatStore } from "../../stores/useChatStore";
import CostumedAvatarGroupChat from "@/components/costumed/CostumedAvatarGroupChat";
import Image from "next/image";

const ConversationCard_ChatsPage_Sidebar = ({
  isFirstCard,
  conversation,
  onClick,
  isShowAllWidth,
}) => {
  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );
  const setConversations = useChatStore((s) => s.setConversations);
  const conversations = useChatStore((s) => s.conversations);
  const userPresenceList = useAuthStore((s) => s.userPresenceList);
  const authUser = useAuthStore((s) => s.authUser);
  const setConversationsHaveUnSeenMessages = useChatStore(
    (s) => s.setConversationsHaveUnSeenMessages
  );
  const conversationsHaveUnSeenMessages = useChatStore(
    (s) => s.conversationsHaveUnSeenMessages
  );

  const t = useTranslations("Components.conversationCard_ChatsPage_Sidebar");
  return (
    <div
      className={`h-16 ${
        isFirstCard != 1 ? "border-b" : ""
      } border-base-300 flex items-center ${
        isShowAllWidth ? "justify-left" : "justify-center"
      } lg:justify-start px-4 cursor-pointer relative ${
        selectedConversation?.conversation?._id ==
        conversation?.conversation?._id
          ? "btn-active"
          : "hover:bg-base-300"
      }`}
      onClick={() => {
        onClick();
        setConversations(
          conversations.map((c) =>
            c.conversation._id === conversation.conversation._id
              ? { ...c, unSeenMessageQuantity: 0 }
              : c
          )
        );
        setSelectedConversation(conversation);
        setConversationsHaveUnSeenMessages(
          conversationsHaveUnSeenMessages.filter(
            (id) => id !== conversation.conversation._id
          )
        );
      }}
    >
      <div className="flex items-center gap-3 relative">
        <div className="avatar">
          <div className="w-10 rounded-full">
            {conversation.conversation?.type == "private" ? (
              <Image
                src={
                  conversation?.users[0]?.user?.profile?.profilePic ||
                  "https://avatar.iran.liara.run/public/20.png"
                }
                alt="avatar"
                width={40}
                height={40}
              />
            ) : conversation.conversation.type == "group" ? (
              <CostumedAvatarGroupChat conversation={conversation} />
            ) : (
              <div className="h-full w-full bg-primary"></div>
            )}
          </div>
        </div>

        {(conversation?.conversation?.type == "chatbot" ||
          conversation?.users?.some(
            (user) =>
              user?.user?._id !== authUser?.user._id &&
              userPresenceList.find(
                (u) => u.userId === user?.user?._id && u.online
              )
          )) && (
          <>
            <div className="absolute left-8 -bottom-0">
              <span className="size-2 rounded-full bg-success inline-block" />
            </div>

            <div
              className={`absolute -right-0 -bottom-0 lg:hidden ${
                isShowAllWidth ? "!hidden" : ""
              }`}
            >
              <span className="size-2 rounded-full bg-success inline-block" />
            </div>
          </>
        )}

        <div className={`hidden lg:block ${isShowAllWidth ? "!block" : ""}`}>
          <p className="font-semibold text-sm">
            {conversation?.conversation?.type == "private"
              ? conversation?.users[0]?.user?.fullName
              : conversation?.conversation?.name}
          </p>

          <p className="text-xs opacity-70 line-clamp-1">
            <span>
              {conversation?.conversation?.lastMessage?.message?.content
                ? conversation?.conversation?.lastMessage?.sender?.fullName
                  ? conversation?.conversation?.lastMessage?.sender?._id ===
                    authUser?.user?._id
                    ? `${t("lastMessage.sender.you")}: `
                    : `${conversation.conversation.lastMessage.sender.fullName}: `
                  : `${t("lastMessage.sender.chatbot")}: `
                : null}
            </span>

            {conversation?.conversation?.lastMessage?.message?.content ||
              t("lastMessage.noData")}
          </p>
        </div>
      </div>

      <div className="absolute right-2 top-2">
        {conversation?.unSeenMessageQuantity > 0 &&
          (conversation?.unSeenMessageQuantity < 10 ? (
            <div className="text-xs btn btn-secondary btn-xs rounded-full size-6">
              {conversation?.unSeenMessageQuantity}
            </div>
          ) : (
            <div className="text-xs btn btn-secondary btn-xs rounded-full size-6 relative top-[1px]">
              <span className="absolute left-[5px] top-[2.5px] text-xs">9</span>
              <span className="absolute left-[11px] top-[1.5px] text-xs">
                +
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ConversationCard_ChatsPage_Sidebar;
