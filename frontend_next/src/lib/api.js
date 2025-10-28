import Cookies from "js-cookie";
import { axiosInstance } from "./axiosInstance";
import { axiosInstanceChat } from "./axiosInstanceChat";

// AUTH
export const getLanguagesAPI = async () => {
  const response = await axiosInstance.get("/user/category/languages");
  return response.data;
};

export const signUpAPI = async (data) => {
  const response = await axiosInstance.post("/auth/signup", data);
  return response.data;
};
export const signUpVerificationAPI = async ({
  otp,
  email,
  password,
  fullName,
}) => {
  const response = await axiosInstance.post("/auth/signup/verify-otp", {
    email,
    password,
    fullName,
    code: otp,
  });
  return response.data;
};

export const loginAPI = async (data) => {
  const response = await axiosInstance.post("/auth/login", data);
  const jwt = response.data.data?.token;
  Cookies.remove("jwt_chatify");
  Cookies.set("jwt_chatify", jwt, { expires: 1 });
  return response.data;
};

export const logoutAPI = async () => {
  const response = await axiosInstance.post("/auth/logout");
  Cookies.remove("jwt_chatify");
  return response.data;
};

export const getAuthUserAPI = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};

export const onboardingAPI = async (data) => {
  const response = await axiosInstance.post("/auth/onboard", data);
  return response.data;
};

export const resetPasswordAPI = async ({ email }) => {
  const response = await axiosInstance.post("/auth/reset-password", {
    email,
  });
  return response.data;
};

export const resetPasswordVerificationAPI = async ({
  email,
  newPassword,
  otp,
}) => {
  const response = await axiosInstance.post("/auth/reset-password/verify-otp", {
    email,
    newPassword,
    code: otp,
  });
  return response.data;
};

// HOME PAGE
export const getRecommendedUsersAPI = async (args = {}) => {
  const {
    fullName = "",
    nativeLanguage = "",
    learningLanguage = "",
    page = 1,
    limit = 12,
  } = args;

  const response = await axiosInstance.get("/user/recommend-users", {
    params: { page, limit, fullName, nativeLanguage, learningLanguage },
  });
  return response.data;
};

export const getOutgoingFriendRequestsAPI = async (args = {}) => {
  const { page = 1, limit = 12 } = args;

  const response = await axiosInstance.get(
    "/user/friends/outgoing-friend-requests",
    {
      params: { page, limit },
    }
  );
  return response.data;
};

export const sendFriendRequestAPI = async (userId) => {
  const response = await axiosInstance.post(`/user/friend-request/${userId}`);
  return response.data;
};

export const cancelFriendRequestAPI = async (requestId) => {
  const response = await axiosInstance.put(
    `/user/friend-request/${requestId}`,
    {
      type: "cancel",
    }
  );
  return response.data;
};

// NOTIFICATIONS PAGE
export const getIncomingFriendRequestsAPI = async (args = {}) => {
  const { page = 1, limit = 12 } = args;
  const response = await axiosInstance.get(
    "/user/friends/incoming-friend-requests",
    {
      params: { page, limit },
    }
  );
  return response.data;
};

export const getTotalNotificationQuantityAPI = async () => {
  const response = await axiosInstance.get("/user/notifications/total");
  return response.data;
};

export const getNotificationsAPI = async (args = {}) => {
  const { page = 1, limit = 12 } = args;
  const response = await axiosInstance.get("/user/notifications", {
    params: { page, limit },
  });
  return response.data;
};

export const acceptFriendRequestAPI = async (requestId) => {
  const response = await axiosInstance.put(
    `/user/friend-request/${requestId}`,
    {
      type: "accept",
    }
  );
  return response.data;
};

export const rejectFriendRequestAPI = async (requestId) => {
  const response = await axiosInstance.put(
    `/user/friend-request/${requestId}`,
    {
      type: "reject",
    }
  );
  return response.data;
};

export const acceptNotificationAPI = async (notificationId) => {
  const response = await axiosInstance.put(
    `/user/notification/${notificationId}`,
    {
      type: "accept",
    }
  );
  return response.data;
};

export const deleteNotificationAPI = async (notificationId) => {
  const response = await axiosInstance.put(
    `/user/notification/${notificationId}`,
    {
      type: "delete",
    }
  );
  return response.data;
};

// FRIENDS PAGE
export const createPrivateConversationAPI = async (userId) => {
  const response = await axiosInstance.post("/chat/conversation/private", {
    userId,
  });
  return response.data;
};

export const getFriendsAPI = async (args = {}) => {
  const {
    fullName = "",
    nativeLanguage = "",
    learningLanguage = "",
    page = 1,
    limit = 12,
  } = args;
  const response = await axiosInstance.get(
    "/user/friends",

    {
      params: { page, limit, fullName, nativeLanguage, learningLanguage },
    }
  );
  return response.data;
};

export const deleteFriendAPI = async (id) => {
  const response = await axiosInstance.delete(`/user/friend/${id}`);
  return response.data;
};

// PROFILE PAGE
export const updateProfileAPI = async (profileData) => {
  const response = await axiosInstance.put("/user/profile", profileData);
  return response.data;
};

export const changePasswordAPI = async ({ currentPassword, newPassword }) => {
  const response = await axiosInstance.post("/user/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export const changePasswordVerificationAPI = async (otp) => {
  const response = await axiosInstance.post(
    "/user/change-password/verify-otp",
    {
      code: otp,
    }
  );
  return response.data;
};

// CHAT PAGE
export const deleteConversationAPI = async (conversationId) => {
  const response = await axiosInstanceChat.delete(
    `/chat/conversation/${conversationId}`
  );
  return response.data;
};
export const markMessageAsSeenAPI = async (messageId) => {
  const response = await axiosInstanceChat.put(
    `/chat/message/mark/${messageId}`
  );
  return response.data;
};

export const markAllMessagesAsSeenAPI = async (conversationId) => {
  const response = await axiosInstanceChat.post(
    `/chat/message/mark-all/${conversationId}`
  );
  return response.data;
};

export const getConversationsAPI = async (args = {}) => {
  const {
    page = 1,
    limit = 12,
    conversationName = null,
    conversationId = null,
    conversationType = null,
    userId = null,
  } = args;
  const response = await axiosInstance.get("/chat/conversations", {
    params: {
      page,
      limit,
      conversationName,
      conversationId,
      conversationType,
      userId,
    },
  });
  return response.data;
};

export const getTotalConversationQuantityAboveFilterAPI = async () => {
  const response = await axiosInstance.get("/chat/conversations/total");
  return response.data;
};

export const getConversationsHaveUnSeenMessagesAPI = async () => {
  const response = await axiosInstance.get(
    "/chat/conversations/have-unseen-messages"
  );
  return response.data;
};

export const getMessagesAPI = async (
  conversationId = null,
  lastMessageId = null,
  args = {}
) => {
  const { page = 1, limit = 16 } = args;
  const response = await axiosInstanceChat.get(
    `/chat/conversation/messages/${conversationId}`,
    {
      params: { page, limit, lastMessageId },
    }
  );
  return response.data;
};

export const sendMessageAPI = async ({ conversationId, messageData }) => {
  const response = await axiosInstanceChat.post(
    `/chat/message/${conversationId}`,
    messageData,
    {
      headers: { "Content-Type": undefined, Accept: "application/json" },
      transformRequest: (v) => v,
    }
  );
  return response.data;
};

export const translateMessageAPI = async (data) => {
  const response = await axiosInstanceChat.post(`/openai/chat/translate`, data);
  return response.data;
};

export const createChatbotAPI = async () => {
  const response = await axiosInstanceChat.post(`/openai/conversation`);
  return response.data;
};

export const sendMessageChatbotAPI = async ({
  conversationId,
  messageData,
}) => {
  const response = await axiosInstanceChat.post(
    `/openai/chat/send/${conversationId}`,
    messageData,
    {
      headers: { "Content-Type": undefined, Accept: "application/json" },
      transformRequest: (v) => v,
    }
  );
  return response.data;
};

export const waitForResponseChatbotAPI = async ({
  conversationId,
  messageData,
  language,
}) => {
  const response = await axiosInstanceChat.post(
    `/openai/chat/wait/${conversationId}`,
    {
      messageData,
      language,
    }
  );
  return response.data;
};

export const createGroupAPI = async ({ name, memberIds }) => {
  const response = await axiosInstanceChat.post("/chat/group", {
    name,
    memberIds,
  });
  return response.data;
};

export const getFriendsCouldBeAddedToGroupAPI = async (
  conversationId,
  args = {}
) => {
  const {
    fullName = "",
    nativeLanguage = "",
    learningLanguage = "",
    page = 1,
    limit = 12,
  } = args;
  const response = await axiosInstance.get(
    `/user/friends/could-be-added-to-group/${conversationId}`,
    {
      params: { page, limit, fullName, nativeLanguage, learningLanguage },
    }
  );
  return response.data;
};

export const addMembersToGroupAPI = async ({ conversationId, memberIds }) => {
  const response = await axiosInstanceChat.post(
    `/chat/group/members/${conversationId}`,
    {
      memberIds,
    }
  );
  return response.data;
};

export const deleteMemberFromGroupAPI = async ({
  conversationId,
  memberId,
}) => {
  const response = await axiosInstanceChat.delete(
    `/chat/group/member/${conversationId}`,
    {
      params: { memberId },
    }
  );
  return response.data;
};

export const getVideoCallTokenAPI = async () => {
  const response = await axiosInstanceChat.get("/chat/video-call/token");
  return response.data;
};

export const updateConversationSettingsAPI = async ({
  conversationId,
  settings,
}) => {
  const response = await axiosInstanceChat.put(
    `/chat/conversation/settings/${conversationId}`,
    settings
  );
  return response.data;
};

export const leaveGroupAPI = async ({
  conversationId,
  isKeyMember = false,
  newKeyMemberId = null,
} = {}) => {
  const response = await axiosInstanceChat.post(
    `/chat/leave-group/${conversationId}`,
    {
      isKeyMember,
      newKeyMemberId,
    }
  );
  return response.data;
};

export const createUpdateReactionAPI = async ({
  messageId,
  reaction,
  conversationId,
}) => {
  const response = await axiosInstanceChat.post(
    `/chat/message/reaction/${messageId}`,
    { type: reaction, conversationId }
  );
  return response.data;
};

export const deleteReactionAPI = async ({
  messageId,
  reaction,
  conversationId,
}) => {
  const response = await axiosInstanceChat.delete(
    `/chat/message/reaction/${messageId}`,
    { params: { type: reaction, conversationId } }
  );
  return response.data;
};

export const getReactMemberListAPI = async ({
  messageId,
  memberInGroupIds,
  conversationType,
  keyMemberId,
}) => {
  const response = await axiosInstanceChat.post(
    `/chat/message/reaction/members/${messageId}`,
    {
      memberInGroupIds,
      conversationType,
      keyMemberId,
    }
  );
  return response.data;
};
