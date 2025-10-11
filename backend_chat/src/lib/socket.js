import { Server } from "socket.io";
import http from "http";
import express from "express";
import ConversationMember from "../models/ConversationMember.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: false,
  },
});

const HEARTBEAT_TIMEOUT_MS = 300000;

// for send messages
const userSocketMap = {};

// for get online users: userId -> { last: number, timeout: NodeJS.Timeout, online: boolean }
const userPresence = new Map();

const getUserPresenceList = () =>
  [...userPresence.entries()].map(([userId, v]) => ({
    userId: String(userId),
    online: Boolean(v.online),
    last: Number(v.last || 0),
  }));

const markOnline = (userId) => {
  const now = Date.now();
  const prev = userPresence.get(userId) || {};

  // hủy timer cũ
  if (prev.timeout) clearTimeout(prev.timeout);

  // nếu không có heartbeat mới trong 5m -> offline
  const timeout = setTimeout(() => {
    const p = userPresence.get(userId);
    if (!p) return;
    p.online = false;
    userPresence.set(userId, p);
    io.emit("getUserPresenceList", getUserPresenceList());
  }, HEARTBEAT_TIMEOUT_MS);

  userPresence.set(userId, { last: now, timeout, online: true });

  // chỉ emit khi mới online hoặc trước đó offline
  if (!prev.online) {
    io.emit("getUserPresenceList", getUserPresenceList());
  }
};

const maybeMarkOfflineImmediately = (userId) => {
  const set = userSocketMap[userId];
  if (!set || set.size === 0) {
    const p = userPresence.get(userId);
    if (p?.timeout) clearTimeout(p.timeout);
    userPresence.set(userId, { last: Date.now(), online: false });
    io.emit("getUserPresenceList", getUserPresenceList());
  }
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  const userId = socket.handshake.query.userId;

  console.log("User ID:", userId);
  if (userId) {
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = [];
      markOnline(userId);
    }
    if (!userSocketMap[userId].includes(socket.id)) {
      userSocketMap[userId].push(socket.id);
    } else {
      userSocketMap[userId] = userSocketMap[userId].filter(
        (id) => id !== socket.id
      );
      userSocketMap[userId].push(socket.id);
    }
  }

  socket.on("heartbeat", () => {
    if (!userId) return;
    console.log("Heartbeat received from user:", userId);
    markOnline(userId);
  });

  io.emit("getUserPresenceList", getUserPresenceList());

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (userId && userSocketMap[userId]) {
      userSocketMap[userId] = userSocketMap[userId].filter(
        (id) => id !== socket.id
      );

      if (userSocketMap[userId].length === 0) {
        delete userSocketMap[userId];
      }

      // maybeMarkOfflineImmediately(userId);
    }
  });
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

export { io, app, server, userSocketMap };
