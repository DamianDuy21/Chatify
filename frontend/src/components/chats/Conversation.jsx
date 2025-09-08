import { useEffect, useRef, useState } from "react";
import Message from "./Message";
import { useChatStore } from "../../stores/useChatStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { LoaderIcon } from "lucide-react";
import { markAllMessagesAsSeenAPI } from "../../lib/api";

const Conversation = ({ translatedTo }) => {
  const authUser = useAuthStore((s) => s.authUser);
  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const isChatbotResponding = useChatStore((s) => s.isChatbotResponding);

  const [openedMessages, setOpenedMessages] = useState(-1);
  const messages = selectedConversation?.messages || [];
  const messagesRefs = useRef([]);
  const scrollRef = useRef();
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideAnyMessage = messagesRefs.current.some(
        (ref) => ref && ref.contains(event.target)
      );

      if (!clickedInsideAnyMessage) {
        setOpenedMessages(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    markAllMessagesAsSeenAPI(selectedConversation?.conversation?._id);
  }, [selectedConversation?.conversation?._id]);

  return (
    <>
      <div className="flex flex-col gap-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start justify-${
              msg?.sender?._id === authUser?.user?._id ? "end" : "start"
            } h-full gap-2`}
          >
            <Message
              ref={(el) => (messagesRefs.current[index] = el)}
              side={msg?.sender?._id === authUser?.user?._id ? "right" : "left"}
              message={msg}
              isOpen={openedMessages === index}
              onToggle={() =>
                setOpenedMessages((prev) => (prev === index ? -1 : index))
              }
              translatedTo={translatedTo}
            />
          </div>
        ))}

        {isChatbotResponding && (
          <div
            key={"chatbot-response"}
            className={`flex items-start justify-start h-full gap-2`}
          >
            <div className={`avatar`}>
              <div className="w-10 rounded-full bg-primary"></div>
            </div>
            <div
              className={`flex flex-col gap-2 max-w-[max-content] ${"items-start"}`}
            >
              <div className="flex flex-col">
                <div className={`flex items-center gap-2 ${"ml-auto"}`}>
                  <div className={`flex flex-col gap-1`}>
                    <div className="!w-[fit-content] bg-base-300 px-4 py-3 rounded-btn flex flex-col gap-2 cursor-pointer relative group">
                      <LoaderIcon className="size-4 animate-spin" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div ref={scrollRef} className=""></div>
    </>
  );
};

export default Conversation;
