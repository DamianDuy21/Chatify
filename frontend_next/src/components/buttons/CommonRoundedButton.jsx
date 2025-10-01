"use client";

import { getUserTooltipStatusClient } from "@/lib/utils";
import { Tooltip } from "react-tooltip";

const CommonRoundedButton = ({
  children,
  onClick,
  type = "primary",
  className = "",
  tooltip = {
    isShowTooltip: false,
    positionTooltip: "bottom",
    classNameTooltip: "",
    idTooltip: "tooltip-rounded-button",
    contentTooltip: "",
    offsetTooltip: 8,
  },
}) => {
  const {
    isShowTooltip,
    positionTooltip,
    classNameTooltip,
    idTooltip,
    contentTooltip,
    offsetTooltip,
  } = tooltip;

  const tooltipStatus = getUserTooltipStatusClient();

  return (
    <>
      <div
        className={`btn btn-${type} size-8 p-0 min-w-0 min-h-0 rounded-card cursor-pointer text-sm flex items-center justify-center ${className}`}
        onClick={onClick}
        data-tooltip-id={idTooltip}
        data-tooltip-content={contentTooltip}
      >
        {children}
      </div>

      {isShowTooltip && tooltipStatus === "on" && (
        <Tooltip
          key={idTooltip}
          id={idTooltip}
          place={positionTooltip}
          offset={offsetTooltip}
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

export default CommonRoundedButton;
