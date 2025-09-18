import { create } from "zustand";
import {
  getConversationsAPI,
  getMessagesAPI,
  getTotalConversationQuantityAboveFilterAPI,
  markMessageAsSeenAPI,
  sendMessageAPI,
  sendMessageChatbotAPI,
  waitForResponseChatbotAPI,
} from "../lib/api.js";
import { useAuthStore } from "./useAuthStore.js";
import { getLocaleById, isConversationFitFilter } from "../lib/utils.js";

export const useChatStore = create((set, get) => ({
  conversations: [],
  messages: [],
  selectedConversation: null,

  isGettingMessages: false,
  isSendingMessage: false,
  isChatbotResponding: false,
  isGettingConversations: false,

  conversationNameFilter: "",
  totalConversationQuantityAboveFilter: 0,
  totalConversationQuantityUnderFilter: 0,

  currentConversationPage: 1,

  setSelectedConversation: (conversation) =>
    set({ selectedConversation: conversation }),
  setConversations: (conversations) => set({ conversations }),
  setConversationNameFilter: (name) => set({ conversationNameFilter: name }),

  setTotalConversationQuantityAboveFilter: (quantity) =>
    set({ totalConversationQuantityAboveFilter: quantity }),
  setTotalConversationQuantityUnderFilter: (quantity) =>
    set({ totalConversationQuantityUnderFilter: quantity }),

  setCurrentConversationPage: (page) => set({ currentConversationPage: page }),

  getTotalConversationQuantityAboveFilter: async () => {
    try {
      const { data } = await getTotalConversationQuantityAboveFilterAPI();

      set({ totalConversationQuantityAboveFilter: data.total.conversations });
    } catch (error) {
      console.error(
        "Failed to fetch total conversations quantity above filter:",
        error
      );
    }
  },

  getConversations: async (args = {}) => {
    try {
      set({ isGettingConversations: true });

      const { data } = await getConversationsAPI(args);

      set((state) => {
        const prevLength = state.conversations.length;
        const requestedPage = args.page ?? 1;

        let merged;

        if (requestedPage > 1) {
          const existingIds = new Set(
            state.conversations.map((c) => c.conversation._id)
          );

          const uniqueIncoming = (data.conversations || []).filter(
            (c) => !existingIds.has(c.conversation._id)
          );

          merged = [...state.conversations, ...uniqueIncoming];
        } else {
          merged = data.conversations || [];
        }

        merged.sort((a, b) => {
          if (!a.conversation.updatedAt) return 1;
          if (!b.conversation.updatedAt) return -1;
          return (
            new Date(b.conversation.updatedAt) -
            new Date(a.conversation.updatedAt)
          );
        });

        const noNewItemAdded =
          merged.length === prevLength && requestedPage > 1;

        if (noNewItemAdded) {
          const {
            totalConversationQuantityUnderFilter,
            totalConversationQuantityAboveFilter,
            currentConversationPage,
          } = state;

          if (
            totalConversationQuantityUnderFilter ===
            totalConversationQuantityAboveFilter
          ) {
            return {
              conversations: merged,
              totalConversationQuantityUnderFilter:
                data?.pagination?.total ?? 0,
            };
          }

          if (currentConversationPage >= (data?.pagination?.totalPages ?? 1)) {
            return {
              conversations: merged,
              totalConversationQuantityUnderFilter:
                data?.pagination?.total ?? 0,
            };
          }

          return {
            conversations: merged,
            totalConversationQuantityUnderFilter: data?.pagination?.total ?? 0,
            currentConversationPage: currentConversationPage + 1,
          };
        }

        return {
          conversations: merged,
          totalConversationQuantityUnderFilter: data?.pagination?.total ?? 0,
        };
      });
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      set({ isGettingConversations: false });
    }
  },

  getMessages: async ({
    conversationId = null,
    lastMessageId = null,
    page = 1,
    limit = 16,
  }) => {
    try {
      set({ isGettingMessages: true });

      const { data } = await getMessagesAPI(conversationId, lastMessageId, {
        page,
        limit,
      });
      set((state) => ({
        conversations: state.conversations.map((conversation) => {
          if (conversation.conversation._id === conversationId) {
            return {
              ...conversation,
              currentMessagePage: conversation.currentMessagePage + 1,
              messages: [
                ...data.conversation.messages,
                ...(conversation.messages || []),
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
                currentMessagePage:
                  state.selectedConversation.currentMessagePage + 1,
                messages: [
                  ...data.conversation.messages,
                  ...(state.selectedConversation.messages || []),
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
      // set((state) => ({
      //   conversations: state.conversations.map((conversation) => {
      //     if (
      //       conversation.conversation._id ===
      //       selectedConversation.conversation._id
      //     ) {
      //       return {
      //         ...conversation,
      //         conversation: {
      //           ...conversation.conversation,
      //           lastMessage: data.message,
      //           updatedAt: data.message.createdAt,
      //         },
      //         messages: [...(conversation.messages || []), data],
      //       };
      //     }
      //     return conversation;
      //   }),
      // }));
      // set((state) => ({
      //   conversations: state.conversations.sort((a, b) => {
      //     if (!a.conversation.updatedAt) return 1;
      //     if (!b.conversation.updatedAt) return -1;
      //     return (
      //       new Date(b.conversation.updatedAt) -
      //       new Date(a.conversation.updatedAt)
      //     );
      //   }),
      // }));

      // set((state) => ({
      //   selectedConversation: state.selectedConversation
      //     ? {
      //         ...state.selectedConversation,
      //         messages: [...(state.selectedConversation.messages || []), data],
      //       }
      //     : null,
      // }));
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
      // set((state) => ({
      //   conversations: state.conversations.map((conversation) => {
      //     if (
      //       conversation.conversation._id ===
      //       selectedConversation.conversation._id
      //     ) {
      //       return {
      //         ...conversation,
      //         conversation: {
      //           ...conversation.conversation,
      //           lastMessage: data.message,
      //           updatedAt: data.message.createdAt,
      //         },
      //         messages: [...(conversation.messages || []), data],
      //       };
      //     }
      //     return conversation;
      //   }),
      // }));
      // set((state) => ({
      //   conversations: state.conversations.sort((a, b) => {
      //     if (!a.conversation.updatedAt) return 1;
      //     if (!b.conversation.updatedAt) return -1;
      //     return (
      //       new Date(b.conversation.updatedAt) -
      //       new Date(a.conversation.updatedAt)
      //     );
      //   }),
      // }));
      // set((state) => ({
      //   selectedConversation: state.selectedConversation
      //     ? {
      //         ...state.selectedConversation,
      //         messages: [...(state.selectedConversation.messages || []), data],
      //       }
      //     : null,
      // }));

      // await markMessageAsSeenAPI(data.message._id);
    } catch (error) {
      console.error("Failed to wait for chatbot response:", error);
    } finally {
      set({ isChatbotResponding: false });
    }
  },

  subscribeToMessages: () => {
    const socketChat = useAuthStore.getState().socketChat;
    if (!socketChat) return;
    socketChat.on("newMessage", async (newMessage) => {
      const { selectedConversation, conversations, conversationNameFilter } =
        get();
      const newMessageConversationId = newMessage.message.conversationId;
      const isNewMessageConversationInList = conversations.some(
        (c) => c.conversation._id === newMessageConversationId
      );

      if (!isNewMessageConversationInList) {
        const { data } = await getConversationsAPI({
          conversationId: newMessageConversationId,
        });
        let isFitFilter = isConversationFitFilter({
          conversation: data.conversations[0],
          conversationNameFilter,
          authUser: useAuthStore.getState().authUser,
        });

        if (isFitFilter) {
          set((state) => ({
            conversations: [data.conversations[0], ...state.conversations],
          }));
        }

        if (
          selectedConversation &&
          selectedConversation.conversation?._id === newMessageConversationId
        ) {
          set((state) => ({
            selectedConversation: state.selectedConversation
              ? {
                  ...state.selectedConversation,
                  conversation: {
                    ...state.selectedConversation.conversation,
                    lastMessage: newMessage,
                    updatedAt: newMessage.message.createdAt,
                  },
                  messages: [
                    ...(state.selectedConversation.messages || []),
                    newMessage,
                  ],
                }
              : null,
          }));
          if (
            newMessage.sender?._id ===
              useAuthStore.getState().authUser?.user?._id &&
            selectedConversation?.conversation?.type === "chatbot"
          ) {
            await get().waitForResponseChatbot({
              language: getLocaleById(
                selectedConversation?.conversation?.settings?.language
              ),
            });
          }

          try {
            if (
              newMessage.sender?._id !==
              useAuthStore.getState().authUser?.user?._id
            ) {
              await markMessageAsSeenAPI(newMessage.message._id);
            }
          } catch (error) {
            console.error("Failed to mark message as seen", error);
          }
        }

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
                  lastMessage: newMessage,
                  updatedAt: newMessage.message.createdAt,
                },
                messages: [...(conversation.messages || []), newMessage],
                unSeenMessageQuantity:
                  newMessage.sender &&
                  newMessage.sender?._id !==
                    useAuthStore.getState().authUser?.user?._id
                    ? (conversation.unSeenMessageQuantity || 0) + 1
                    : 0,
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
                  lastMessage: newMessage,
                  updatedAt: newMessage.message.createdAt,
                },
                messages: [...(conversation.messages || []), newMessage],
                unSeenMessageQuantity:
                  newMessage.sender &&
                  newMessage.sender?._id !==
                    useAuthStore.getState().authUser?.user?._id
                    ? (conversation.unSeenMessageQuantity || 0) + 1
                    : 0,
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
                  lastMessage: newMessage,
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
                  lastMessage: newMessage,
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

        if (
          newMessage.sender?._id ===
            useAuthStore.getState().authUser?.user?._id &&
          selectedConversation?.conversation?.type === "chatbot"
        ) {
          await get().waitForResponseChatbot({
            language: getLocaleById(
              selectedConversation?.conversation?.settings?.language
            ),
          });
        }

        try {
          if (
            newMessage.sender?._id !==
            useAuthStore.getState().authUser?.user?._id
          ) {
            await markMessageAsSeenAPI(newMessage.message._id);
          }
        } catch (error) {
          console.error("Failed to mark message as seen", error);
        }
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socketChat = useAuthStore.getState().socketChat;
    if (!socketChat) return;
    socketChat.off("newMessage");
  },
}));
