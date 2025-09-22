"use client";
import { FLAG_TO_LANGUAGE } from "@/lib/constants";
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

export function getFlagLanguage(countryCode) {
  if (!countryCode) return null;

  const lang = FLAG_TO_LANGUAGE[countryCode];

  return lang;
}

export default FriendCard_Func;
