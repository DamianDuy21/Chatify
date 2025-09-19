import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        btn: "var(--rounded-btn, 0.5rem)",
        card: "var(--rounded-box, 1rem /* 16px */)",
      },
    },
  },
  plugins: [daisyui, "@tailwindcss/line-clamp"],
  daisyui: {
    themes: [
      "corporate",
      "halloween",
      "lofi",
      "fantasy",
      "black",
      "dracula",
      "business",
      "night",
      "winter",
      "nord",
    ],
  },
};
