import { create } from "zustand";
import {
  getConversationsAPI,
  getMessagesAPI,
  markMessageAsSeenAPI,
  sendMessageAPI,
  sendMessageChatbotAPI,
  waitForResponseChatbotAPI,
} from "../lib/api.js";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
  conversations: [],
  messages: [],
  selectedConversation: null,

  isGettingMessages: false,
  isSendingMessage: false,
  isChatbotResponding: false,
  isGettingConversations: false,

  conversationNameFilter: "",

  setSelectedConversation: (conversation) =>
    set({ selectedConversation: conversation }),

  setConversations: (conversations) => set({ conversations }),

  setConversationNameFilter: (name) => set({ conversationNameFilter: name }),

  getConversations: async (args = {}) => {
    try {
      set({ isGettingConversations: true });
      const { data } = await getConversationsAPI(args);
      set({
        conversations: data.conversations.sort((a, b) => {
          if (!a.conversation.updatedAt) return 1;
          if (!b.conversation.updatedAt) return -1;
          return (
            new Date(b.conversation.updatedAt) -
            new Date(a.conversation.updatedAt)
          );
        }),
      });
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      set({ isGettingConversations: false });
    }
  },

  getMessages: async ({ conversationId, page = 1, limit = 10 }) => {
    try {
      set({ isGettingMessages: true });

      const { data } = await getMessagesAPI(conversationId, { page, limit });
      set((state) => ({
        conversations: state.conversations.map((conversation) => {
          if (conversation.conversation._id === conversationId) {
            return {
              ...conversation,
              messages: [
                ...(conversation.messages || []),
                ...data.conversation.messages,
              ],
            };
          }
          return conversation;
        }),
      }));
      set((state) => ({
        selectedConversation:
          state.selectedConversation?.conversation._id === conversationId
            ? {
                ...state.selectedConversation,
                messages: [
                  ...(state.selectedConversation.messages || []),
                  ...data.conversation.messages,
                ],
              }
            : null,
      }));
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      set({ isGettingMessages: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedConversation } = get();
    try {
      set({ isSendingMessage: true });
      await sendMessageAPI({
        conversationId: selectedConversation.conversation._id,
        messageData,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      set({ isSendingMessage: false });
    }
  },

  sendMessageChatbot: async (messageData) => {
    const { selectedConversation } = get();
    try {
      set({ isSendingMessage: true });

      const { data } = await sendMessageChatbotAPI({
        conversationId: selectedConversation.conversation._id,
        messageData,
      });
      console.log("sendMessageChatbot data:", data);
      set((state) => ({
        conversations: state.conversations.map((conversation) => {
          if (
            conversation.conversation._id ===
            selectedConversation.conversation._id
          ) {
            return {
              ...conversation,
              conversation: {
                ...conversation.conversation,
                lastMessage: data.message,
                updatedAt: data.message.createdAt,
              },
              messages: [...(conversation.messages || []), data],
            };
          }
          return conversation;
        }),
      }));
      set((state) => ({
        conversations: state.conversations.sort((a, b) => {
          if (!a.conversation.updatedAt) return 1;
          if (!b.conversation.updatedAt) return -1;
          return (
            new Date(b.conversation.updatedAt) -
            new Date(a.conversation.updatedAt)
          );
        }),
      }));

      set((state) => ({
        selectedConversation: state.selectedConversation
          ? {
              ...state.selectedConversation,
              messages: [...(state.selectedConversation.messages || []), data],
            }
          : null,
      }));
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      set({ isSendingMessage: false });
    }
  },

  waitForResponseChatbot: async ({ language }) => {
    const { selectedConversation } = get();
    try {
      set({ isChatbotResponding: true });
      const { data } = await waitForResponseChatbotAPI({
        conversationId: selectedConversation.conversation._id,
        messageData: selectedConversation.messages.slice(-1)[0],
        language,
      });
      set((state) => ({
        conversations: state.conversations.map((conversation) => {
          if (
            conversation.conversation._id ===
            selectedConversation.conversation._id
          ) {
            return {
              ...conversation,
              conversation: {
                ...conversation.conversation,
                lastMessage: data.message,
                updatedAt: data.message.createdAt,
              },
              messages: [...(conversation.messages || []), data],
            };
          }
          return conversation;
        }),
      }));
      set((state) => ({
        conversations: state.conversations.sort((a, b) => {
          if (!a.conversation.updatedAt) return 1;
          if (!b.conversation.updatedAt) return -1;
          return (
            new Date(b.conversation.updatedAt) -
            new Date(a.conversation.updatedAt)
          );
        }),
      }));
      set((state) => ({
        selectedConversation: state.selectedConversation
          ? {
              ...state.selectedConversation,
              messages: [...(state.selectedConversation.messages || []), data],
            }
          : null,
      }));

      await markMessageAsSeenAPI(data.message._id);
    } catch (error) {
      console.error("Failed to wait for chatbot response:", error);
    } finally {
      set({ isChatbotResponding: false });
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.on("newMessage", async (newMessage) => {
      const { selectedConversation } = get();
      const newMessageConversationId = newMessage.message.conversationId;
      const isNewMessageConversationInList = get().conversations.some(
        (c) => c.conversation._id === newMessageConversationId
      );

      if (!isNewMessageConversationInList) {
        const { data } = await getConversationsAPI({
          conversationId: newMessageConversationId,
        });

        set((state) => ({
          conversations: [data.conversations[0], ...state.conversations],
        }));

        return;
      }

      if (!selectedConversation) {
        set((state) => ({
          conversations: state.conversations.map((conversation) => {
            if (
              conversation.conversation._id ===
              newMessage.message.conversationId
            ) {
              return {
                ...conversation,
                conversation: {
                  ...conversation.conversation,
                  lastMessage: newMessage.message,
                  updatedAt: newMessage.message.createdAt,
                },
                messages: [...(conversation.messages || []), newMessage],
                unSeenMessageQuantity:
                  (conversation.unSeenMessageQuantity || 0) + 1,
              };
            }
            return conversation;
          }),
        }));
        set((state) => ({
          conversations: state.conversations.sort((a, b) => {
            if (!a.conversation.updatedAt) return 1;
            if (!b.conversation.updatedAt) return -1;
            return (
              new Date(b.conversation.updatedAt) -
              new Date(a.conversation.updatedAt)
            );
          }),
        }));

        return;
      }

      const isMessageSentToSelectedConversation =
        newMessage.message.conversationId ===
        selectedConversation?.conversation?._id;
      if (!isMessageSentToSelectedConversation) {
        set((state) => ({
          conversations: state.conversations.map((conversation) => {
            if (
              conversation.conversation._id ===
              newMessage.message.conversationId
            ) {
              return {
                ...conversation,
                conversation: {
                  ...conversation.conversation,
                  lastMessage: newMessage.message,
                  updatedAt: newMessage.message.createdAt,
                },
                messages: [...(conversation.messages || []), newMessage],
                unSeenMessageQuantity:
                  (conversation.unSeenMessageQuantity || 0) + 1,
              };
            }
            return conversation;
          }),
        }));
        set((state) => ({
          conversations: state.conversations.sort((a, b) => {
            if (!a.conversation.updatedAt) return 1;
            if (!b.conversation.updatedAt) return -1;
            return (
              new Date(b.conversation.updatedAt) -
              new Date(a.conversation.updatedAt)
            );
          }),
        }));
        return;
      } else {
        newMessage.seenBy = [
          useAuthStore.getState().authUser?.user !== newMessage.sender?._id
            ? useAuthStore.getState().authUser?.user
            : null,
        ];
        set((state) => ({
          conversations: state.conversations.map((conversation) => {
            if (
              conversation.conversation._id ===
              selectedConversation.conversation._id
            ) {
              return {
                ...conversation,
                conversation: {
                  ...conversation.conversation,
                  lastMessage: newMessage.message,
                  updatedAt: newMessage.message.createdAt,
                },
                messages: [...(conversation.messages || []), newMessage],
              };
            }
            return conversation;
          }),
        }));

        set((state) => ({
          selectedConversation: state.selectedConversation
            ? {
                ...state.selectedConversation,
                conversation: {
                  ...state.selectedConversation.conversation,
                  lastMessage: newMessage.message,
                  updatedAt: newMessage.message.createdAt,
                },
                messages: [
                  ...(state.selectedConversation.messages || []),
                  newMessage,
                ],
              }
            : null,
        }));

        set((state) => ({
          conversations: state.conversations.sort((a, b) => {
            if (!a.conversation.updatedAt) return 1;
            if (!b.conversation.updatedAt) return -1;
            return (
              new Date(b.conversation.updatedAt) -
              new Date(a.conversation.updatedAt)
            );
          }),
        }));

        try {
          if (
            newMessage.sender?._id !==
            useAuthStore.getState().authUser?.user?._id
          ) {
            // await axiosInstanceChat.put(
            //   `/chat/mark-as-seen/${newMessage.message._id}`
            // );
            await markMessageAsSeenAPI(newMessage.message._id);
          }
        } catch (error) {
          console.error("Failed to mark message as seen", error);
        }
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
  },
}));
