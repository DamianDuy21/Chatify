import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/useAuthStore";

const MessageNotification = ({ message }) => {
  const authUser = useAuthStore((s) => s.authUser);
  const { t } = useTranslation("components", {
    keyPrefix: "messageNotification",
  });

  const userId = message.message?.content.split("-")[2];
  const fullName = message.message?.content.split("-")[1];
  const action = message.message?.content.split("-")[0];

  return (
    <>
      {/* content */}
      <div className={`w-full`}>
        {message.message?.content && message.message?.content.trim() !== "" && (
          <div className="flex justify-center items-center">
            <div className="px-4 py-3">
              <div className="text-xs opacity-70 break-words whitespace-pre-wrap">
                {userId === authUser?.user?._id ? t("user.you") : fullName}{" "}
                {action === "leave_group"
                  ? t("action.leave_group")
                  : action === "added_to_group"
                  ? t("action.added_to_group")
                  : action === "deleted_from_group"
                  ? t("action.deleted_from_group")
                  : ""}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MessageNotification;
