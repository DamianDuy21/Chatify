import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router";
import CommonPageLoader from "./components/loaders/CommonPageLoader.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import CallPage from "./pages/CallPage.jsx";
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
import { useAuthStore } from "./stores/useAuthStore.js";
import { useChatStore } from "./stores/useChatStore.js";
import { useLanguageStore } from "./stores/useLanguageStore.js";
import { useThemeStore } from "./stores/useThemeStore.js";

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
  const getTotalConversationQuantityAboveFilter = useChatStore(
    (s) => s.getTotalConversationQuantityAboveFilter
  );
  const setConversationNameFilter = useChatStore(
    (s) => s.setConversationNameFilter
  );
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );

  const socket = useAuthStore((s) => s.socket);

  const getLanguages = useLanguageStore((s) => s.getLanguages);

  const { theme } = useThemeStore();

  const isAuthenticated = Boolean(authUser);

  const isOnboarding = authUser?.user?.isOnboarded;

  useEffect(() => {
    checkAuthAuthStore();
  }, [checkAuthAuthStore]);

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  useEffect(() => {
    if (!authUser) {
      setConversations([]);
    }
    if (authUser) {
      getTotalConversationQuantityAboveFilter();
    }
    setConversationNameFilter("");
    setSelectedConversation(null);
  }, [authUser]);

  useEffect(() => {
    getLanguages();
  }, [getLanguages]);

  useEffect(() => {
    if (!socket) return;
    subscribeToMessages();
    return () => {
      unsubscribeFromMessages();
    };
  }, [socket]);

  if (isGettingAuthUser) {
    return <CommonPageLoader />;
  }

  return (
    <>
      <div className="min-h-screen" data-theme={theme}>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated && isOnboarding ? (
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
              isAuthenticated && isOnboarding ? (
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
              isAuthenticated && isOnboarding ? (
                <CallPage />
              ) : (
                <Navigate to={!isAuthenticated ? "/signin" : "/onboarding"} />
              )
            }
          />
          <Route
            path="/notifications"
            element={
              isAuthenticated && isOnboarding ? (
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
              isAuthenticated && isOnboarding ? (
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
              isAuthenticated && isOnboarding ? (
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
              isAuthenticated && isOnboarding ? (
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
                !isOnboarding ? (
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
                <Navigate to={!isOnboarding ? "/onboarding" : "/"} />
              )
            }
          />
          <Route
            path="/signin"
            element={
              !isAuthenticated ? (
                <LoginPage />
              ) : (
                <Navigate to={!isOnboarding ? "/onboarding" : "/"} />
              )
            }
          />
          <Route
            path="/forgot-password"
            element={
              !isAuthenticated ? (
                <ForgotPasswordPage />
              ) : (
                <Navigate to={!isOnboarding ? "/onboarding" : "/"} />
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
