import {
  Badge,
  BellIcon,
  ChevronLeft,
  ChevronRight,
  Hexagon,
  LoaderIcon,
  MessageCircle,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { useAuthStore } from "../../stores/useAuthStore";
import { useChatStore } from "../../stores/useChatStore";
import { useNotificationStore } from "../../stores/useNotificationStore";
import CommonRoundedButton from "../buttons/CommonRoundedButton";

const Sidebar = () => {
  const authUser = useAuthStore((s) => s.authUser);
  const conversations = useChatStore((s) => s.conversations);
  const isGettingConversations = useChatStore((s) => s.isGettingConversations);
  const conversationsHaveUnSeenMessages = useChatStore(
    (s) => s.conversationsHaveUnSeenMessages
  );

  // unseen notifications
  const totalNotificationQuantity = useNotificationStore(
    (s) => s.totalNotificationQuantity
  );
  const totalIncomingRequestQuantity = useNotificationStore(
    (s) => s.totalIncomingRequestQuantity
  );

  const { t } = useTranslation("sidebar");
  const location = useLocation();
  const currentPath = location.pathname;

  const isChatPage = location.pathname?.includes("/chat");
  const isProfilePage = location.pathname?.includes("/profile");
  const isChangePasswordPage = location.pathname?.includes("/change-password");

  const [totalUnseenMessages, setTotalUnseenMessages] = useState(0);
  const [isOpenSidebarInSmallScreen, setIsOpenSidebarInSmallScreen] =
    useState(false);

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;

      if (windowWidth > 1024) {
        setIsOpenSidebarInSmallScreen(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const unseenCount = conversations.reduce((total, conv) => {
      return total + (conv.unSeenMessageQuantity || 0);
    }, 0);
    setTotalUnseenMessages(
      unseenCount + conversationsHaveUnSeenMessages.length
    );
  }, [conversations]);

  return (
    <>
      <aside
        className={`h-screen w-20 z-50 lg:w-64 ${
          isOpenSidebarInSmallScreen ? "!w-64 !absolute top-0 left-0 z-50" : ""
        } bg-base-200 border-r border-base-300 flex flex-col sticky top-0`}
      >
        <div
          className={`w-full px-4 lg:px-8 lg:justify-start ${
            isOpenSidebarInSmallScreen ? "!px-8 !justify-start" : ""
          } h-16 border-b border-base-300 flex items-center justify-center`}
        >
          {!isProfilePage && !isChatPage && !isChangePasswordPage ? (
            <>
              <div
                className={`relative -left-[2px] hidden lg:block ${
                  isOpenSidebarInSmallScreen ? "!block" : ""
                }`}
              >
                <Link href="/" className="flex items-center gap-2.5">
                  <Hexagon className="size-6 text-primary" />
                  <span className="text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                    Chatify
                  </span>
                </Link>
              </div>

              <div
                className={`block lg:hidden ${
                  isOpenSidebarInSmallScreen ? "!hidden" : ""
                }`}
              >
                <Link href="/" className="flex items-center gap-2.5">
                  <Hexagon className="size-8 text-primary" />
                </Link>
              </div>
            </>
          ) : null}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="flex lg:hidden items-center mb-2">
            {!isOpenSidebarInSmallScreen ? (
              <CommonRoundedButton
                onClick={() => {
                  setIsOpenSidebarInSmallScreen(true);
                }}
                className={"mx-auto"}
              >
                <ChevronRight className="size-4" />
              </CommonRoundedButton>
            ) : (
              <CommonRoundedButton
                onClick={() => {
                  setIsOpenSidebarInSmallScreen(false);
                }}
                className={"mx-auto"}
              >
                <ChevronLeft className="size-4" />
              </CommonRoundedButton>
            )}
          </div>

          <Link
            to="/"
            className={`btn btn-ghost flex justify-center items-center lg:justify-start lg:gap-4 lg:px-4 ${
              isOpenSidebarInSmallScreen ? "!justify-start !gap-4 !px-4" : ""
            } w-full px-0 normal-case ${
              currentPath === "/" ? "btn-active" : "hover:bg-base-300"
            }`}
          >
            <Badge className="!size-5 text-base-content opacity-70" />
            {!isProfilePage && !isChatPage && !isChangePasswordPage ? (
              <span
                className={`hidden lg:block ${
                  isOpenSidebarInSmallScreen ? "!block" : ""
                }`}
              >
                {t("pages.home")}
              </span>
            ) : null}
          </Link>
          <Link
            to="/friends"
            className={`btn btn-ghost flex justify-center items-center lg:justify-start lg:gap-4 lg:px-4 ${
              isOpenSidebarInSmallScreen ? "!justify-start !gap-4 !px-4" : ""
            } w-full px-0 normal-case ${
              currentPath === "/friends" ? "btn-active" : "hover:bg-base-300"
            }`}
          >
            {/* <UsersRound /> */}
            <UsersRound className="size-5 text-base-content opacity-70" />
            {!isProfilePage && !isChatPage && !isChangePasswordPage ? (
              <span
                className={`hidden lg:block ${
                  isOpenSidebarInSmallScreen ? "!block" : ""
                }`}
              >
                {t("pages.friends")}
              </span>
            ) : null}
          </Link>
          <Link
            to="/chats"
            className={`relative btn btn-ghost flex justify-center items-center lg:justify-start lg:gap-4 lg:px-4 ${
              isOpenSidebarInSmallScreen ? "!justify-start !gap-4 !px-4" : ""
            } w-full px-0 normal-case ${
              currentPath === "/chats" ? "btn-active" : "hover:bg-base-300"
            }`}
          >
            <MessageCircle className="size-5 text-base-content opacity-70" />
            {!isProfilePage && !isChatPage && !isChangePasswordPage ? (
              <span
                className={`hidden lg:block ${
                  isOpenSidebarInSmallScreen ? "!block" : ""
                }`}
              >
                {t("pages.chats")}
              </span>
            ) : null}
            {isGettingConversations ? (
              <div
                className={`absolute right-[2px] top-[2px] lg:right-[14px] lg:top-1/2 lg:transform lg:-translate-y-1/2 
               ${
                 isOpenSidebarInSmallScreen
                   ? "!right-[14px] !top-1/2 !transform !-translate-y-1/2 "
                   : ""
               }
               `}
              >
                <LoaderIcon className="size-3 animate-spin" />
              </div>
            ) : (
              totalUnseenMessages > 0 && (
                <div
                  className={`absolute right-1 -top-0 lg:right-4 lg:top-1/2 lg:transform lg:-translate-y-1/2
                  ${
                    isOpenSidebarInSmallScreen
                      ? "!right-4 !top-1/2 !transform !-translate-y-1/2"
                      : ""
                  }
                `}
                >
                  <span className="size-2 rounded-full bg-primary inline-block opacity-100" />
                </div>
              )
            )}
          </Link>
          <Link
            to="/notifications"
            className={`relative btn btn-ghost flex justify-center items-center lg:justify-start lg:gap-4 lg:px-4 ${
              isOpenSidebarInSmallScreen ? "!justify-start !gap-4 !px-4" : ""
            } w-full px-0 normal-case ${
              currentPath === "/notifications"
                ? "btn-active"
                : "hover:bg-base-300"
            }`}
          >
            <BellIcon className="size-5 text-base-content opacity-70" />
            {!isProfilePage && !isChatPage && !isChangePasswordPage ? (
              <span
                className={`hidden lg:block ${
                  isOpenSidebarInSmallScreen ? "!block" : ""
                }`}
              >
                {t("pages.notifications")}
              </span>
            ) : null}
            {totalNotificationQuantity + totalIncomingRequestQuantity > 0 && (
              <div
                className={`absolute right-1 -top-0 lg:right-4 lg:top-1/2 lg:transform lg:-translate-y-1/2
              ${
                isOpenSidebarInSmallScreen
                  ? "!right-4 !top-1/2 !transform !-translate-y-1/2"
                  : ""
              }
              `}
              >
                <span className="size-2 rounded-full bg-primary inline-block opacity-100" />
              </div>
            )}
          </Link>
        </nav>

        {/* USER PROFILE SECTION */}
        <div
          className={`relative h-16 border-t border-base-300 mt-auto flex items-center justify-center lg:justify-between ${
            isOpenSidebarInSmallScreen ? "!justify-between" : ""
          } px-4`}
        >
          <div className="flex items-center gap-3 relative">
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img
                  src={
                    authUser?.user?.profile?.profilePic ||
                    "https://avatar.iran.liara.run/public/20.png"
                  }
                  alt=""
                />
              </div>
            </div>
            <div
              className={`absolute -right-0 -bottom-0 lg:hidden ${
                isOpenSidebarInSmallScreen ? "!hidden" : ""
              }`}
            >
              <span className="size-2 rounded-full bg-success inline-block" />
            </div>
            {!isProfilePage && !isChatPage && !isChangePasswordPage ? (
              <div
                className={`hidden lg:block ${
                  isOpenSidebarInSmallScreen ? "!block" : ""
                }`}
              >
                <p className="font-semibold text-sm">
                  {authUser?.user?.fullName}
                </p>
                <p className="text-xs text-success flex items-center gap-1">
                  <span className="size-2 rounded-full bg-success inline-block" />
                  {t("user.status.online")}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
