import { LoaderIcon, MessageCircle } from "lucide-react";

const CountAndMessageBadge = ({
  count = 0,
  onClick = () => {},
  isLoading = false,
  className,
}) => {
  // const displayCount = count > 99 ? "9+" : count;

  return (
    <div className={`${className} group w-fit h-fit`} onClick={onClick}>
      <div
        className={`btn btn-primary size-8 p-0 min-w-0 min-h-0 rounded-card cursor-pointer text-sm items-center justify-center ${
          count == 0 ? "" : "hidden"
        } group-hover:flex ${isLoading ? "pointer-events-none" : ""}`}
      >
        {isLoading ? (
          <LoaderIcon className="size-4 animate-spin" />
        ) : (
          <MessageCircle className="size-4" />
        )}
      </div>

      {/* <div
        className={`btn btn-primary size-8 p-0 min-w-0 min-h-0 rounded-card cursor-pointer flex text-sm items-center justify-center ${
          count == 0 ? "hidden" : ""
        } group-hover:hidden`}
      >
        {displayCount}
      </div> */}
    </div>
  );
};

export default CountAndMessageBadge;
