import { FLAG_TO_LANGUAGE } from "../../constants";

const FriendCard_Func = () => {
  return <div>FriendCard_Func</div>;
};

export function getLanguageFlag(countryCode) {
  if (!countryCode) return null;

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${countryCode} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }
  return null;
}

export default FriendCard_Func;
