"use client";

import { useEffect } from "react";

const CostumedModal = ({ open = false, onClose, title, children }) => {
  const handleClose = () => {
    onClose?.();
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="modal modal-open fixed inset-0 flex items-center justify-center !z-[999999999] bg-black/40 !m-0"
    >
      <div className="modal-box relative bg-base-100 !rounded-btn">
        <button
          aria-label="Close"
          className="btn btn-sm btn-circle rounded-card btn-ghost absolute right-4 top-4 z-[99]"
          onClick={handleClose}
        >
          ✕
        </button>

        {title && <h3 className="font-bold text-lg mb-4">{title}</h3>}

        {typeof children === "function"
          ? children({ close: handleClose })
          : children}
      </div>
    </div>
  );
};

export default CostumedModal;
