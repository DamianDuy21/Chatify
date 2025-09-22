"use client";
import { useEffect, useState } from "react";
import FriendCard_FriendSelectInModal from "../cards/FriendCard_FriendSelectInModal";
import CostumedDebounceInput from "./CostumedDebounceInput";

const CostumedGroupChatUpdateMemberRoleList = ({
  friends = [],
  isLeaving = false,
  selectedFriends = [],
  onSelected = () => {},
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [displayedFriends, setDisplayedFriends] = useState(friends);

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

  return (
    <div className="flex flex-col gap-2">
      <div className={`bg-base-100 z-99`}>
        <CostumedDebounceInput
          name={"searchInput"}
          onChange={(value) => {
            setSearchValue(value);
          }}
          placeholder={"Tìm kiếm thành viên"}
        />
      </div>

      {displayedFriends.length > 0 && (
        <div className="flex flex-col gap-1 max-h-50 overflow-y-auto">
          {displayedFriends.map((friend, idx) => (
            <div key={friend?.user?._id || idx}>
              <FriendCard_FriendSelectInModal
                friend={friend?.user}
                onSelected={onSelected}
                isSelected={selectedFriends.includes(friend?.user?._id)}
              ></FriendCard_FriendSelectInModal>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CostumedGroupChatUpdateMemberRoleList;
