import React from "react";

const CommonRoundedButton = ({
  children,
  onClick,
  type = "primary",
  className,
}) => {
  return (
    <div
      className={`btn btn-${type} size-8 p-0 min-w-0 min-h-0 rounded-card cursor-pointer text-sm flex items-center justify-center ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default CommonRoundedButton;
