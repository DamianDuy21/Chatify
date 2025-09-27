import TanstackReactQueryProvider from "@/providers/TanstackReactQueryProvider";
import ToastProvider from "@/providers/ToastProvider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import "./globals.css";
import { getUserLocale } from "@/services/locale";

export const metadata = {
  title: "Chatify",
  description: "Chatify: Học ngoại ngữ dễ dàng và hiệu quả",
  icons: { icon: "/hexagon.svg" },
  openGraph: {
    title: "Chatify",
    description: "Chatify: Học ngoại ngữ dễ dàng và hiệu quả",
    url: "https://chatify.example.com",
    siteName: "Chatify",
    images: [
      {
        url: "https://private-user-images.githubusercontent.com/165623366/486825136-cb2e059d-0ee2-47b0-a64b-881927baa343.jpg?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NTg5NDE0NjUsIm5iZiI6MTc1ODk0MTE2NSwicGF0aCI6Ii8xNjU2MjMzNjYvNDg2ODI1MTM2LWNiMmUwNTlkLTBlZTItNDdiMC1hNjRiLTg4MTkyN2JhYTM0My5qcGc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUwOTI3JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MDkyN1QwMjQ2MDVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT03Yzc3NjkzYTllYTIxMGQxM2IyZDkwZGMwMWI2YTMxMTA3YTNkMzE2YmQ4MmQyN2M2M2NlYTFjODhlZTAxNGYyJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.4_Z5hW4_heXAhkqILE9yW5IOGFmhqtBHIHZK5WX2ZO8",
        width: 1200,
        height: 630,
        alt: "Chatify Thumbnail",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
};

const darkSet = new Set([
  "dark",
  "night",
  "halloween",
  "black",
  "dracula",
  "business",
]);

export async function getServerTheme() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("chatify-theme")?.value ?? "light";
  const resolved = raw === "system" ? "light" : raw;
  const colorScheme = darkSet.has(resolved) ? "dark" : "light";
  return { saved: raw, resolved, colorScheme };
}

const themeInit = `
(function () {
  try {
    var m = document.cookie.match(/(?:^|; )chatify-theme=([^;]*)/);
    var saved = (m && m[1]) ? m[1] : 'light';
    try { saved = decodeURIComponent(saved); } catch {}
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var darkSet = new Set(['dark','night','halloween','black','dracula','business']);
    var resolved = saved === 'system' ? (prefersDark ? 'dark' : 'light') : saved;
    var el = document.documentElement;
    el.setAttribute('data-theme', resolved);
    el.style.colorScheme = darkSet.has(resolved) ? 'dark' : 'light';
    // đảm bảo cookie luôn phản ánh lựa chọn hiện tại
    document.cookie = 'chatify-theme=' + saved + '; path=/; max-age=31536000; samesite=lax';
  } catch (error) {}
})();
`;

export default async function RootLayout({ children }) {
  const locale = await getUserLocale();

  setRequestLocale(locale);
  const messages = await getMessages();

  const { resolved, colorScheme } = await getServerTheme();

  return (
    <html
      lang={locale}
      data-theme={resolved}
      style={{ colorScheme }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="h-screen bg-base-100 text-base-content">
        <NextIntlClientProvider>
          <TanstackReactQueryProvider>
            <ToastProvider>{children}</ToastProvider>
          </TanstackReactQueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
