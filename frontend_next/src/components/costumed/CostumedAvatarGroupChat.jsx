"use client";
const CostumedAvatarGroupChat = ({ conversation }) => {
  return (
    <div className="relative h-full w-full">
      {conversation?.users.length >= 3 ? (
        <>
          <div className="w-4 rounded-full absolute left-[3px] bottom-[6px]">
            <img
              src={conversation?.users[0]?.user?.profile?.profilePic}
              alt=""
            />
          </div>
          <div className="w-4 rounded-full absolute left-3 top-[2px]">
            <img
              src={conversation?.users[1]?.user?.profile?.profilePic}
              alt=""
            />
          </div>
          <div className="w-4 rounded-full absolute right-[3px] bottom-[6px]">
            <img
              src={conversation?.users[2]?.user?.profile?.profilePic}
              alt=""
            />
          </div>
        </>
      ) : (
        <>
          {conversation?.users.length === 2 ? (
            <>
              <div className="w-5 rounded-full absolute left-[3px] bottom-[16px]">
                <img
                  src={conversation?.users[0]?.user?.profile?.profilePic}
                  alt=""
                />
              </div>
              <div className="w-5 rounded-full absolute right-[3px] top-[16px]">
                <img
                  src={conversation?.users[1]?.user?.profile?.profilePic}
                  alt=""
                />
              </div>
            </>
          ) : (
            <>
              <img
                src={conversation?.users[0]?.user?.profile?.profilePic}
                alt=""
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CostumedAvatarGroupChat;
