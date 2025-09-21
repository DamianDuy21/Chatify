"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useThemeStore } from "@/stores/useThemeStore";
import CommonPageLoader from "@/components/loaders/CommonPageLoader";

export default function AuthAndOnboardClientProvider({ children }) {
  const { hydrateTheme } = useThemeStore();

  // ----- Auth -----
  const authUser = useAuthStore((s) => s.authUser);
  const isGettingAuthUser = useAuthStore((s) => s.isGettingAuthUser);
  const checkAuthAuthStore = useAuthStore((s) => s.checkAuthAuthStore);

  // ----- Chat -----
  const getConversations = useChatStore((s) => s.getConversations);
  // const setConversations = useChatStore((s) => s.setConversations);
  const subscribeToMessages = useChatStore((s) => s.subscribeToMessages);
  const unsubscribeFromMessages = useChatStore(
    (s) => s.unsubscribeFromMessages
  );
  const getTotalConversationQuantityAboveFilter = useChatStore(
    (s) => s.getTotalConversationQuantityAboveFilter
  );
  const setConversationNameFilter = useChatStore(
    (s) => s.setConversationNameFilter
  );
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );

  // ----- Notifications -----
  const subscribeToNotifications = useNotificationStore(
    (s) => s.subscribeToNotifications
  );
  const unsubscribeFromNotifications = useNotificationStore(
    (s) => s.unsubscribeFromNotifications
  );

  // ----- Sockets -----
  const socketChat = useAuthStore((s) => s.socketChat);
  const socketNotification = useAuthStore((s) => s.socketNotification);

  // ----- Languages -----
  const getLanguages = useLanguageStore((s) => s.getLanguages);

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    checkAuthAuthStore();
  }, [checkAuthAuthStore]);

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  useEffect(() => {
    getLanguages();
  }, [getLanguages]);

  useEffect(() => {
    getTotalConversationQuantityAboveFilter();
  }, [getTotalConversationQuantityAboveFilter]);

  useEffect(() => {
    setConversationNameFilter("");
    setSelectedConversation(null);
  }, []);

  useEffect(() => {
    if (!socketChat) return;
    subscribeToMessages();
    return () => {
      unsubscribeFromMessages();
    };
  }, [socketChat]);

  useEffect(() => {
    if (!socketNotification) return;
    subscribeToNotifications();
    return () => {
      unsubscribeFromNotifications();
    };
  }, [socketNotification]);

  if (isGettingAuthUser || !authUser) {
    return <CommonPageLoader />;
  }

  return children;
}
