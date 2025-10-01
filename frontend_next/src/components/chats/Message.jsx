import {
  CheckCheckIcon,
  ChevronDown,
  ChevronUp,
  Copy,
  Heart,
  Languages,
  LoaderIcon,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { translateMessageAPI } from "@/lib/api";
import { copyToClipboard, formatISOToParts, getLocaleById } from "@/lib/utils";
import CommonRoundedButton from "../buttons/CommonRoundedButton";
import { showToast } from "../costumed/CostumedToast";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useAuthStore } from "@/stores/useAuthStore";

const Message = ({
  ref,
  side,
  isOpen,
  onToggle,
  message,
  translatedTo,
  isShowAvatar = false,
  isShowTime = false,
}) => {
  const t = useTranslations("Components.message");
  const authUser = useAuthStore((s) => s.authUser);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [otherFiles, setOtherFiles] = useState([]);

  const [isCopied, setIsCopied] = useState(false);
  const [isCopiedTranslation, setIsCopiedTranslation] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [showAllTranslations, setShowAllTranslations] = useState(true);

  const [reactions, setReactions] = useState({
    thumbsUp: 0,
    thumbsDown: 0,
    heart: 0,
  });

  useEffect(() => {
    if (
      message?.message?.attachments?.images &&
      message?.message?.attachments?.images.length > 0
    ) {
      setImages(message.message.attachments.images);
    }
    if (
      message?.message?.attachments?.videos &&
      message?.message?.attachments?.videos.length > 0
    ) {
      setVideos(message.message.attachments.videos);
    }
    if (
      message?.message?.attachments?.files &&
      message?.message?.attachments?.files.length > 0
    ) {
      setOtherFiles(message?.message?.attachments?.files);
    }
  }, [message?.message?.attachments]);

  useEffect(() => {
    if (isCopied) {
      setTimeout(() => setIsCopied(false), 1000);
    }
    return () => {
      clearTimeout();
    };
  }, [isCopied]);

  useEffect(() => {
    if (isCopiedTranslation) {
      setTimeout(() => setIsCopiedTranslation(false), 1000);
    }
    return () => {
      clearTimeout();
    };
  }, [isCopiedTranslation]);

  useEffect(() => {
    if (isOpen) {
      setIsCopied(false);
    }
  }, [isOpen]);

  const [isTranslatingText, setIsTranslatingText] = useState(false);
  const handleTranslateTextOpenaiAPI = async (
    text,
    targetLang,
    formality = "auto"
  ) => {
    try {
      setIsTranslatingText(true);
      const response = await translateMessageAPI({
        text,
        targetLang,
        formality,
      });
      setTranslatedText(response.translated);
    } catch (error) {
      showToast({
        message:
          error?.response?.data?.message || t("toast.translateText.error"),
        type: "error",
      });
      console.error("Error translating text:", error);
    } finally {
      setIsTranslatingText(false);
    }
  };

  return (
    <>
      {/* avatar */}
      <div className={`avatar ${side === "left" ? "order-1" : "order-3"}`}>
        {message.sender?.profile?.profilePic ? (
          <div
            className="w-10 h-10 rounded-full relative top-6"
            // title={message.sender?.fullName}
          >
            {isShowAvatar && (
              <Image
                // src={
                //   message.sender?.profile?.profilePic ||
                //   "https://avatar.iran.liara.run/public/20.png"
                // }
                src={
                  message?.sender?._id === authUser?.user?._id
                    ? `/images/avatar/${authUser?.user?.profile?.profilePic}.png`
                    : `/images/avatar/${message.sender?.profile?.profilePic}.png`
                }
                className="w-full h-full object-cover"
                alt="avatar"
                width={40}
                height={40}
              />
            )}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary"></div>
        )}
      </div>

      {/* content */}
      <div
        className={`flex flex-col gap-2 max-w-[50vw] ${
          side === "left" ? "order-2" : "order-2"
        }`}
        ref={ref}
      >
        {isShowAvatar && (
          <div
            className={`text-xs opacity-70 line-clamp-1 ${
              side === "right" ? "ml-auto" : ""
            }`}
          >
            {message.sender?.fullName}
          </div>
        )}
        {message.message?.content && message.message?.content.trim() !== "" && (
          <div className="flex flex-col" ref={ref}>
            <div
              className={`flex items-center gap-2 ${
                side !== "left" ? "ml-auto" : ""
              }`}
            >
              {/* max-w-[calc(100%-32px)] */}
              <div
                className={`flex flex-col gap-1 ${
                  side !== "left" ? "items-end" : ""
                }`}
              >
                <div
                  className="!w-[fit-content] bg-base-300 px-4 py-3 rounded-btn flex flex-col gap-2 cursor-pointer relative group"
                  onClick={onToggle}
                >
                  <div className="text-sm break-words whitespace-pre-wrap ">
                    {message.message?.content}
                  </div>

                  <div
                    className={`hidden group-hover:flex absolute top-[9px] 
                  right-2 border border-base-300 bg-base-100 px-2 py-1.5 rounded-card`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (message.message?.content && !isCopied) {
                        copyToClipboard(message.message?.content);
                        setIsCopied(true);
                      }
                    }}
                  >
                    {isCopied ? (
                      <>
                        <CheckCheckIcon
                          className="size-3 text-green-500"
                          title="Check"
                        />
                      </>
                    ) : (
                      <>
                        <Copy
                          className="size-3 cursor-pointer hover:scale-105 transition-transform duration-200"
                          title="Copy"
                        />
                      </>
                    )}
                  </div>
                </div>
                {translatedText && (
                  <div className=" bg-base-100 border border-base-300 px-4 py-3 rounded-btn flex flex-col gap-2 relative group">
                    <div
                      className={`text-sm max-w-full ${
                        showAllTranslations ? "" : "line-clamp-1"
                      }`}
                    >
                      {translatedText}
                    </div>

                    <div
                      className={`hidden group-hover:flex absolute top-[9px] 
                  right-2 gap-1 items-center`}
                    >
                      {isCopiedTranslation ? (
                        <div className="border border-base-300 bg-base-100 px-2 py-1.5 rounded-card">
                          <CheckCheckIcon
                            className="size-3 text-green-500"
                            title="Check"
                          />
                        </div>
                      ) : (
                        <div className="border border-base-300 bg-base-100 px-2 py-1.5 rounded-card">
                          <Copy
                            className="size-3 cursor-pointer hover:scale-105 transition-transform duration-200"
                            title="Copy"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (translatedText) {
                                copyToClipboard(translatedText);
                                setIsCopiedTranslation(true);
                              }
                            }}
                          />
                        </div>
                      )}

                      {translatedText && translatedText.length > 100 && (
                        <>
                          {showAllTranslations ? (
                            <CommonRoundedButton
                              className=" rounded-full w-6 h-6"
                              onClick={() => {
                                setShowAllTranslations(false);
                              }}
                            >
                              <ChevronUp className="size-4" />
                            </CommonRoundedButton>
                          ) : (
                            <CommonRoundedButton
                              className="rounded-full w-6 h-6"
                              onClick={() => {
                                setShowAllTranslations(true);
                              }}
                            >
                              <ChevronDown className="size-4" />
                            </CommonRoundedButton>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div
              className={`flex gap-1 items-center justify-${
                side !== "left" ? "end" : "start"
              } ${
                isOpen ||
                reactions.heart > 0 ||
                reactions.thumbsUp > 0 ||
                reactions.thumbsDown > 0
                  ? "mt-1"
                  : ""
              }`}
            >
              {reactions.heart > 0 && (
                <div
                  className={`border border-base-300 bg-base-100 px-2 py-1 rounded-card gap-1 flex items-center ${
                    side !== "left" ? "order-1" : "order-2"
                  }`}
                >
                  <Heart
                    className="size-3 cursor-pointer hover:scale-105 transition-transform duration-200 fill-red-500 order-2"
                    onClick={() =>
                      setReactions({ ...reactions, heart: reactions.heart - 1 })
                    }
                  />

                  <span className="text-xs opacity-70 order-2 relative -top-[0.5px]">
                    {reactions.heart}
                  </span>
                </div>
              )}

              {reactions.thumbsUp > 0 && (
                <div
                  className={`border border-base-300 bg-base-100 px-2 py-1 rounded-card gap-1 flex items-center ${
                    side !== "left" ? "order-1" : "order-2"
                  }`}
                >
                  <ThumbsUp
                    className="size-3 cursor-pointer hover:scale-105 transition-transform duration-200 fill-primary/25 order-2"
                    onClick={() =>
                      setReactions({
                        ...reactions,
                        thumbsUp: reactions.thumbsUp - 1,
                      })
                    }
                  />

                  <span className="text-xs opacity-70 order-2 relative -top-[0.5px]">
                    {reactions.thumbsUp}
                  </span>
                </div>
              )}

              {reactions.thumbsDown > 0 && (
                <div
                  className={`border border-base-300 bg-base-100 px-2 py-1 rounded-card gap-1 flex items-center ${
                    side !== "left" ? "order-1" : "order-2"
                  }`}
                >
                  <ThumbsDown
                    className="size-3 cursor-pointer hover:scale-105 transition-transform duration-200 fill-primary/25 order-2"
                    onClick={() =>
                      setReactions({
                        ...reactions,
                        thumbsDown: reactions.thumbsDown - 1,
                      })
                    }
                  />

                  <span className="text-xs opacity-70 order-2 relative -top-[0.5px]">
                    {reactions.thumbsDown}
                  </span>
                </div>
              )}

              <div
                className={`border border-base-300 bg-base-100 px-2 py-1.5 rounded-card gap-2.5 ${
                  side !== "left" ? "order-2" : "order-1"
                }  ${isOpen ? "flex" : "hidden"}`}
              >
                <div className="group flex gap-2.5">
                  <Heart
                    className={`size-3 cursor-pointer hover:scale-105 transition-transform duration-200 hover:fill-red-500 order-${
                      side === "left" ? "1" : "0"
                    }`}
                    onClick={() =>
                      setReactions({ ...reactions, heart: reactions.heart + 1 })
                    }
                  />

                  {/* <div className="hidden group-hover:flex gap-2.5">
                    <ThumbsUp
                      className={`size-3 cursor-pointer hover:scale-105 transition-transform duration-200 hover:fill-primary/25 order-${
                        side === "left" ? "1" : "0"
                      }`}
                      onClick={() =>
                        setReactions({
                          ...reactions,
                          thumbsUp: reactions.thumbsUp + 1,
                        })
                      }
                    />

                    <ThumbsDown
                      className="size-3 cursor-pointer hover:scale-105 transition-transform duration-200 hover:fill-primary/25"
                      onClick={() =>
                        setReactions({
                          ...reactions,
                          thumbsDown: reactions.thumbsDown + 1,
                        })
                      }
                    />
                  </div> */}
                </div>

                {isTranslatingText ? (
                  <>
                    <LoaderIcon className="animate-spin size-3" />
                  </>
                ) : (
                  <Languages
                    className="size-3 cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => {
                      handleTranslateTextOpenaiAPI(
                        message.message?.content,
                        getLocaleById(translatedTo) || "gb"
                      );
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {(message.message?.attachments?.files?.length > 0 ||
          message.message?.attachments?.images?.length > 0 ||
          message.message?.attachments?.videos?.length > 0) && (
          // <div className="flex items-center gap-2">
          //   <div className="flex flex-col gap-2">
          //     {/* Block 1: Ảnh */}
          //     {images.length > 0 && (
          //       <div
          //         className={`flex flex-wrap gap-1 ${
          //           side === "left" ? "justify-start" : "justify-end"
          //         }`}
          //       >
          //         {images.map((file, index) => (
          //           <CostumedModal
          //             key={index}
          //             trigger={
          //               <div className="relative h-[max-content] w-fit cursor-pointer group">
          //                 <img
          //                   src={file.content}
          //                   alt="preview"
          //                   className="h-24 min-w-20 !rounded-btn border border-base-300 bg-base-100 p-1"
          //                 />
          //                 <CommonRoundedButton
          //                   className="hidden group-hover:flex absolute top-1 right-1 cursor-pointer bg-primary/25 p-1 rounded-full !size-6"
          //                   onClick={(e) => {
          //                     e.stopPropagation();
          //                     e.preventDefault();

          //                     const link = document.createElement("a");
          //                     link.href = file.downloadUrl;
          //                     link.download = file.downloadUrl;
          //                     document.body.appendChild(link);
          //                     link.click();
          //                     document.body.removeChild(link);
          //                   }}
          //                   type="primary"
          //                 >
          //                   <ArrowDownToLine className="size-3" />
          //                 </CommonRoundedButton>
          //               </div>
          //             }
          //           >
          //             <img
          //               src={file.content}
          //               alt="full preview"
          //               className="w-full h-auto max-h-[80vh] rounded"
          //             />
          //           </CostumedModal>
          //         ))}
          //       </div>
          //     )}

          //     {/* Block 2: Video */}
          //     {videos.length > 0 && (
          //       <div
          //         className={`flex flex-wrap gap-1 ${
          //           side === "left" ? "justify-start" : "justify-end"
          //         }`}
          //       >
          //         {videos.map((file, index) => (
          //           <CostumedModal
          //             key={index}
          //             trigger={
          //               <div className="relative h-[max-content] w-fit cursor-pointer group">
          //                 <video
          //                   src={file.content}
          //                   className="h-24 min-w-40 !rounded-btn border border-base-300 bg-base-100 p-1"
          //                 />
          //                 <CommonRoundedButton
          //                   className="hidden group-hover:flex absolute top-1 right-1 cursor-pointer bg-primary/25 p-1 rounded-full !size-6"
          //                   onClick={(e) => {
          //                     e.stopPropagation();
          //                     e.preventDefault();

          //                     const link = document.createElement("a");
          //                     link.href = file.downloadUrl;
          //                     link.download = file.downloadUrl;
          //                     document.body.appendChild(link);
          //                     link.click();
          //                     document.body.removeChild(link);
          //                   }}
          //                   type="primary"
          //                 >
          //                   <ArrowDownToLine className="size-3" />
          //                 </CommonRoundedButton>
          //               </div>
          //             }
          //           >
          //             <video
          //               src={file.content}
          //               controls
          //               className="w-full h-auto max-h-[80vh] rounded"
          //             />
          //           </CostumedModal>
          //         ))}
          //       </div>
          //     )}

          //     {/* Block 3: Các loại file khác */}
          //     {otherFiles.length > 0 && (
          //       <div
          //         className={`flex flex-wrap gap-1 ${
          //           side === "left" ? "justify-start" : "justify-end"
          //         }`}
          //       >
          //         {otherFiles.map((file, index) => (
          //           <div
          //             key={index}
          //             className="text-sm bg-base-100 border border-base-300 px-4 py-2 w-[200px] lg:w-auto lg:max-w-[360px] rounded-btn flex items-center gap-3 relative group"
          //           >
          //             <div>
          //               {" "}
          //               <File className="!size-4" />{" "}
          //             </div>
          //             <div className="flex flex-col gap-1 truncate">
          //               <span className="truncate">{file.fileName}</span>
          //               <div className="flex items-center gap-1 ">
          //                 <span className="text-xs opacity-70">
          //                   {formatFileSize(file.bytes ?? 0)}
          //                 </span>

          //                 <span className="text-xs opacity-70">
          //                   {getFileExtension(file.fileName)}
          //                 </span>
          //               </div>
          //             </div>

          //             <CommonRoundedButton
          //               className="hidden group-hover:flex absolute top-1 right-1 cursor-pointer bg-primary/25 p-1 rounded-full !size-6"
          //               onClick={(e) => {
          //                 e.stopPropagation();
          //                 e.preventDefault();

          //                 const link = document.createElement("a");
          //                 link.href = file.downloadUrl;
          //                 link.download = file.downloadUrl;
          //                 document.body.appendChild(link);
          //                 link.click();
          //                 document.body.removeChild(link);
          //               }}
          //               type="primary"
          //             >
          //               <ArrowDownToLine className="size-3" />
          //             </CommonRoundedButton>
          //           </div>
          //         ))}
          //       </div>
          //     )}
          //   </div>
          // </div>
          <></>
        )}
        {isShowTime && (
          <div
            className={`flex items-end text-xs opacity-70 ${
              side === "left" ? "order-3 justify-start" : "order-1 justify-end"
            }`}
          >
            {formatISOToParts(message.message?.createdAt).time}
          </div>
        )}
      </div>
    </>
  );
};

export default Message;
