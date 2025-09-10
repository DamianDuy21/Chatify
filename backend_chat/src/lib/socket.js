import { Server } from "socket.io";
import http from "http";
import express from "express";
import ConversationMember from "../models/ConversationMember.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Adjust this to your front-end URL
  },
});

export const getReceiverSocketIds = async (conversationId) => {
  const memberIds = await ConversationMember.find({ conversationId }).select(
    "userId"
  );

  const socketIds = memberIds.flatMap(
    (member) => userSocketMap[member.userId] || []
  );

  return socketIds;
};

const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  const userId = socket.handshake.query.userId; // Assuming userId is sent as a query parameter

  console.log("User ID:", userId);
  // if (userId) {
  //   userSocketMap[userId] = socket.id;
  // }
  if (userId) {
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = [];
    }
    if (!userSocketMap[userId].includes(socket.id)) {
      userSocketMap[userId].push(socket.id);
    }
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

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

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server, userSocketMap };
