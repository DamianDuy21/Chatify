"use client";
import { LoaderIcon } from "lucide-react";
import { useRef } from "react";
import FriendCard_MessageSeenBy from "../cards/FriendCard_MessageSeenBy";

const CostumedMessageSeenByList = ({ seenByList }) => {
  const firstItemRef = useRef();

  if (seenByList.length === 0)
    return (
      <div className="flex flex-col justify-center items-center gap-2 min-h-[106px]">
        <LoaderIcon className="animate-spin size-5" />
      </div>
    );

  return (
    <div className="flex flex-col gap-2 min-h-[64px]">
      {seenByList.length > 0 && (
        <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
          {seenByList.map((friend, idx) => (
            <div key={idx} ref={idx === 0 ? firstItemRef : null}>
              <FriendCard_MessageSeenBy
                friend={friend}
              ></FriendCard_MessageSeenBy>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CostumedMessageSeenByList;
