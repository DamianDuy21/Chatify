"use client";

import { Tooltip } from "react-tooltip";
import { LoaderIcon, MessageCircle } from "lucide-react";
import { getUserTooltipStatusClient } from "@/lib/utils";

const CountAndMessageBadge = ({
  count = 0,
  onClick = () => {},
  isLoading = false,
  className = "",
  tooltip = {
    isShowTooltip: false,
    positionTooltip: "bottom",
    classNameTooltip: "",
    idTooltip: "tooltip-count-badge",
    contentTooltip: "",
  },
}) => {
  const {
    isShowTooltip,
    positionTooltip,
    classNameTooltip,
    idTooltip,
    contentTooltip,
  } = tooltip;

  const tooltipStatus = getUserTooltipStatusClient();

  return (
    <>
      <div
        className={`group w-fit h-fit ${className}`}
        onClick={isLoading ? undefined : onClick}
        role="button"
        tabIndex={0}
        data-tooltip-id={idTooltip}
        data-tooltip-content={contentTooltip}
      >
        <div
          className={`btn btn-primary size-8 p-0 min-w-0 min-h-0 rounded-card cursor-pointer text-sm items-center justify-center ${
            count == 0 ? "" : "hidden"
          } group-hover:flex ${
            isLoading ? "pointer-events-none opacity-70" : ""
          }`}
        >
          {isLoading ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : (
            <MessageCircle className="size-4" />
          )}
        </div>

        {/*
        <div
          className={`btn btn-primary size-8 p-0 min-w-0 min-h-0 rounded-card cursor-pointer flex text-sm items-center justify-center ${
            count == 0 ? "hidden" : ""
          } group-hover:hidden ${isLoading ? "pointer-events-none opacity-70" : ""}`}
        >
          {displayCount}
        </div>
        */}
      </div>

      {isShowTooltip && tooltipStatus === "on" && (
        <Tooltip
          key={idTooltip}
          id={idTooltip}
          place={positionTooltip}
          offset={8}
          delayShow={100}
          delayHide={80}
          className={`!pointer-events-none !rounded-card !border !border-primary/25
                      !bg-base-100 !h-8 !px-3 !text-xs !text-base-content
                      !shadow-none !whitespace-nowrap !z-[999999999] ${classNameTooltip}`}
        />
      )}
    </>
  );
};

export default CountAndMessageBadge;
