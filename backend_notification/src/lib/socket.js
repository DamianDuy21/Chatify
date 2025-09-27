import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// for send notification
const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  const userId = socket.handshake.query.userId;

  console.log("User ID:", userId);
  if (userId) {
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = [];
    }
    if (!userSocketMap[userId].includes(socket.id)) {
      userSocketMap[userId].push(socket.id);
    }
  }

  socket.on("sendFriendRequest", (data) => {
    // user == socket sender
    const { userIds, request, user } = data;
    const receiverSocketIds = getReceiverSocketIds(userIds);
    receiverSocketIds.forEach((socketId) => {
      io.to(socketId).emit("receiveFriendRequest", {
        request,
        user,
      });
    });
  });

  socket.on("cancelFriendRequest", (data) => {
    // user == socket sender
    const { userIds, request, user } = data;
    const receiverSocketIds = getReceiverSocketIds(userIds);
    receiverSocketIds.forEach((socketId) => {
      io.to(socketId).emit("handleCancelFriendRequest", {
        request,
        user,
      });
    });
  });

  socket.on("deleteFriend", (data) => {
    // user == socket sender
    const { userIds, user } = data;
    const receiverSocketIds = getReceiverSocketIds(userIds);
    receiverSocketIds.forEach((socketId) => {
      io.to(socketId).emit("handleDeleteFriend", {
        user,
      });
    });
  });

  socket.on("rejectFriendRequest", (data) => {
    // user == socket sender
    const { userIds, request, user } = data;
    const senderSocketIds = getReceiverSocketIds(userIds);
    senderSocketIds.forEach((socketId) => {
      io.to(socketId).emit("handleRejectFriendRequest", {
        request,
        user,
      });
    });
  });

  socket.on("acceptFriendRequest", (data) => {
    // user == socket sender
    const {
      userIds,
      request,
      conversation,
      conversationIsNewCreated,
      notification,
      user,
    } = data;
    const senderSocketIds = getReceiverSocketIds(userIds);
    senderSocketIds.forEach((socketId) => {
      io.to(socketId).emit("handleAcceptFriendRequest", {
        request,
        conversation,
        conversationIsNewCreated,
        notification,
        user,
      });
    });
  });

  socket.on("createGroup", (data) => {
    const { conversation, notifications, user, userIds } = data;
    const socketIds = getReceiverSocketIds(userIds);
    socketIds.forEach((socketId) => {
      io.to(socketId).emit("handleCreateGroup", {
        conversation,
        notifications,
        user,
      });
    });
  });

  socket.on("addMembersToGroup", (data) => {
    const { conversation, notifications, user, userIds, userAlreadyInGroup } =
      data;
    const socketIds = getReceiverSocketIds(userIds);
    const socketIds_updateMemberList = getReceiverSocketIds(userAlreadyInGroup);
    socketIds.forEach((socketId) => {
      io.to(socketId).emit("handleAddMembersToGroup", {
        conversation,
        notifications,
        user,
      });
    });
    socketIds_updateMemberList.forEach((socketId) => {
      io.to(socketId).emit("handleAddMembersToGroup_updateMemberList", {
        conversation,
      });
    });
  });

  socket.on("deleteMemberFromGroup", (data) => {
    const { conversation, notifications, user, userIds, userAlreadyInGroup } =
      data;
    const socketIds = getReceiverSocketIds(userIds);
    const socketIds_updateMemberList = getReceiverSocketIds(userAlreadyInGroup);
    socketIds.forEach((socketId) => {
      io.to(socketId).emit("handleDeleteMemberFromGroup", {
        conversation,
        notifications,
        user,
      });
    });
    socketIds_updateMemberList.forEach((socketId) => {
      io.to(socketId).emit("handleDeleteMemberFromGroup_updateMemberList", {
        conversation,
        userIds,
      });
    });
  });

  socket.on("leaveGroup", (data) => {
    const { conversation, newKeyMemberId, user, userIds, userAlreadyInGroup } =
      data;
    const socketIds = getReceiverSocketIds(userIds);
    socketIds.forEach((socketId) => {
      io.to(socketId).emit("handleLeaveGroup", {
        conversation,
        newKeyMemberId,
        user,
      });
    });

    const socketIds_updateMemberList = getReceiverSocketIds(userAlreadyInGroup);
    socketIds_updateMemberList.forEach((socketId) => {
      io.to(socketId).emit("handleLeaveGroup_updateMemberList", {
        conversation,
        newKeyMemberId,
        user,
        userIds,
      });
    });
  });

  socket.on("deleteConversation", (data) => {
    const { conversation, userIds, notifications, user } = data;
    const socketIds = getReceiverSocketIds(userIds);

    socketIds.forEach((socketId) => {
      io.to(socketId).emit("handleDeleteConversation", {
        conversation,
        notifications,
        user,
      });
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (userId && userSocketMap[userId]) {
      userSocketMap[userId] = userSocketMap[userId].filter(
        (id) => id !== socket.id
      );

      if (userSocketMap[userId].length === 0) {
        delete userSocketMap[userId];
      }
    }
  });
});

export const getReceiverSocketIds = (userIds) => {
  const socketIds = userIds.flatMap((userId) => userSocketMap[userId] || []);
  return socketIds;
};

export { app, io, server, userSocketMap };
