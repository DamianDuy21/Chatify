"use client";

import Image from "next/image";

const CostumedAvatarGroupChat = ({ conversation }) => {
  return (
    <div className="relative h-full w-full">
      {conversation?.users.length >= 3 ? (
        <>
          <div className="w-4 rounded-full absolute left-[3px] bottom-[6px]">
            <Image
              src={conversation?.users[0]?.user?.profile?.profilePic}
              alt="avatar"
              width={16}
              height={16}
            />
          </div>
          <div className="w-4 rounded-full absolute left-3 top-[2px]">
            <Image
              src={conversation?.users[1]?.user?.profile?.profilePic}
              alt="avatar"
              width={16}
              height={16}
            />
          </div>
          <div className="w-4 rounded-full absolute right-[3px] bottom-[6px]">
            <Image
              src={conversation?.users[2]?.user?.profile?.profilePic}
              alt="avatar"
              width={16}
              height={16}
            />
          </div>
        </>
      ) : (
        <>
          {conversation?.users.length === 2 ? (
            <>
              <div className="w-5 rounded-full absolute left-[3px] bottom-[16px]">
                <Image
                  src={conversation?.users[0]?.user?.profile?.profilePic}
                  alt="avatar"
                  width={20}
                  height={20}
                />
              </div>
              <div className="w-5 rounded-full absolute right-[3px] top-[16px]">
                <Image
                  src={conversation?.users[1]?.user?.profile?.profilePic}
                  alt="avatar"
                  width={20}
                  height={20}
                />
              </div>
            </>
          ) : (
            <>
              <Image
                src={conversation?.users[0]?.user?.profile?.profilePic}
                alt="avatar"
                width={40}
                height={40}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CostumedAvatarGroupChat;
