import { LoaderIcon } from "lucide-react";
import FriendCard_FriendSelectInModal from "../cards/FriendCard_FriendSelectInModal";
import CostumedDebounceInput from "./CostumedDebounceInput";
import { useTranslation } from "react-i18next";

const CostumedFriendSelectInModal = ({
  isLoadingGetFriends = false,
  friends = [],
  selectedFriends = [],
  onSelected = () => {},
  onFiltered = () => {},
}) => {
  const { t } = useTranslation("components", {
    keyPrefix: "costumedFriendSelectInModal",
  });
  return (
    <div className="flex flex-col gap-2">
      <div className={`bg-base-100 z-99`}>
        <CostumedDebounceInput
          name={"searchInput"}
          onChange={(value) => {
            onFiltered(value);
          }}
          placeholder={t("search.placeholder")}
        />
      </div>

      {friends.length > 0 && !isLoadingGetFriends ? (
        <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
          {friends.map((friend) => (
            <div key={friend?.user?._id}>
              <FriendCard_FriendSelectInModal
                friend={friend?.user}
                onSelected={onSelected}
                isSelected={selectedFriends.includes(friend?.user?._id)}
              ></FriendCard_FriendSelectInModal>
            </div>
          ))}
        </div>
      ) : (
        <>
          {isLoadingGetFriends && (
            <div className="flex justify-center items-center mt-4">
              <LoaderIcon className="size-6 animate-spin" />
            </div>
          )}
          {friends.length === 0 && !isLoadingGetFriends && (
            <div className="flex items-center justify-center w-full mt-4">
              {t("noMatch")}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CostumedFriendSelectInModal;
