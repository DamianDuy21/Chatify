"use client";
import { getUserTooltipStatusClient } from "@/lib/utils";
import { setUserTooltipStatus } from "@/services/locale";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import {
  Badge,
  BellIcon,
  Hexagon,
  Lightbulb,
  LoaderIcon,
  MessageCircle,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import CommonRoundedButton from "../buttons/CommonRoundedButton";

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

  const tooltipStatus = getUserTooltipStatusClient();
  // show in small screen
  const [isShowTooltip, setIsShowTooltip] = useState(false);
  const [isClickAvatarToShowTooltip, setIsClickAvatarToShowTooltip] =
    useState(false);

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

  useEffect(() => {
    if (!(isShowTooltip && isClickAvatarToShowTooltip)) return;

    const t = setTimeout(() => {
      setIsShowTooltip(false);
      setIsClickAvatarToShowTooltip(false);
    }, 2000);

    return () => clearTimeout(t);
  }, [isShowTooltip, isClickAvatarToShowTooltip]);

  return (
    <>
      <aside className="h-screen w-20 z-50 lg:w-64 bg-base-200 border-r border-base-300 flex flex-col sticky top-0">
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
          {/* HOME */}
          <Link
            href="/"
            data-tooltip-id="tip-nav-home"
            data-tooltip-content={t("pages.home")}
            className={`btn btn-ghost flex justify-center items-center lg:justify-start w-full px-0 lg:gap-4 lg:px-4 normal-case ${
              currentPath === "/" ? "btn-active" : "hover:bg-base-300"
            }`}
          >
            <Badge className="!size-5 text-base-content opacity-70" />
            {!isProfilePage && !isChatPage && !isChangePasswordPage ? (
              <span className="hidden lg:block">{t("pages.home")}</span>
            ) : null}
          </Link>
          {tooltipStatus === "on" && (
            <Tooltip
              id="tip-nav-home"
              place="right-start"
              offset={8}
              delayShow={100}
              delayHide={80}
              className={`!pointer-events-none !rounded-card !border !border-primary/25
                      !bg-base-100 !h-8 !px-3 !text-xs !text-base-content
                      !shadow-none !whitespace-nowrap !z-[999999999] lg:!hidden`}
            />
          )}

          {/* FRIENDS */}
          <Link
            href="/friends"
            data-tooltip-id="tip-nav-friends"
            data-tooltip-content={t("pages.friends")}
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
          {tooltipStatus === "on" && (
            <Tooltip
              id="tip-nav-friends"
              place="right-start"
              offset={8}
              delayShow={100}
              delayHide={80}
              className={`!pointer-events-none !rounded-card !border !border-primary/25
                      !bg-base-100 !h-8 !px-3 !text-xs !text-base-content
                      !shadow-none !whitespace-nowrap !z-[999999999] lg:!hidden`}
            />
          )}

          {/* CHATS */}
          <Link
            href="/chats"
            data-tooltip-id="tip-nav-chats"
            data-tooltip-content={t("pages.chats")}
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
          {tooltipStatus === "on" && (
            <Tooltip
              id="tip-nav-chats"
              place="right-start"
              offset={8}
              delayShow={100}
              delayHide={80}
              className={`!pointer-events-none !rounded-card !border !border-primary/25
                      !bg-base-100 !h-8 !px-3 !text-xs !text-base-content
                      !shadow-none !whitespace-nowrap !z-[999999999] lg:!hidden`}
            />
          )}
          {/* NOTIFICATIONS */}
          <Link
            href="/notifications"
            data-tooltip-id="tip-nav-notifications"
            data-tooltip-content={t("pages.notifications")}
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
          {tooltipStatus === "on" && (
            <Tooltip
              id="tip-nav-notifications"
              place="right-start"
              offset={8}
              delayShow={100}
              delayHide={80}
              className={`!pointer-events-none !rounded-card !border !border-primary/25
                      !bg-base-100 !h-8 !px-3 !text-xs !text-base-content
                      !shadow-none !whitespace-nowrap !z-[999999999] lg:!hidden`}
            />
          )}
        </nav>

        {/* USER PROFILE SECTION */}
        <div className="relative h-16 border-t border-base-300 mt-auto flex items-center justify-center lg:justify-between px-4">
          <div
            className={`${
              isShowTooltip ? "hidden" : ""
            } flex items-center gap-3 relative cursor-pointer lg:cursor-default`}
            onClick={() => {
              setIsShowTooltip(true);
              setIsClickAvatarToShowTooltip(true);
            }}
          >
            <div className="avatar">
              <div className="w-10 rounded-full">
                <Image
                  // src={
                  //   authUser?.user?.profile?.profilePic ||
                  //   "https://avatar.iran.liara.run/public/20.png"
                  // }
                  src={
                    authUser?.user?.profile?.profilePic
                      ? `/images/avatar/${authUser?.user?.profile?.profilePic}.png`
                      : `/images/avatar/1.png`
                  }
                  alt="avatar"
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
          {isShowTooltip && (
            <CommonRoundedButton
              className={`!bg-transparent`}
              onClick={() => {
                setUserTooltipStatus(tooltipStatus === "on" ? "off" : "on");
                setIsClickAvatarToShowTooltip(false);
                setTimeout(() => setIsShowTooltip(false), 2000);
              }}
              type="ghost"
              tooltip={{
                isShowTooltip: true,
                positionTooltip: "top-end",
                classNameTooltip: "",
                idTooltip: "tooltip",
                contentTooltip: t("tooltip.turnOffTooltip"),
                offsetTooltip: 2,
              }}
            >
              {tooltipStatus === "on" ? (
                <Lightbulb
                  className="
                size-4
                [&_path]:fill-primary 
                !text-primary      
              "
                />
              ) : (
                <Lightbulb
                  className="
                size-4
                !text-base-content
                [&_path]:stroke-current                 
                [&_path]:fill-transparent              
                  
              "
                />
              )}
            </CommonRoundedButton>
          )}

          <CommonRoundedButton
            className={`hidden lg:flex !bg-transparent`}
            onClick={() => {
              setUserTooltipStatus(tooltipStatus === "on" ? "off" : "on");
              setIsClickAvatarToShowTooltip(false);
              setTimeout(() => setIsShowTooltip(false), 2000);
            }}
            type="ghost"
            tooltip={{
              isShowTooltip: true,
              positionTooltip: "top-end",
              classNameTooltip: "",
              idTooltip: "tooltip",
              contentTooltip: t("tooltip.turnOffTooltip"),
              offsetTooltip: 2,
            }}
          >
            {tooltipStatus === "on" ? (
              <Lightbulb
                className="
                size-4
                [&_path]:fill-primary 
                !text-primary      
              "
              />
            ) : (
              <Lightbulb
                className="
                size-4
                !text-base-content
                [&_path]:stroke-current                 
                [&_path]:fill-transparent              
                  
              "
              />
            )}
          </CommonRoundedButton>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
