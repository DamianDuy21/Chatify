"use client";

import Image from "next/image";

const CostumedAvatarSeenBy = ({
  className = "",
  seenByList = [],
  onClick = () => {},
}) => {
  return (
    <div
      className={`relative cursor-pointer w-full h-[26px] flex justify-end items-center ${className}`}
      onClick={onClick}
    >
      {seenByList.length > 3 ? (
        <div className="flex gap-1 justify-end items-center relative w-[48px]">
          <div className="w-4 rounded-full absolute left-[0px]">
            <Image
              src={
                seenByList[0]?.user?.profile?.profilePic
                  ? `/images/avatar/${seenByList[0]?.user?.profile?.profilePic}.png`
                  : `/images/avatar/1.png`
              }
              alt="avatar"
              width={16}
              height={16}
            />
          </div>
          <div className="w-4 rounded-full absolute left-[10px]">
            <Image
              src={
                seenByList[1]?.user?.profile?.profilePic
                  ? `/images/avatar/${seenByList[1]?.user?.profile?.profilePic}.png`
                  : `/images/avatar/1.png`
              }
              alt="avatar"
              width={16}
              height={16}
            />
          </div>
          <div className="w-4 rounded-full absolute left-[20px]">
            <Image
              src={
                seenByList[2]?.user?.profile?.profilePic
                  ? `/images/avatar/${seenByList[2]?.user?.profile?.profilePic}.png`
                  : `/images/avatar/1.png`
              }
              alt="avatar"
              width={16}
              height={16}
            />
          </div>
          <span className="relative w-[12px] flex justify-end items-end -bottom-[2px] pointer-events-none opacity-70">
            ...
          </span>
        </div>
      ) : seenByList.length === 3 ? (
        <div className="flex gap-1 justify-end items-center relative w-[36px]">
          <div className="w-4 rounded-full absolute left-[0px]">
            <Image
              src={
                seenByList[0]?.user?.profile?.profilePic
                  ? `/images/avatar/${seenByList[0]?.user?.profile?.profilePic}.png`
                  : `/images/avatar/1.png`
              }
              alt="avatar"
              width={16}
              height={16}
            />
          </div>
          <div className="w-4 rounded-full absolute left-[10px]">
            <Image
              src={
                seenByList[1]?.user?.profile?.profilePic
                  ? `/images/avatar/${seenByList[1]?.user?.profile?.profilePic}.png`
                  : `/images/avatar/1.png`
              }
              alt="avatar"
              width={16}
              height={16}
            />
          </div>
          <div className="w-4 rounded-full absolute left-[20px]">
            <Image
              src={
                seenByList[2]?.user?.profile?.profilePic
                  ? `/images/avatar/${seenByList[2]?.user?.profile?.profilePic}.png`
                  : `/images/avatar/1.png`
              }
              alt="avatar"
              width={16}
              height={16}
            />
          </div>
        </div>
      ) : (
        <>
          {seenByList.length === 2 ? (
            <div className="flex gap-1 justify-end items-center relative w-[26px]">
              <div className="w-4 rounded-full absolute left-[0px]">
                <Image
                  src={
                    seenByList[0]?.user?.profile?.profilePic
                      ? `/images/avatar/${seenByList[0]?.user?.profile?.profilePic}.png`
                      : `/images/avatar/1.png`
                  }
                  alt="avatar"
                  width={16}
                  height={16}
                />
              </div>
              <div className="w-4 rounded-full absolute left-[10px]">
                <Image
                  src={
                    seenByList[1]?.user?.profile?.profilePic
                      ? `/images/avatar/${seenByList[1]?.user?.profile?.profilePic}.png`
                      : `/images/avatar/1.png`
                  }
                  alt="avatar"
                  width={16}
                  height={16}
                />
              </div>
            </div>
          ) : (
            <div className="w-4 rounded-full">
              <Image
                src={
                  seenByList[0]?.user?.profile?.profilePic
                    ? `/images/avatar/${seenByList[0]?.user?.profile?.profilePic}.png`
                    : `/images/avatar/1.png`
                }
                alt="avatar"
                width={16}
                height={16}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CostumedAvatarSeenBy;
