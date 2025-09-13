import { LANGUAGES_DATA } from "../constants";

export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
export const deepTrimObj = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;

  const trimmed = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === "string") {
      trimmed[key] = value.trim();
    } else if (typeof value === "object" && value !== null) {
      trimmed[key] = deepTrimObj(value);
    } else {
      trimmed[key] = value;
    }
  }

  return trimmed;
};

export const formatFileSize = (bytes) => {
  if (typeof bytes !== "number" || isNaN(bytes)) return "0 B";

  if (bytes < 1024) return `${bytes} B`;
  else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  else return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getFileExtension = (fileName) => {
  if (!fileName) return "";
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

export const copyToClipboard = (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  } catch (err) {
    console.error(err);
  }
};

export const getLocalImageAsFile = async (fileName) => {
  // Đường dẫn file ảnh (giả sử để trong thư mục public/images/avatar)
  const response = await fetch(`/images/avatar/${fileName}`);
  const blob = await response.blob();

  // Lấy MIME type từ blob
  const fileType = blob.type || "image/png";

  // Tạo File object (giống như khi input chọn file)
  const file = new File([blob], fileName, { type: fileType });
  return file;
};

export const getProfilePicUrl = (profilePic) => {
  if (!profilePic) return null;

  if (typeof profilePic === "string") return profilePic;

  if (profilePic.url) return profilePic.url;

  if (profilePic instanceof File || profilePic instanceof Blob) {
    return URL.createObjectURL(profilePic);
  }

  return null;
};

export function formatRelativeTime(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;

  if (isNaN(created.getTime())) return "";
  if (diffMs < 0) return "Vừa xong";

  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "Vừa xong";

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;

  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} ngày trước`;

  const month = Math.floor(day / 30);
  if (month < 12) return `${month} tháng trước`;

  const year = Math.floor(day / 365);
  return `${year} năm trước`;
}

export const toDownloadUrl = (url, filename) => {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const i = parts.findIndex((p) => p === "upload");
    if (i === -1) return url;

    const namePart =
      filename && filename.trim()
        ? `fl_attachment:${encodeURIComponent(filename)}`
        : "fl_attachment";

    parts.splice(i + 1, 0, namePart);

    u.pathname = parts.join("/");
    return u.toString();
  } catch {
    return url;
  }
};

export const getLocaleById = (id) => {
  const lang = LANGUAGES_DATA.find((item) => item._id === id);
  return lang ? lang.locale : null;
};

export const isConversationFitFilter = ({
  conversation,
  conversationNameFilter,
  authUser,
}) => {
  let isFitFilter = false;
  if (conversation.conversation.type === "chatbot") {
    if ("chatbot".includes(conversationNameFilter.trim().toLowerCase())) {
      isFitFilter = true;
    }
  } else if (conversation.conversation.type === "group") {
    if (
      conversation.conversation.name
        .toLowerCase()
        .includes(conversationNameFilter.trim().toLowerCase())
    ) {
      isFitFilter = true;
    }
  } else {
    const otherParticipant = conversation.users.find(
      (p) => p.user._id !== authUser?.user?._id
    );
    if (otherParticipant) {
      const fullName = `${otherParticipant.user.fullName}`.toLowerCase();
      if (fullName.includes(conversationNameFilter.trim().toLowerCase())) {
        isFitFilter = true;
      }
    }
  }
  return isFitFilter;
};

export const formatISOToParts = (iso, timeZone = "Asia/Bangkok") => {
  const d = new Date(iso);

  const time = new Intl.DateTimeFormat("vi-VN", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

  const date = new Intl.DateTimeFormat("vi-VN", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);

  return { time, date };
};
