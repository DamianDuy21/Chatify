"use client";
import { Funnel, LoaderIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import CommonRoundedButton from "@/components/buttons/CommonRoundedButton.jsx";
import CountBadge from "@/components/buttons/CountBadge.jsx";
import FriendCard_v2_FriendsPage from "@/components/cards/FriendCard_FriendsPage.jsx";
import CommonPagination from "@/components/costumed/CostumedPagination.jsx";
import { showToast } from "@/components/costumed/CostumedToast.jsx";
import NoDataCommon from "@/components/noFounds/NoDataCommon.jsx";
import FriendFilterInput from "@/components/others/FriendFilterInput.jsx";
import { getFriendsAPI } from "@/lib/api.js";
import { useChatStore } from "@/stores/useChatStore.js";
import { useAuthStore } from "@/stores/useAuthStore.js";
import { useNotificationStore } from "@/stores/useNotificationStore.js";

const FriendsPage = () => {
  const t = useTranslations("FriendsPage");

  const pendingFriends = useNotificationStore((s) => s.pendingFriends);
  const setPendingFriends = useNotificationStore((s) => s.setPendingFriends);

  const deleteFriend_NotificationStore = useNotificationStore(
    (s) => s.deleteFriend_NotificationStore
  );

  const authUser = useAuthStore((s) => s.authUser);
  const userPresenceList = useAuthStore((s) => s.userPresenceList);
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );

  const [friends, setFriends] = useState([]);
  const [isLoadingGetFriends, setIsLoadingGetFriends] = useState(false);
  const [friendQuantity, setFriendQuantity] = useState(0);

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const [isOpenFilter, setIsOpenFilter] = useState(false);
  const [filterData, setFilterData] = useState({
    fullName: "",
    nativeLanguage: "",
    learningLanguage: "",
  });

  const handleOnSuccessDeleteFriend = (data) => {
    const { fullName, nativeLanguage, learningLanguage } = filterData;

    const otherUserId = data.data.user._id;
    setConversations(
      conversations.map((conversation) => ({
        ...conversation,
        users: conversation.users.map((userObj) =>
          userObj?.user?._id === otherUserId
            ? { ...userObj, isSendFriendRequest: false, isFriend: false }
            : userObj
        ),
      }))
    );
    if (selectedConversation) {
      setSelectedConversation({
        ...selectedConversation,
        users: selectedConversation.users.map((userObj) =>
          userObj.user._id === otherUserId
            ? { ...userObj, isSendFriendRequest: false, isFriend: false }
            : userObj
        ),
      });
    }

    if (currentPage == totalPages) {
      if (
        friendQuantity == (currentPage - 1) * pageSize + 1 &&
        currentPage > 1
      ) {
        setCurrentPage(currentPage - 1);
      } else {
        setFriends((prev) =>
          prev.filter((user) => user.user._id !== otherUserId)
        );
        setFriendQuantity((prev) => prev - 1);
      }
    } else {
      fetchFriends({
        fullName,
        nativeLanguage,
        learningLanguage,
        page: currentPage,
      });
    }

    deleteFriend_NotificationStore({
      userIds: [otherUserId],
      request: null,
      user: authUser.user,
    });
  };

  const handleOnErrorDeleteFriend = () => {
    const { fullName, nativeLanguage, learningLanguage } = filterData;
    if (friendQuantity == (currentPage - 1) * pageSize + 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else {
      fetchFriends({
        fullName,
        nativeLanguage,
        learningLanguage,
        page: currentPage,
      });
    }
  };

  const handleClickFilterOnButton = () => {
    setFilterData({
      fullName: "",
      nativeLanguage: "",
      learningLanguage: "",
    });
    setIsOpenFilter(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const { fullName, nativeLanguage, learningLanguage } = filterData;
    if (currentPage == 1) {
      fetchFriends({
        fullName,
        nativeLanguage,
        learningLanguage,
        page: currentPage,
      });
    } else {
      setCurrentPage(1);
    }
  };

  const handleClickFilterOffButton = () => {
    if (
      !(
        filterData.fullName === "" &&
        filterData.nativeLanguage === "" &&
        filterData.learningLanguage === ""
      )
      // || currentPage == 1
    ) {
      setFilterData({
        fullName: "",
        nativeLanguage: "",
        learningLanguage: "",
      });
      setIsOpenFilter(false);
      fetchFriends();
    } else {
      setFilterData({
        fullName: "",
        nativeLanguage: "",
        learningLanguage: "",
      });
      setIsOpenFilter(false);
      fetchFriends();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  useEffect(() => {
    const { fullName, nativeLanguage, learningLanguage } = filterData;
    fetchFriends({
      fullName,
      nativeLanguage,
      learningLanguage,
      page: currentPage,
    });
    setPendingFriends([]);
  }, [currentPage]);

  useEffect(() => {
    if (pendingFriends.length === 0) return;
    // thêm vào friends nếu đang ở trang 1
    if (currentPage == 1) {
      pendingFriends.forEach((request) => {
        const exists = friends.find((r) => r.user._id === request.user._id);

        if (exists) {
          setFriends((prev) =>
            prev.filter((r) => r.user._id !== exists.user._id)
          );
          setFriends((prev) => [request, ...prev]);
        } else if (!exists) {
          setFriends((prev) => {
            if (prev.length >= pageSize) {
              return [request, ...prev.slice(0, -1)];
            }
            return [request, ...prev];
          });
          setFriendQuantity((prev) => prev + 1);
          setTotalPages(Math.ceil((friendQuantity + 1) / pageSize));
        }
      });
      return;
    }
  }, [pendingFriends]);

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-6 min-h-[calc(100vh - 64px)] h-full flex flex-col justify-between">
        <div className="w-full space-y-4 sm:space-y-4">
          <>
            <div className="flex items-start justify-between gap-4 mb-4 sm:mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl sm:text-2xl font-bold">
                  {t("friendsList.title")}
                </h2>
                {<CountBadge count={friendQuantity}></CountBadge>}
              </div>

              <div>
                {!isOpenFilter ? (
                  <CommonRoundedButton onClick={handleClickFilterOnButton}>
                    <Funnel className="size-4" />
                  </CommonRoundedButton>
                ) : (
                  <CommonRoundedButton onClick={handleClickFilterOffButton}>
                    <X className="size-4" />
                  </CommonRoundedButton>
                )}
              </div>
            </div>

            {isOpenFilter && (
              <FriendFilterInput
                data={filterData}
                onChange={setFilterData}
                onSubmit={handleFilterSubmit}
              />
            )}

            {isLoadingGetFriends ? (
              <div className="flex justify-center h-[100px] items-center">
                <LoaderIcon className="animate-spin size-8" />
              </div>
            ) : friendQuantity === 0 ? (
              filterData.fullName === "" &&
              filterData.nativeLanguage === "" &&
              filterData.learningLanguage === "" ? (
                <NoDataCommon
                  title={"Chưa có bạn bè"}
                  content={"Hãy gửi lời mời kết bạn để bắt đầu kết nối."}
                />
              ) : (
                <NoDataCommon
                  title={"Không tìm thấy bạn bè"}
                  content={"Hãy thử điều chỉnh bộ lọc hoặc thêm bạn bè mới."}
                />
              )
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {friends &&
                    friends.map((friend, idx) => (
                      <div key={friend.user._id || idx}>
                        <FriendCard_v2_FriendsPage
                          friend={friend.user}
                          isOnline={
                            userPresenceList.find(
                              (u) => u.userId === friend.user._id && u.online
                            )?.online
                          }
                          onSuccess={handleOnSuccessDeleteFriend}
                          onError={handleOnErrorDeleteFriend}
                        />
                      </div>
                    ))}
                </div>
              </>
            )}
          </>
        </div>
        {friends && friendQuantity > pageSize && (
          <CommonPagination
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
    </>
  );
};

export default FriendsPage;
