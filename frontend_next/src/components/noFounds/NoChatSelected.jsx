"use client";
import { useState } from "react";
import { createChatbotAPI, getConversationsAPI } from "@/lib/api";
import { useChatStore } from "../../stores/useChatStore";
import { useThemeStore } from "../../stores/useThemeStore";
import { showToast } from "../costumed/CostumedToast";
import { LoaderIcon } from "lucide-react";
import { isConversationFitFilter } from "../../lib/utils";
import { useAuthStore } from "../../stores/useAuthStore";
import { useTranslations } from "next-intl";

const NoChatSelected = ({ hasFriends }) => {
  const t = useTranslations("Components.noChatSelected");
  const { theme } = useThemeStore();
  const authUser = useAuthStore((s) => s.authUser);

  const [isGettingChatbot, setIsGettingChatbot] = useState(false);

  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );
  const conversationNameFilter = useChatStore((s) => s.conversationNameFilter);
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
      setIsGettingChatbot(true);
      const { data: isAlreadyHaveChatbot } = await getConversationsAPI({
        conversationType: "chatbot",
      });
      if (isAlreadyHaveChatbot.conversations[0]) {
        setSelectedConversation(isAlreadyHaveChatbot.conversations[0]);
        return;
      }
      const { data: newChatbotConversation } = await createChatbotAPI();

      setSelectedConversation(newChatbotConversation);
      setTotalConversationQuantityAboveFilter(
        totalConversationQuantityAboveFilter + 1
      );
      const isFitFilter = isConversationFitFilter({
        conversation: newChatbotConversation,
        conversationNameFilter,
        authUser,
      });
      if (isFitFilter) {
        setConversations([newChatbotConversation, ...conversations]);
        setTotalConversationQuantityUnderFilter(
          totalConversationQuantityUnderFilter + 1
        );
      }
    } catch (error) {
      console.log("Error getting chatbot:", error);
      showToast({
        message:
          error?.response?.data?.message || t("toast.handleGetChatbot.error"),
        type: "error",
      });
      return;
    } finally {
      setIsGettingChatbot(false);
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
          {hasFriends ? t("hasFriends.true") : t("hasFriends.false")}
        </h3>
        <p className="text-base-content text-sm">
          {t("chatbot.try")}{" "}
          {isGettingChatbot ? (
            <LoaderIcon className="size-4 animate-spin text-primary inline-block relative -top-[1.5px] -right-[2px]"></LoaderIcon>
          ) : (
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
              {t("chatbot.name")}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
