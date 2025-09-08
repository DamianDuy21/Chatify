import { useAuthStore } from "../../stores/useAuthStore";
import { useChatStore } from "../../stores/useChatStore";
import CostumedAvatarGroupChat from "../costumed/CostumedAvatarGroupChat";

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
  const onlineUsers = useAuthStore((s) => s.onlineUsers);
  const authUser = useAuthStore((s) => s.authUser);

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
      }}
    >
      <div className="flex items-center gap-3 relative">
        <div className="avatar ">
          <div className="w-10 rounded-full">
            {conversation.conversation?.type == "private" ? (
              <img
                src={conversation?.users[0]?.user?.profile?.profilePic}
                alt=""
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
              onlineUsers.includes(user?.user?._id)
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
            {conversation?.conversation?.lastMessage?.content ||
              "Bắt đầu trò chuyện ngay"}
          </p>
        </div>
      </div>

      <div className="absolute right-2 top-2">
        {conversation?.unSeenMessageQuantity > 0 && (
          <div className="text-xs btn btn-secondary btn-xs rounded-full">
            {conversation?.unSeenMessageQuantity}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationCard_ChatsPage_Sidebar;
