import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { useChatStore } from "../../stores/useChatStore";

const CountAndMessageBadge = ({ count = 0, conversation, className }) => {
  const displayCount = count > 99 ? "9+" : count;

  const navigate = useNavigate();
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);

  return (
    <div
      className={`${className} group w-fit h-fit`}
      onClick={() => {
        setConversations(
          conversations.map((conv) =>
            conv.conversation._id === conversation.conversation._id
              ? { ...conv, unSeenMessageQuantity: 0 }
              : conv
          )
        );
        setSelectedConversation(conversation);
        navigate(`/chats`);
      }}
    >
      <div
        className={`btn btn-primary size-8 p-0 min-w-0 min-h-0 rounded-card cursor-pointer text-sm items-center justify-center ${
          count == 0 ? "" : "hidden"
        } group-hover:flex`}
      >
        <MessageCircle className="size-4" />
      </div>

      <div
        className={`btn btn-primary size-8 p-0 min-w-0 min-h-0 rounded-card cursor-pointer flex text-sm items-center justify-center ${
          count == 0 ? "hidden" : ""
        } group-hover:hidden`}
      >
        {displayCount}
      </div>
    </div>
  );
};

export default CountAndMessageBadge;
