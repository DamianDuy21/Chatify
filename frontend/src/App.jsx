import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router";
import CommonPageLoader from "./components/loaders/CommonPageLoader.jsx";
import MainLayout from "./layouts/MainLayout.jsx";

import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";
import ChatsPage from "./pages/ChatsPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import FriendsPage from "./pages/FriendsPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProfilePage from "./pages/ProfilePage.jsx";
import SignUpPage from "./pages/SignUpPage";
import VideoCallPage from "./pages/VideoCallPage.jsx";
import { useAuthStore } from "./stores/useAuthStore.js";
import { useChatStore } from "./stores/useChatStore.js";
import { useLanguageStore } from "./stores/useLanguageStore.js";
import { useThemeStore } from "./stores/useThemeStore.js";
import { useNotificationStore } from "./stores/useNotificationStore.js";

const App = () => {
  const authUser = useAuthStore((s) => s.authUser);
  const checkAuthAuthStore = useAuthStore((s) => s.checkAuthAuthStore);
  const isGettingAuthUser = useAuthStore((s) => s.isGettingAuthUser);

  const getConversations = useChatStore((s) => s.getConversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const subscribeToMessages = useChatStore((s) => s.subscribeToMessages);
  const unsubscribeFromMessages = useChatStore(
    (s) => s.unsubscribeFromMessages
  );
  const subscribeToNotifications = useNotificationStore(
    (s) => s.subscribeToNotifications
  );
  const unsubscribeFromNotifications = useNotificationStore(
    (s) => s.unsubscribeFromNotifications
  );
  const getTotalConversationQuantityAboveFilter = useChatStore(
    (s) => s.getTotalConversationQuantityAboveFilter
  );
  const getConversationsHaveUnSeenMessages = useChatStore(
    (s) => s.getConversationsHaveUnSeenMessages
  );
  const setConversationNameFilter = useChatStore(
    (s) => s.setConversationNameFilter
  );
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );

  const socketChat = useAuthStore((s) => s.socketChat);
  const socketNotification = useAuthStore((s) => s.socketNotification);

  const getLanguages = useLanguageStore((s) => s.getLanguages);

  const { theme } = useThemeStore();

  const isAuthenticated = Boolean(authUser);

  const isOnboarded = authUser?.user?.isOnboarded;

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
    if (!authUser) {
      setConversations([]);
    }
    if (authUser) {
      getTotalConversationQuantityAboveFilter();
      getConversationsHaveUnSeenMessages();
    }
    setConversationNameFilter("");
    setSelectedConversation(null);
  }, [authUser?.user?._id]);

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

  if (isGettingAuthUser) {
    return <CommonPageLoader />;
  }

  return (
    <>
      <div
        className="min-h-screen bg-base-100 text-base-content"
        data-theme={theme}
      >
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated && isOnboarded ? (
                <MainLayout>
                  <HomePage />
                </MainLayout>
              ) : (
                <Navigate to={!isAuthenticated ? "/signin" : "/onboarding"} />
              )
            }
          />
          <Route
            path="/chats"
            element={
              isAuthenticated && isOnboarded ? (
                <MainLayout>
                  <ChatsPage />
                </MainLayout>
              ) : (
                <Navigate to={!isAuthenticated ? "/signin" : "/onboarding"} />
              )
            }
          />
          <Route
            path="/video-call/:id"
            element={
              isAuthenticated && isOnboarded ? (
                <VideoCallPage />
              ) : (
                <Navigate to={!isAuthenticated ? "/signin" : "/onboarding"} />
              )
            }
          />
          <Route
            path="/notifications"
            element={
              isAuthenticated && isOnboarded ? (
                <MainLayout>
                  <NotificationsPage />
                </MainLayout>
              ) : (
                <Navigate to={!isAuthenticated ? "/signin" : "/onboarding"} />
              )
            }
          />
          <Route
            path="/friends"
            element={
              isAuthenticated && isOnboarded ? (
                <MainLayout>
                  <FriendsPage />
                </MainLayout>
              ) : (
                <Navigate to={!isAuthenticated ? "/signin" : "/onboarding"} />
              )
            }
          />
          <Route
            path="/profile"
            element={
              isAuthenticated && isOnboarded ? (
                <MainLayout>
                  <ProfilePage />
                </MainLayout>
              ) : (
                <Navigate to={!isAuthenticated ? "/signin" : "/onboarding"} />
              )
            }
          />
          <Route
            path="/change-password"
            element={
              isAuthenticated && isOnboarded ? (
                <MainLayout>
                  <ChangePasswordPage />
                </MainLayout>
              ) : (
                <Navigate to={!isAuthenticated ? "/signin" : "/onboarding"} />
              )
            }
          />

          <Route
            path="/onboarding"
            element={
              isAuthenticated ? (
                !isOnboarded ? (
                  <OnboardingPage />
                ) : (
                  <Navigate to={"/"} />
                )
              ) : (
                <Navigate to={"/signin"} />
              )
            }
          />
          <Route
            path="/signup"
            element={
              !isAuthenticated ? (
                <SignUpPage />
              ) : (
                <Navigate to={!isOnboarded ? "/onboarding" : "/"} />
              )
            }
          />
          <Route
            path="/signin"
            element={
              !isAuthenticated ? (
                <LoginPage />
              ) : (
                <Navigate to={!isOnboarded ? "/onboarding" : "/"} />
              )
            }
          />
          <Route
            path="/forgot-password"
            element={
              !isAuthenticated ? (
                <ForgotPasswordPage />
              ) : (
                <Navigate to={!isOnboarded ? "/onboarding" : "/"} />
              )
            }
          />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontSize: "14px",
              minHeight: "48px",
              padding: "8px 16px",
            },
          }}
          gutter={8}
        />
      </div>
    </>
  );
};

export default App;
