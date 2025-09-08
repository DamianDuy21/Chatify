// CostumedToast.js
import { toast } from "react-hot-toast";

let toastQueue = []; // lưu danh sách toast đang hiển thị
const MAX_TOAST = 3;

export function showToast({ message, type = "success" }) {
  if (toastQueue.length >= MAX_TOAST) {
    const oldToastId = toastQueue.shift();
    toast.dismiss(oldToastId);
  }
  const id = (() => {
    switch (type) {
      case "success":
        return toast.success(message);
      case "error":
        return toast.error(message);
      case "loading":
        return toast.loading(message);
      case "custom":
        return toast.custom(message);
      default:
        return toast(message);
    }
  })();

  toastQueue.push(id);
}
