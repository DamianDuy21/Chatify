"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider({ children }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          removeDelay: 100,
          duration: 3000,
          style: {
            fontSize: "14px",
            minHeight: "48px",
            padding: "8px 16px",
          },
        }}
        gutter={8}
      />
    </>
  );
}
