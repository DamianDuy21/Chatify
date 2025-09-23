import {
  Forward,
  Funnel,
  LoaderIcon,
  ShuffleIcon,
  Undo2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CommonRoundedButton from "../components/buttons/CommonRoundedButton.jsx";
import CountBadge from "../components/buttons/CountBadge.jsx";
import FriendCard_HomePage_OutgoingRequest from "../components/cards/FriendCard_HomePage_OutgoingRequest.jsx";
import RecommendedUserCard_HomePage from "../components/cards/RecommendedUserCard_HomePage.jsx";
import CommonPagination from "../components/costumed/CostumedPagination.jsx";
import { showToast } from "../components/costumed/CostumedToast.jsx";
import NoDataCommon from "../components/noFounds/NoDataCommon.jsx";
import FriendFilterInput from "../components/others/FriendFilterInput.jsx";
import {
  getOutgoingFriendRequestsAPI,
  getRecommendedUsersAPI,
} from "../lib/api.js";
import { useChatStore } from "../stores/useChatStore.js";
import { useAuthStore } from "../stores/useAuthStore.js";
import { useNotificationStore } from "../stores/useNotificationStore.js";

const HomePage = () => {
  const { t } = useTranslation("homePage");

  const sendFriendRequest_NotificationStore = useNotificationStore(
    (s) => s.sendFriendRequest_NotificationStore
  );
  const cancelFriendRequest_NotificationStore = useNotificationStore(
    (s) => s.cancelFriendRequest_NotificationStore
  );

  const authUser = useAuthStore((s) => s.authUser);
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );

  const [isShowMoreRecommendedUsers, setIsShowMoreRecommendedUsers] =
    useState(false);
  const [isShowMoreFriendRequests, setIsShowMoreFriendRequests] =
    useState(false);

  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [recommendedUserQuantity, setRecommendedUserQuantity] = useState(0);
  const [isLoadingGetRecommendedUsers, setIsLoadingGetRecommendedUsers] =
    useState(false);

  const [outgoingFriendRequests, setOutgoingFriendRequests] = useState([]);
  const [outgoingFriendRequestsQuantity, setOutgoingFriendRequestsQuantity] =
    useState(0);
  const [isLoadingOutgoingFriendRequests, setIsLoadingOutgoingFriendRequests] =
    useState(false);

  const [totalRecommendedUsersPages, setTotalRecommendedUsersPages] =
    useState(1);
  const [
    totalOutgoingFriendRequestsPages,
    setTotalOutgoingFriendRequestsPages,
  ] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const [isOpenFilter, setIsOpenFilter] = useState(false);
  const [filterData, setFilterData] = useState({
    fullName: "",
    nativeLanguage: "",
    learningLanguage: "",
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const { fullName, nativeLanguage, learningLanguage } = filterData;
    if (currentPage == 1) {
      fetchRecommendedUsers({
        fullName,
        nativeLanguage,
        learningLanguage,
        currentPage: currentPage,
      });
    } else {
      setCurrentPage(1);
    }
  };

  const handleOnSuccessSendFriendRequest = (data) => {
    const { fullName, nativeLanguage, learningLanguage } = filterData;
    const otherUserId =
      authUser.user._id === data.data.request.recipientId
        ? data.data.request.senderId
        : data.data.request.recipientId;

    setConversations(
      conversations.map((conversation) => ({
        ...conversation,
        users: conversation.users.map((userObj) =>
          userObj?.user?._id === otherUserId
            ? { ...userObj, isSendFriendRequest: true }
            : userObj
        ),
      }))
    );

    if (selectedConversation) {
      setSelectedConversation({
        ...selectedConversation,
        users: selectedConversation.users.map((userObj) =>
          userObj?.user?._id === otherUserId
            ? { ...userObj, isSendFriendRequest: true }
            : userObj
        ),
      });
    }

    // done: nếu ở trang cuối thì xóa
    if (currentPage == totalRecommendedUsersPages) {
      if (
        recommendedUserQuantity == (currentPage - 1) * pageSize + 1 &&
        currentPage > 1
      ) {
        setCurrentPage(currentPage - 1);
        if (!isShowMoreRecommendedUsers) {
          fetchRecommendedUsers({
            fullName,
            nativeLanguage,
            learningLanguage,
            page: currentPage - 1,
          });
        }
        // fetchOutgoingFriendRequests({ page: 1 });
      } else {
        setRecommendedUsers((prev) =>
          prev.filter((user) => user.user._id !== otherUserId)
        );
        setRecommendedUserQuantity((prev) => prev - 1);
        // fetchOutgoingFriendRequests({ page: 1 });
      }
    } else {
      fetchRecommendedUsers({
        fullName,
        nativeLanguage,
        learningLanguage,
        page: currentPage,
      });
    }

    // thêm vào outgoingFriendRequests nếu đang ở trang 1
    if (
      !isShowMoreFriendRequests ||
      (isShowMoreFriendRequests && currentPage == 1)
    ) {
      setOutgoingFriendRequests((prev) => {
        if (prev.length >= pageSize) {
          return [data.data, ...prev.slice(0, -1)];
        }
        return [data.data, ...prev];
      });
      setOutgoingFriendRequestsQuantity((prev) => prev + 1);
      setTotalOutgoingFriendRequestsPages(
        Math.ceil((outgoingFriendRequestsQuantity + 1) / pageSize)
      );
    }

    // socket emit
    sendFriendRequest_NotificationStore({
      userIds: [otherUserId],
      request: data.data.request,
      user: authUser.user,
    });
  };

  const handleOnErrorSendFriendRequest = () => {
    const { fullName, nativeLanguage, learningLanguage } = filterData;
    if (
      recommendedUserQuantity == (currentPage - 1) * pageSize + 1 &&
      currentPage > 1
    ) {
      setCurrentPage(currentPage - 1);
      fetchOutgoingFriendRequests({ page: 1 });
      if (!isShowMoreRecommendedUsers) {
        fetchRecommendedUsers({
          fullName,
          nativeLanguage,
          learningLanguage,
          page: currentPage - 1,
        });
      }
    } else {
      fetchRecommendedUsers({
        fullName,
        nativeLanguage,
        learningLanguage,
        page: currentPage,
      });
      fetchOutgoingFriendRequests({ page: 1 });
    }
  };

  const handleOnSuccessCancelFriendRequest = (data) => {
    const { fullName, nativeLanguage, learningLanguage } = filterData;
    const otherUserId =
      authUser.user._id === data.data.request.recipientId
        ? data.data.request.senderId
        : data.data.request.recipientId;

    setConversations(
      conversations.map((conversation) => ({
        ...conversation,
        users: conversation.users.map((userObj) =>
          userObj?.user?._id === otherUserId
            ? { ...userObj, isSendFriendRequest: false }
            : userObj
        ),
      }))
    );

    if (selectedConversation) {
      setSelectedConversation({
        ...selectedConversation,
        users: selectedConversation.users.map((userObj) =>
          userObj?.user?._id === otherUserId
            ? { ...userObj, isSendFriendRequest: false }
            : userObj
        ),
      });
    }

    if (currentPage == totalOutgoingFriendRequestsPages) {
      if (
        outgoingFriendRequestsQuantity == (currentPage - 1) * pageSize + 1 &&
        currentPage > 1
      ) {
        setCurrentPage(currentPage - 1);
        if (!isShowMoreFriendRequests) {
          fetchOutgoingFriendRequests({ page: currentPage - 1 });
        }
        // fetchRecommendedUsers({
        //   fullName,
        //   nativeLanguage,
        //   learningLanguage,
        //   page: 1,
        // });
      } else {
        setOutgoingFriendRequests((prev) =>
          prev.filter((request) => request.user._id !== otherUserId)
        );
        setOutgoingFriendRequestsQuantity((prev) => prev - 1);
        //  fetchRecommendedUsers({
        //   fullName,
        //   nativeLanguage,
        //   learningLanguage,
        //   page: 1,
        // });
      }
    } else {
      fetchOutgoingFriendRequests({ page: currentPage });
    }

    // socket emit
    cancelFriendRequest_NotificationStore({
      userIds: [otherUserId],
      request: data.data.request,
      user: authUser.user,
    });
  };

  const handleOnErrorCancelFriendRequest = () => {
    const { fullName, nativeLanguage, learningLanguage } = filterData;
    if (
      outgoingFriendRequestsQuantity == (currentPage - 1) * pageSize + 1 &&
      currentPage > 1
    ) {
      setCurrentPage(currentPage - 1);
      if (!isShowMoreFriendRequests) {
        fetchOutgoingFriendRequests({ page: currentPage - 1 });
      }
      fetchRecommendedUsers({
        fullName,
        nativeLanguage,
        learningLanguage,
        page: 1,
      });
    } else {
      fetchRecommendedUsers({
        fullName,
        nativeLanguage,
        learningLanguage,
        page: 1,
      });
      fetchOutgoingFriendRequests({ page: currentPage });
    }
  };

  const fetchRecommendedUsers = async (args = {}) => {
    try {
      setIsLoadingGetRecommendedUsers(true);
      const { data } = await getRecommendedUsersAPI(args);
      setRecommendedUsers(data?.users || []);
      setRecommendedUserQuantity(data?.pagination?.total || 0);
      setTotalRecommendedUsersPages(data?.pagination?.totalPages || 1);
    } catch (error) {
      console.log("Error fetching recommended users:", error);
      showToast({
        message:
          error?.response?.data?.message ||
          t("toast.fetchRecommendedUsers.error"),
        type: "error",
      });
    } finally {
      setIsLoadingGetRecommendedUsers(false);
    }
  };

  const fetchOutgoingFriendRequests = async (args = {}) => {
    try {
      setIsLoadingOutgoingFriendRequests(true);
      const { data } = await getOutgoingFriendRequestsAPI(args);
      setOutgoingFriendRequests(data?.requests || []);
      setOutgoingFriendRequestsQuantity(data?.pagination?.total || 0);
      setTotalOutgoingFriendRequestsPages(data?.pagination?.totalPages || 1);
    } catch (error) {
      console.log("Error fetching outgoing friend requests:", error);
      showToast({
        message:
          error?.response?.data?.message ||
          t("toast.fetchOutgoingFriendRequests.error"),
        type: "error",
      });
    } finally {
      setIsLoadingOutgoingFriendRequests(false);
    }
  };

  const handleClickShuffleButton = () => {
    setFilterData({
      fullName: "",
      nativeLanguage: "",
      learningLanguage: "",
    });
    setIsOpenFilter(false);
    setCurrentPage(1);
    if (!isShowMoreRecommendedUsers) {
      fetchRecommendedUsers();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
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
      fetchRecommendedUsers();
    } else {
      setFilterData({
        fullName: "",
        nativeLanguage: "",
        learningLanguage: "",
      });
      setIsOpenFilter(false);
      fetchRecommendedUsers();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClickSeeMoreRecommendedUsersButton = () => {
    setIsShowMoreRecommendedUsers(true);
    setCurrentPage(1);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleClickSeeLessRecommendedUsersButton = () => {
    setIsShowMoreRecommendedUsers(false);
    setCurrentPage(1);
    //  fetchOutgoingFriendRequests();
    const { fullName, nativeLanguage, learningLanguage } = filterData;
    if (currentPage !== 1) {
      fetchRecommendedUsers({
        fullName,
        nativeLanguage,
        learningLanguage,
        page: 1,
      });
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleClickSeeMoreOutGoingFriendRequests = () => {
    setFilterData({
      fullName: "",
      nativeLanguage: "",
      learningLanguage: "",
    });
    setIsOpenFilter(false);
    setIsShowMoreFriendRequests(true);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClickSeeLessOutGoingFriendRequests = () => {
    setIsShowMoreFriendRequests(false);
    setCurrentPage(1);
    // fetchRecommendedUsers();

    if (currentPage !== 1) {
      fetchOutgoingFriendRequests({
        page: 1,
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    fetchRecommendedUsers();
    fetchOutgoingFriendRequests();
  }, []);

  useEffect(() => {
    if (isShowMoreRecommendedUsers) {
      const { fullName, nativeLanguage, learningLanguage } = filterData;
      fetchRecommendedUsers({
        fullName,
        nativeLanguage,
        learningLanguage,
        page: currentPage,
      });
    }
    if (isShowMoreFriendRequests) {
      fetchOutgoingFriendRequests({
        page: currentPage,
      });
    }
  }, [currentPage]);

  return (
    <>
      <div
        className={`p-4 sm:p-6 lg:p-6 !min-h-[calc(100vh - 64px)] ${
          isShowMoreRecommendedUsers || isShowMoreFriendRequests
            ? "h-full flex flex-col justify-between"
            : ""
        } `}
      >
        {/* MEET NEW LEARNERS */}
        {!isShowMoreFriendRequests && (
          <div>
            <section>
              <div className="mb-4 sm:mb-4">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl sm:text-2xl font-bold">
                      {t("recommendedUsers.title")}
                    </h2>
                    {<CountBadge count={recommendedUserQuantity}></CountBadge>}
                  </div>
                  {
                    <div>
                      <div className="flex gap-2">
                        <CommonRoundedButton
                          onClick={handleClickShuffleButton}
                          type="primary"
                        >
                          <ShuffleIcon className="size-4" />
                        </CommonRoundedButton>

                        {!isOpenFilter ? (
                          <CommonRoundedButton
                            onClick={handleClickFilterOnButton}
                            type="primary"
                          >
                            <Funnel className="size-4" />
                          </CommonRoundedButton>
                        ) : (
                          <CommonRoundedButton
                            onClick={handleClickFilterOffButton}
                            type="primary"
                          >
                            <X className="size-4" />
                          </CommonRoundedButton>
                        )}

                        {!isShowMoreRecommendedUsers ? (
                          <div
                            className="btn btn-outline btn-sm ml-2"
                            onClick={handleClickSeeMoreRecommendedUsersButton}
                          >
                            <Forward className="size-4" />
                            <span className="">
                              {t("recommendedUsers.subButton.seeMore")}
                            </span>
                          </div>
                        ) : (
                          <div
                            className="btn btn-outline btn-sm ml-2"
                            onClick={handleClickSeeLessRecommendedUsersButton}
                          >
                            <Undo2 className="size-4" />
                            <span className="">
                              {t("recommendedUsers.subButton.seeLess")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  }
                </div>
              </div>

              {isOpenFilter && (
                <FriendFilterInput
                  data={filterData}
                  onChange={setFilterData}
                  onSubmit={(e) => handleFilterSubmit(e)}
                />
              )}

              {isLoadingGetRecommendedUsers ? (
                <div className="flex justify-center h-[100px] items-center">
                  <LoaderIcon className="animate-spin size-8" />
                </div>
              ) : recommendedUserQuantity === 0 ? (
                filterData.fullName === "" &&
                filterData.nativeLanguage === "" &&
                filterData.learningLanguage === "" ? (
                  <NoDataCommon
                    title={t("recommendedUsers.noData.title")}
                    content={t("recommendedUsers.noData.subtitle")}
                  />
                ) : (
                  <NoDataCommon
                    title={t("recommendedUsers.noMatch.title")}
                    content={t("recommendedUsers.noMatch.subtitle")}
                  />
                )
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {recommendedUsers &&
                      recommendedUsers.map((user, idx) => {
                        if (idx >= 6 && !isShowMoreRecommendedUsers) {
                          return null;
                        }

                        return (
                          <div key={user.user._id || idx}>
                            <RecommendedUserCard_HomePage
                              user={user.user}
                              onSuccess={handleOnSuccessSendFriendRequest}
                              onError={handleOnErrorSendFriendRequest}
                            />
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {/* FRIEND REQUESTS NOTIFICATIONS */}
        {!isShowMoreRecommendedUsers && (
          <div className={`${isShowMoreFriendRequests ? "!mt-0" : "mt-6"}`}>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4 sm:mb-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl sm:text-2xl font-bold">
                  {t("outgoingFriendRequests.title")}
                </h1>

                <CountBadge count={outgoingFriendRequestsQuantity}></CountBadge>
              </div>

              {!isShowMoreFriendRequests ? (
                <div
                  className="btn btn-outline btn-sm"
                  onClick={handleClickSeeMoreOutGoingFriendRequests}
                >
                  <Forward className="size-4" />
                  <span className="">
                    {t("outgoingFriendRequests.subButton.seeMore")}
                  </span>
                </div>
              ) : (
                <div
                  className="btn btn-outline btn-sm"
                  onClick={handleClickSeeLessOutGoingFriendRequests}
                >
                  <Undo2 className="size-4" />
                  <span className="">
                    {t("outgoingFriendRequests.subButton.seeLess")}
                  </span>
                </div>
              )}
            </div>
            {isLoadingOutgoingFriendRequests ? (
              <div className="flex justify-center h-[100px] items-center">
                <LoaderIcon className="animate-spin size-8" />
              </div>
            ) : (
              <>
                {outgoingFriendRequestsQuantity > 0 ? (
                  <section className="space-y-4">
                    <div className="space-y-3">
                      {outgoingFriendRequests.map((request, idx) => {
                        if (idx >= 3 && !isShowMoreFriendRequests) {
                          return null;
                        }
                        return (
                          <div key={request.request._id}>
                            <FriendCard_HomePage_OutgoingRequest
                              friend={request.user}
                              request={request.request}
                              onSuccess={handleOnSuccessCancelFriendRequest}
                              onError={handleOnErrorCancelFriendRequest}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ) : (
                  <NoDataCommon
                    title={t("outgoingFriendRequests.noData.title")}
                    content={t("outgoingFriendRequests.noData.subtitle")}
                  />
                )}
              </>
            )}
          </div>
        )}

        {((isShowMoreRecommendedUsers && recommendedUserQuantity > pageSize) ||
          (isShowMoreFriendRequests &&
            outgoingFriendRequestsQuantity > pageSize)) && (
          <CommonPagination
            totalPages={
              isShowMoreRecommendedUsers
                ? totalRecommendedUsersPages
                : totalOutgoingFriendRequestsPages
            }
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
    </>
  );
};

export default HomePage;
