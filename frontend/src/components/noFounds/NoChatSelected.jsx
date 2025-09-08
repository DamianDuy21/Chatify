import React from "react";
import { useThemeStore } from "../../stores/useThemeStore";
import { useChatStore } from "../../stores/useChatStore";
import { createChatbotAPI } from "../../lib/api";

const NoChatSelected = ({ hasFriends }) => {
  const { theme } = useThemeStore();
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );

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
                const { data: newChatbotConversation } =
                  await createChatbotAPI();
                console.log(newChatbotConversation);
                setConversations([newChatbotConversation, ...conversations]);
                setSelectedConversation(newChatbotConversation);
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
