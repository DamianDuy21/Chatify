"use client";

import { LoaderIcon } from "lucide-react";

const CommonPageLoader = ({ className }) => {
  return (
    <div
      className={`min-h-[100vh] flex items-center justify-center ${className}`}
    >
      <LoaderIcon className="animate-spin size-8 text-primary" />
    </div>
  );
};

export default CommonPageLoader;
