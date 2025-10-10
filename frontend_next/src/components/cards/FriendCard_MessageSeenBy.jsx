"use client";
import Image from "next/image";
import { getLanguageFlag } from "./FriendCard_Func";
import { getLocaleById } from "@/lib/utils";

const FriendCard_MessageSeenBy = ({ friend = null }) => {
  return (
    <div
      className={`h-16 w-full
        border
        !border-base-300 flex items-center
        px-4 relative gap-6
      `}
    >
      <div className="flex justify-between items-center flex-1">
        <div className="flex items-center gap-3 relative">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <Image
                // src={friend?.user?.profile?.profilePic}
                src={
                  friend?.user?.profile?.profilePic
                    ? `/images/avatar/${friend?.user?.profile?.profilePic}.png`
                    : `/images/avatar/1.png`
                }
                alt="avatar"
                width={40}
                height={40}
              />
            </div>
          </div>

          <div className={`flex items-center gap-2`}>
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
    </div>
  );
};

export default FriendCard_MessageSeenBy;
