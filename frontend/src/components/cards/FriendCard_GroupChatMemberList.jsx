import { useMutation } from "@tanstack/react-query";
import {
  Crown,
  LoaderIcon,
  UserRoundCheck,
  UserRoundPlus,
  X,
} from "lucide-react";
import { deleteMemberFromGroupAPI, sendFriendRequestAPI } from "../../lib/api";
import { getLocaleById } from "../../lib/utils";
import { useAuthStore } from "../../stores/useAuthStore";
import CommonRoundedButton from "../buttons/CommonRoundedButton";
import { showToast } from "../costumed/CostumedToast";
import { getLanguageFlag } from "./FriendCard_Func";
import { useChatStore } from "../../stores/useChatStore";

const FriendCard_GroupChatMemberList = ({
  friend = null,
  isAbleEditMember = false,
  onSuccessSendFriendRequest = () => {},
  onSuccessDeleteMember = () => {},
}) => {
  const authUser = useAuthStore((s) => s.authUser);
  const selectedConversation = useChatStore((s) => s.selectedConversation);

  const isKeyMember = friend?.isKeyMember;
  const isFriend =
    friend?.isFriend || friend?.user?._id === authUser?.user?._id;
  const isSendFriendRequest =
    friend?.isSendFriendRequest ||
    friend?.isFriend ||
    friend?.user?._id === authUser?.user?._id;

  const {
    mutate: sendFriendRequestMutation,
    isPending: isSendingFriendRequest,
  } = useMutation({
    mutationFn: sendFriendRequestAPI,
    onSuccess: (data) => {
      onSuccessSendFriendRequest(data);
      showToast({
        message: data?.message || "Friend request sent successfully!",
        type: "success",
      });
    },
    onError: (error) => {
      showToast({
        message:
          error?.response?.data?.message || "Failed to send friend request",
        type: "error",
      });
    },
  });

  const {
    mutate: deleteMemberFromGroupMutation,
    isPending: isDeletingMemberFromGroup,
  } = useMutation({
    mutationFn: deleteMemberFromGroupAPI,
    onSuccess: (data) => {
      console.log("Delete member from group chat data:", data);
      onSuccessDeleteMember(data);
      showToast({
        message: data?.message || "Friend request cancelled successfully!",
        type: "success",
      });
    },
    onError: (error) => {
      console.log("Cancel friend request error:", error);
      showToast({
        message:
          error?.response?.data?.message ||
          "Failed delete friend group request",
        type: "error",
      });
    },
  });

  return (
    <div
      className={`h-16 w-full
        border
        !border-base-300 flex items-center
        px-4 cursor-pointer relative gap-6
      `}
    >
      <div className="flex justify-between items-center flex-1">
        <div className="flex items-center gap-3 relative">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={friend?.user?.profile?.profilePic} alt="" />
            </div>
          </div>

          <div className="absolute left-8 -bottom-0">
            <span className="size-2 rounded-full bg-success inline-block" />
          </div>

          <div className={`flex items-center gap-2`}>
            {isKeyMember && <Crown className="size-4 text-primary" />}
            <p className="font-semibold text-sm">{friend?.user?.fullName}</p>
          </div>
        </div>
        <div className="flex justify-center gap-1 -mr-1">
          <span className="relative -top-[1px]">
            {getLanguageFlag(
              getLocaleById(friend?.user?.profile?.nativeLanguage)
            )}
          </span>
          <span className="relative -top-[1px]">
            {getLanguageFlag(
              getLocaleById(friend?.user?.profile?.learningLanguage)
            )}
          </span>
        </div>
      </div>

      {(isAbleEditMember || !isFriend || !isSendFriendRequest) &&
        friend?.user?._id !== authUser?.user?._id && (
          <div className="flex gap-2 items-center">
            {!isFriend && (
              <>
                {!isSendFriendRequest ? (
                  <CommonRoundedButton
                    type="ghost"
                    className={`border border-secondary`}
                    onClick={() => {
                      sendFriendRequestMutation(friend?.user?._id);
                    }}
                  >
                    {isSendingFriendRequest ? (
                      <LoaderIcon className="size-4 animate-spin" />
                    ) : (
                      <UserRoundPlus className="size-4" />
                    )}
                  </CommonRoundedButton>
                ) : (
                  <CommonRoundedButton
                    type="ghost"
                    className={`border border-base-300 pointer-events-none`}
                    onClick={() => {}}
                  >
                    <UserRoundCheck className="size-4" />
                  </CommonRoundedButton>
                )}
              </>
            )}

            {isAbleEditMember && (
              <CommonRoundedButton
                type="ghost"
                className={` border border-base-300`}
                onClick={() =>
                  deleteMemberFromGroupMutation({
                    conversationId: selectedConversation?.conversation?._id,
                    memberId: friend?.user?._id,
                  })
                }
              >
                {isDeletingMemberFromGroup ? (
                  <LoaderIcon className="size-4 animate-spin" />
                ) : (
                  <X className="size-4" />
                )}
              </CommonRoundedButton>
            )}
          </div>
        )}
    </div>
  );
};

export default FriendCard_GroupChatMemberList;
