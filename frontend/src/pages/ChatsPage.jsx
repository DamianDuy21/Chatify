import {
  ChevronLeft,
  ChevronRight,
  CircleFadingPlus,
  CirclePlus,
  Info,
  LoaderIcon,
  Plus,
  UsersRound,
} from "lucide-react";
import { use, useEffect, useRef, useState } from "react";

import CommonRoundedButton from "../components/buttons/CommonRoundedButton.jsx";
import ConversationCard_ChatsPage_Sidebar from "../components/cards/ConversationCard_ChatsPage_Sidebar.jsx";
import ChatWindow from "../components/chats/ChatWindow.jsx";
import CostumedDebounceInput from "../components/costumed/CostumedDebounceInput.jsx";
import CostumedFriendSelectInModal from "../components/costumed/CostumedFriendSelectInModal.jsx";
import CostumedModal from "../components/costumed/CostumedModal.jsx";
import { showToast } from "../components/costumed/CostumedToast.jsx";
import NoChatSelected from "../components/noFounds/NoChatSelected.jsx";
import NoDataCommon from "../components/noFounds/NoDataCommon.jsx";
import { createGroupAPI, getFriendsAPI } from "../lib/api.js";
import { useAuthStore } from "../stores/useAuthStore.js";
import { useChatStore } from "../stores/useChatStore.js";
import { useMutation } from "@tanstack/react-query";
import CommonPageLoader from "../components/loaders/CommonPageLoader.jsx";

const ChatsPage = () => {
  const authUser = useAuthStore((s) => s.authUser);
  const socket = useAuthStore((s) => s.socket);

  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const isGettingConversations = useChatStore((s) => s.isGettingConversations);
  const getConversations = useChatStore((s) => s.getConversations);
  const conversationNameFilter = useChatStore((s) => s.conversationNameFilter);
  const setConversationNameFilter = useChatStore(
    (s) => s.setConversationNameFilter
  );

  const subscribeToMessages = useChatStore((s) => s.subscribeToMessages);
  const unsubscribeFromMessages = useChatStore(
    (s) => s.unsubscribeFromMessages
  );

  const closeRef = useRef(null);
  const didMountRef = useRef(false);
  const cleanedOnceRef = useRef(false);

  const [
    isOpenSearchFriendsInSmallScreen,
    setIsOpenSearchFriendsInSmallScreen,
  ] = useState(false);

  const [isOpenModalCreateGroup, setIsOpenModalCreateGroup] = useState(false);

  const [friends, setFriends] = useState([]);
  const [isLoadingGetFriends, setIsLoadingGetFriends] = useState(false);
  const [friendQuantity, setFriendQuantity] = useState(0);

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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
  const { mutate: createGroupMutation, isPending: isCreatingGroup } =
    useMutation({
      mutationFn: createGroupAPI,
      onSuccess: (data) => {
        setConversations([data.data, ...conversations]);
        if (closeRef.current) closeRef.current();
        showToast({
          message: data?.message || "Friend deleted successfully!",
          type: "success",
        });
      },
      onError: (error) => {
        showToast({
          message: error?.response?.data?.message || "Failed to delete friend",
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
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    getConversations({
      conversationName: conversationNameFilter || null,
    });
  }, [conversationNameFilter]);

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

  // useEffect(() => {
  //   if (!socket) return;
  //   subscribeToMessages();
  //   return () => {
  //     unsubscribeFromMessages();
  //   };
  // }, [socket]);

  if (isGettingConversations && !didMountRef.current) {
    return <CommonPageLoader className={"!min-h-[calc(100vh-64px)]"} />;
  }

  return (
    <>
      {/* p-4 sm:p-6 lg:p-6  */}
      <div className="min-h-[calc(100vh-64px)] relative flex">
        <div
          className={`${
            conversations.length === 0 ? "hidden" : ""
          } w-20 lg:w-64 bg-base-200 border-r border-base-300 flex flex-col h-[calc(100vh-64px)] ${
            isOpenSearchFriendsInSmallScreen
              ? "!w-64 absolute top-0 left-0 z-50"
              : ""
          }`}
        >
          {conversations.length > 0 ? (
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
                    isOpenSearchFriendsInSmallScreen ? "!pr-4" : "!pr-9"
                  }`}
                  iconClassName={`!right-3`}
                  onChange={(value) => {
                    setConversationNameFilter(value);
                  }}
                  // searchIcon={isOpenSearchFriendsInSmallScreen ? false : true}
                  isSearching={isGettingConversations}
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
          ) : null}

          {conversations.length > 0 && (
            <>
              {conversations.length > 0 ? (
                <div className="flex-1 overflow-y-auto">
                  {conversations.map((conversation, index) => (
                    <div key={conversation.conversation._id}>
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
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <NoDataCommon
                    title={"Không tìm thấy bạn bè"}
                    content={"Thử tìm kiếm với từ khóa khác."}
                  />
                </div>
              )}
            </>
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
              <NoChatSelected hasFriends={conversations.length > 0} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatsPage;
