import { useEffect, useState } from "react";
import { useAuthStore } from "../../stores/useAuthStore";
import FriendCard_GroupChatMemberList from "../cards/FriendCard_GroupChatMemberList";
import CostumedDebounceInput from "./CostumedDebounceInput";
import { useChatStore } from "../../stores/useChatStore";
import { useNotificationStore } from "../../stores/useNotificationStore";
import { useTranslation } from "react-i18next";

const CostumedGroupChatMemberList = ({ friends = [] }) => {
  const { t } = useTranslation("components", {
    keyPrefix: "costumedGroupChatMemberList",
  });
  const authUser = useAuthStore((s) => s.authUser);

  const sendFriendRequest_NotificationStore = useNotificationStore(
    (s) => s.sendFriendRequest_NotificationStore
  );
  const deleteMemberFromGroup_NotificationStore = useNotificationStore(
    (s) => s.deleteMemberFromGroup_NotificationStore
  );

  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);

  const [searchValue, setSearchValue] = useState("");
  const [displayedFriends, setDisplayedFriends] = useState([]);
  const [isAbleEditMember, setIsAbleEditMember] = useState(false);

  const handleOnSuccessSendFriendRequest = (data) => {
    const otherUserId = data.data.user._id;

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

    if (selectedConversation)
      setSelectedConversation({
        ...selectedConversation,
        users: selectedConversation.users.map((userObj) =>
          userObj.user._id === otherUserId
            ? { ...userObj, isSendFriendRequest: true }
            : userObj
        ),
      });

    // socket emit
    sendFriendRequest_NotificationStore({
      userIds: [otherUserId],
      request: data.data.request,
      user: authUser.user,
    });
  };

  const handleOnSuccessDeleteMember = (data) => {
    const otherUserId = data.data.conversation.user._id;
    setConversations(
      conversations.map((conversation) =>
        conversation.conversation._id ===
        data.data.conversation.conversation._id
          ? {
              ...conversation,
              users: conversation.users.filter(
                (user) => user.user._id !== data.data.conversation.user._id
              ),
            }
          : conversation
      )
    );

    if (selectedConversation)
      setSelectedConversation({
        ...selectedConversation,
        users: selectedConversation.users.filter(
          (user) => user.user._id !== data.data.conversation.user._id
        ),
      });

    // socket emit
    deleteMemberFromGroup_NotificationStore({
      userIds: [otherUserId],
      userAlreadyInGroup: conversations
        .find(
          (c) => c.conversation._id === data.data.conversation.conversation._id
        )
        ?.users.filter((u) => u.user._id !== otherUserId)
        .map((u) => u.user._id),
      conversation: data.data.conversation,
      notifications: data.data.notifications,
      user: authUser.user,
    });
  };

  useEffect(() => {
    if (searchValue.trim() === "") {
      setDisplayedFriends(friends);
    } else {
      const filtered = friends.filter((friend) => {
        const fullName = `${friend?.user?.fullName}`.toLowerCase();
        return fullName.includes(searchValue.toLowerCase());
      });
      setDisplayedFriends(filtered);
    }
  }, [searchValue, friends]);

  useEffect(() => {
    friends.forEach((friend) => {
      if (friend?.isKeyMember) {
        setIsAbleEditMember(friend?.user?._id === authUser?.user?._id);
        return;
      }
    });
  }, [friends, authUser]);

  return (
    <div className="flex flex-col gap-2">
      <div className={`bg-base-100 z-99`}>
        <CostumedDebounceInput
          name={"searchInput"}
          onChange={(value) => {
            setSearchValue(value);
          }}
          placeholder={t("search.placeholder")}
        />
      </div>

      {displayedFriends.length > 0 && (
        <div className="flex flex-col gap-1 max-h-50 overflow-y-auto">
          {displayedFriends.map((friend, idx) => (
            <div key={idx}>
              <FriendCard_GroupChatMemberList
                friend={friend}
                isAbleEditMember={isAbleEditMember}
                onSuccessSendFriendRequest={handleOnSuccessSendFriendRequest}
                onSuccessDeleteMember={handleOnSuccessDeleteMember}
              ></FriendCard_GroupChatMemberList>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CostumedGroupChatMemberList;
