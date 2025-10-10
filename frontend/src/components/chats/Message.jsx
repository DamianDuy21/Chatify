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
import { useTranslation } from "react-i18next";
import {
  createUpdateReactionAPI,
  deleteReactionAPI,
  translateMessageAPI,
} from "../../lib/api";
import {
  copyToClipboard,
  formatISOToParts,
  getLocaleById,
  pluralToSingular,
  singularToPlural,
} from "../../lib/utils";
import { useAuthStore } from "../../stores/useAuthStore";
import { useChatStore } from "../../stores/useChatStore";
import CommonRoundedButton from "../buttons/CommonRoundedButton";
import { showToast } from "../costumed/CostumedToast";
import CostumedAvatarSeenBy from "../costumed/CostumedAvatarSeenBy";
import CostumedMessageReactionsModal from "../costumed/CostumedMessageReactionsModal";
import CostumedMessageSeenByList from "../costumed/CostumedMessageSeenByList";

const Message = ({
  ref,
  side,
  isOpen,
  onToggle,
  message,
  seenByList = [],
  translatedTo,
  isShowAvatar = false,
  isShowTime = false,
  isShowName = false,
}) => {
  const { t } = useTranslation("components", { keyPrefix: "message" });
  const { t: tReactionsModal } = useTranslation("components", {
    keyPrefix: "chatWindow.reactionsModal",
  });
  const { t: tSeenByModal } = useTranslation("components", {
    keyPrefix: "chatWindow.seenByModal",
  });
  const { i18n } = useTranslation();
  const getUserLocaleClient = () => {
    if (typeof window === "undefined") return "vi";
    return i18n.language || "vi";
  };
  const userLocale = getUserLocaleClient();

  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);

  const authUser = useAuthStore((s) => s.authUser);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [otherFiles, setOtherFiles] = useState([]);

  const [isCopied, setIsCopied] = useState(false);
  const [isCopiedTranslation, setIsCopiedTranslation] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [showAllTranslations, setShowAllTranslations] = useState(true);

  const [isShowModalReactions, setIsShowModalReactions] = useState(false);
  const [isShowModalSeenBy, setIsShowModalSeenBy] = useState(false);

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

  const createUpdateReaction = async (reaction) => {
    try {
      const response = await createUpdateReactionAPI({
        messageId: message.message._id,
        reaction,
        conversationId: selectedConversation.conversation._id,
      });
    } catch (error) {
      console.error("Error creating/updating reaction:", error);
    }
  };
  const deleteReaction = async (reaction) => {
    try {
      const response = await deleteReactionAPI({
        messageId: message.message._id,
        reaction,
        conversationId: selectedConversation.conversation._id,
      });
    } catch (error) {
      console.error("Error deleting reaction:", error);
    }
  };

  const convUserIds = new Set(
    (selectedConversation?.users ?? [])
      .map((u) => u?.user?._id ?? u?._id)
      .filter(Boolean)
  );

  const displayedSeenByList = (
    Array.isArray(message?.seenBy) ? message.seenBy : []
  ).filter((u) => {
    const uid = u?.user?._id ?? u?._id;
    return uid && convUserIds.has(uid) && uid !== authUser?.user?._id;
  });

  const reactionMap = {
    heart: Heart,
    like: ThumbsUp,
    dislike: ThumbsDown,
  };

  const reactionsTotal = message?.reactions?.total ?? {
    heart: [],
    like: [],
    dislike: [],
  };

  const reactionCounts = Object.fromEntries(
    Object.keys(reactionMap).map((key) => {
      const arr = reactionsTotal[key] ?? [];
      const countInConv = arr.filter((r) => {
        const rUserId = String(r?.userId ?? r?.user?._id ?? r?._id ?? "");
        return rUserId && convUserIds.has(rUserId);
      }).length;
      return [key, countInConv];
    })
  );

  const totalVisibleReaction = Object.values(reactionCounts).reduce(
    (s, v) => s + v,
    0
  );

  return (
    <>
      {/* avatar */}
      <div className={`avatar ${side === "left" ? "order-1" : "order-3"}`}>
        {message.sender?.profile?.profilePic ? (
          <div
            className={`w-10 h-10 rounded-full ${
              isShowName ? "relative top-6" : ""
            }`}
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
        {isShowName && (
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
                  <div className="text-sm break-words whitespace-pre-wrap">
                    {message.message?.content}
                  </div>
                  {/* copy */}
                  {/* <div
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
                          className="size-3 cursor-pointer hover:scale-110 transition-transform duration-200"
                          title="Copy"
                        />
                      </>
                    )}
                  </div> */}
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
                      className={`hidden group-hover:flex absolute top-[12px] 
                  right-[12px] items-center`}
                    >
                      {/* copy */}
                      {/* {isCopiedTranslation ? (
                        <div className="border border-base-300 bg-base-100 px-2 py-1.5 rounded-card">
                          <CheckCheckIcon
                            className="size-3 text-green-500"
                            title="Check"
                          />
                        </div>
                      ) : (
                        <div className="border border-base-300 bg-base-100 px-2 py-1.5 rounded-card">
                          <Copy
                            className="size-3 cursor-pointer hover:scale-110 transition-transform duration-200"
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
                      )} */}

                      {translatedText && translatedText.length > 100 && (
                        <>
                          {showAllTranslations ? (
                            <CommonRoundedButton
                              className="rounded-full w-5 h-5"
                              onClick={() => {
                                setShowAllTranslations(false);
                              }}
                            >
                              <ChevronUp className="size-3" />
                            </CommonRoundedButton>
                          ) : (
                            <CommonRoundedButton
                              className="rounded-full w-5 h-5"
                              onClick={() => {
                                setShowAllTranslations(true);
                              }}
                            >
                              <ChevronDown className="size-3" />
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
              className={`flex justify-${
                side !== "left" ? "end" : "start"
              } items-center gap-2`}
            >
              {/* time */}
              {isShowTime && (
                <div
                  className={`text-xs opacity-70 mt-1 ${
                    side === "left" ? "" : "order-3"
                  }`}
                >
                  <span className="">
                    {formatISOToParts(message.message?.createdAt).time}
                  </span>
                </div>
              )}

              {/* reactions */}
              <div
                className={`flex gap-1 mt-1 items-center justify-${
                  side !== "left" ? "end order-1" : "start order-2"
                } ${isOpen || totalVisibleReaction > 0 ? "flex" : "hidden"}`}
              >
                <div
                  className={`cursor-pointer border border-base-300 bg-base-100 px-2 py-1.5 rounded-card gap-2.5 flex items-center ${
                    side !== "left" ? "order-1" : "order-2"
                  } ${totalVisibleReaction > 0 ? "flex" : "hidden"}`}
                  onClick={() => setIsShowModalReactions(true)}
                >
                  {Object.entries(reactionMap).map(([key, Icon]) => {
                    const count = reactionCounts[key] || 0;
                    if (!count) return null;

                    const iconClass =
                      key === "heart"
                        ? "size-3 fill-red-500 order-2 text-transparent"
                        : "size-3 fill-[#fbcc3b] order-2 text-transparent";

                    return <Icon key={key} className={iconClass} />;
                  })}
                </div>

                <div
                  className={`border border-base-300 bg-base-100 px-2 py-1.5 rounded-card gap-2.5 ${
                    side !== "left" ? "order-2" : "order-1"
                  }  ${isOpen ? "flex" : "hidden"}`}
                >
                  <div className="flex gap-2.5">
                    <Heart
                      className={`size-3 cursor-pointer hover:scale-110 hover:text-transparent transition-transform duration-200 hover:fill-red-500 ${
                        message.reactions.my.heart > 0
                          ? "fill-red-500 text-transparent"
                          : ""
                      }`}
                      onClick={() => {
                        if (message.reactions.my.heart > 0) {
                          deleteReaction("heart");
                          return;
                        }
                        createUpdateReaction("heart");
                      }}
                    />

                    <div className="flex gap-2.5">
                      <ThumbsUp
                        className={`size-3 cursor-pointer hover:scale-110 hover:text-transparent transition-transform duration-200 fill-base-100 hover:fill-[#fbcc3b] ${
                          message.reactions.my.like > 0
                            ? "!fill-[#fbcc3b] text-transparent"
                            : ""
                        }`}
                        onClick={() => {
                          if (message.reactions.my.like > 0) {
                            deleteReaction("like");
                            return;
                          }
                          createUpdateReaction("like");
                        }}
                      />

                      <ThumbsDown
                        className={`size-3 cursor-pointer hover:scale-110 hover:text-transparent transition-transform duration-200 fill-base-100 hover:fill-[#fbcc3b] ${
                          message.reactions.my.dislike > 0
                            ? "!fill-[#fbcc3b] text-transparent"
                            : ""
                        }`}
                        onClick={() => {
                          if (message.reactions.my.dislike > 0) {
                            deleteReaction("dislike");
                            return;
                          }
                          createUpdateReaction("dislike");
                        }}
                      />
                    </div>
                  </div>

                  {isTranslatingText ? (
                    <>
                      <LoaderIcon className="animate-spin size-3" />
                    </>
                  ) : (
                    <Languages
                      className="size-3 cursor-pointer hover:scale-110 transition-transform duration-200"
                      onClick={() => {
                        handleTranslateTextOpenaiAPI(
                          message.message?.content,
                          getLocaleById(translatedTo) || "gb"
                        );
                      }}
                    />
                  )}
                  {isCopied ? (
                    <CheckCheckIcon
                      className="size-3 text-green-500"
                      title="Check"
                    />
                  ) : (
                    <div
                      onClick={() => {
                        if (message.message?.content && !isCopied) {
                          copyToClipboard(message.message?.content);
                          setIsCopied(true);
                        }
                      }}
                    >
                      <Copy
                        className="size-3 cursor-pointer hover:scale-110 transition-transform duration-200"
                        title="Copy"
                      />
                    </div>
                  )}

                  {translatedText &&
                    (isCopiedTranslation ? (
                      <CheckCheckIcon
                        className="size-3 text-green-500"
                        title="CheckTranslation"
                      />
                    ) : (
                      <div
                        onClick={() => {
                          if (translatedText) {
                            copyToClipboard(translatedText);
                            setIsCopiedTranslation(true);
                          }
                        }}
                      >
                        <Copy
                          className="size-3 cursor-pointer hover:scale-110 transition-transform duration-200"
                          title="CopyTranslation"
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* seen */}
              <div
                className={`flex gap-1 mt-1 items-center justify-${
                  side !== "left" ? "end order-2" : "start order-1"
                } ${seenByList.length > 0 ? "" : "hidden"}`}
              >
                <CostumedAvatarSeenBy
                  onClick={() => setIsShowModalSeenBy(true)}
                  className={""}
                  seenByList={seenByList}
                />
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

      {/* REACTIONS MODAL */}
      <CostumedModal
        open={isShowModalReactions}
        onClose={() => {
          setIsShowModalReactions(false);
        }}
        title={tReactionsModal("title")}
      >
        {({ close }) => {
          return (
            <div className={`pb-0 text-sm`}>
              <div className="space-y-3 -mt-2">
                <div className="form-control w-full">
                  <div className="flex items-center justify-between gap-2">
                    <div className="label">
                      <span className="label-text line-clamp-1">
                        {message.message.content}
                      </span>
                    </div>
                    <div className="text-end label-text-alt flex-1 min-w-[max-content]">
                      {totalVisibleReaction}{" "}
                      {totalVisibleReaction > 1
                        ? singularToPlural(
                            tReactionsModal("quantity"),
                            userLocale
                          )
                        : pluralToSingular(
                            tReactionsModal("quantity"),
                            userLocale
                          )}
                    </div>
                  </div>

                  <CostumedMessageReactionsModal
                    message={message}
                  ></CostumedMessageReactionsModal>
                </div>
              </div>
            </div>
          );
        }}
      </CostumedModal>

      {/* SEEN BY LIST MODAL */}
      <CostumedModal
        open={isShowModalSeenBy}
        onClose={() => {
          setIsShowModalSeenBy(false);
        }}
        title={tSeenByModal("title")}
      >
        {({ close }) => {
          return (
            <div className={`pb-0 text-sm`}>
              <div className="space-y-3 -mt-2">
                <div className="form-control w-full">
                  <div className="flex items-center justify-between gap-2">
                    <label className="label">
                      <span className="label-text line-clamp-1">
                        {message.message.content}
                      </span>
                    </label>
                    <span className="text-end label-text-alt flex-1 min-w-[max-content]">
                      {displayedSeenByList.length}{" "}
                      {displayedSeenByList.length > 1
                        ? singularToPlural(tSeenByModal("quantity"), userLocale)
                        : pluralToSingular(
                            tSeenByModal("quantity"),
                            userLocale
                          )}
                    </span>
                  </div>

                  <CostumedMessageSeenByList
                    seenByList={displayedSeenByList}
                  ></CostumedMessageSeenByList>
                </div>
              </div>
            </div>
          );
        }}
      </CostumedModal>
    </>
  );
};

export default Message;
