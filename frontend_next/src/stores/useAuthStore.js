"use client";

import Cookies from "js-cookie";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getAuthUserAPI, loginAPI, logoutAPI } from "@/lib/api.js";
import { io } from "socket.io-client";
const BACKEND_CHAT_URL = process.env.NEXT_PUBLIC_BACKEND_CHAT_URL;
const BACKEND_NOTIFICATION_URL =
  process.env.NEXT_PUBLIC_BACKEND_NOTIFICATION_URL;

let __hbTimer = null;
const HEARTBEAT_TIMEOUT_MS = 60000;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ---------- STATE ----------
      authUser: null,
      userPresenceList: [],

      socketChat: null,
      socketNotification: null,

      isGettingAuthUser: false,

      hydrated: false,

      // ---------- ACTIONS ----------
      setAuthUser: (user) => set({ authUser: user }),

      signInAuthStore: async (loginData) => {
        try {
          await loginAPI(loginData);
          const { data: userData } = await getAuthUserAPI();
          set({ authUser: userData });
          get().connectSocket();
        } catch (error) {
          console.error("Error signing in:", error);
          throw error;
        }
      },

      logoutAuthStore: async (options = {}) => {
        try {
          if (!options.skipRemote) {
            await logoutAPI();
          }
        } catch (error) {
          console.error("Error logging out:", error);
        } finally {
          set({ authUser: null });
          // Cookies.remove("jwt_chatify");
          get().disconnectSocket();
        }
      },

      checkAuthAuthStore: async () => {
        try {
          set({ isGettingAuthUser: true });
          const { data } = await getAuthUserAPI();
          set({ authUser: data });
          get().connectSocket();
        } catch (error) {
          set({ authUser: null });
          get().disconnectSocket();
          // Cookies.remove("jwt_chatify");
          console.error("Error checking authentication:", error);
        } finally {
          set({ isGettingAuthUser: false });
        }
      },

      connectSocket: () => {
        const { authUser, socketChat } = get();
        if (!authUser || !authUser.user.isOnboarded || socketChat?.connected)
          return;
        const s_chat = io(BACKEND_CHAT_URL, {
          autoConnect: false,
          query: { userId: authUser?.user?._id },
          transports: ["websocket"],
          reconnection: true,
        });

        const s_notification = io(BACKEND_NOTIFICATION_URL, {
          autoConnect: false,
          query: { userId: authUser?.user?._id },
          transports: ["websocket"],
          reconnection: true,
        });

        s_chat.on("connect", () => {
          s_chat.emit("heartbeat");
          if (__hbTimer) clearInterval(__hbTimer);
          __hbTimer = setInterval(() => {
            if (s_chat.connected) s_chat.emit("heartbeat");
          }, HEARTBEAT_TIMEOUT_MS);
        });

        s_chat.on("disconnect", () => {
          if (__hbTimer) {
            clearInterval(__hbTimer);
            __hbTimer = null;
          }
        });

        s_chat.on("getUserPresenceList", (list) =>
          set({ userPresenceList: list })
        );

        s_chat.connect();
        s_notification.connect();
        set({ socketChat: s_chat, socketNotification: s_notification });
      },

      disconnectSocket: () => {
        if (get().socketChat?.connected) {
          get().socketChat.disconnect();
          if (__hbTimer) {
            clearInterval(__hbTimer);
            __hbTimer = null;
          }
          set({ socketChat: null });
        }
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        authUser: state.authUser,
      }),

      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Auth store rehydrate error:", error);
        }

        queueMicrotask(() => {
          try {
            const { authUser, connectSocket } = useAuthStore.getState();
            useAuthStore.setState({ hydrated: true });

            if (authUser) {
              connectSocket();
            }
          } catch (error) {
            console.error("Post-hydrate hook failed:", error);
          }
        });
      },

      version: 1,
    }
  )
);
