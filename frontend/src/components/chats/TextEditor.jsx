import { File, Forward, LoaderIcon, Smile, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatFileSize,
  getFileExtension,
  getLocaleById,
} from "../../lib/utils";
import { useChatStore } from "../../stores/useChatStore";
import CommonRoundedButton from "../buttons/CommonRoundedButton";
import CostumedEmojiPicker from "../costumed/CostumedEmojiPicker";
import CostumedModal from "../costumed/CostumedModal";

const TextEditor = ({
  text,
  setText,
  handleEmojiSelect,
  pendingFile,
  setPendingFile,
}) => {
  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const sendMessageChatbot = useChatStore((s) => s.sendMessageChatbot);
  const isSendingMessage = useChatStore((s) => s.isSendingMessage);
  const lastFileInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const inputRef = useRef(null);
  const sendBtnRef = useRef(null);

  const isChatbotResponding = useChatStore((s) => s.isChatbotResponding);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (!files || files.length === 0) return;

    const newItems = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPendingFile((prev) => [...prev, ...newItems]);

    event.target.value = null;

    if (lastFileInputRef.current) {
      const timeout = setTimeout(() => {
        if (lastFileInputRef.current) {
          lastFileInputRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  };

  const handleRemoveFile = (index) => {
    setPendingFile((prev) => {
      const item = prev[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
    lastFileInputRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (text.trim() === "" && pendingFile.length === 0) return;

    const images = pendingFile.filter((i) => i.file.type.startsWith("image/"));
    const videos = pendingFile.filter((i) => i.file.type.startsWith("video/"));
    const others = pendingFile.filter(
      (i) =>
        !i.file.type.startsWith("image/") && !i.file.type.startsWith("video/")
    );
    try {
      const form = new FormData();
      form.append("text", text.trim());

      images.forEach((it) => form.append("images", it.file));
      videos.forEach((it) => form.append("videos", it.file));
      others.forEach((it) => form.append("files", it.file));

      await sendMessage(form);

      pendingFile.forEach(
        (it) => it.previewUrl && URL.revokeObjectURL(it.previewUrl)
      );

      setText("");
      setPendingFile([]);

      // Clear form
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }

      // Scroll
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleSendMessageChatbot = async () => {
    if (text.trim() === "" && pendingFile.length === 0) return;

    const images = pendingFile.filter((i) => i.file.type.startsWith("image/"));
    const videos = pendingFile.filter((i) => i.file.type.startsWith("video/"));
    const others = pendingFile.filter(
      (i) =>
        !i.file.type.startsWith("image/") && !i.file.type.startsWith("video/")
    );

    try {
      const form = new FormData();
      form.append("text", text.trim());

      images.forEach((it) => form.append("images", it.file));
      videos.forEach((it) => form.append("videos", it.file));
      others.forEach((it) => form.append("files", it.file));

      await sendMessageChatbot(form);

      pendingFile.forEach(
        (it) => it.previewUrl && URL.revokeObjectURL(it.previewUrl)
      );

      setText("");
      setPendingFile([]);

      // Clear form
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }

      // Scroll
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendByRef();
    }
  };

  const sendByRef = useCallback(() => {
    if (isSendingMessage || !text.trim()) return;
    const fn =
      selectedConversation?.conversation?.type === "chatbot"
        ? handleSendMessageChatbot
        : handleSendMessage;
    fn();

    setText("");
    // focus lại ô nhập
    inputRef.current?.focus();
  }, [
    isSendingMessage,
    text,
    selectedConversation,
    handleSendMessage,
    handleSendMessageChatbot,
    inputRef,
  ]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <div
      className={`border-t border-base-300 flex flex-col gap-4 px-4 py-4 ${
        pendingFile.length > 0 ? "h-[192px]" : "h-20"
      }`}
    >
      {pendingFile.length > 0 && (
        <div className="flex-1 !overflow-x-scroll ml-[88px] mr-[56px] max-w-[calc(100vw-256px)] lg:max-w-[calc(100vw-432px)] flex items-end relative">
          {pendingFile.map((item, index) => (
            <div key={index} className={`${index !== 0 ? "ml-2" : ""}`}>
              {item.file?.type?.startsWith("image/") ? (
                <div>
                  <CostumedModal
                    trigger={
                      <div className="relative h-[max-content] w-fit cursor-pointer group">
                        <img
                          src={item.previewUrl}
                          alt="preview"
                          className="h-24 min-w-20 !rounded-btn border border-base-300 bg-base-100 p-1"
                        />

                        <CommonRoundedButton
                          className="hidden group-hover:flex absolute top-1 right-1 cursor-pointer bg-primary/25 p-1 rounded-full !size-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleRemoveFile(index);
                          }}
                          type="primary"
                        >
                          <X className="size-3" />
                        </CommonRoundedButton>
                      </div>
                    }
                  >
                    <img
                      src={item.previewUrl}
                      alt="full preview"
                      className="w-full h-auto max-h-[80vh] rounded"
                    />
                  </CostumedModal>
                </div>
              ) : item.file.type.startsWith("video/") ? (
                <CostumedModal
                  trigger={
                    <div className="relative h-[max-content] w-fit cursor-pointer group">
                      <video
                        src={item.previewUrl}
                        controls
                        className="h-24 min-w-40 !rounded-btn border border-base-300 bg-base-100 p-1"
                      />

                      <CommonRoundedButton
                        className="hidden group-hover:flex absolute top-1 right-1 cursor-pointer bg-primary/25 p-1 rounded-full !size-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleRemoveFile(index);
                        }}
                        type="primary"
                      >
                        <X className="size-3" />
                      </CommonRoundedButton>
                    </div>
                  }
                >
                  <video
                    src={item.previewUrl}
                    controls
                    className="w-full h-auto max-h-[80vh] rounded"
                  />
                </CostumedModal>
              ) : (
                <div className="text-sm bg-base-100 border border-base-300 px-4 py-2 w-[200px] lg:w-auto lg:max-w-[360px] rounded-btn flex items-center gap-3 relative group">
                  <div>
                    {" "}
                    <File className="!size-4" />{" "}
                  </div>
                  <div className="flex flex-col gap-1 truncate">
                    <span className="truncate">{item.file.name}</span>
                    <div className="flex items-center gap-1 ">
                      <span className="text-xs opacity-70">
                        {formatFileSize(item.file.size ?? 0)}
                      </span>

                      <span className="text-xs opacity-70">
                        {getFileExtension(item.file.name)}
                      </span>
                    </div>
                  </div>

                  <CommonRoundedButton
                    className="hidden group-hover:flex absolute top-1 right-1 cursor-pointer bg-primary/25 p-1 rounded-full !size-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleRemoveFile(index);
                    }}
                    type="primary"
                  >
                    <X className="size-3" />
                  </CommonRoundedButton>
                </div>
              )}
            </div>
          ))}
          <div ref={lastFileInputRef} className="" />
        </div>
      )}

      <div
        className={`flex items-center justify-between gap-4 ${
          isChatbotResponding || isSendingMessage ? "pointer-events-none" : ""
        }`}
      >
        {" "}
        {/* Utils */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx"
            // accept="image/*,video/*"
            style={{ display: "none" }}
            multiple
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          {/* <CommonRoundedButton onClick={() => fileInputRef.current.click()}>
            <Paperclip className="size-4" />
          </CommonRoundedButton> */}

          {/* <MultiMediaSelect /> */}
          <CostumedEmojiPicker
            trigger={
              <CommonRoundedButton
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <Smile className="size-4" />
              </CommonRoundedButton>
            }
            onEmojiClick={(emojiData) => handleEmojiSelect(emojiData)}
          />
        </div>
        {/* Input field */}
        <div className="w-full">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder="Type a message..."
            className="input input-bordered w-full text-sm"
          />
        </div>
        {/* Send button */}
        {isSendingMessage ? (
          <div
            className={`btn btn-primary size-10 p-0 min-w-0 min-h-0 rounded-full pointer-events-none  text-sm flex items-center justify-center hover:btn-secondary `}
          >
            <LoaderIcon className="animate-spin size-6" />
          </div>
        ) : (
          <div
            ref={sendBtnRef}
            className={`btn btn-primary size-10 p-0 min-w-0 min-h-0 rounded-full cursor-pointer text-sm flex items-center justify-center hover:btn-secondary `}
            onClick={sendByRef}
            aria-label="Send"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                sendByRef();
              }
            }}
          >
            <Forward className="size-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default TextEditor;
