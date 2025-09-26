"use client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import {
  Badge,
  BellIcon,
  Hexagon,
  LoaderIcon,
  MessageCircle,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const Sidebar = () => {
  const t = useTranslations("Sidebar");
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

  const pathname = usePathname();
  const currentPath = pathname || "/";
  const isChatPage = pathname?.includes("/chat");
  const isProfilePage = pathname?.includes("/profile");
  const isChangePasswordPage = pathname?.includes("/change-password");

  const [windowWidth, setWindowWidth] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth;
    return 0;
  });

  const [totalUnseenMessages, setTotalUnseenMessages] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
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
      <aside className="w-20 lg:w-64 bg-base-200 border-r border-base-300 flex flex-col h-screen sticky top-0">
        <div className="w-full px-4 lg:px-8 h-16 border-b border-base-300 flex items-center justify-center lg:justify-start">
          {!isProfilePage && !isChatPage && !isChangePasswordPage ? (
            windowWidth > 1024 ? (
              <div className="relative -left-[2px]">
                <Link href="/" className="flex items-center gap-2.5">
                  <Hexagon className="size-6 text-primary" />
                  <span className="text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                    Chatify
                  </span>
                </Link>
              </div>
            ) : (
              <div className="">
                <Link href="/" className="flex items-center gap-2.5">
                  <Hexagon className="size-8 text-primary" />
                </Link>
              </div>
            )
          ) : null}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link
            href="/"
            className={`btn btn-ghost flex justify-center items-center lg:justify-start w-full px-0 lg:gap-4 lg:px-4 normal-case  ${
              currentPath === "/" ? "btn-active" : "hover:bg-base-300"
            }`}
          >
            <Badge className="!size-5 text-base-content opacity-70" />
            {!isProfilePage && !isChatPage && !isChangePasswordPage ? (
              <span className="hidden lg:block">{t("pages.home")}</span>
            ) : null}
          </Link>
          <Link
            href="/friends"
            className={`btn btn-ghost flex justify-center items-center lg:justify-start w-full px-0 lg:gap-4 lg:px-4 normal-case ${
              currentPath === "/friends" ? "btn-active" : "hover:bg-base-300"
            }`}
          >
            {/* <UsersRound /> */}
            <UsersRound className="size-5 text-base-content opacity-70" />
            {!isProfilePage && !isChatPage && !isChangePasswordPage ? (
              <span className="hidden lg:block">{t("pages.friends")}</span>
            ) : null}
          </Link>
          <Link
            href="/chats"
            className={`relative btn btn-ghost flex justify-center items-center lg:justify-start w-full px-0 lg:gap-4 lg:px-4 normal-case ${
              currentPath === "/chats" ? "btn-active" : "hover:bg-base-300"
            }`}
          >
            <MessageCircle className="size-5 text-base-content opacity-70" />
            {!isProfilePage && !isChatPage && !isChangePasswordPage ? (
              <span className="hidden lg:block">{t("pages.chats")}</span>
            ) : null}
            {isGettingConversations ? (
              <div className="absolute right-[2px] top-[2px] lg:right-[14px] lg:top-1/2 lg:transform lg:-translate-y-1/2">
                <LoaderIcon className="size-3 animate-spin" />
              </div>
            ) : (
              totalUnseenMessages > 0 && (
                <div className="absolute right-1 -top-0 lg:right-4 lg:top-1/2 lg:transform lg:-translate-y-1/2">
                  <span className="size-2 rounded-full bg-primary inline-block opacity-100" />
                </div>
              )
            )}
          </Link>
          <Link
            href="/notifications"
            className={`relative btn btn-ghost flex justify-center items-center lg:justify-start w-full px-0 lg:gap-4 lg:px-4 normal-case ${
              currentPath === "/notifications"
                ? "btn-active"
                : "hover:bg-base-300"
            }`}
          >
            <BellIcon className="size-5 text-base-content opacity-70" />
            {!isProfilePage && !isChatPage && !isChangePasswordPage ? (
              <span className="hidden lg:block">
                {t("pages.notifications")}
              </span>
            ) : null}
            {totalNotificationQuantity + totalIncomingRequestQuantity > 0 && (
              <div className="absolute right-1 -top-0 lg:right-4 lg:top-1/2 lg:transform lg:-translate-y-1/2">
                <span className="size-2 rounded-full bg-primary inline-block opacity-100" />
              </div>
            )}
          </Link>
        </nav>

        {/* USER PROFILE SECTION */}
        <div className="h-16 border-t border-base-300 mt-auto flex items-center justify-center lg:justify-start px-4">
          <div className="flex items-center gap-3 relative">
            <div className="avatar">
              <div className="w-10 rounded-full">
                <Image
                  src={
                    authUser?.user?.profile?.profilePic ||
                    "https://avatar.iran.liara.run/public/20.png"
                  }
                  alt=""
                  rel="noreferrer"
                  width={40}
                  height={40}
                />
              </div>
            </div>
            <div className="absolute -right-0 -bottom-0 lg:hidden">
              <span className="size-2 rounded-full bg-success inline-block" />
            </div>
            {!isProfilePage && !isChatPage && !isChangePasswordPage ? (
              <div className="hidden lg:block">
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
