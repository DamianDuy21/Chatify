import { useMutation } from "@tanstack/react-query";
import { LoaderIcon, X } from "lucide-react";
import { useRef, useState } from "react";
import {
  createPrivateConversationAPI,
  deleteFriendAPI,
  getConversationsAPI,
} from "../../lib/api.js";
import { capitalize, getLocaleById } from "../../lib/utils.js";
import CommonRoundedButton from "../buttons/CommonRoundedButton.jsx";
import CountAndMessageBadge from "../buttons/CountAndMessageBadge.jsx";
import CostumedModal from "../costumed/CostumedModal.jsx";
import { showToast } from "../costumed/CostumedToast.jsx";
import { getFlagLanguage, getLanguageFlag } from "./FriendCard_Func.jsx";
import { useNavigate } from "react-router";
import { useChatStore } from "../../stores/useChatStore";
const FriendCard_v2_FriendsPage = ({
  friend,
  isOnline = false,
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setSelectedConversation = useChatStore(
    (s) => s.setSelectedConversation
  );
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const closeRef = useRef(null);
  const { mutate: deleteFriendMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteFriendAPI,
    onSuccess: (data) => {
      onSuccess(data);
      if (closeRef.current) closeRef.current();
      showToast({
        message: data?.message || "Friend deleted successfully!",
        type: "success",
      });
    },
    onError: (error) => {
      console.error("Error deleting friend:", error);
      onError();
      showToast({
        message: error?.response?.data?.message || "Failed to delete friend",
        type: "error",
      });
    },
  });

  const handleGetPrivateConversation = async () => {
    try {
      setIsLoading(true);
      const { data } = await getConversationsAPI({
        userId: friend._id,
      });
      if (data && data.conversations.length > 0) {
        setConversations(
          conversations.map((c) =>
            c.conversation._id === data.conversations[0].conversation._id
              ? { ...c, unSeenMessageQuantity: 0 }
              : c
          )
        );
        setSelectedConversation(data.conversations[0]);
        navigate(`/chats`);
      } else {
        const { data: newConvData } = await createPrivateConversationAPI(
          friend._id
        );
        if (
          newConvData &&
          newConvData.isNewCreated &&
          newConvData.conversation
        ) {
          setConversations([newConvData.conversation, ...conversations]);
          setSelectedConversation(newConvData.conversation);
          navigate(`/chats`);
        }
      }
    } catch (error) {
      console.error("Error fetching or creating private conversation:", error);
      showToast({
        message:
          error?.response?.data?.message ||
          "Failed to fetch or create private conversation",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      key={friend._id}
      className="card bg-base-200 hover:shadow-lg transition-all duration-300 relative h-full"
    >
      <div className="card-body p-4 space-y-2">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={friend.profile.profilePic} alt={friend.fullName} />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm">{friend.fullName}</h3>
            {isOnline ? (
              <p className="text-xs text-success flex items-center gap-1">
                <span className="size-2 rounded-full bg-success inline-block" />
                Online
              </p>
            ) : (
              <p className="text-xs opacity-70 flex items-center gap-1">
                <span className="size-2 rounded-full bg-gray-600 opacity-70 inline-block" />
                Offline
              </p>
            )}
          </div>
        </div>

        {friend.profile.bio && (
          <p className="text-sm line-clamp-2">{friend.profile.bio}</p>
        )}

        {/* Languages with flags */}
        <div className="flex flex-wrap gap-2">
          <span className="badge badge-secondary h-8 px-4 flex items-center gap-1 relative -top-[1px]">
            {getLanguageFlag(getLocaleById(friend.profile.nativeLanguage))}
            Native:{" "}
            {capitalize(
              getFlagLanguage(getLocaleById(friend.profile.nativeLanguage))
            )}
          </span>
          <span className="badge badge-outline h-8 px-4 flex items-center gap-1 relative -top-[1px]">
            {getLanguageFlag(getLocaleById(friend.profile.learningLanguage))}
            Learning:{" "}
            {capitalize(
              getFlagLanguage(getLocaleById(friend.profile.learningLanguage))
            )}
          </span>
        </div>

        <CountAndMessageBadge
          // conversation={conversation}
          onClick={handleGetPrivateConversation}
          isLoading={isLoading}
          className={"absolute top-2 right-14"}
        ></CountAndMessageBadge>

        <CostumedModal
          trigger={
            <CommonRoundedButton
              className={`absolute top-2 right-4 ${
                isDeleting ? "pointer-events-none opacity-70" : ""
              }`}
            >
              <X className="size-4" />
            </CommonRoundedButton>
          }
          title="Thông báo"
        >
          {({ close }) => {
            closeRef.current = close;
            return (
              <div>
                <div
                  className={`pb-6 text-sm ${
                    isDeleting ? "pointer-events-none" : ""
                  }`}
                >
                  Bạn có chắc muốn hủy kết bạn với{" "}
                  <span className="font-semibold">{friend.fullName}</span>{" "}
                  không?
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
                    className="btn btn-primary w-full hover:btn-primary"
                    onClick={() => {
                      deleteFriendMutation(friend._id);
                    }}
                  >
                    {isDeleting ? (
                      <LoaderIcon className="size-4 animate-spin" />
                    ) : null}
                    Hủy kết bạn
                  </button>
                </div>
              </div>
            );
          }}
        </CostumedModal>
      </div>
    </div>
  );
};

export default FriendCard_v2_FriendsPage;
