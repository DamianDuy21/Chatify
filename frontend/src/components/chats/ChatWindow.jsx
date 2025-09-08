import {
  AppWindow,
  BellIcon,
  Check,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  ChevronUp,
  LoaderIcon,
  Pin,
  UserRoundPlus,
  UsersRound,
  Video,
  X,
} from "lucide-react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  addMembersToGroupAPI,
  deleteConversationAPI,
  getFriendsCouldBeAddedToGroupAPI,
  getVideoCallTokenAPI,
  leaveGroupAPI,
  updateChatSettingsAPI,
} from "../../lib/api.js";
import { useChatStore } from "../../stores/useChatStore";
import { useLanguageStore } from "../../stores/useLanguageStore.js";
import CommonRoundedButton from "../buttons/CommonRoundedButton";
import CostumedAvatarGroupChat from "../costumed/CostumedAvatarGroupChat.jsx";
import CostumedFriendSelectInModal from "../costumed/CostumedFriendSelectInModal.jsx";
import CostumedGroupChatMemberList from "../costumed/CostumedGroupChatMemberList.jsx";
import CostumedModal from "../costumed/CostumedModal";
import CostumedSelect from "../costumed/CostumedSelect.jsx";
import { showToast } from "../costumed/CostumedToast.jsx";
import Conversation from "./Conversation";
import TextEditor from "./TextEditor";

import { StreamChat } from "stream-chat";
import { useAuthStore } from "../../stores/useAuthStore.js";
import CostumedGroupChatUpdateMemberRoleList from "../costumed/CostumedGroupChatUpdateMemberRoleList.jsx";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatWindow = () => {
  const authUser = useAuthStore((s) => s.authUser);
  const onlineUsers = useAuthStore((s) => s.onlineUsers);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isLoadingChannel, setIsLoadingChannel] = useState(false);

  const handleClickVideoCallButton = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/video-call/${channel.id}`;
      window.open(callUrl, "_blank", "noopener,noreferrer");
    }
  };

  // const getMessages = useChatStore((s) => s.getMessages);
  // const isGettingMessages = useChatStore((s) => s.isGettingMessages);
  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );

  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);

  const languages = useLanguageStore((s) => s.languages);

  // const closeDeleteHistoryRef = useRef();
  const closeDeleteChatRef = useRef();
  const closeLeaveChatRef = useRef();
  const closeMemberListRef = useRef();
  const closeAddMemberRef = useRef();
  const closeLeaveGroupRef = useRef(null);

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

  // add member to group chat
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);

  const { data: videoCallTokenData } = useQuery({
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
      console.log("Add members to group chat data:", data);
      setConversations(
        conversations.map((conversation) =>
          conversation.conversation._id == data.data.conversation._id
            ? {
                ...conversation,
                users: [...conversation.users, ...data.data.users],
              }
            : conversation
        )
      );
      setSelectedConversation({
        ...selectedConversation,
        users: [...selectedConversation.users, ...data.data.users],
      });
      if (closeAddMemberRef.current) closeAddMemberRef.current();
      showToast({
        message: data?.message || "Friend request cancelled successfully!",
        type: "success",
      });
    },
    onError: (error) => {
      console.log("Cancel friend request error:", error);
      showToast({
        message:
          error?.response?.data?.message || "Failed to cancel friend request",
        type: "error",
      });
    },
  });

  const {
    mutate: updateChatSettingsMutation,
    isPending: isUpdatingChatSettings,
  } = useMutation({
    mutationFn: updateChatSettingsAPI,
    onSuccess: (data) => {
      console.log("Update chat settings data:", data);
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
      setSelectedConversation({
        ...selectedConversation,
        conversation: {
          ...selectedConversation.conversation,
          settings: data.data.conversation.settings,
        },
      });
      showToast({
        message: data?.message || "Cập nhật cài đặt nhóm thành công!",
        type: "success",
      });
    },
    onError: (error) => {
      console.log("Update chat settings error:", error);
      showToast({
        message:
          error?.response?.data?.message || "Failed to update chat settings",
        type: "error",
      });
    },
  });

  const { mutate: leaveGroupMutation, isPending: isLeavingGroup } = useMutation(
    {
      mutationFn: leaveGroupAPI,
      onSuccess: (data) => {
        console.log("Leave group data:", data);
        setConversations(
          conversations.filter(
            (conversation) =>
              conversation.conversation._id !== data.data.conversation._id
          )
        );
        setSelectedConversation(null);
        if (closeLeaveGroupRef.current) closeLeaveGroupRef.current();
        showToast({
          message: data?.message || "Left group successfully!",
          type: "success",
        });
      },
      onError: (error) => {
        console.log("Cancel friend request error:", error);
        showToast({
          message: error?.response?.data?.message || "Failed to leave group",
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
      console.log("Delete conversation data:", data);
      setConversations(
        conversations.filter(
          (conversation) =>
            conversation.conversation._id !== data.data.conversation._id
        )
      );
      setSelectedConversation(null);
      showToast({
        message: data?.message || "Delete conversation successfully!",
        type: "success",
      });
    },
    onError: (error) => {
      console.log("Cancel friend request error:", error);
      showToast({
        message:
          error?.response?.data?.message || "Failed to delete conversation",
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
    const myId = authUser?.user?._id;
    const keyMemberId = selectedConversation?.users.find((u) => u.isKeyMember)
      ?.user?._id;
    const iAmKeyMember = String(myId) == String(keyMemberId);
    if (
      iAmKeyMember &&
      (!selectedFriendIds?.length || !selectedFriendIds[0]) &&
      selectedConversation?.users.length > 1
    ) {
      showToast({
        message: "Vui lòng chọn trưởng nhóm mới",
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
        message: "Có lỗi xảy ra khi rời nhóm, vui lòng thử lại",
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
        message: "Vui lòng chọn ít nhất 1 bạn bè để thêm vào nhóm",
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
        message: error?.message || "Failed to fetch friends",
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
      setIsOpenUtils(false);
      setUseUtils({
        isOpenSettings: false,
        isOpenImagesVideos: false,
        isOpenFiles: false,
      });
      // getMessages(selectedConversation.conversation._id);
    }
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
  }, [selectedConversation]);

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
    if (!videoCallTokenData?.data.token || !authUser) {
      return;
    }

    try {
      setIsLoadingChannel(true);
      const client = StreamChat.getInstance(STREAM_API_KEY);

      await client.connectUser(
        {
          id: authUser?.user._id,
          name: authUser?.user.fullName,
          image: authUser?.user?.profile?.profilePic,
        },
        videoCallTokenData.data.token
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
        message: error?.message || "Error initializing chat",
        type: "error",
      });
    } finally {
      setIsLoadingChannel(false);
    }
  };

  useEffect(() => {
    if (selectedConversation.conversation.type !== "chatbot") initChat();
  }, [selectedConversation.conversation._id, authUser, videoCallTokenData]);

  return (
    <>
      <div className="h-[calc(100vh-64px)] flex relative">
        <div className="flex-1 ">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-base-300 gap-4">
            <div className="flex gap-3 items-center relative">
              <div className="avatar">
                <div className="w-10 rounded-full">
                  {selectedConversation.conversation?.type == "private" ? (
                    <img
                      src={
                        selectedConversation?.users[0]?.user?.profile
                          ?.profilePic
                      }
                      alt=""
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

              <div className="hidden sm:block">
                <h3 className="font-semibold text-sm">
                  {selectedConversation?.conversation?.type == "private"
                    ? selectedConversation?.users[0]?.user?.fullName
                    : selectedConversation?.conversation?.name}
                </h3>
                {selectedConversation?.conversation?.type !== "chatbot" ? (
                  <>
                    {selectedConversation?.users?.some(
                      (user) =>
                        user?.user?._id !== authUser?.user._id &&
                        onlineUsers.includes(user?.user?._id)
                    ) && (
                      <p className="text-xs text-success flex items-center gap-1">
                        <span className="size-2 rounded-full bg-success inline-block" />
                        Online
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs text-success flex items-center gap-1 opacity-70 line-clamp-1">
                      <span className="size-2 rounded-full bg-success inline-block" />
                      Sẵn sàng trò chuyện cùng bạn
                    </p>
                  </>
                )}
              </div>
              <div className="absolute -right-0 -bottom-0 sm:hidden">
                <span className="size-2 rounded-full bg-success inline-block" />
              </div>
            </div>

            <div className={`flex ${isOpenUtils ? "pr-64 lg:pr-0" : ""}`}>
              <div
                className={`flex gap-4 ${isOpenUtils ? "hidden sm:flex" : ""}`}
              >
                <div className="flex gap-2">
                  {selectedConversation.conversation.type == "group" && (
                    <>
                      <CostumedModal
                        trigger={
                          <CommonRoundedButton
                            className={`${
                              isOpenModalMemberList
                                ? "btn-secondary"
                                : "btn-primary"
                            }`}
                          >
                            <UsersRound className="size-4" />
                          </CommonRoundedButton>
                        }
                        onOpen={() => {
                          setIsOpenModalMemberList(true);
                        }}
                        onClose={() => {
                          setIsOpenModalMemberList(false);
                        }}
                        title="Thành viên nhóm"
                      >
                        {({ close }) => {
                          closeMemberListRef.current = close;
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
                                      {selectedConversation.users.length} thành
                                      viên
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
                      <CostumedModal
                        trigger={
                          <CommonRoundedButton
                            className={`${
                              isOpenModalAddMember
                                ? "btn-secondary"
                                : "btn-primary"
                            }`}
                          >
                            <UserRoundPlus className="size-4" />
                          </CommonRoundedButton>
                        }
                        onOpen={() => {
                          setIsOpenModalAddMember(true);
                        }}
                        onClose={() => {
                          setIsOpenModalAddMember(false);
                          setSelectedFriendIds([]);
                          setFilterData({
                            fullName: "",
                            nativeLanguage: "",
                            learningLanguage: "",
                          });
                        }}
                        title="Thêm thành viên"
                      >
                        {({ close }) => {
                          closeAddMemberRef.current = close;
                          return (
                            <div>
                              <div
                                className={`pb-6 text-sm ${
                                  isAddingMembersToGroup
                                    ? "pointer-events-none"
                                    : ""
                                }`}
                              >
                                <div className="space-y-3 -mt-2">
                                  {/* GROUP MEMBERS */}
                                  <div className="form-control w-full">
                                    <div className="flex items-center justify-between">
                                      <label className="label">
                                        <span className="label-text">
                                          Bạn bè
                                        </span>
                                      </label>
                                      <span className="label-text-alt">
                                        {selectedFriendIds.length} đã chọn
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
                                  className="btn btn-primary w-full hover:btn-primary"
                                  onClick={handleAddMembersToGroup}
                                >
                                  {isAddingMembersToGroup ? (
                                    <LoaderIcon className="size-4 animate-spin" />
                                  ) : null}
                                  Xác nhận
                                </button>
                              </div>
                            </div>
                          );
                        }}
                      </CostumedModal>
                    </>
                  )}

                  {selectedConversation.conversation.type !== "chatbot" && (
                    <CommonRoundedButton onClick={handleClickVideoCallButton}>
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
                className={`flex flex-col relative ${
                  isOpenUtils ? "block sm:hidden" : "hidden"
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
                  className={`absolute top-12 -right-4 p-4 z-10 border border-primary/25 bg-base-200 rounded-card ${
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
                    <CommonRoundedButton
                      onClick={() => {
                        setIsOpenHeaderOptions(false);
                        handleClickVideoCallButton();
                      }}
                    >
                      <Video className="size-4" />
                    </CommonRoundedButton>
                    {selectedConversation.conversation.type == "group" && (
                      <>
                        <CostumedModal
                          trigger={
                            <CommonRoundedButton
                              className={`${
                                isOpenModalAddMember
                                  ? "btn-secondary"
                                  : "btn-primary"
                              }`}
                            >
                              <UserRoundPlus className="size-4" />
                            </CommonRoundedButton>
                          }
                          onOpen={() => {
                            setIsOpenModalAddMember(true);
                          }}
                          onClose={() => {
                            setIsOpenModalAddMember(false);
                            setSelectedFriendIds([]);
                            setFilterData({
                              fullName: "",
                              nativeLanguage: "",
                              learningLanguage: "",
                            });
                          }}
                          title="Thêm thành viên"
                        >
                          {({ close }) => {
                            closeAddMemberRef.current = close;
                            return (
                              <div>
                                <div
                                  className={`pb-6 text-sm ${
                                    isAddingMembersToGroup
                                      ? "pointer-events-none"
                                      : ""
                                  }`}
                                >
                                  <div className="space-y-3 -mt-2">
                                    {/* GROUP MEMBERS */}
                                    <div className="form-control w-full">
                                      <div className="flex items-center justify-between">
                                        <label className="label">
                                          <span className="label-text">
                                            Bạn bè
                                          </span>
                                        </label>
                                        <span className="label-text-alt">
                                          {selectedFriendIds.length} đã chọn
                                        </span>
                                      </div>

                                      <CostumedFriendSelectInModal
                                        isLoadingGetFriends={
                                          isLoadingGetFriends
                                        }
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
                                    className="btn btn-primary w-full hover:btn-primary"
                                    onClick={handleAddMembersToGroup}
                                  >
                                    {isAddingMembersToGroup ? (
                                      <LoaderIcon className="size-4 animate-spin" />
                                    ) : null}
                                    Xác nhận
                                  </button>
                                </div>
                              </div>
                            );
                          }}
                        </CostumedModal>
                        <CostumedModal
                          trigger={
                            <CommonRoundedButton
                              className={`${
                                isOpenModalMemberList
                                  ? "btn-secondary"
                                  : "btn-primary"
                              }`}
                            >
                              <UsersRound className="size-4" />
                            </CommonRoundedButton>
                          }
                          onOpen={() => {
                            setIsOpenModalMemberList(true);
                          }}
                          onClose={() => {
                            setIsOpenModalMemberList(false);
                          }}
                          title="Thành viên nhóm"
                        >
                          {({ close }) => {
                            closeMemberListRef.current = close;
                            return (
                              <div className={`pb-0 text-sm`}>
                                <div className="space-y-3 -mt-2">
                                  <div className="form-control w-full">
                                    <div className="flex items-center justify-between">
                                      <label className="label">
                                        <span className="label-text">
                                          {
                                            selectedConversation.conversation
                                              .name
                                          }
                                        </span>
                                      </label>
                                      <span className="label-text-alt">
                                        {selectedConversation.users.length}{" "}
                                        thành viên
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
                className={`overflow-y-auto p-4 ${
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
            className={`absolute top-0 right-0 lg:relative lg:flex lg:flex-col w-64 z-9 bg-base-100`}
          >
            <div className="border-l border-base-300">
              <div className="h-16 px-4 py-4 border-b border-base-300">
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <span className="font-semibold text-sm">
                    Thông tin cuộc trò chuyện
                  </span>
                </div>
              </div>
            </div>

            <div className="h-[calc(100vh-64px-64px)] overflow-y-auto flex flex-col justify-between border-l border-base-300">
              <div>
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
                        <span className="text-sm font-semibold">Cài đặt</span>
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
                          <span className="text-sm">Thông báo</span>
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
                                ? "pointer-events-none"
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
                                ? "pointer-events-none"
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
                          <span className="text-sm">Ghim</span>
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
                                ? "pointer-events-none"
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
                                ? "pointer-events-none"
                                : ""
                            }
                          >
                            <X className="size-4" />
                          </CommonRoundedButton>
                        </div>
                      </div>

                      <div className="p-4 border-b border-base-300">
                        <div className="text-sm mb-2">Ngôn ngữ phiên dịch</div>
                        <CostumedSelect
                          placeholder={"Ngôn ngữ phiên dịch"}
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
                        />
                      </div>
                      {selectedConversation?.conversation?.type ===
                        "chatbot" && (
                        <div className="p-4 border-b border-base-300">
                          <div className="text-sm mb-2">Ngôn ngữ Chatbot</div>
                          <CostumedSelect
                            placeholder={"Ngôn ngữ Chatbot"}
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
                          Ảnh / Video
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
                              <img src={image} alt={`Image ${index + 1}`} />
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
                        <span className="text-sm font-semibold">Files</span>
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
                              <img src={file} alt={`File ${index + 1}`} />
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
                  <CostumedModal
                    trigger={
                      <div className="">
                        <div className="btn btn-outlined w-full hover:btn-error">
                          Xóa cuộc trò chuyện
                        </div>
                      </div>
                    }
                    title="Xóa cuộc trò chuyện"
                  >
                    {({ close }) => {
                      closeDeleteChatRef.current = close;
                      return (
                        <div>
                          {selectedConversation?.conversation?.type ===
                          "group" ? (
                            <div className="pb-6 text-sm">
                              Bạn có chắc muốn xóa cuộc trò chuyện nhóm{" "}
                              <span className="font-semibold">
                                {selectedConversation?.conversation?.name}
                              </span>{" "}
                              không?
                            </div>
                          ) : selectedConversation?.conversation?.type ===
                            "private" ? (
                            <div className="pb-6 text-sm">
                              Bạn có chắc muốn xóa cuộc trò chuyện với{" "}
                              <span className="font-semibold">
                                {selectedConversation?.users[0]?.user?.fullName}
                              </span>{" "}
                              không?
                            </div>
                          ) : (
                            <div className="pb-6 text-sm">
                              Bạn có chắc muốn xóa cuộc trò chuyện với{" "}
                              <span className="font-semibold">Chatbot</span>{" "}
                              không?
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <button
                              className="btn btn-outlined w-full"
                              onClick={() => {
                                close();
                              }}
                            >
                              Để sau
                            </button>
                            <button
                              className="btn btn-primary w-full hover:btn-primary"
                              onClick={handleDeleteConversation}
                            >
                              {isDeletingConversation ? (
                                <LoaderIcon className="size-4 animate-spin" />
                              ) : (
                                <> Xác nhận</>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    }}
                  </CostumedModal>
                )}

                {selectedConversation?.conversation?.type === "group" &&
                  (authUser?.user._id ===
                    selectedConversation?.users.find((user) => user.isKeyMember)
                      ?.user._id && selectedConversation?.users.length > 1 ? (
                    <>
                      <CostumedModal
                        trigger={
                          <div className="">
                            <div className="btn btn-outlined w-full hover:btn-error">
                              Rời khỏi cuộc trò chuyện
                            </div>
                          </div>
                        }
                        title="Rời khỏi cuộc trò chuyện"
                        onOpen={() => {
                          setSelectedFriendIds([]);
                        }}
                        onClose={() => {
                          setSelectedFriendIds([]);
                        }}
                      >
                        {({ close }) => {
                          closeLeaveChatRef.current = close;
                          return (
                            <div>
                              <div className="pb-6 text-sm">
                                Bạn cần chọn trưởng nhóm mới cho{" "}
                                <span className="font-semibold">
                                  {/* {selectedConversation?.conversation?.type ==
                                  "private"
                                    ? selectedConversation?.users[0]?.user
                                        ?.fullName
                                    :  */}
                                  {selectedConversation?.conversation?.name}
                                </span>{" "}
                                ({selectedConversation.users.length} thành viên)
                              </div>
                              <div className={`pb-6 text-sm`}>
                                <div className="space-y-3 -mt-2">
                                  <div className="form-control w-full">
                                    <CostumedGroupChatUpdateMemberRoleList
                                      friends={selectedConversation.users.filter(
                                        (user) =>
                                          user.user._id !== authUser?.user?._id
                                      )}
                                      isLeaving={isLeavingGroup}
                                      selectedFriends={selectedFriendIds}
                                      onSelected={
                                        handleSelectedFriendLeaveGroup
                                      }
                                    ></CostumedGroupChatUpdateMemberRoleList>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <button
                                  className="btn btn-outlined w-full"
                                  onClick={() => {
                                    close();
                                  }}
                                >
                                  Để sau
                                </button>
                                <button
                                  className={`btn btn-primary w-full hover:btn-primary  ${
                                    isLeavingGroup ? "pointer-events-none" : ""
                                  }`}
                                  onClick={handleLeaveGroup}
                                >
                                  {isLeavingGroup ? (
                                    <LoaderIcon className="size-4 animate-spin" />
                                  ) : (
                                    <> Xác nhận và rời khỏi nhóm</>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        }}
                      </CostumedModal>
                    </>
                  ) : (
                    <>
                      <CostumedModal
                        trigger={
                          <div className="">
                            <div className="btn btn-outlined w-full hover:btn-error">
                              Rời khỏi cuộc trò chuyện
                            </div>
                          </div>
                        }
                        title="Thông báo"
                      >
                        {({ close }) => {
                          closeLeaveChatRef.current = close;
                          return (
                            <div>
                              {selectedConversation?.conversation?.type ===
                              "group" ? (
                                <div className="pb-6 text-sm">
                                  Bạn có chắc muốn rời khỏi cuộc trò chuyện nhóm{" "}
                                  <span className="font-semibold">
                                    {selectedConversation?.conversation?.name}
                                  </span>{" "}
                                  không?
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
                                    close();
                                  }}
                                >
                                  Để sau
                                </button>
                                <button
                                  className="btn btn-primary w-full hover:btn-primary"
                                  onClick={handleLeaveGroup}
                                >
                                  {isLeavingGroup ? (
                                    <LoaderIcon className="size-4 animate-spin" />
                                  ) : (
                                    <> Xác nhận</>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        }}
                      </CostumedModal>
                    </>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatWindow;
