"use client";
import Message from "@/components/chats/Message";
import { ChevronsDown, ChevronsUp, LoaderIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { GroupedVirtuoso } from "react-virtuoso";
import useCalm from "../../hooks/useCalm";
import { formatISOToParts } from "../../lib/utils";
import { useAuthStore } from "../../stores/useAuthStore";
import { useChatStore } from "../../stores/useChatStore";
import CommonRoundedButton from "../buttons/CommonRoundedButton";
import { showToast } from "../costumed/CostumedToast";

const getSenderId = (m) => m?.sender?._id ?? m?.message?.senderId ?? null;

// nếu muốn giữ phần react và dịch thì phải thêm thông tin đó vào đúng message đó trong global state
// vì mình dùng virtuoso nên nó không lưu lại trên dom. nhưng tạm thời thôi

// yyyy-mm-dd
const toDateKeyTZ = (iso, timeZone = "Asia/Bangkok") =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));

const Conversation = ({ translatedTo }) => {
  const t = useTranslations("Components.conversation");
  const authUser = useAuthStore((s) => s.authUser);
  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const isChatbotResponding = useChatStore((s) => s.isChatbotResponding);
  const getMessages = useChatStore((s) => s.getMessages);
  const isGettingMessages = useChatStore((s) => s.isGettingMessages);

  const [openedIndex, setOpenedIndex] = useState(-1);
  const [isAtTop, setIsAtTop] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const virtuosoRef = useRef(null);
  const didMountRef = useRef(false);

  const messages = selectedConversation?.messages || [];

  const data = useMemo(() => {
    return isChatbotResponding &&
      selectedConversation?.conversation?.type === "chatbot"
      ? [...messages, { __typing: true, _id: "__typing" }]
      : messages;
  }, [messages, isChatbotResponding]);

  const { groupsSorted, groupCounts, flat } = useMemo(() => {
    if (!data.length) return { groupsSorted: [], groupCounts: [], flat: [] };

    const todayKey = toDateKeyTZ(new Date().toISOString());
    const lastReal = [...data].reverse().find((m) => !m.__typing);
    const lastKey = lastReal
      ? toDateKeyTZ(lastReal?.message?.createdAt)
      : todayKey;

    const getKey = (m) => {
      if (m.__typing) return lastKey || todayKey;
      return toDateKeyTZ(m?.message?.createdAt);
    };

    const map = new Map();
    data.forEach((m) => {
      const k = getKey(m);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(m);
    });

    const groups = [...map.entries()]
      .map(([key, items]) => ({ key, items }))
      .sort((a, b) => a.key.localeCompare(b.key));

    const counts = groups.map((g) => g.items.length);
    const flatArr = groups.flatMap((g) => g.items);

    return { groupsSorted: groups, groupCounts: counts, flat: flatArr };
  }, [data]);

  const handleGetMessages = async () => {
    try {
      getMessages({
        conversationId: selectedConversation.conversation._id,
        lastMessageId: data[0].message._id,
      });
    } catch (error) {
      showToast({
        type: "error",
        message: t("toast.getMessages.error"),
      });
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    if (!virtuosoRef.current) return;

    if (!didMountRef.current) {
      didMountRef.current = true;
    }

    virtuosoRef.current.scrollToIndex({
      index: Math.max(flat.length - 1, 0),
      align: "end",
      behavior: "smooth", // 'auto' or 'smooth'
    });
  }, [selectedConversation?.conversation?._id]);

  const isCalm = useCalm([selectedConversation?.conversation?._id], 1000);

  const isMine = (m) => m?.sender?._id === authUser?.user?._id;

  const lastIndex = Math.max(flat.length - 1, 0);

  return (
    <div
      className="w-full h-full relative"
      onMouseDown={() => setOpenedIndex(-1)}
    >
      <div
        className={`${
          selectedConversation.currentMessagePage <
            selectedConversation.totalMessagePageQuantity &&
          isAtTop &&
          isCalm
            ? "absolute"
            : "hidden"
        } top-8 left-1/2 -translate-x-1/2 z-[1]`}
      >
        <CommonRoundedButton
          onClick={handleGetMessages}
          className={`${
            isGettingMessages ? "pointer-events-none opacity-70" : ""
          } rounded-full`}
          type="secondary"
        >
          {isGettingMessages ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : (
            <ChevronsUp className="size-4" />
          )}
        </CommonRoundedButton>
      </div>

      <div
        className={`${
          showScrollBottomBtn && isCalm ? "absolute" : "hidden"
        } bottom-0 left-1/2 -translate-x-1/2 z-[1]`}
      >
        <CommonRoundedButton
          onClick={() =>
            virtuosoRef.current?.scrollToIndex({
              index: Math.max(flat.length - 1, 0),
              align: "end",
              behavior: "smooth",
            })
          }
          className={`rounded-full`}
          type="secondary"
        >
          <ChevronsDown className="size-4" />
        </CommonRoundedButton>
      </div>

      <GroupedVirtuoso
        ref={virtuosoRef}
        // initialTopMostItemIndex={Math.max(flat.length - 1, 0)}
        followOutput="smooth"
        computeItemKey={(i) => flat[i]?._id ?? `idx-${i}`}
        atTopStateChange={(atTop) => setIsAtTop(atTop)} // for the load more message button
        atBottomStateChange={(atBottom) => setIsAtBottom(atBottom)} // for the scroll to bottom button
        rangeChanged={({ startIndex, endIndex }) => {
          if (startIndex == null || endIndex == null) return;

          const lastVisible = startIndex <= lastIndex && lastIndex <= endIndex;

          setShowScrollBottomBtn(!lastVisible && flat.length > 0);
        }}
        groupCounts={groupCounts}
        groupContent={(groupIndex) => {
          const key = groupsSorted[groupIndex]?.key;
          const label = formatISOToParts(key).date;
          return (
            <div className="sticky top-0 z-10 flex items-center gap-4 py-2 bg-base-100 backdrop-blur">
              <div className="flex-1 h-px border-t border-base-300" />
              <span className="mx-4 text-xs opacity-70">{label}</span>
              <div className="flex-1 h-px border-t border-base-300" />
            </div>
          );
        }}
        itemContent={(index) => {
          const item = flat[index];
          const isFirst = index === 0;
          const isLast = index === flat.length - 1;
          const padClass = isFirst ? "pb-1" : isLast ? "pt-1" : "py-1";

          if (item?.__typing) {
            return (
              <div className={`${padClass} flex items-start gap-2`}>
                <div className="avatar">
                  <div className="w-10 rounded-full bg-primary" />
                </div>
                <div className="!w-[fit-content] bg-base-300 px-4 py-3 rounded-btn">
                  <LoaderIcon className="size-4 animate-spin" />
                </div>
              </div>
            );
          }

          const prev = index > 0 ? flat[index - 1] : undefined;
          const next = index < flat.length - 1 ? flat[index + 1] : undefined;

          const currSender = getSenderId(item);
          const prevSender = prev && !prev.__typing ? getSenderId(prev) : null;
          const nextSender = next && !next?.__typing ? getSenderId(next) : null;

          const currDate = formatISOToParts(item?.message?.createdAt).date;
          const prevDate = prev
            ? formatISOToParts(prev?.message?.createdAt).date
            : null;
          const nextDate =
            next && !next.__typing
              ? formatISOToParts(next?.message?.createdAt).date
              : null;

          const isGroupHead =
            isFirst || prev?.__typing || prevSender !== currSender;

          const isGroupTail =
            isLast || next?.__typing || nextSender !== currSender;

          const mine = isMine(item);

          return (
            <div className={`${padClass}`}>
              <div
                onMouseDown={(e) => e.stopPropagation()}
                className={`flex ${
                  mine ? "justify-end" : "justify-start"
                } gap-2`}
              >
                <Message
                  side={mine ? "right" : "left"}
                  message={item}
                  isOpen={openedIndex === index}
                  onToggle={() =>
                    setOpenedIndex((prev) => (prev === index ? -1 : index))
                  }
                  translatedTo={translatedTo}
                  isShowAvatar={isGroupHead || currDate !== prevDate}
                  isShowTime={isGroupTail || currDate !== nextDate}
                />
              </div>
            </div>
          );
        }}
      />
    </div>
  );
};

export default Conversation;
