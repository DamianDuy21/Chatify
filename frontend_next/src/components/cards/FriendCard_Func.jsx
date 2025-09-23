"use client";
import { getFlagToLanguage } from "@/lib/utils";
import Image from "next/image";

const FriendCard_Func = () => {
  return <div>FriendCard_Func</div>;
};

export function getLanguageFlag(countryCode) {
  if (!countryCode) return null;

  if (countryCode) {
    return (
      <Image
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${countryCode} flag`}
        className="h-3 mr-1 inline-block"
        width={16}
        height={12}
      />
    );
  }
  return null;
}

export default FriendCard_Func;
