"use client";
import { getLocaleById } from "@/lib/utils";
import { getLanguageFlag } from "./FriendCard_Func";

const FriendCard_FriendSelectInModal = ({
  friend = null,
  isSelected = false,
  onSelected = () => {},
}) => {
  return (
    <div
      className={`h-16 
        border
        !border-base-300 flex items-center 
        px-4 cursor-pointer relative
        hover:bg-base-300
        gap-4
      `}
      onClick={() => {
        onSelected(friend);
      }}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelected(friend)}
        className="checkbox checkbox-sm"
      />
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-3 relative">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={friend?.profile?.profilePic} alt="" />
            </div>
          </div>

          <div className="absolute left-8 -bottom-0">
            <span className="size-2 rounded-full bg-success inline-block" />
          </div>

          <div className={``}>
            <p className="font-semibold text-sm">{friend?.fullName}</p>
          </div>
        </div>
        <div className="flex justify-center gap-1 -mr-1">
          <span className="relative -top-[1px]">
            {getLanguageFlag(getLocaleById(friend.profile.nativeLanguage))}
          </span>
          <span className="relative -top-[1px]">
            {getLanguageFlag(getLocaleById(friend.profile.learningLanguage))}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FriendCard_FriendSelectInModal;
