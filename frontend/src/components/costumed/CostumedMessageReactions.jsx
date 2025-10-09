import { Heart, LoaderIcon, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../stores/useChatStore";
import FriendCard_MessageReactions from "../cards/FriendCard_MessageReactions";
import { useTranslation } from "react-i18next";
import { getReactMemberListAPI } from "../../lib/api";
import { pluralToSingular, singularToPlural } from "../../lib/utils";

const CostumedMessageReactions = ({ message }) => {
  const { t } = useTranslation("components", {
    keyPrefix: "chatWindow.reactionsModal",
  });
  const { i18n } = useTranslation();
  const getUserLocaleClient = () => {
    if (typeof window === "undefined") return "vi";
    return i18n.language || "vi";
  };
  const userLocale = getUserLocaleClient();

  const selectedConversation = useChatStore((s) => s.selectedConversation);

  const [friends, setFriends] = useState([]);
  const [displayedFriends, setDisplayedFriends] = useState([]);
  const [reaction, setReaction] = useState();

  const firstItemRef = useRef();

  const getReactMemberList = async () => {
    try {
      const memberInGroupIds = selectedConversation.users.map(
        (u) => u.user._id
      );
      const keyMemberId = selectedConversation.users.find((u) => u.isKeyMember)
        ?.user._id;
      const conversationType = selectedConversation.conversation.type;

      const { data } = await getReactMemberListAPI({
        messageId: message.message._id,
        memberInGroupIds,
        keyMemberId,
        conversationType,
      });

      const reactionTypes = ["like", "dislike", "heart"];
      const fullUserMap = new Map(
        selectedConversation.users.map((usr) => [usr.user._id.toString(), usr])
      );
      const reactionMemberData = reactionTypes.map((type) => {
        const apiUsers = Array.isArray(data.users?.[type])
          ? data.users[type]
          : [];

        const users = apiUsers.map((u) => {
          const userId = u?.user?._id ? u.user._id.toString() : null;
          if (!userId) return u;

          const full = fullUserMap.get(userId);
          if (full) {
            return full;
          }
          return u;
        });

        return { [type]: users };
      });

      setFriends({
        like: reactionMemberData.find((r) => r.like)?.like || [],
        dislike: reactionMemberData.find((r) => r.dislike)?.dislike || [],
        heart: reactionMemberData.find((r) => r.heart)?.heart || [],
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getReactMemberList();
  }, []);

  useEffect(() => {
    if (friends && friends.heart && friends.heart.length > 0) {
      setReaction("heart");
    } else if (friends && friends.like && friends.like.length > 0) {
      setReaction("like");
    } else if (friends && friends.dislike && friends.dislike.length > 0) {
      setReaction("dislike");
    }
  }, [friends]);

  useEffect(() => {
    if (reaction) {
      setDisplayedFriends(friends[reaction]);
    } else {
      setDisplayedFriends([]);
    }
  }, [reaction]);

  useEffect(() => {
    if (!displayedFriends || displayedFriends.length === 0) return;

    const el = firstItemRef.current;
    if (el && typeof el.scrollIntoView === "function") {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [displayedFriends]);

  if (displayedFriends.length === 0)
    return (
      <div className="flex flex-col justify-center items-center gap-2 min-h-[106px]">
        <LoaderIcon className="animate-spin size-5" />
      </div>
    );

  return (
    <div className="flex flex-col gap-2 min-h-[106px]">
      <div className="flex z-99 justify-between items-center">
        <div className={`bg-base-100 flex items-center gap-2`}>
          <div
            className={`group cursor-pointer px-3 py-2 rounded-md border border-base-300 ${
              reaction === "heart" ? "bg-base-200" : ""
            } ${friends?.heart?.length > 0 ? "block" : "hidden"}`}
            onClick={() => setReaction("heart")}
          >
            <Heart
              className={`size-4 group-hover:fill-red-500 group-hover:text-transparent ${
                reaction === "heart" ? "fill-red-500 text-transparent" : ""
              }`}
            />
          </div>
          <div
            className={`group cursor-pointer px-3 py-2 rounded-md border border-base-300 ${
              reaction === "like" ? "bg-base-200" : ""
            } ${friends?.like?.length > 0 ? "block" : "hidden"}`}
            onClick={() => setReaction("like")}
          >
            <ThumbsUp
              className={`size-4 fill-base-100 group-hover:fill-[#fbcc3b] group-hover:text-transparent ${
                reaction === "like" ? "!fill-[#fbcc3b] text-transparent" : ""
              }`}
            />
          </div>
          <div
            className={`group cursor-pointer px-3 py-2 rounded-md border border-base-300 ${
              reaction === "dislike" ? "bg-base-200" : ""
            } ${friends?.dislike?.length > 0 ? "block" : "hidden"}`}
            onClick={() => setReaction("dislike")}
          >
            <ThumbsDown
              className={`size-4 fill-base-100 group-hover:fill-[#fbcc3b] group-hover:text-transparent ${
                reaction === "dislike" ? "!fill-[#fbcc3b] text-transparent" : ""
              }`}
            />
          </div>
        </div>
        <span className="label-text-alt">
          {displayedFriends.length}{" "}
          {displayedFriends.length > 1
            ? singularToPlural(t("quantity"), userLocale)
            : pluralToSingular(t("quantity"), userLocale)}
        </span>
      </div>

      {displayedFriends.length > 0 && (
        <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
          {displayedFriends.map((friend, idx) => (
            <div key={idx} ref={idx === 0 ? firstItemRef : null}>
              <FriendCard_MessageReactions
                friend={friend}
              ></FriendCard_MessageReactions>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CostumedMessageReactions;
