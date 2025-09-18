import { create } from "zustand";
import { isConversationFitFilter } from "../lib/utils.js";
import { useAuthStore } from "./useAuthStore.js";
import { useChatStore } from "./useChatStore.js";
import { getConversationsAPI } from "../lib/api.js";

const pageSize = 12;

export const useNotificationStore = create((set, get) => ({
  pendingIncomingRequests: [],
  pendingFriends: [],
  pendingNotifications: [],

  setPendingIncomingRequests: (requests) => {
    set({ pendingIncomingRequests: requests });
  },
  setPendingFriends: (friends) => {
    set({ pendingFriends: friends });
  },
  setPendingNotifications: (notifications) => {
    set({ pendingNotifications: notifications });
  },

  sendFriendRequest_NotificationStore: async (data) => {
    try {
      const socketNotification = useAuthStore.getState().socketNotification;
      socketNotification.emit("sendFriendRequest", data);
    } catch (error) {
      console.error("Error sending friend request:", error);
      throw error;
    }
  },

  cancelFriendRequest_NotificationStore: async (data) => {
    try {
      const socketNotification = useAuthStore.getState().socketNotification;
      socketNotification.emit("cancelFriendRequest", data);
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      throw error;
    }
  },

  deleteFriend_NotificationStore: async (data) => {
    try {
      const socketNotification = useAuthStore.getState().socketNotification;
      socketNotification.emit("deleteFriend", data);
    } catch (error) {
      console.error("Error deleting friend:", error);
      throw error;
    }
  },

  rejectFriendRequest_NotificationStore: async (data) => {
    try {
      const socketNotification = useAuthStore.getState().socketNotification;
      socketNotification.emit("rejectFriendRequest", data);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      throw error;
    }
  },

  acceptFriendRequest_NotificationStore: async (data) => {
    try {
      const socketNotification = useAuthStore.getState().socketNotification;
      socketNotification.emit("acceptFriendRequest", data);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      throw error;
    }
  },

  createGroup_NotificationStore: async (data) => {
    try {
      const socketNotification = useAuthStore.getState().socketNotification;
      socketNotification.emit("createGroup", data);
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    }
  },

  addMembersToGroup_NotificationStore: async (data) => {
    try {
      const socketNotification = useAuthStore.getState().socketNotification;
      socketNotification.emit("addMembersToGroup", data);
    } catch (error) {
      console.error("Error adding members to group:", error);
      throw error;
    }
  },

  deleteMemberFromGroup_NotificationStore: async (data) => {
    try {
      const socketNotification = useAuthStore.getState().socketNotification;
      socketNotification.emit("deleteMemberFromGroup", data);
    } catch (error) {
      console.error("Error deleting member from group:", error);
      throw error;
    }
  },

  leaveGroup_NotificationStore: async (data) => {
    try {
      const socketNotification = useAuthStore.getState().socketNotification;
      socketNotification.emit("leaveGroup", data);
    } catch (error) {
      console.error("Error leaving group:", error);
      throw error;
    }
  },

  deleteConversation_NotificationStore: async (data) => {
    try {
      const socketNotification = useAuthStore.getState().socketNotification;
      socketNotification.emit("deleteConversation", data);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  },

  subscribeToNotifications: () => {
    const socketNotification = useAuthStore.getState().socketNotification;

    socketNotification.on("handleDeleteConversation", (data) => {
      const { authUser } = useAuthStore.getState();
      const {
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
      } = useChatStore.getState();
      const conversationId = data.conversation._id;

      set((state) => {
        const newNotification = {
          notification: data.notifications.filter(
            (n) => n.userId === authUser.user._id && n.userId !== n.userIdRef
          )[0],
          user: data.user,
        };
        return {
          pendingNotifications: [
            newNotification,
            ...state.pendingNotifications,
          ].slice(0, pageSize),
        };
      });

      setConversations(
        conversations.filter(
          (conversation) => conversation.conversation._id !== conversationId
        )
      );
      if (
        selectedConversation &&
        selectedConversation.conversation._id === conversationId
      ) {
        setSelectedConversation(null);
      }
    });

    socketNotification.on("handleLeaveGroup", (data) => {
      const {
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
      } = useChatStore.getState();
      const conversationId = data.conversation._id;

      setConversations(
        conversations.filter(
          (conversation) => conversation.conversation._id !== conversationId
        )
      );
      if (
        selectedConversation &&
        selectedConversation.conversation._id === conversationId
      ) {
        setSelectedConversation(null);
      }
    });

    socketNotification.on("handleLeaveGroup_updateMemberList", (data) => {
      const {
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
      } = useChatStore.getState();
      const conversationId = data.conversation._id;
      const newKeyMemberId = data.newKeyMemberId;

      setConversations(
        conversations.map((conversation) =>
          conversation.conversation._id === conversationId
            ? {
                ...conversation,
                users: conversation.users
                  .filter((u) => u.user._id !== data.user._id)
                  .map((u) =>
                    u.user._id === newKeyMemberId
                      ? { ...u, isKeyMember: true }
                      : u
                  ),
              }
            : conversation
        )
      );
      if (
        selectedConversation &&
        selectedConversation.conversation._id === conversationId
      ) {
        setSelectedConversation({
          ...selectedConversation,
          users: selectedConversation.users
            .filter((u) => u.user._id !== data.user._id)
            .map((u) =>
              u.user._id === newKeyMemberId ? { ...u, isKeyMember: true } : u
            ),
        });
      }
    });

    socketNotification.on("handleDeleteMemberFromGroup", (data) => {
      const { authUser } = useAuthStore.getState();
      const {
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
      } = useChatStore.getState();

      set((state) => {
        const newNotification = {
          notification: data.notifications.filter(
            (n) => n.userId === authUser.user._id && n.userId !== n.userIdRef
          )[0],
          user: data.user,
        };
        return {
          pendingNotifications: [
            newNotification,
            ...state.pendingNotifications,
          ].slice(0, pageSize),
        };
      });

      const conversationId = data.conversation.conversation._id;
      setConversations(
        conversations.filter(
          (conversation) => conversation.conversation._id !== conversationId
        )
      );
      if (
        selectedConversation &&
        selectedConversation.conversation._id === conversationId
      ) {
        setSelectedConversation(null);
      }
    });

    socketNotification.on("handleAddMembersToGroup", async (data) => {
      const { authUser } = useAuthStore.getState();
      const { conversations, setConversations } = useChatStore.getState();

      set((state) => {
        const newNotification = {
          notification: data.notifications.filter(
            (n) => n.userId === authUser.user._id && n.userId !== n.userIdRef
          )[0],
          user: data.user,
        };
        return {
          pendingNotifications: [
            newNotification,
            ...state.pendingNotifications,
          ].slice(0, pageSize),
        };
      });
      const conversationId = data.conversation.conversation._id;
      const { data: newConversation } = await getConversationsAPI({
        conversationId: conversationId,
      });
      setConversations([newConversation.conversations[0], ...conversations]);
    });

    socketNotification.on(
      "handleAddMembersToGroup_updateMemberList",
      async (data) => {
        const {
          conversations,
          setConversations,
          selectedConversation,
          setSelectedConversation,
        } = useChatStore.getState();

        const conversationId = data.conversation.conversation._id;

        const isConversationFitFilter =
          conversations.some((c) => c.conversation._id === conversationId) ||
          (selectedConversation
            ? selectedConversation.conversation._id === conversationId
            : false);
        if (!isConversationFitFilter) return;

        const { data: newConversation } = await getConversationsAPI({
          conversationId: conversationId,
        });
        setConversations(
          conversations.map((conversation) =>
            conversation.conversation._id === conversationId
              ? newConversation.conversations[0]
              : conversation
          )
        );
        if (
          selectedConversation &&
          selectedConversation.conversation._id === conversationId
        ) {
          setSelectedConversation(newConversation.conversations[0]);
        }
      }
    );

    socketNotification.on(
      "handleDeleteMemberFromGroup_updateMemberList",
      async (data) => {
        const {
          conversations,
          setConversations,
          selectedConversation,
          setSelectedConversation,
        } = useChatStore.getState();

        const conversationId = data.conversation.conversation._id;
        const deletedMemberIds = data.userIds;

        const isConversationFitFilter =
          conversations.some((c) => c.conversation._id === conversationId) ||
          (selectedConversation
            ? selectedConversation.conversation._id === conversationId
            : false);
        if (!isConversationFitFilter) return;

        setConversations(
          conversations.map((conversation) =>
            conversation.conversation._id === conversationId
              ? {
                  ...conversation,
                  users: conversation.users.filter(
                    (user) => !deletedMemberIds.includes(user.user._id)
                  ),
                }
              : conversation
          )
        );
        if (
          selectedConversation &&
          selectedConversation.conversation._id === conversationId
        ) {
          setSelectedConversation({
            ...selectedConversation,
            users: selectedConversation.users.filter(
              (user) => !deletedMemberIds.includes(user.user._id)
            ),
          });
        }
      }
    );

    socketNotification.on("handleCreateGroup", async (data) => {
      const { authUser } = useAuthStore.getState();
      const { conversations, setConversations } = useChatStore.getState();

      if (data.user._id === authUser.user._id) return;

      set((state) => {
        const newNotification = {
          notification: data.notifications.filter(
            (n) => n.userId === authUser.user._id && n.userId !== n.userIdRef
          )[0],
          user: data.user,
        };
        return {
          pendingNotifications: [
            newNotification,
            ...state.pendingNotifications,
          ].slice(0, pageSize),
        };
      });
      const { data: newConversation } = await getConversationsAPI({
        conversationId: data.conversation.conversation._id,
      });
      setConversations([newConversation.conversations[0], ...conversations]);
    });

    socketNotification.on("receiveFriendRequest", (data) => {
      const { authUser } = useAuthStore.getState();
      const {
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
      } = useChatStore.getState();
      if (data.user._id === authUser.user._id) return;
      set((state) => {
        const exists = state.pendingIncomingRequests.find(
          (req) => req.user._id === data.user._id
        );
        let updatedRequests = state.pendingIncomingRequests;
        if (exists) {
          updatedRequests = state.pendingIncomingRequests.filter(
            (req) => req.user._id !== data.user._id
          );
        }
        return {
          pendingIncomingRequests: [...updatedRequests, data],
        };
      });

      const otherUserId = data.user._id;

      setConversations(
        conversations.map((conversation) => ({
          ...conversation,
          users: conversation.users.map((userObj) =>
            userObj?.user?._id === otherUserId
              ? { ...userObj, isSendFriendRequest: true }
              : userObj
          ),
        }))
      );

      if (selectedConversation) {
        setSelectedConversation({
          ...selectedConversation,
          users: selectedConversation.users.map((userObj) =>
            userObj?.user?._id === otherUserId
              ? { ...userObj, isSendFriendRequest: true }
              : userObj
          ),
        });
      }
    });

    socketNotification.on("handleAcceptFriendRequest", (data) => {
      const { authUser } = useAuthStore.getState();
      const {
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
      } = useChatStore.getState();

      let tmpConversations = [...conversations];

      if (data.user._id === authUser.user._id) return;
      set((state) => {
        const exists = state.pendingFriends.find(
          (req) => req.user._id === data.user._id
        );
        let updatedFriends = state.pendingFriends;
        if (exists) {
          updatedFriends = state.pendingFriends.filter(
            (req) => req.user._id !== data.user._id
          );
        }
        return {
          pendingFriends: [...updatedFriends, data],
        };
      });

      set((state) => {
        const newNotification = {
          notification: data.notification,
          user: data.user,
        };
        return {
          pendingNotifications: [
            newNotification,
            ...state.pendingNotifications,
          ].slice(0, pageSize),
        };
      });

      const otherUserId = data.user._id;

      if (data.conversationIsNewCreated) {
        const {
          setTotalConversationQuantityAboveFilter,
          setTotalConversationQuantityUnderFilter,
          conversationNameFilter,
        } = useChatStore.getState();
        const totalConversationQuantityAboveFilter =
          useChatStore.getState().totalConversationQuantityAboveFilter;
        const totalConversationQuantityUnderFilter =
          useChatStore.getState().totalConversationQuantityUnderFilter;
        setTotalConversationQuantityAboveFilter(
          totalConversationQuantityAboveFilter + 1
        );
        const isFitFilter = isConversationFitFilter({
          conversation: data.conversationIsNewCreated,
          conversationNameFilter,
          authUser,
        });

        if (isFitFilter) {
          tmpConversations = [
            data.conversationIsNewCreated,
            ...tmpConversations,
          ];
          setConversations(tmpConversations);
          setTotalConversationQuantityUnderFilter(
            totalConversationQuantityUnderFilter + 1
          );
        }
      }

      setConversations(
        tmpConversations.map((conversation) => ({
          ...conversation,
          users: conversation.users.map((userObj) =>
            userObj?.user?._id === otherUserId
              ? { ...userObj, isSendFriendRequest: false, isFriend: true }
              : userObj
          ),
        }))
      );
      if (selectedConversation) {
        setSelectedConversation({
          ...selectedConversation,
          users: selectedConversation.users.map((userObj) =>
            userObj?.user?._id === otherUserId
              ? { ...userObj, isSendFriendRequest: false, isFriend: true }
              : userObj
          ),
        });
      }
    });

    socketNotification.on("handleCancelFriendRequest", (data) => {
      const { authUser } = useAuthStore.getState();
      const {
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
      } = useChatStore.getState();
      if (data.user._id === authUser.user._id) return;

      const otherUserId = data.user._id;

      setConversations(
        conversations.map((conversation) => ({
          ...conversation,
          users: conversation.users.map((userObj) =>
            userObj?.user?._id === otherUserId
              ? { ...userObj, isSendFriendRequest: false }
              : userObj
          ),
        }))
      );
      if (selectedConversation) {
        setSelectedConversation({
          ...selectedConversation,
          users: selectedConversation.users.map((userObj) =>
            userObj?.user?._id === otherUserId
              ? { ...userObj, isSendFriendRequest: false }
              : userObj
          ),
        });
      }
    });

    socketNotification.on("handleDeleteFriend", (data) => {
      const { authUser } = useAuthStore.getState();
      const {
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
      } = useChatStore.getState();
      if (data.user._id === authUser.user._id) return;

      const otherUserId = data.user._id;

      setConversations(
        conversations.map((conversation) => ({
          ...conversation,
          users: conversation.users.map((userObj) =>
            userObj?.user?._id === otherUserId
              ? { ...userObj, isSendFriendRequest: false, isFriend: false }
              : userObj
          ),
        }))
      );
      if (selectedConversation) {
        setSelectedConversation({
          ...selectedConversation,
          users: selectedConversation.users.map((userObj) =>
            userObj?.user?._id === otherUserId
              ? { ...userObj, isSendFriendRequest: false, isFriend: false }
              : userObj
          ),
        });
      }
    });

    socketNotification.on("handleRejectFriendRequest", (data) => {
      const { authUser } = useAuthStore.getState();
      const {
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
      } = useChatStore.getState();

      if (data.user._id === authUser.user._id) return;

      const otherUserId = data.user._id;

      setConversations(
        conversations.map((conversation) => ({
          ...conversation,
          users: conversation.users.map((userObj) =>
            userObj?.user._id === otherUserId
              ? { ...userObj, isSendFriendRequest: false }
              : userObj
          ),
        }))
      );
      if (selectedConversation)
        setSelectedConversation({
          ...selectedConversation,
          users: [...selectedConversation.users].map((userObj) =>
            userObj?.user._id === otherUserId
              ? { ...userObj, isSendFriendRequest: false }
              : userObj
          ),
        });
    });
  },
  unsubscribeFromNotifications: () => {
    const socketNotification = useAuthStore.getState().socketNotification;
    if (!socketNotification) return;
    socketNotification.off("receiveFriendRequest");
  },
}));
