import React from "react";
import { useThemeStore } from "../../stores/useThemeStore";
import { useChatStore } from "../../stores/useChatStore";
import { createChatbotAPI, getConversationsAPI } from "../../lib/api";
import { showToast } from "../costumed/CostumedToast";

const NoChatSelected = ({ hasFriends }) => {
  const { theme } = useThemeStore();
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );
  const totalConversationQuantityAboveFilter = useChatStore(
    (s) => s.totalConversationQuantityAboveFilter
  );
  const totalConversationQuantityUnderFilter = useChatStore(
    (s) => s.totalConversationQuantityUnderFilter
  );
  const setTotalConversationQuantityAboveFilter = useChatStore(
    (s) => s.setTotalConversationQuantityAboveFilter
  );
  const setTotalConversationQuantityUnderFilter = useChatStore(
    (s) => s.setTotalConversationQuantityUnderFilter
  );

  const handleGetChatbot = async () => {
    try {
      const { data: isAlreadyHaveChatbot } = await getConversationsAPI({
        conversationType: "chatbot",
      });
      if (isAlreadyHaveChatbot.conversations[0]) {
        setSelectedConversation(isAlreadyHaveChatbot.conversations[0]);
        setConversations([
          isAlreadyHaveChatbot.conversations[0],
          ...conversations,
        ]);
        return;
      }
      const { data: newChatbotConversation } = await createChatbotAPI();
      setConversations([newChatbotConversation, ...conversations]);
      setSelectedConversation(newChatbotConversation);
      setTotalConversationQuantityAboveFilter(
        totalConversationQuantityAboveFilter + 1
      );
      setTotalConversationQuantityUnderFilter(
        totalConversationQuantityUnderFilter + 1
      );
    } catch (err) {
      console.log(err);
      showToast({
        message:
          err?.response?.data?.message ||
          "Failed to create chatbot conversation. Please try again.",
        type: "error",
      });
      return;
    }
  };
  return (
    <div className="relative aspect-square max-w-sm mx-auto">
      <img
        className="w-full h-full"
        src={`/images/nochat_selected_pic/${theme}.png`}
        alt="No chat selected"
      />
      <div className="text-center">
        <h3 className="font-semibold mb-2">
          {hasFriends
            ? "Hãy chọn một cuộc trò chuyện để bắt đầu."
            : "Bạn chưa có kết nối nào."}
        </h3>
        <p className="text-base-content text-sm">
          Hoặc bạn có thể thử trò chuyện với{" "}
          <span
            className="text-primary hover:underline cursor-pointer"
            onClick={async () => {
              const chatbotConversation = conversations.find(
                (c) => c.conversation.type === "chatbot"
              );
              if (chatbotConversation) {
                setSelectedConversation(chatbotConversation);
                return;
              } else {
                handleGetChatbot();
              }
            }}
          >
            Chatbot
          </span>
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
