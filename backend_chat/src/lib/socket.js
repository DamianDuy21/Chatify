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
  const socketIds = memberIds
    .map((member) => userSocketMap[member.userId])
    .filter((socketId) => socketId);
  return socketIds;
};

const userSocketMap = {}; // Stores online users {userId: socketId}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  const userId = socket.handshake.query.userId; // Assuming userId is sent as a query parameter

  if (userId) {
    userSocketMap[userId] = socket.id; // Map userId to socketId
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Emit online users to all clients

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Emit updated online users to all clients
  });
});

export { io, app, server, userSocketMap };
