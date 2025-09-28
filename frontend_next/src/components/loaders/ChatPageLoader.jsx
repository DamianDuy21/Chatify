"use client";

import { LoaderIcon } from "lucide-react";

function ChatPageLoader() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4">
      <LoaderIcon className="animate-spin size-8 text-primary" />
      {/* <p className="mt-4 text-center text-lg font-mono">
        Connecting to Chats...
      </p> */}
    </div>
  );
}

export default ChatPageLoader;
