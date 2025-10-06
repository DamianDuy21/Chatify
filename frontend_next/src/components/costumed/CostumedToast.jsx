"use client";
import { CircleCheck, CircleX, X } from "lucide-react";
import { toast } from "react-hot-toast";

let toastQueue = [];
const MAX_TOAST = 3;

function pruneToastQueue() {
  try {
    toastQueue = toastQueue.filter((id) => toast.isActive(id));
  } catch (e) {}
}

export function showToast({ message, type = "success" }) {
  pruneToastQueue();
  if (toastQueue.length >= MAX_TOAST) {
    const oldToastId = toastQueue.shift();
    toast.dismiss(oldToastId);
  }
  const id = (() => {
    switch (type) {
      case "success":
        return toast.custom((t) => (
          <div
            className={`${
              t.visible ? "animate-custom-enter" : "animate-custom-leave"
            } max-w-md w-full bg-white shadow-md rounded-card pointer-events-auto flex items-center`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-center justify-center">
                <div className="flex-shrink-0">
                  <CircleCheck className="size-6 fill-green-500 text-white" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-gray-900">{message}</p>
                </div>
              </div>
            </div>
            <div
              className="flex justify-center items-center p-4 cursor-pointer"
              onClick={() => toast.dismiss(t.id)}
            >
              <X className="size-4 text-gray-600" />
            </div>
          </div>
        ));
      case "error":
        return toast.custom((t) => (
          <div
            className={`${
              t.visible ? "animate-custom-enter" : "animate-custom-leave"
            } max-w-md w-full bg-white shadow-md rounded-card pointer-events-auto flex items-center`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-center justify-center">
                <div className="flex-shrink-0">
                  <CircleX className="size-6 fill-red-500 text-white" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-gray-900">{message}</p>
                </div>
              </div>
            </div>
            <div
              className="flex justify-center items-center p-4 cursor-pointer"
              onClick={() => toast.dismiss(t.id)}
            >
              <X className="size-4 text-gray-600" />
            </div>
          </div>
        ));
      default:
        return toast(message);
    }
  })();

  toastQueue.push(id);
}
