"use client";
import {
  AppWindow,
  BellIcon,
  Check,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  ChevronUp,
  ClockIcon,
  LoaderIcon,
  Pin,
  UserRoundPlus,
  UsersRound,
  Video,
  X,
} from "lucide-react";

import CostumedGroupChatUpdateMemberRoleList from "@/components/costumed/CostumedGroupChatUpdateMemberRoleList.jsx";
import {
  addMembersToGroupAPI,
  deleteConversationAPI,
  getFriendsCouldBeAddedToGroupAPI,
  getVideoCallTokenAPI,
  leaveGroupAPI,
  markAllMessagesAsSeenAPI,
  updateConversationSettingsAPI,
} from "@/lib/api.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import {
  formatRelativeTime,
  isConversationFitFilter,
} from "../../lib/utils.js";
import { useAuthStore } from "../../stores/useAuthStore.js";
import { useChatStore } from "../../stores/useChatStore";
import { useLanguageStore } from "../../stores/useLanguageStore.js";
import { useNotificationStore } from "../../stores/useNotificationStore.js";
import CommonRoundedButton from "../buttons/CommonRoundedButton";
import CostumedAvatarGroupChat from "../costumed/CostumedAvatarGroupChat.jsx";
import CostumedFriendSelectInModal from "../costumed/CostumedFriendSelectInModal.jsx";
import CostumedGroupChatMemberList from "../costumed/CostumedGroupChatMemberList.jsx";
import CostumedModal from "../costumed/CostumedModal";
import CostumedSelect from "../costumed/CostumedSelect.jsx";
import { showToast } from "../costumed/CostumedToast.jsx";
import Conversation from "./Conversation";
import TextEditor from "./TextEditor";
import Image from "next/image.js";

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const ChatWindow = () => {
  const t = useTranslations("Components.chatWindow");
  const deleteConversation_NotificationStore = useNotificationStore(
    (s) => s.deleteConversation_NotificationStore
  );
  const leaveGroup_NotificationStore = useNotificationStore(
    (s) => s.leaveGroup_NotificationStore
  );
  const addMembersToGroup_NotificationStore = useNotificationStore(
    (s) => s.addMembersToGroup_NotificationStore
  );

  const authUser = useAuthStore((s) => s.authUser);
  const userPresenceList = useAuthStore((s) => s.userPresenceList);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isLoadingChannel, setIsLoadingChannel] = useState(false);

  const handleClickVideoCallButton = () => {
    if (!channel) initChat();
    if (channel) {
      const callUrl = `${window.location.origin}/video-call/${channel.id}`;
      window.open(callUrl, "_blank", "noopener,noreferrer");
    }
  };

  // const getMessages = useChatStore((s) => s.getMessages);
  // const isGettingMessages = useChatStore((s) => s.isGettingMessages);
  // const videoCallToken = useChatStore((s) => s.videoCallToken);
  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );
  const conversationNameFilter = useChatStore((s) => s.conversationNameFilter);
  const setTotalConversationQuantityAboveFilter = useChatStore(
    (s) => s.setTotalConversationQuantityAboveFilter
  );
  const totalConversationQuantityAboveFilter = useChatStore(
    (s) => s.totalConversationQuantityAboveFilter
  );

  const setTotalConversationQuantityUnderFilter = useChatStore(
    (s) => s.setTotalConversationQuantityUnderFilter
  );
  const totalConversationQuantityUnderFilter = useChatStore(
    (s) => s.totalConversationQuantityUnderFilter
  );

  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const languages = useLanguageStore((s) => s.languages);

  const [isOpenUtils, setIsOpenUtils] = useState(false);
  const [useUtils, setUseUtils] = useState({
    isOpenSettings: false,
    isOpenImagesVideos: false,
    isOpenFiles: false,
  });
  const [userSettings, setUserSettings] = useState({
    getNotifications: false,
    isPinned: false,
    language: null,
    translatedTo: null,
  });

  const [languageSelection, setLanguageSelection] = useState([]);
  const [isOpenHeaderOptions, setIsOpenHeaderOptions] = useState(false);
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState([]);

  const [imagesVideos, setImagesVideos] = useState([
    // "https://avatar.iran.liara.run/public/03.png",
    // "https://avatar.iran.liara.run/public/04.png",
    // "https://avatar.iran.liara.run/public/05.png",
    // "https://avatar.iran.liara.run/public/06.png",
    // "https://avatar.iran.liara.run/public/07.png",
    // "https://avatar.iran.liara.run/public/08.png",
    // "https://avatar.iran.liara.run/public/09.png",
    // "https://avatar.iran.liara.run/public/10.png",
    // "https://avatar.iran.liara.run/public/11.png",
    // "https://avatar.iran.liara.run/public/03.png",
    // "https://avatar.iran.liara.run/public/04.png",
    // "https://avatar.iran.liara.run/public/05.png",
    // "https://avatar.iran.liara.run/public/06.png",
    // "https://avatar.iran.liara.run/public/07.png",
    // "https://avatar.iran.liara.run/public/08.png",
    // "https://avatar.iran.liara.run/public/09.png",
    // "https://avatar.iran.liara.run/public/10.png",
    // "https://avatar.iran.liara.run/public/11.png",
    // "https://avatar.iran.liara.run/public/12.png",
  ]);

  const [files, setFiles] = useState([
    // "https://avatar.iran.liara.run/public/03.png",
    // "https://avatar.iran.liara.run/public/04.png",
  ]);

  const [isOpenModalAddMember, setIsOpenModalAddMember] = useState(false);
  const [isOpenModalMemberList, setIsOpenModalMemberList] = useState(false);
  const [isOpenModalDeleteConversation, setIsOpenModalDeleteConversation] =
    useState(false);
  const [isOpenModalLeaveGroup, setIsOpenModalLeaveGroup] = useState(false);

  const [friends, setFriends] = useState([]);
  const [isLoadingGetFriends, setIsLoadingGetFriends] = useState(false);
  const [friendQuantity, setFriendQuantity] = useState(0);

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [filterData, setFilterData] = useState({
    fullName: "",
    nativeLanguage: "",
    learningLanguage: "",
  });

  const [iAmKeyMember, setIAmKeyMember] = useState(false);

  useEffect(() => {
    const myId = authUser?.user?._id;
    const keyMemberId = selectedConversation?.users.find((u) => u.isKeyMember)
      ?.user?._id;
    const iAmKeyMember = String(myId) == String(keyMemberId);
    setIAmKeyMember(iAmKeyMember);
  }, [selectedConversation, authUser?.user?._id]);

  // add member to group chat / leave group chat
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);

  const { data: videoCallToken } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getVideoCallTokenAPI,
    enabled:
      !!authUser &&
      !!selectedConversation &&
      selectedConversation.conversation.type !== "chatbot",
  });

  const {
    mutate: addMembersToGroupMutation,
    isPending: isAddingMembersToGroup,
  } = useMutation({
    mutationFn: addMembersToGroupAPI,
    onSuccess: (data) => {
      let newConversation = conversations
        .map((c) =>
          c.conversation._id == data.data.conversation.conversation._id
            ? {
                ...c,
                settings: null,
                users: [...c.users, ...data.data.conversation.users],
              }
            : null
        )
        .filter((c) => c);
      setConversations(
        conversations.map((conversation) =>
          conversation.conversation._id ==
          data.data.conversation.conversation._id
            ? {
                ...conversation,
                users: [...conversation.users, ...data.data.conversation.users],
              }
            : conversation
        )
      );
      if (selectedConversation) {
        setSelectedConversation({
          ...selectedConversation,
          users: [
            ...selectedConversation.users,
            ...data.data.conversation.users,
          ],
        });
      }
      addMembersToGroup_NotificationStore({
        userIds: [...selectedFriendIds],
        userAlreadyInGroup: conversations
          .find((c) =>
            c.conversation._id == data.data.conversation.conversation._id
              ? c
              : null
          )
          ?.users.map((u) => u.user._id),
        conversation: newConversation[0],
        notifications: data.data.notifications,
        user: authUser.user,
      });

      showToast({
        message: data?.message || t("toast.addMembersToGroupMutation.success"),
        type: "success",
      });
      setIsOpenModalAddMember(false);
      setSelectedFriendIds([]);
    },
    onError: (error) => {
      console.log("Add members to group error:", error);
      showToast({
        message:
          error?.response?.data?.message ||
          t("toast.addMembersToGroupMutation.error"),
        type: "error",
      });
    },
  });

  const {
    mutate: updateChatSettingsMutation,
    isPending: isUpdatingChatSettings,
  } = useMutation({
    mutationFn: updateConversationSettingsAPI,
    onSuccess: (data) => {
      setConversations(
        conversations.map((conversation) => {
          if (conversation.conversation._id == data.data.conversation._id) {
            return {
              ...conversation,
              conversation: {
                ...conversation.conversation,
                settings: data.data.conversation.settings,
              },
            };
          }
          return conversation;
        })
      );
      if (selectedConversation) {
        setSelectedConversation({
          ...selectedConversation,
          conversation: {
            ...selectedConversation.conversation,
            settings: data.data.conversation.settings,
          },
        });
      }
      showToast({
        message: data?.message || t("toast.updateChatSettingsMutation.success"),
        type: "success",
      });
    },
    onError: (error) => {
      console.log("Error updating chat settings:", error);
      showToast({
        message:
          error?.response?.data?.message ||
          t("toast.updateChatSettingsMutation.error"),
        type: "error",
      });
    },
  });

  const { mutate: leaveGroupMutation, isPending: isLeavingGroup } = useMutation(
    {
      mutationFn: leaveGroupAPI,
      onSuccess: (data) => {
        setConversations(
          conversations.filter(
            (conversation) =>
              conversation.conversation._id !== data.data.conversation._id
          )
        );
        setSelectedConversation(null);
        setTotalConversationQuantityAboveFilter(
          totalConversationQuantityAboveFilter - 1
        );
        const isFitFilter = isConversationFitFilter({
          conversation: data.data,
          conversationNameFilter,
          authUser,
        });
        if (isFitFilter) {
          setTotalConversationQuantityUnderFilter(
            totalConversationQuantityUnderFilter - 1
          );
        }

        leaveGroup_NotificationStore({
          userIds: [authUser.user._id],
          userAlreadyInGroup: conversations
            .find((c) => c.conversation._id === data.data.conversation._id)
            ?.users.filter((u) => u.user._id !== authUser.user._id)
            .map((u) => u.user._id),
          newKeyMemberId: selectedFriendIds[0] || null,
          conversation: data.data.conversation,
          user: authUser.user,
        });

        showToast({
          message: data?.message || t("toast.leaveGroupMutation.success"),
          type: "success",
        });

        setIsOpenModalLeaveGroup(false);
        setSelectedFriendIds([]);
      },
      onError: (error) => {
        console.log("Leave group error:", error);
        showToast({
          message:
            error?.response?.data?.message ||
            t("toast.leaveGroupMutation.error"),
          type: "error",
        });
      },
    }
  );

  const {
    mutate: deleteConversationMutation,
    isPending: isDeletingConversation,
  } = useMutation({
    mutationFn: deleteConversationAPI,
    onSuccess: (data) => {
      setConversations(
        conversations.filter(
          (conversation) =>
            conversation.conversation._id !==
            data.data.conversation.conversation._id
        )
      );
      setSelectedConversation(null);
      setTotalConversationQuantityAboveFilter(
        totalConversationQuantityAboveFilter - 1
      );
      const isFitFilter = isConversationFitFilter({
        conversation: data.data.conversation,
        conversationNameFilter,
        authUser,
      });
      if (isFitFilter) {
        setTotalConversationQuantityUnderFilter(
          totalConversationQuantityUnderFilter - 1
        );
      }

      deleteConversation_NotificationStore({
        conversation: data.data.conversation.conversation,
        userIds: selectedConversation.users.map((u) => u.user._id),
        notifications: data.data.notifications,
        user: authUser.user,
      });

      showToast({
        message: data?.message || t("toast.deleteConversationMutation.success"),
        type: "success",
      });
    },
    onError: (error) => {
      console.log("Delete conversation error:", error);
      showToast({
        message:
          error?.response?.data?.message ||
          t("toast.deleteConversationMutation.error"),
        type: "error",
      });
    },
  });

  const handleDeleteConversation = () => {
    const conversationId = selectedConversation?.conversation?._id;
    if (!conversationId) return;
    deleteConversationMutation(conversationId);
  };

  const handleLeaveGroup = async () => {
    const conversationId = selectedConversation?.conversation?._id;
    if (!conversationId) return;

    if (
      iAmKeyMember &&
      (!selectedFriendIds?.length || !selectedFriendIds[0]) &&
      selectedConversation?.users.length > 1
    ) {
      showToast({
        message: t("toast.handleLeaveGroup.emptyNewKeyMember"),
        type: "error",
      });
      return;
    }

    try {
      if (iAmKeyMember && selectedConversation?.users.length > 1) {
        leaveGroupMutation({
          conversationId,
          isKeyMember: true,
          newKeyMemberId: selectedFriendIds[0],
        });
      } else {
        leaveGroupMutation({ conversationId });
      }
    } catch (error) {
      console.error(error);
      showToast({
        message: t("toast.handleLeaveGroup.error"),
        type: "error",
      });
    }
  };

  const handleUpdateChatSettings = (settingData) => {
    updateChatSettingsMutation({
      conversationId: selectedConversation?.conversation._id,
      settings: settingData,
    });
  };

  const handleAddMembersToGroup = () => {
    if (selectedFriendIds.length === 0) {
      showToast({
        message: t("toast.handleAddMembersToGroup.emptyMembers"),
        type: "error",
      });
      return;
    }

    addMembersToGroupMutation({
      conversationId: selectedConversation?.conversation._id,
      memberIds: [...selectedFriendIds],
    });
  };

  // add member to group chat
  const handleSelectedFriend = (friend) => {
    if (!friend) return;
    const isAlreadySelected = selectedFriendIds.includes(friend._id);
    if (isAlreadySelected) {
      setSelectedFriendIds((prev) => prev.filter((id) => id !== friend._id));
    } else {
      setSelectedFriendIds((prev) => [...prev, friend._id]);
    }
  };

  // for leave group chat
  const handleSelectedFriendLeaveGroup = (user) => {
    if (!user || !user?._id) return;
    setSelectedFriendIds([user._id]);
  };

  const fetchFriends = async (args = {}) => {
    try {
      setIsLoadingGetFriends(true);
      const { data } = await getFriendsCouldBeAddedToGroupAPI(
        selectedConversation?.conversation._id,
        args
      );
      setFriends(data.users);
      setFriendQuantity(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      showToast({
        message:
          error?.response?.data?.message || t("toast.fetchFriends.error"),
        type: "error",
      });
    } finally {
      setIsLoadingGetFriends(false);
    }
  };

  const handleEmojiSelect = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      if (windowWidth > 640) {
        setIsOpenHeaderOptions(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      const currentLastMessage = selectedConversation?.messages?.slice(-1)[0];
      const isSeenByMe =
        currentLastMessage?.seenBy?.some(
          (user) => user?.user?._id === authUser?.user?._id
        ) || currentLastMessage?.sender?._id === authUser?.user?._id;
      if (currentLastMessage && !isSeenByMe) {
        const id = selectedConversation?.conversation?._id;
        markAllMessagesAsSeenAPI(id);
      }
      setIsOpenUtils(false);
      setUseUtils({
        isOpenSettings: false,
        isOpenImagesVideos: false,
        isOpenFiles: false,
      });
      // getMessages(selectedConversation.conversation._id);
    }
    setIsOpenHeaderOptions(false);
    setText("");
  }, [selectedConversation.conversation._id]);

  useEffect(() => {
    setLanguageSelection(languages);
  }, [languages]);

  useEffect(() => {
    setUserSettings(() => ({
      language: selectedConversation?.conversation?.settings?.language,
      translatedTo: selectedConversation?.conversation?.settings?.translatedTo,
      getNotifications:
        selectedConversation?.conversation?.settings?.getNotifications,
      isPinned: selectedConversation?.conversation?.settings?.isPinned,
    }));
  }, [selectedConversation?.conversation?.settings]);

  useEffect(() => {
    if (!isOpenModalAddMember) return;
    const { fullName, nativeLanguage, learningLanguage } = filterData;
    fetchFriends({
      fullName,
      nativeLanguage,
      learningLanguage,
      page: currentPage,
    });
  }, [currentPage, isOpenModalAddMember]);

  useEffect(() => {
    if (!isOpenModalAddMember) return;
    if (currentPage == 1) {
      const { fullName, nativeLanguage, learningLanguage } = filterData;
      fetchFriends({
        fullName,
        nativeLanguage,
        learningLanguage,
        page: currentPage,
      });
    } else {
      setCurrentPage(1);
    }
  }, [filterData]);

  const initChat = async () => {
    if (!videoCallToken?.data.token || !authUser) {
      return;
    }

    try {
      setIsLoadingChannel(true);
      const client = StreamChat.getInstance(STREAM_API_KEY);

      await client.connectUser(
        {
          id: authUser?.user._id,
          name: authUser?.user.fullName,
          // image: authUser?.user?.profile?.profilePic,
          image: `/images/avatar/${
            authUser?.user?.profile?.profilePic || 1
          }.png`,
        },
        videoCallToken.data.token
      );

      //
      const channelId = selectedConversation?.conversation?._id;

      const currChannel = client.channel("messaging", channelId, {
        members: selectedConversation?.users.map((user) => user.user._id),
      });

      await currChannel.watch();

      setChatClient(client);
      setChannel(currChannel);
    } catch (error) {
      console.error("Error initializing chat:", error);
      showToast({
        message: error?.response?.data?.message || t("toast.initChat.error"),
        type: "error",
      });
    } finally {
      setIsLoadingChannel(false);
    }
  };

  useEffect(() => {
    if (selectedConversation.conversation.type !== "chatbot") initChat();
  }, [authUser.user._id, videoCallToken?.data.token]);

  return (
    <>
      <div className="h-[calc(100vh-64px)] w-[calc(100vw-80px)] lg:w-[calc(100vw-256px)] flex relative overflow-x-hidden">
        <div className="flex-1">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-base-300 gap-4">
            <div className="flex gap-3 items-center relative">
              <div className="avatar">
                <div className="w-10 rounded-full">
                  {selectedConversation.conversation?.type == "private" ? (
                    <Image
                      // src={
                      //   selectedConversation?.users[0]?.user?.profile
                      //     ?.profilePic
                      // }
                      src={
                        selectedConversation?.users[0]?.user?.profile
                          ?.profilePic
                          ? `/images/avatar/${selectedConversation?.users[0]?.user?.profile?.profilePic}.png`
                          : `/images/avatar/1.png`
                      }
                      alt="avatar"
                      width={40}
                      height={40}
                    />
                  ) : selectedConversation.conversation.type == "group" ? (
                    <CostumedAvatarGroupChat
                      conversation={selectedConversation}
                    />
                  ) : (
                    <div className="h-full w-full bg-primary"></div>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="hidden sm:block">
                <h3 className="font-semibold text-sm line-clamp-1">
                  {selectedConversation?.conversation?.type == "private"
                    ? selectedConversation?.users[0]?.user?.fullName
                    : selectedConversation?.conversation?.name}
                </h3>
                {selectedConversation?.conversation?.type !== "chatbot" ? (
                  <>
                    {selectedConversation?.users?.some(
                      (user) =>
                        user?.user?._id !== authUser?.user._id &&
                        userPresenceList.find(
                          (u) => u.userId === user?.user?._id && u.online
                        )
                    ) ? (
                      <p className="text-xs text-success flex items-center gap-1">
                        <span className="size-2 rounded-full bg-success inline-block" />
                        {t("status.online")}
                      </p>
                    ) : (
                      <>
                        {selectedConversation?.conversation?.type ==
                          "private" &&
                          userPresenceList.find(
                            (u) =>
                              u.userId ===
                              selectedConversation?.users?.find(
                                (user) => user?.user?._id !== authUser?.user._id
                              )?.user?._id
                          ) && (
                            <p className="text-xs opacity-70 flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              <span>
                                {formatRelativeTime(
                                  userPresenceList.find(
                                    (u) =>
                                      u.userId ===
                                      selectedConversation?.users?.find(
                                        (user) =>
                                          user?.user?._id !== authUser?.user._id
                                      )?.user?._id
                                  )?.last
                                )}
                              </span>
                            </p>
                          )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs text-success flex items-center gap-1 line-clamp-1">
                      <span className="size-2 rounded-full bg-success inline-block" />
                      {t("status.chatbot")}
                    </p>
                  </>
                )}
              </div>
              {selectedConversation?.conversation?.type !== "chatbot" ? (
                <>
                  {selectedConversation?.users?.some(
                    (user) =>
                      user?.user?._id !== authUser?.user._id &&
                      userPresenceList.find(
                        (u) => u.userId === user?.user?._id && u.online
                      )
                  ) && (
                    <div className="absolute -right-0 -bottom-0 sm:hidden">
                      <span className="size-2 rounded-full bg-success inline-block" />
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute -right-0 -bottom-0 sm:hidden">
                  <span className="size-2 rounded-full bg-success inline-block" />
                </div>
              )}
            </div>

            <div className={`flex ${isOpenUtils ? "pr-64 lg:pr-0" : ""}`}>
              <div
                className={`gap-4 hidden sm:flex ${
                  isOpenUtils ? "sm:flex" : "hidden"
                }`}
              >
                <div className="flex gap-2">
                  {selectedConversation.conversation.type == "group" && (
                    <>
                      <CommonRoundedButton
                        className={`${
                          isOpenModalMemberList
                            ? "btn-secondary"
                            : "btn-primary"
                        }`}
                        onClick={() => {
                          setIsOpenModalMemberList(true);
                        }}
                      >
                        <UsersRound className="size-4" />
                      </CommonRoundedButton>

                      {authUser?.user?._id ==
                        selectedConversation?.users?.find((u) => u.isKeyMember)
                          ?.user?._id && (
                        <CommonRoundedButton
                          className={`${
                            isOpenModalAddMember
                              ? "btn-secondary"
                              : "btn-primary"
                          }`}
                          onClick={() => {
                            setIsOpenModalAddMember(true);
                          }}
                        >
                          <UserRoundPlus className="size-4" />
                        </CommonRoundedButton>
                      )}
                    </>
                  )}

                  {selectedConversation.conversation.type !== "chatbot" && (
                    <CommonRoundedButton
                      onClick={handleClickVideoCallButton}
                      className={`${!channel ? "opacity-70" : ""}`}
                    >
                      <Video className="size-4" />
                    </CommonRoundedButton>
                  )}

                  <CommonRoundedButton
                    className={`${
                      isOpenUtils ? "btn-secondary" : "btn-primary"
                    }`}
                    onClick={() => {
                      setIsOpenUtils(!isOpenUtils);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <AppWindow className="size-4" />
                  </CommonRoundedButton>
                </div>
                <CommonRoundedButton
                  onClick={() => {
                    setSelectedConversation(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <X className="size-4" />
                </CommonRoundedButton>
              </div>

              {/* Option when the utils panel is open and screen is small */}
              <div
                className={`flex flex-col relative sm:hidden ${
                  isOpenUtils ? "sm:hidden" : ""
                }`}
              >
                <CommonRoundedButton
                  onClick={() => {
                    setIsOpenHeaderOptions(!isOpenHeaderOptions);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  {isOpenHeaderOptions ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </CommonRoundedButton>

                <div
                  className={`absolute top-12 -right-4 p-4 z-[10] border border-primary/25 bg-base-200 rounded-card ${
                    isOpenHeaderOptions ? "" : "hidden"
                  }`}
                >
                  <div className={`flex flex-col gap-4`}>
                    <CommonRoundedButton
                      onClick={() => {
                        setSelectedConversation(null);
                        setIsOpenHeaderOptions(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <X className="size-4" />
                    </CommonRoundedButton>

                    {!isOpenUtils && (
                      <CommonRoundedButton
                        className={` ${
                          isOpenUtils ? "btn-secondary" : "btn-primary"
                        }`}
                        onClick={() => {
                          setIsOpenUtils(!isOpenUtils);
                          setIsOpenHeaderOptions(false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <AppWindow className="size-4" />
                      </CommonRoundedButton>
                    )}

                    {selectedConversation.conversation.type !== "chatbot" && (
                      <CommonRoundedButton
                        onClick={() => {
                          setIsOpenHeaderOptions(false);
                          handleClickVideoCallButton();
                        }}
                        className={`${!channel ? "opacity-70" : ""}`}
                      >
                        <Video className="size-4" />
                      </CommonRoundedButton>
                    )}

                    {selectedConversation.conversation.type == "group" && (
                      <>
                        {authUser?.user?._id ==
                          selectedConversation?.users?.find(
                            (u) => u.isKeyMember
                          )?.user?._id && (
                          <CommonRoundedButton
                            className={`${
                              isOpenModalAddMember
                                ? "btn-secondary"
                                : "btn-primary"
                            }`}
                            onClick={() => {
                              setIsOpenHeaderOptions(false);
                              setIsOpenModalAddMember(true);
                            }}
                          >
                            <UserRoundPlus className="size-4" />
                          </CommonRoundedButton>
                        )}
                        <CommonRoundedButton
                          className={`${
                            isOpenModalMemberList
                              ? "btn-secondary"
                              : "btn-primary"
                          }`}
                          onClick={() => {
                            setIsOpenHeaderOptions(false);
                            setIsOpenModalMemberList(true);
                          }}
                        >
                          <UsersRound className="size-4" />
                        </CommonRoundedButton>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Chat Area */}
          <div className="flex flex-row">
            <div className="flex-1">
              {/* Chat Messages */}
              <div
                className={`overflow-y-auto p-4 pt-0 ${
                  pendingFile.length === 0
                    ? "!h-[calc(100vh-64px-64px-80px-1px)]"
                    : "!h-[calc(100vh-64px-64px-80px-112px)]"
                }`}
              >
                <Conversation translatedTo={userSettings.translatedTo} />
              </div>

              {/* Input */}
              <TextEditor
                text={text}
                setText={setText}
                pendingFile={pendingFile}
                setPendingFile={setPendingFile}
                handleEmojiSelect={handleEmojiSelect}
              />
            </div>
          </div>
        </div>

        {/* Utils Panel */}
        {isOpenUtils && (
          <div
            className={`absolute top-0 right-0 lg:relative lg:flex lg:flex-col w-64 z-[1] bg-base-100`}
          >
            <div className="border-l border-base-300">
              <div className="h-16 px-4 py-4 border-b border-base-300">
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <span className="font-semibold text-sm">
                    {t("utils.title")}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-[calc(100vh-64px-64px)] overflow-y-auto flex flex-col justify-between border-l border-base-300">
              <div>
                <div className="sm:hidden h-16 flex items-center justify-center border-b border-base-300">
                  <CommonRoundedButton
                    className={`${
                      isOpenUtils ? "btn-secondary" : "btn-primary"
                    }`}
                    onClick={() => {
                      setIsOpenUtils(!isOpenUtils);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <AppWindow className="size-4" />
                  </CommonRoundedButton>
                </div>

                {/* Settings */}
                <div className="flex flex-col">
                  <div
                    className={`h-16 border-base-300 flex items-center justify-center lg:justify-start px-4 cursor-pointer border-b ${
                      useUtils.isOpenSettings
                        ? "bg-base-300"
                        : "hover:bg-base-200"
                    }`}
                    onClick={() => {
                      setUseUtils((prev) => {
                        return {
                          ...prev,
                          isOpenSettings: !prev.isOpenSettings,
                        };
                      });
                    }}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        {/* <Settings className="size-4" /> */}
                        <span className="text-sm font-semibold">
                          {t("utils.settings.title")}
                        </span>
                      </div>

                      {useUtils.isOpenSettings ? (
                        <>
                          <ChevronUp className="size-4" />
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-4" />
                        </>
                      )}
                    </div>
                  </div>
                  {useUtils.isOpenSettings && (
                    <div>
                      <div className="h-16 border-base-300 flex items-center justify-between px-4 border-b">
                        <div className="flex gap-2 items-center">
                          <BellIcon className="size-4" />
                          <span className="text-sm">
                            {t("utils.settings.getNotifications.label")}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <CommonRoundedButton
                            onClick={() => {
                              handleUpdateChatSettings({
                                ...userSettings,
                                getNotifications: true,
                              });
                            }}
                            type={
                              userSettings.getNotifications
                                ? "primary"
                                : "outlined hover:btn-primary"
                            }
                            className={
                              isUpdatingChatSettings ||
                              userSettings.getNotifications
                                ? "pointer-events-none opacity-70"
                                : ""
                            }
                          >
                            <Check className="size-4" />
                          </CommonRoundedButton>
                          <CommonRoundedButton
                            onClick={() => {
                              handleUpdateChatSettings({
                                ...userSettings,
                                getNotifications: false,
                              });
                            }}
                            type={
                              !userSettings.getNotifications
                                ? "primary"
                                : "outlined hover:btn-primary"
                            }
                            className={
                              isUpdatingChatSettings ||
                              !userSettings.getNotifications
                                ? "pointer-events-none opacity-70"
                                : ""
                            }
                          >
                            <X className="size-4" />
                          </CommonRoundedButton>
                        </div>
                      </div>
                      <div className="h-16 border-base-300 flex items-center justify-between px-4 border-b">
                        <div className="flex gap-2 items-center">
                          <Pin className="size-4" />
                          <span className="text-sm">
                            {t("utils.settings.isPinned.label")}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <CommonRoundedButton
                            onClick={() => {
                              handleUpdateChatSettings({
                                ...userSettings,
                                isPinned: true,
                              });
                            }}
                            type={
                              userSettings.isPinned
                                ? "primary"
                                : "outlined hover:btn-primary"
                            }
                            className={
                              isUpdatingChatSettings || userSettings.isPinned
                                ? "pointer-events-none opacity-70"
                                : ""
                            }
                          >
                            <Check className="size-4" />
                          </CommonRoundedButton>
                          <CommonRoundedButton
                            onClick={() => {
                              handleUpdateChatSettings({
                                ...userSettings,
                                isPinned: false,
                              });
                            }}
                            type={
                              !userSettings.isPinned
                                ? "primary"
                                : "outlined hover:btn-primary"
                            }
                            className={
                              isUpdatingChatSettings || !userSettings.isPinned
                                ? "pointer-events-none opacity-70"
                                : ""
                            }
                          >
                            <X className="size-4" />
                          </CommonRoundedButton>
                        </div>
                      </div>

                      <div className="p-4 border-b border-base-300">
                        <div className="text-sm mb-2">
                          {t("utils.settings.translatedTo.label")}
                        </div>
                        <CostumedSelect
                          placeholder={t(
                            "utils.settings.translatedTo.placeholder"
                          )}
                          options={languageSelection}
                          onSelect={(option) =>
                            // setUserSettings((prev) => ({
                            //   ...prev,
                            //   translatedTo: option._id,
                            // })),
                            handleUpdateChatSettings({
                              ...userSettings,
                              translatedTo: option._id,
                            })
                          }
                          defaultValue={languageSelection.find(
                            (lang) => lang._id === userSettings.translatedTo
                          )}
                          isDeselectAble={false}
                        />
                      </div>
                      {selectedConversation?.conversation?.type ===
                        "chatbot" && (
                        <div className="p-4 border-b border-base-300">
                          <div className="text-sm mb-2">
                            {t("utils.settings.chatbotLanguage.label")}
                          </div>
                          <CostumedSelect
                            placeholder={t(
                              "utils.settings.chatbotLanguage.placeholder"
                            )}
                            options={languageSelection}
                            onSelect={(option) =>
                              handleUpdateChatSettings({
                                ...userSettings,
                                language: option._id,
                              })
                            }
                            defaultValue={languageSelection.find(
                              (lang) => lang._id === userSettings.language
                            )}
                            isDeselectAble={false}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Images/Videos */}
                <div className="flex flex-col">
                  <div
                    className={`h-16 border-base-300 flex items-center justify-center lg:justify-start px-4 border-b ${
                      useUtils.isOpenImagesVideos
                        ? "bg-base-300 cursor-pointer"
                        : ""
                    }`}
                    onClick={() => {
                      setUseUtils((prev) => {
                        return {
                          ...prev,
                          isOpenImagesVideos: false,
                        };
                      });
                    }}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        {/* <Settings className="size-4" /> */}
                        <span className="text-sm font-semibold">
                          {t("utils.settings.imageVideo.label")}
                        </span>
                      </div>

                      {/* {useUtils.isOpenImagesVideos ? (
                      <>
                        <ChevronUp className="size-4" />
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-4" />
                      </>
                    )} */}
                    </div>
                  </div>
                  {true && (
                    <div className="min-h-16 border-base-300 p-4 border-b">
                      <div className="grid grid-cols-3 gap-4">
                        {imagesVideos.map((image, index) => {
                          if (index > 2 && !useUtils.isOpenImagesVideos)
                            return null; // Show only first 3 images/videos
                          return (
                            <div
                              key={index}
                              className="w-16 h-16 rounded-card overflow-hidden"
                            >
                              <Image
                                src={image}
                                alt={`Image ${index + 1}`}
                                width={64}
                                height={64}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {imagesVideos.length > 3 && (
                        <div className="flex text-sm items-center justify-center mt-4">
                          <CommonRoundedButton
                            onClick={() => {
                              setUseUtils((prev) => ({
                                ...prev,
                                isOpenImagesVideos: !prev.isOpenImagesVideos,
                              }));
                            }}
                            type="outlined"
                          >
                            {useUtils.isOpenImagesVideos ? (
                              <ChevronsUp className="size-4" />
                            ) : (
                              <ChevronsDown className="size-4" />
                            )}
                          </CommonRoundedButton>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Files */}
                <div className="flex flex-col">
                  <div
                    className={`h-16 border-base-300 flex items-center justify-center lg:justify-start px-4 border-b ${
                      useUtils.isOpenFiles ? "bg-base-300 cursor-pointer" : ""
                    }`}
                    onClick={() => {
                      setUseUtils((prev) => {
                        return {
                          ...prev,
                          isOpenFiles: false,
                        };
                      });
                    }}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        {/* <Settings className="size-4" /> */}
                        <span className="text-sm font-semibold">
                          {t("utils.settings.file.label")}
                        </span>
                      </div>

                      {/* {useUtils.isOpenImagesVideos ? (
                      <>
                        <ChevronUp className="size-4" />
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-4" />
                      </>
                    )} */}
                    </div>
                  </div>
                  {true && (
                    <div className="min-h-16 border-base-300 p-4 border-b">
                      <div className="grid grid-cols-3 gap-4">
                        {files.map((file, index) => {
                          if (index > 2 && !useUtils.isOpenFiles) return null; // Show only first 3 files
                          return (
                            <div
                              key={index}
                              className="w-16 h-16 rounded-card overflow-hidden"
                            >
                              <Image
                                src={file}
                                alt={`File ${index + 1}`}
                                width={64}
                                height={64}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {files.length > 3 && (
                        <div className="flex text-sm items-center justify-center mt-4">
                          <CommonRoundedButton
                            onClick={() => {
                              setUseUtils((prev) => ({
                                ...prev,
                                isOpenFiles: !prev.isOpenFiles,
                              }));
                            }}
                            type="outlined"
                          >
                            {useUtils.isOpenFiles ? (
                              <ChevronsUp className="size-4" />
                            ) : (
                              <ChevronsDown className="size-4" />
                            )}
                          </CommonRoundedButton>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className=" flex flex-col gap-4 p-4 pb-[15px]">
                {((authUser?.user._id ===
                  selectedConversation?.users.find((user) => user.isKeyMember)
                    ?.user._id &&
                  selectedConversation?.conversation.type === "group") ||
                  selectedConversation?.conversation.type !== "group") && (
                  <div
                    className="btn btn-outlined w-full hover:btn-error"
                    onClick={() => {
                      setIsOpenModalDeleteConversation(true);
                    }}
                  >
                    {t("utils.settings.button.deleteConversation")}
                  </div>
                )}

                {selectedConversation?.conversation?.type === "group" &&
                  selectedConversation?.users.length > 1 && (
                    <>
                      <div
                        className="btn btn-outlined w-full hover:btn-error"
                        onClick={() => {
                          setIsOpenModalLeaveGroup(true);
                        }}
                      >
                        {t("utils.settings.button.leaveGroup")}
                      </div>
                    </>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MEMBER LIST MODAL */}
      <CostumedModal
        open={isOpenModalMemberList}
        onClose={() => {
          setIsOpenModalMemberList(false);
        }}
        title={t("memberListModal.title")}
      >
        {({ close }) => {
          return (
            <div className={`pb-0 text-sm`}>
              <div className="space-y-3 -mt-2">
                <div className="form-control w-full">
                  <div className="flex items-center justify-between">
                    <label className="label">
                      <span className="label-text">
                        {selectedConversation.conversation.name}
                      </span>
                    </label>
                    <span className="label-text-alt">
                      {selectedConversation.users.length}{" "}
                      {t("memberListModal.quantity")}
                    </span>
                  </div>

                  <CostumedGroupChatMemberList
                    friends={selectedConversation.users}
                  ></CostumedGroupChatMemberList>
                </div>
              </div>
            </div>
          );
        }}
      </CostumedModal>

      {/* ADD MEMBERS MODAL */}
      <CostumedModal
        open={isOpenModalAddMember}
        onClose={() => {
          setIsOpenModalAddMember(false);
          setSelectedFriendIds([]);
          setFilterData({
            fullName: "",
            nativeLanguage: "",
            learningLanguage: "",
          });
        }}
        title={t("addMemberModal.title")}
      >
        {({ close }) => {
          return (
            <div>
              <div
                className={`pb-6 text-sm ${
                  isAddingMembersToGroup ? "pointer-events-none opacity-70" : ""
                }`}
              >
                <div className="space-y-3 -mt-2">
                  {/* GROUP MEMBERS */}
                  <div className="form-control w-full">
                    <div className="flex items-center justify-between">
                      <label className="label">
                        <span className="label-text">
                          {t("addMemberModal.selectFriends.label")}
                        </span>
                      </label>
                      <span className="label-text-alt">
                        {selectedFriendIds.length}{" "}
                        {t("addMemberModal.selectFriends.selected")}
                      </span>
                    </div>

                    <CostumedFriendSelectInModal
                      isLoadingGetFriends={isLoadingGetFriends}
                      friends={friends}
                      selectedFriends={selectedFriendIds}
                      onSelected={handleSelectedFriend}
                      onFiltered={(value) => {
                        setFilterData((prev) => ({
                          ...prev,
                          fullName: value,
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="">
                <button
                  className={`btn btn-primary w-full hover:btn-primary ${
                    isAddingMembersToGroup
                      ? "pointer-events-none opacity-70"
                      : ""
                  }`}
                  onClick={handleAddMembersToGroup}
                  // disabled={isAddingMembersToGroup}
                >
                  {isAddingMembersToGroup ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : null}
                  {t("addMemberModal.button.confirm")}
                </button>
              </div>
            </div>
          );
        }}
      </CostumedModal>

      {/* DELETE CONVERSATION MODAL */}
      <CostumedModal
        open={isOpenModalDeleteConversation}
        onClose={() => {
          setIsOpenModalDeleteConversation(false);
        }}
        title={t("deleteConversationModal.title")}
      >
        {({ close }) => {
          return (
            <div>
              {selectedConversation?.conversation?.type === "group" ? (
                <div className="pb-6 text-sm">
                  {t("deleteConversationModal.subtitle.group")}{" "}
                  <span className="font-semibold">
                    {selectedConversation?.conversation?.name}
                  </span>
                  ?
                </div>
              ) : selectedConversation?.conversation?.type === "private" ? (
                <div className="pb-6 text-sm">
                  {t("deleteConversationModal.subtitle.private")}{" "}
                  <span className="font-semibold">
                    {selectedConversation?.users[0]?.user?.fullName}
                  </span>
                  ?
                </div>
              ) : (
                <div className="pb-6 text-sm">
                  {t("deleteConversationModal.subtitle.chatbot.label")}{" "}
                  <span className="font-semibold">
                    {t("deleteConversationModal.subtitle.chatbot.name")}
                  </span>
                  ?
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  className="btn btn-outlined w-full"
                  onClick={() => {
                    setIsOpenModalDeleteConversation(false);
                  }}
                >
                  {t("deleteConversationModal.button.cancel")}
                </button>
                <button
                  className={`btn btn-primary w-full hover:btn-primary ${
                    isDeletingConversation
                      ? "pointer-events-none opacity-70"
                      : ""
                  }`}
                  onClick={handleDeleteConversation}
                  // disabled={isDeletingConversation}
                >
                  {isDeletingConversation ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : (
                    <>{t("deleteConversationModal.button.confirm")}</>
                  )}
                </button>
              </div>
            </div>
          );
        }}
      </CostumedModal>

      {/* LEAVE GROUP MODAL KEY MEMBER */}
      <CostumedModal
        open={isOpenModalLeaveGroup && iAmKeyMember}
        onClose={() => {
          setIsOpenModalLeaveGroup(false);
          setSelectedFriendIds([]);
        }}
        title={t("leaveGroupModal.title")}
      >
        {({ close }) => {
          return (
            <div>
              <div className="pb-6 text-sm">
                {t("leaveGroupModal.subtitle.isKeyMember.true.label")}{" "}
                <span className="font-semibold">
                  {/* {selectedConversation?.conversation?.type ==
                                  "private"
                                    ? selectedConversation?.users[0]?.user
                                        ?.fullName
                                    :  */}
                  {selectedConversation?.conversation?.name}
                </span>{" "}
                ({selectedConversation.users.length}{" "}
                {t("leaveGroupModal.subtitle.isKeyMember.true.quantity")})
              </div>
              <div className={`pb-6 text-sm`}>
                <div className="space-y-3 -mt-2">
                  <div className="form-control w-full">
                    <CostumedGroupChatUpdateMemberRoleList
                      friends={selectedConversation.users.filter(
                        (user) => user.user._id !== authUser?.user?._id
                      )}
                      isLeaving={isLeavingGroup}
                      selectedFriends={selectedFriendIds}
                      onSelected={handleSelectedFriendLeaveGroup}
                    ></CostumedGroupChatUpdateMemberRoleList>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className="btn btn-outlined w-full"
                  onClick={() => {
                    setIsOpenModalLeaveGroup(false);
                    setSelectedFriendIds([]);
                  }}
                >
                  {t("leaveGroupModal.button.isKeyMember.true.cancel")}
                </button>
                <button
                  className={`btn btn-primary w-full hover:btn-primary  ${
                    isLeavingGroup ? "pointer-events-none opacity-70" : ""
                  }`}
                  onClick={handleLeaveGroup}
                >
                  {isLeavingGroup ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : (
                    <>{t("leaveGroupModal.button.isKeyMember.true.confirm")}</>
                  )}
                </button>
              </div>
            </div>
          );
        }}
      </CostumedModal>

      {/* LEAVE GROUP MODAL */}
      <CostumedModal
        open={isOpenModalLeaveGroup && !iAmKeyMember}
        onClose={() => {
          setIsOpenModalLeaveGroup(false);
        }}
        title={t("leaveGroupModal.title")}
      >
        {({ close }) => {
          return (
            <div>
              {selectedConversation?.conversation?.type === "group" ? (
                <div className="pb-6 text-sm">
                  {t("leaveGroupModal.subtitle.isKeyMember.false")}{" "}
                  <span className="font-semibold">
                    {selectedConversation?.conversation?.name}
                  </span>
                  ?
                </div>
              ) : // selectedConversation?.conversation?.type ===
              //   "private" ? (
              //   <div className="pb-6 text-sm">
              //     Bạn có chắc muốn rời khỏi cuộc trò chuyện với{" "}
              //     <span className="font-semibold">
              //       {
              //         selectedConversation?.users[0]?.user
              //           ?.fullName
              //       }
              //     </span>{" "}
              //     không?
              //   </div>
              // ) :
              null}
              <div className="grid grid-cols-2 gap-4">
                <button
                  className="btn btn-outlined w-full"
                  onClick={() => {
                    setIsOpenModalLeaveGroup(false);
                  }}
                >
                  {t("leaveGroupModal.button.isKeyMember.false.cancel")}
                </button>
                <button
                  className={`btn btn-primary w-full hover:btn-primary ${
                    isLeavingGroup ? "pointer-events-none opacity-70" : ""
                  }`}
                  onClick={handleLeaveGroup}
                  // disabled={isLeavingGroup}
                >
                  {isLeavingGroup ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : (
                    <>
                      {" "}
                      {t("leaveGroupModal.button.isKeyMember.false.confirm")}
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        }}
      </CostumedModal>
    </>
  );
};

export default ChatWindow;
