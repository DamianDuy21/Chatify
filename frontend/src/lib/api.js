import { axiosInstance } from "./axiosInstance";
import { axiosInstanceChat } from "./axiosInstanceChat";

// AUTH
export const getLanguagesAPI = async () => {
  const response = await axiosInstance.get("/user/category/get-languages");
  return response.data;
};

export const signUpAPI = async (signUpData) => {
  const response = await axiosInstance.post("/auth/signup", signUpData);
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

export const loginAPI = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);

  return response.data;
};

export const logoutAPI = async () => {
  const response = await axiosInstance.post("/auth/logout");

  return response.data;
};

export const getAuthUserAPI = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};

export const onboardingAPI = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export const resetPasswordAPI = async (email) => {
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
    limit = 10,
  } = args;

  const response = await axiosInstance.post(
    "/user/get-recommend-users",
    { fullName, nativeLanguage, learningLanguage },
    { params: { page, limit } }
  );
  return response.data;
};

export const getOutgoingFriendRequestsAPI = async (args = {}) => {
  const { page = 1, limit = 10 } = args;

  const response = await axiosInstance.get(
    "/user/get-outgoing-friend-requests",
    {
      params: { page, limit },
    }
  );
  return response.data;
};

export const sendFriendRequestAPI = async (userId) => {
  const response = await axiosInstance.post(
    `/user/send-friend-request/${userId}`
  );
  return response.data;
};

export const cancelFriendRequestAPI = async (requestId) => {
  const response = await axiosInstance.put(
    `/user/update-friend-request/${requestId}`,
    {
      type: "cancel",
    }
  );
  return response.data;
};

// NOTIFICATIONS PAGE
export const getIncomingFriendRequestsAPI = async (args = {}) => {
  const { page = 1, limit = 10 } = args;
  const response = await axiosInstance.get(
    "/user/get-incoming-friend-requests",
    {
      params: { page, limit },
    }
  );
  return response.data;
};

export const getNotificationsAPI = async (args = {}) => {
  const { page = 1, limit = 10 } = args;
  const response = await axiosInstance.get("/user/get-notifications", {
    params: { page, limit },
  });
  return response.data;
};

export const acceptFriendRequestAPI = async (requestId) => {
  const response = await axiosInstance.put(
    `/user/update-friend-request/${requestId}`,
    {
      type: "accept",
    }
  );
  return response.data;
};

export const rejectFriendRequestAPI = async (requestId) => {
  const response = await axiosInstance.put(
    `/user/update-friend-request/${requestId}`,
    {
      type: "reject",
    }
  );
  return response.data;
};

export const acceptNotificationAPI = async (notificationId) => {
  const response = await axiosInstance.put(
    `/user/update-notification/${notificationId}`,
    {
      type: "accept",
    }
  );
  return response.data;
};

export const deleteNotificationAPI = async (notificationId) => {
  const response = await axiosInstance.put(
    `/user/update-notification/${notificationId}`,
    {
      type: "delete",
    }
  );
  return response.data;
};

// FRIENDS PAGE
export const getFriendsAPI = async (args = {}) => {
  const {
    fullName = "",
    nativeLanguage = "",
    learningLanguage = "",
    page = 1,
    limit = 10,
  } = args;
  const response = await axiosInstance.post(
    "/user/get-friends",
    {
      fullName,
      nativeLanguage,
      learningLanguage,
    },
    {
      params: { page, limit },
    }
  );
  return response.data;
};

export const deleteFriendAPI = async (id) => {
  const response = await axiosInstance.delete(`/user/delete-friend/${id}`);
  return response.data;
};

// PROFILE PAGE
export const updateProfileAPI = async (profileData) => {
  const response = await axiosInstance.put("/user/update-profile", profileData);
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
    `/chat/delete-conversation/${conversationId}`
  );
  return response.data;
};
export const markMessageAsSeenAPI = async (messageId) => {
  const response = await axiosInstanceChat.put(
    `/chat/mark-message-as-seen/${messageId}`
  );
  return response.data;
};

export const markAllMessagesAsSeenAPI = async (conversationId) => {
  const response = await axiosInstanceChat.post(
    `/chat/mark-all-messages-as-seen/${conversationId}`
  );
  return response.data;
};

export const getConversationsAPI = async (args = {}) => {
  const {
    page = 1,
    limit = 10,
    conversationName = null,
    conversationId = null,
  } = args;
  const response = await axiosInstance.post(
    "/chat/get-conversations",
    {
      conversationName,
      conversationId,
    },
    {
      params: { page, limit },
    }
  );
  return response.data;
};

export const getMessagesAPI = async (conversationId, args = {}) => {
  const { page = 1, limit = 10 } = args;
  const response = await axiosInstanceChat.get(
    `/chat/get-conversation-messages/${conversationId}`,
    {
      params: { page, limit },
    }
  );
  return response.data;
};

export const sendMessageAPI = async ({ conversationId, messageData }) => {
  const response = await axiosInstanceChat.post(
    `/chat/send-message/${conversationId}`,
    messageData,
    {
      headers: { "Content-Type": undefined, Accept: "application/json" },
      transformRequest: (v) => v,
    }
  );
  return response.data;
};

export const translateMessageAPI = async (data) => {
  const response = await axiosInstanceChat.post(
    `/openai/translate-message`,
    data
  );
  return response.data;
};

export const createChatbotAPI = async () => {
  const response = await axiosInstanceChat.post(`/openai/create-chatbot`);
  return response.data;
};

export const sendMessageChatbotAPI = async ({
  conversationId,
  messageData,
}) => {
  const response = await axiosInstanceChat.post(
    `/openai/chat/send-message/${conversationId}`,
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
    `/openai/chat/wait-message/${conversationId}`,
    {
      messageData,
      language,
    }
  );
  return response.data;
};

export const createGroupAPI = async ({ name, memberIds }) => {
  const response = await axiosInstanceChat.post("/chat/create-group", {
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
    limit = 10,
  } = args;
  const response = await axiosInstance.post(
    `/user/get-friends-could-be-added-to-group/${conversationId}`,
    {
      fullName,
      nativeLanguage,
      learningLanguage,
    },
    {
      params: { page, limit },
    }
  );
  return response.data;
};

export const addMembersToGroupAPI = async ({ conversationId, memberIds }) => {
  const response = await axiosInstanceChat.post(
    `/chat/add-members-to-group/${conversationId}`,
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
  const response = await axiosInstanceChat.post(
    `/chat/delete-member-from-group/${conversationId}`,
    {
      memberId,
    }
  );
  return response.data;
};

export const getVideoCallTokenAPI = async () => {
  const response = await axiosInstanceChat.get("/chat/video-call/get-token");
  return response.data;
};

export const updateChatSettingsAPI = async ({ conversationId, settings }) => {
  const response = await axiosInstanceChat.put(
    `/chat/update-chat-settings/${conversationId}`,
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
