import { Funnel, LoaderIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CommonRoundedButton from "../components/buttons/CommonRoundedButton.jsx";
import CountBadge from "../components/buttons/CountBadge.jsx";
import FriendCard_v2_FriendsPage from "../components/cards/FriendCard_FriendsPage.jsx";
import CommonPagination from "../components/costumed/CostumedPagination.jsx";
import { showToast } from "../components/costumed/CostumedToast.jsx";
import NoDataCommon from "../components/noFounds/NoDataCommon.jsx";
import FriendFilterInput from "../components/others/FriendFilterInput.jsx";
import { getFriendsAPI } from "../lib/api.js";
import { useChatStore } from "../stores/useChatStore.js";
import { useAuthStore } from "../stores/useAuthStore.js";

const FriendsPage = () => {
  const { t } = useTranslation("friendsPage");

  const authUser = useAuthStore((s) => s.authUser);
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
  const pageSize = 10;

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

    if (friendQuantity <= pageSize) {
      setFriends((prev) =>
        prev.filter((user) => user.user._id !== otherUserId)
      );
      setFriendQuantity((prev) => prev - 1);
      return;
    }

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
  }, [currentPage]);

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
                          conversation={conversations.find(
                            (c) =>
                              c.conversation._id === friend.conversation._id
                          )}
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
