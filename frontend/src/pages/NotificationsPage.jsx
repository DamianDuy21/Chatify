import { Forward, LoaderIcon, Undo2 } from "lucide-react";
import {
  getIncomingFriendRequestsAPI,
  getNotificationsAPI,
} from "../lib/api.js";

import { useEffect, useState } from "react";
import CountBadge from "../components/buttons/CountBadge.jsx";
import FriendCard_NotificationsPage_IncomingRequest from "../components/cards/FriendCard_NotificationsPage_IncomingRequest.jsx";
import { showToast } from "../components/costumed/CostumedToast.jsx";
import NoDataCommon from "../components/noFounds/NoDataCommon.jsx";
import CommonPagination from "../components/costumed/CostumedPagination.jsx";
import NotificationCard_NotificationsPage from "../components/cards/NotificationCard_NotificationsPage.jsx";
import { useAuthStore } from "../stores/useAuthStore.js";
import { useChatStore } from "../stores/useChatStore.js";
import { isConversationFitFilter } from "../lib/utils.js";
import { useNotificationStore } from "../stores/useNotificationStore.js";
import { useTranslation } from "react-i18next";

const NotificationsPage = () => {
  const { t } = useTranslation("notificationsPage");
  const pendingNotifications = useNotificationStore(
    (s) => s.pendingNotifications
  );
  const setPendingNotifications = useNotificationStore(
    (s) => s.setPendingNotifications
  );
  const pendingIncomingRequests = useNotificationStore(
    (s) => s.pendingIncomingRequests
  );
  const setPendingIncomingRequests = useNotificationStore(
    (s) => s.setPendingIncomingRequests
  );
  const rejectFriendRequest_NotificationStore = useNotificationStore(
    (s) => s.rejectFriendRequest_NotificationStore
  );
  const acceptFriendRequest_NotificationStore = useNotificationStore(
    (s) => s.acceptFriendRequest_NotificationStore
  );

  const authUser = useAuthStore((s) => s.authUser);
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
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
  const conversationNameFilter = useChatStore((s) => s.conversationNameFilter);

  const [isShowMoreFriendRequests, setIsShowMoreFriendRequests] =
    useState(false);
  const [isShowMoreNotifications, setIsShowMoreNotifications] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notificationsQuantity, setNotificationsQuantity] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const [incomingFriendRequests, setIncomingFriendRequests] = useState([]);
  const [incomingFriendRequestsQuantity, setIncomingFriendRequestsQuantity] =
    useState(0);
  const [isLoadingIncomingFriendRequests, setIsLoadingIncomingFriendRequests] =
    useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [
    totalIncomingFriendRequestsPages,
    setTotalIncomingFriendRequestsPages,
  ] = useState(1);
  const [totalNotificationsPages, setTotalNotificationsPages] = useState(1);
  const pageSize = 12;

  const handleOnSuccessFriendRequest = ({
    data = null,
    isRejected = false,
  }) => {
    const otherUserId =
      authUser.user._id === data.data.request.recipientId
        ? data.data.request.senderId
        : data.data.request.recipientId;
    if (isRejected) {
      setConversations(
        conversations.map((conversation) => ({
          ...conversation,
          users: conversation.users.map((userObj) =>
            userObj?.user._id === otherUserId
              ? { ...userObj, isSendFriendRequest: false }
              : userObj
          ),
        }))
      );
      if (selectedConversation)
        setSelectedConversation({
          ...selectedConversation,
          users: [...selectedConversation.users].map((userObj) =>
            userObj.user._id === otherUserId
              ? { ...userObj, isSendFriendRequest: false }
              : userObj
          ),
        });

      rejectFriendRequest_NotificationStore({
        userIds: [otherUserId],
        request: data.data.request,
        user: authUser.user,
      });
    } else {
      setConversations(
        conversations.map((conversation) => ({
          ...conversation,
          users: conversation.users.map((userObj) => {
            return userObj?.user._id === otherUserId
              ? { ...userObj, isFriend: true, isSendFriendRequest: false }
              : userObj;
          }),
        }))
      );
      if (selectedConversation)
        setSelectedConversation({
          ...selectedConversation,
          users: [...selectedConversation.users].map((userObj) =>
            userObj.user._id === otherUserId
              ? { ...userObj, isFriend: true, isSendFriendRequest: false }
              : userObj
          ),
        });

      acceptFriendRequest_NotificationStore({
        userIds: [otherUserId],
        request: data.data.request,
        conversation: data.data.conversation.conversation,
        conversationIsNewCreated: data.data.isNewCreated
          ? data.data.conversation
          : null,
        user: authUser.user,
        notification: data.data.notification,
      });

      if (data.data.isNewCreated) {
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
      }
    }

    // done: nếu ở trang cuối thì xóa
    if (currentPage == totalIncomingFriendRequestsPages) {
      if (
        incomingFriendRequestsQuantity == (currentPage - 1) * pageSize + 1 &&
        currentPage > 1
      ) {
        setCurrentPage(currentPage - 1);
        if (!isShowMoreFriendRequests) {
          fetchIncomingFriendRequests({ page: currentPage - 1 });
        }
      } else {
        setIncomingFriendRequests((prev) =>
          prev.filter((request) => request.user._id != otherUserId)
        );
        setIncomingFriendRequestsQuantity((prev) => prev - 1);
      }
    } else {
      fetchIncomingFriendRequests({ page: currentPage });
    }
  };

  const handleOnErrorFriendRequest = () => {
    if (
      incomingFriendRequestsQuantity == (currentPage - 1) * pageSize + 1 &&
      currentPage > 1
    ) {
      setCurrentPage(currentPage - 1);
      if (!isShowMoreFriendRequests) {
        fetchIncomingFriendRequests({ page: currentPage - 1 });
      }
      fetchNotifications({ page: 1 });
    } else {
      fetchIncomingFriendRequests({ page: currentPage });
      fetchNotifications({ page: 1 });
    }
  };

  const handleOnSuccessAcceptNotification = (notification) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.notification._id === notification.notification._id) {
          return {
            ...n,
            notification: { ...n.notification, status: "accepted" },
          };
        }
        return n;
      })
    );
  };

  const handleOnSuccessDeleteNotification = (data) => {
    if (currentPage == totalNotificationsPages) {
      if (
        notificationsQuantity == (currentPage - 1) * pageSize + 1 &&
        currentPage > 1
      ) {
        setCurrentPage(currentPage - 1);
        if (!isShowMoreNotifications) {
          fetchNotifications({ page: currentPage - 1 });
        }
      } else {
        setNotifications((prev) =>
          prev.filter(
            (notification) =>
              notification.notification._id != data.data.notification._id
          )
        );
        setNotificationsQuantity((prev) => prev - 1);
      }
    } else {
      fetchNotifications({ page: currentPage });
    }
  };

  const handleOnErrorNotification = () => {
    if (
      notificationsQuantity == (currentPage - 1) * pageSize + 1 &&
      currentPage > 1
    ) {
      setCurrentPage(currentPage - 1);
      if (!isShowMoreNotifications) {
        fetchNotifications({ page: currentPage - 1 });
      }
    } else {
      fetchNotifications({ page: currentPage });
    }
  };

  const handleClickShowMoreIncomingFriendRequests = () => {
    setIsShowMoreFriendRequests(true);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClickShowLessIncomingFriendRequests = () => {
    setIsShowMoreFriendRequests(false);
    setCurrentPage(1);
    if (currentPage !== 1) {
      fetchIncomingFriendRequests({
        page: 1,
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClickShowMoreNotifications = () => {
    setIsShowMoreNotifications(true);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClickShowLessNotifications = () => {
    setIsShowMoreNotifications(false);
    setCurrentPage(1);
    if (currentPage !== 1) {
      fetchNotifications({
        page: 1,
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchIncomingFriendRequests = async (args = {}) => {
    setIsLoadingIncomingFriendRequests(true);
    try {
      const { data } = await getIncomingFriendRequestsAPI(args);
      setIncomingFriendRequests(data.requests);
      setIncomingFriendRequestsQuantity(data.pagination.total);
      setTotalIncomingFriendRequestsPages(data.pagination.totalPages);
    } catch (error) {
      showToast({
        message:
          error.response.data.message ||
          t("toast.fetchIncomingFriendRequests.error"),
        type: "error",
      });
    } finally {
      setIsLoadingIncomingFriendRequests(false);
    }
  };

  const fetchNotifications = async (args = {}) => {
    setIsLoadingNotifications(true);
    try {
      const { data } = await getNotificationsAPI(args);
      setNotifications(data.notifications);
      setNotificationsQuantity(data.pagination.total);
      setTotalNotificationsPages(data.pagination.totalPages);
    } catch (error) {
      showToast({
        message:
          error.response.data.message || t("toast.fetchNotifications.error"),
        type: "error",
      });
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchIncomingFriendRequests();
  }, []);

  useEffect(() => {
    if (isShowMoreFriendRequests) {
      fetchIncomingFriendRequests({
        page: currentPage,
      });
      setPendingIncomingRequests([]);
      return;
    }
    if (isShowMoreNotifications) {
      fetchNotifications({
        page: currentPage,
      });
      setPendingNotifications([]);
      return;
    }
  }, [currentPage]);

  useEffect(() => {
    if (pendingIncomingRequests.length === 0) return;
    // thêm vào incomingFriendRequests nếu đang ở trang 1
    if (currentPage == 1) {
      pendingIncomingRequests.forEach((request) => {
        const exists = incomingFriendRequests.find(
          (r) => r.user._id === request.user._id
        );

        if (exists) {
          setIncomingFriendRequests((prev) =>
            prev.filter((r) => r.user._id !== exists.user._id)
          );
          setIncomingFriendRequests((prev) => [request, ...prev]);
        }

        if (!exists) {
          setIncomingFriendRequests((prev) => {
            if (prev.length >= pageSize) {
              return [request, ...prev.slice(0, -1)];
            }
            return [request, ...prev];
          });
          setIncomingFriendRequestsQuantity((prev) => prev + 1);
          setTotalIncomingFriendRequestsPages(
            Math.ceil((incomingFriendRequestsQuantity + 1) / pageSize)
          );
        }
      });
      return;
    }
  }, [pendingIncomingRequests]);

  useEffect(() => {
    if (pendingNotifications.length === 0) return;
    // thêm vào friends nếu đang ở trang 1
    if (currentPage == 1) {
      [...pendingNotifications].reverse().forEach((request) => {
        const exists = notifications.find(
          (n) => n.notification._id === request.notification._id
        );

        if (exists) {
          setNotifications((prev) =>
            prev.filter((n) => n.notification._id !== exists.notification._id)
          );
          setNotifications((prev) => [request, ...prev]);
        } else if (!exists) {
          setNotifications((prev) => {
            if (prev.length >= pageSize) {
              return [request, ...prev.slice(0, -1)];
            }
            return [request, ...prev];
          });
          setNotificationsQuantity((prev) => prev + 1);
          setTotalNotificationsPages(
            Math.ceil((notificationsQuantity + 1) / pageSize)
          );
        }
      });
      return;
    }
  }, [pendingNotifications]);

  return (
    <>
      <div
        className={`p-4 sm:p-6 lg:p-6 min-h-[calc(100vh - 64px)] ${
          setIsShowMoreNotifications || isShowMoreFriendRequests
            ? "h-full flex flex-col justify-between"
            : ""
        }`}
      >
        <div className="w-full space-y-4 sm:space-y-4">
          {/* FRIEND REQUESTS NOTIFICATIONS */}
          {!isShowMoreNotifications && (
            <>
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4 sm:mb-4">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl sm:text-2xl font-bold">
                    {t("incomingFriendRequests.title")}
                  </h1>
                  {
                    <CountBadge
                      count={incomingFriendRequestsQuantity}
                    ></CountBadge>
                  }
                </div>

                {!isShowMoreFriendRequests ? (
                  <div
                    className="btn btn-outline btn-sm"
                    onClick={handleClickShowMoreIncomingFriendRequests}
                  >
                    <Forward className="size-4" />
                    <span className="">
                      {t("incomingFriendRequests.subButton.seeMore")}
                    </span>
                  </div>
                ) : (
                  <div
                    className="btn btn-outline btn-sm"
                    onClick={handleClickShowLessIncomingFriendRequests}
                  >
                    <Undo2 className="size-4" />
                    <span className="">
                      {t("incomingFriendRequests.subButton.seeLess")}
                    </span>
                  </div>
                )}
              </div>
              {isLoadingIncomingFriendRequests ? (
                <div className="flex justify-center h-[100px] items-center">
                  <LoaderIcon className="animate-spin size-8" />
                </div>
              ) : (
                <>
                  {incomingFriendRequestsQuantity > 0 ? (
                    <section className="space-y-4">
                      <div className="space-y-3">
                        {incomingFriendRequests.map((request, idx) => {
                          if (idx >= 6 && !isShowMoreFriendRequests) {
                            return null;
                          }
                          return (
                            <div key={request.request._id}>
                              <FriendCard_NotificationsPage_IncomingRequest
                                friend={request.user}
                                request={request.request}
                                onSuccess={handleOnSuccessFriendRequest}
                                onError={handleOnErrorFriendRequest}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ) : (
                    <NoDataCommon
                      title={t("incomingFriendRequests.noData.title")}
                      content={t("incomingFriendRequests.noData.subtitle")}
                    />
                  )}
                </>
              )}
            </>
          )}
          {/* NOTIFICATIONS */}
          {!isShowMoreFriendRequests ? (
            <section
              className={`space-y-4 ${
                isShowMoreNotifications ? "!mt-0" : "mt-6"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4 sm:mb-4">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl sm:text-2xl font-bold">
                    {t("notifications.title")}
                  </h1>

                  <CountBadge count={notificationsQuantity}></CountBadge>
                </div>

                {!isShowMoreNotifications ? (
                  <div
                    className="btn btn-outline btn-sm"
                    onClick={handleClickShowMoreNotifications}
                  >
                    <Forward className="size-4 " />
                    <span className="">
                      {t("notifications.subButton.seeMore")}
                    </span>
                  </div>
                ) : (
                  <div
                    className="btn btn-outline btn-sm"
                    onClick={handleClickShowLessNotifications}
                  >
                    <Undo2 className="size-4 " />
                    <span className="">
                      {t("notifications.subButton.seeLess")}
                    </span>
                  </div>
                )}
              </div>

              {isLoadingNotifications ? (
                <div className="flex justify-center h-[100px] items-center">
                  <LoaderIcon className="animate-spin size-8" />
                </div>
              ) : (
                <>
                  {notifications.length > 0 ? (
                    <div className="space-y-3">
                      {notifications.map((notification, idx) => {
                        if (idx >= 3 && !isShowMoreNotifications) {
                          return null;
                        }
                        if (notification?.notification)
                          return (
                            <div key={notification.notification._id}>
                              <NotificationCard_NotificationsPage
                                notification={notification.notification}
                                user={notification?.user || null}
                                onSuccessAccept={() =>
                                  handleOnSuccessAcceptNotification(
                                    notification
                                  )
                                }
                                onSuccessDelete={
                                  handleOnSuccessDeleteNotification
                                }
                                onError={handleOnErrorNotification}
                              />
                            </div>
                          );
                      })}
                    </div>
                  ) : (
                    <>
                      <NoDataCommon
                        title={t("notifications.noData.title")}
                        content={t("notifications.noData.subtitle")}
                      />
                    </>
                  )}
                </>
              )}
            </section>
          ) : null}
        </div>

        {((isShowMoreFriendRequests &&
          incomingFriendRequestsQuantity > pageSize) ||
          (isShowMoreNotifications && notificationsQuantity > pageSize)) && (
          <CommonPagination
            totalPages={
              isShowMoreFriendRequests
                ? totalIncomingFriendRequestsPages
                : totalNotificationsPages
            }
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
    </>
  );
};

export default NotificationsPage;
