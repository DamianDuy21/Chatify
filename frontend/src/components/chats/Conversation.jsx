import { ChevronsUp, LoaderIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import useCalm from "../../hooks/useCalm";
import { useAuthStore } from "../../stores/useAuthStore";
import { useChatStore } from "../../stores/useChatStore";
import CommonRoundedButton from "../buttons/CommonRoundedButton";
import Message from "./Message";

const getSenderId = (m) => m?.sender?._id ?? m?.message?.senderId ?? null;

// nếu muốn giữ phần react và dịch thì phải thêm thông tin đó vào đúng message đó trong global state
// vì mình dùng virtuoso nên nó không lưu lại trên dom. nhưng tạm thời thôi

const Conversation = ({ translatedTo }) => {
  const authUser = useAuthStore((s) => s.authUser);
  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const isChatbotResponding = useChatStore((s) => s.isChatbotResponding);
  const getMessages = useChatStore((s) => s.getMessages);
  const isGettingMessages = useChatStore((s) => s.isGettingMessages);

  const [openedIndex, setOpenedIndex] = useState(-1);
  const [isFirstVisible, setIsFirstVisible] = useState(false);
  const virtuosoRef = useRef(null);

  const messages = selectedConversation?.messages || [];

  const data = useMemo(() => {
    return isChatbotResponding
      ? [...messages, { __typing: true, _id: "__typing" }]
      : messages;
  }, [messages, isChatbotResponding]);

  const isCalm = useCalm([selectedConversation?.conversation?._id], 1000);

  const isMine = (m) => m?.sender?._id === authUser?.user?._id;

  console.log(data);

  return (
    <div
      className="w-full h-full relative"
      onMouseDown={() => setOpenedIndex(-1)}
    >
      <div
        className={`${
          selectedConversation.currentMessagePage <
            selectedConversation.totalMessagePageQuantity &&
          isFirstVisible &&
          isCalm
            ? "absolute"
            : "hidden"
        } top-0 left-1/2 -translate-x-1/2 z-10 `}
      >
        <CommonRoundedButton
          onClick={() => {
            getMessages({
              conversationId: selectedConversation.conversation._id,
              lastMessageId: data[0].message._id,
            });
          }}
          className={`${
            isGettingMessages ? "pointer-events-none" : ""
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
      <Virtuoso
        ref={virtuosoRef}
        data={data}
        initialTopMostItemIndex={Math.max(data.length - 1, 0)}
        followOutput="smooth"
        computeItemKey={(index, item) => item?._id ?? `idx-${index}`}
        atTopStateChange={(atTop) => setIsFirstVisible(atTop)}
        itemContent={(index, item) => {
          const isFirst = index === 0;
          const isLast = index === data.length - 1;
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

          const prev = index > 0 ? data[index - 1] : undefined;
          const next = index < data.length - 1 ? data[index + 1] : undefined;

          const currSender = getSenderId(item);
          const prevSender = prev && !prev.__typing ? getSenderId(prev) : null;
          const nextSender = next && !next?.__typing ? getSenderId(next) : null;

          const isGroupHead =
            isFirst || prev?.__typing || prevSender !== currSender;
          const isGroupTail =
            isLast || next?.__typing || nextSender !== currSender;

          const mine = isMine(item);

          return (
            <div className={`${padClass}`}>
              <div
                onMouseDown={(e) => e.stopPropagation()}
                className={` flex ${
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
                  isShowAvatar={isGroupHead}
                  isShowTime={isGroupTail}
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
