"use client";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  LoaderIcon,
  MessageCircleOff,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import CommonRoundedButton from "@/components/buttons/CommonRoundedButton.jsx";
import ConversationCard_ChatsPage_Sidebar from "@/components/cards/ConversationCard_ChatsPage_Sidebar.jsx";
import ChatWindow from "@/components/chats/ChatWindow.jsx";
import CostumedDebounceInput from "@/components/costumed/CostumedDebounceInput.jsx";
import CostumedFriendSelectInModal from "@/components/costumed/CostumedFriendSelectInModal.jsx";
import CostumedModal from "@/components/costumed/CostumedModal.jsx";
import { showToast } from "@/components/costumed/CostumedToast.jsx";
import CommonPageLoader from "@/components/loaders/CommonPageLoader.jsx";
import NoChatSelected from "@/components/noFounds/NoChatSelected.jsx";
import NoDataCommon from "@/components/noFounds/NoDataCommon.jsx";
import { createGroupAPI, getFriendsAPI } from "@/lib/api.js";
import { isConversationFitFilter } from "@/lib/utils.js";
import { useAuthStore } from "@/stores/useAuthStore.js";
import { useChatStore } from "@/stores/useChatStore.js";
import { useNotificationStore } from "@/stores/useNotificationStore.js";

const ChatsPage = () => {
  const createGroup_NotificationStore = useNotificationStore(
    (s) => s.createGroup_NotificationStore
  );
  const authUser = useAuthStore((s) => s.authUser);

  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const isGettingConversations = useChatStore((s) => s.isGettingConversations);
  const getConversations = useChatStore((s) => s.getConversations);
  const conversationNameFilter = useChatStore((s) => s.conversationNameFilter);
  const setConversationNameFilter = useChatStore(
    (s) => s.setConversationNameFilter
  );
  const totalConversationQuantityAboveFilter = useChatStore(
    (s) => s.totalConversationQuantityAboveFilter
  );
  const setTotalConversationQuantityAboveFilter = useChatStore(
    (s) => s.setTotalConversationQuantityAboveFilter
  );
  const totalConversationQuantityUnderFilter = useChatStore(
    (s) => s.totalConversationQuantityUnderFilter
  );
  const setTotalConversationQuantityUnderFilter = useChatStore(
    (s) => s.setTotalConversationQuantityUnderFilter
  );

  const currentConversationPage = useChatStore(
    (s) => s.currentConversationPage
  );
  const setCurrentConversationPage = useChatStore(
    (s) => s.setCurrentConversationPage
  );
  const [isLoadingByMoreConversations, setIsLoadingByMoreConversations] =
    useState(false);

  const closeRef = useRef(null);
  const didMountRef = useRef(false);

  const [
    isOpenSearchFriendsInSmallScreen,
    setIsOpenSearchFriendsInSmallScreen,
  ] = useState(false);

  const [isOpenModalCreateGroup, setIsOpenModalCreateGroup] = useState(false);

  const [friends, setFriends] = useState([]);
  const [isLoadingGetFriends, setIsLoadingGetFriends] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // filter friends
  const [filterData, setFilterData] = useState({
    fullName: "",
    nativeLanguage: "",
    learningLanguage: "",
  });

  // create group chat
  const [groupName, setGroupName] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);

  const handleSelectedFriend = (friend) => {
    if (!friend) return;
    const isAlreadySelected = selectedFriendIds.includes(friend._id);
    if (isAlreadySelected) {
      setSelectedFriendIds((prev) => prev.filter((id) => id !== friend._id));
    } else {
      setSelectedFriendIds((prev) => [...prev, friend._id]);
    }
  };

  const fetchFriends = async (args = {}) => {
    try {
      setIsLoadingGetFriends(true);
      const { data } = await getFriendsAPI(args);
      setFriends(data.users);
    } catch (error) {
      showToast({
        message: error?.message || "Failed to fetch friends",
        type: "error",
      });
    } finally {
      setIsLoadingGetFriends(false);
    }
  };
  const { mutate: createGroupMutation, isPending: isCreatingGroup } =
    useMutation({
      mutationFn: createGroupAPI,
      onSuccess: (data) => {
        setTotalConversationQuantityAboveFilter(
          totalConversationQuantityAboveFilter + 1
        );
        const isFitFilter = isConversationFitFilter({
          conversation: data.data.conversation,
          conversationNameFilter,
          authUser,
        });
        if (isFitFilter) {
          setConversations([data.data.conversation, ...conversations]);
          setTotalConversationQuantityUnderFilter(
            totalConversationQuantityUnderFilter + 1
          );
        }
        if (closeRef.current) closeRef.current();
        showToast({
          message: data?.message || "Group created successfully!",
          type: "success",
        });
        createGroup_NotificationStore({
          userIds: [...selectedFriendIds],
          conversation: data.data.conversation,
          notifications: data.data.notifications,
          user: authUser.user,
        });
      },
      onError: (error) => {
        showToast({
          message: error?.response?.data?.message || "Failed to create group",
          type: "error",
        });
      },
    });

  const handleCreateGroup = () => {
    if (selectedFriendIds.length < 2) {
      showToast({
        message: "Vui lòng chọn ít nhất 2 thành viên khác để tạo nhóm",
        type: "error",
      });
      return;
    }
    if (selectedFriendIds.length > 20) {
      showToast({
        message: "Số lượng thành viên trong nhóm không được vượt quá 20",
        type: "error",
      });
      return;
    }
    if (groupName.trim().length === 0) {
      showToast({
        message: "Vui lòng nhập tên nhóm",
        type: "error",
      });
      return;
    }
    createGroupMutation({
      name: groupName.trim(),
      memberIds: [authUser.user._id, ...selectedFriendIds],
    });
  };

  useEffect(() => {
    if (!isOpenModalCreateGroup) return;
    const { fullName, nativeLanguage, learningLanguage } = filterData;
    fetchFriends({
      fullName,
      nativeLanguage,
      learningLanguage,
      page: currentPage,
    });
  }, [currentPage, isOpenModalCreateGroup]);

  useEffect(() => {
    if (!isOpenModalCreateGroup) return;
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

  useEffect(() => {
    didMountRef.current = false;
  }, []);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setCurrentConversationPage(1);
    getConversations({
      conversationName: conversationNameFilter || null,
      page: 1,
    });
  }, [conversationNameFilter]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (currentConversationPage === 1) return;
    getConversations({
      conversationName: conversationNameFilter || null,
      page: currentConversationPage,
    });
  }, [currentConversationPage]);

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      if (windowWidth > 1024) {
        setIsOpenSearchFriendsInSmallScreen(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (isLoadingByMoreConversations && !isGettingConversations) {
      setIsLoadingByMoreConversations(false);
    }
  }, [isGettingConversations]);

  if (isGettingConversations && !didMountRef.current) {
    return <CommonPageLoader className={"!min-h-[calc(100vh-64px)]"} />;
  }

  return (
    <>
      {/* p-4 sm:p-6 lg:p-6  */}
      <div className="min-h-[calc(100vh-64px)] relative flex">
        <div
          className={`${
            totalConversationQuantityAboveFilter === 0 ? "hidden" : ""
          } w-20 lg:w-64 bg-base-200 border-r border-base-300 flex flex-col h-[calc(100vh-64px)] ${
            isOpenSearchFriendsInSmallScreen
              ? "!w-64 absolute top-0 left-0 z-50"
              : ""
          }`}
        >
          <div className="h-16 px-4 flex items-center justify-center gap-2 border-b border-base-300">
            <div
              className={`hidden lg:flex w-full gap-2 ${
                isOpenSearchFriendsInSmallScreen ? "!flex" : ""
              }`}
            >
              <CostumedDebounceInput
                name="searchFriends"
                defaultValue={conversationNameFilter}
                placeholder={"Tìm kiếm..."}
                className={`input-sm ${
                  isOpenSearchFriendsInSmallScreen ? "!pr-9" : "!pr-9"
                }`}
                iconClassName={`!right-3`}
                onChange={(value) => {
                  setConversationNameFilter(value);
                }}
                // searchIcon={isOpenSearchFriendsInSmallScreen ? false : true}
                isSearching={
                  isGettingConversations && !isLoadingByMoreConversations
                }
              />
              <CostumedModal
                trigger={
                  <CommonRoundedButton>
                    <Plus className="size-4" />
                  </CommonRoundedButton>
                }
                onOpen={() => {
                  setIsOpenModalCreateGroup(true);
                }}
                onClose={() => {
                  setIsOpenModalCreateGroup(false);
                  setGroupName("");
                  setSelectedFriendIds([]);
                  setFilterData({
                    fullName: "",
                    nativeLanguage: "",
                    learningLanguage: "",
                  });
                }}
                title="Tạo nhóm"
              >
                {({ close }) => {
                  closeRef.current = close;
                  return (
                    <div>
                      <div
                        className={`pb-6 text-sm ${
                          isCreatingGroup ? "pointer-events-none" : ""
                        }`}
                      >
                        <div className="space-y-3 -mt-2">
                          {/* GROUP NAME */}
                          <div className="form-control w-full">
                            <div className="flex items-center justify-between">
                              <label className="label">
                                <span className="label-text">Tên nhóm</span>
                              </label>
                            </div>

                            <input
                              type="text"
                              placeholder={"Nhập tên nhóm"}
                              className="input input-bordered w-full text-sm"
                              value={groupName}
                              onChange={(e) => setGroupName(e.target.value)}
                              maxLength={50}
                            />
                          </div>

                          {/* GROUP MEMBERS */}
                          <div className="form-control w-full">
                            <div className="flex items-center justify-between">
                              <label className="label">
                                <span className="label-text">Thành viên</span>
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
                          onClick={() => {
                            handleCreateGroup();
                          }}
                        >
                          {isCreatingGroup ? (
                            <LoaderIcon className="size-4 animate-spin" />
                          ) : null}
                          Xác nhận
                        </button>
                      </div>
                    </div>
                  );
                }}
              </CostumedModal>
            </div>
            {!isOpenSearchFriendsInSmallScreen ? (
              <CommonRoundedButton
                onClick={() => {
                  //   setIsOpenFilter(true);
                  setIsOpenSearchFriendsInSmallScreen(true);
                }}
                className={"flex lg:hidden"}
              >
                <ChevronRight className="size-4" />
              </CommonRoundedButton>
            ) : (
              <CommonRoundedButton
                onClick={() => {
                  //   setIsOpenFilter(true);
                  setIsOpenSearchFriendsInSmallScreen(false);
                }}
                className={"flex lg:hidden"}
              >
                <ChevronLeft className="size-4" />
              </CommonRoundedButton>
            )}
          </div>

          {conversations.length > 0 ? (
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation, index) => (
                <div key={conversation?.conversation._id}>
                  <ConversationCard_ChatsPage_Sidebar
                    isFirstCard={index}
                    conversation={conversation}
                    onClick={() => {
                      setIsOpenSearchFriendsInSmallScreen(false);
                    }}
                    isShowAllWidth={isOpenSearchFriendsInSmallScreen}
                  />
                </div>
              ))}
              {conversations.length < totalConversationQuantityUnderFilter && (
                <div className="flex justify-center items-center h-[62px]">
                  <CommonRoundedButton
                    onClick={() => {
                      setCurrentConversationPage(currentConversationPage + 1);
                      setIsLoadingByMoreConversations(true);
                    }}
                    className={`${
                      isLoadingByMoreConversations ? "pointer-events-none" : ""
                    }`}
                  >
                    {isLoadingByMoreConversations ? (
                      <LoaderIcon className="size-4 animate-spin" />
                    ) : (
                      <ChevronsDown className="size-4" />
                    )}
                  </CommonRoundedButton>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              {!isOpenSearchFriendsInSmallScreen ? (
                <div className="h-16 flex items-center justify-center">
                  {isGettingConversations ? (
                    <LoaderIcon className="size-6 animate-spin" />
                  ) : (
                    <MessageCircleOff className="size-6" />
                  )}
                </div>
              ) : (
                <NoDataCommon
                  title={"Không có kết quả phù hợp"}
                  content={"Thử tìm kiếm với từ khóa khác"}
                  classNameTitle={"text-sm"}
                  classNameContent={"text-xs"}
                />
              )}
            </div>
          )}
        </div>

        <div
          className={`flex-1 ${
            isOpenSearchFriendsInSmallScreen ? "ml-20" : ""
          }`}
        >
          {selectedConversation ? (
            <ChatWindow />
          ) : (
            <div className="p-16 flex items-center justify-center h-full">
              <NoChatSelected
                hasFriends={totalConversationQuantityAboveFilter > 0}
              ></NoChatSelected>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatsPage;
