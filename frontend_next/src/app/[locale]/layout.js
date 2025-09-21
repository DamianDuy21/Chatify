import { routing } from "@/i18n/routing";
import TanstackReactQueryProvider from "@/providers/TanstackReactQueryProvider";
import ToastProvider from "@/providers/ToastProvider";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import "../globals.css";

export const metadata = {
  title: "Chatify",
  description: "",
  icons: { icon: "/hexagon.svg" },
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
  } catch (e) {}
})();
`;

export default async function RootLayout({ children, params }) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

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
      <body className="min-h-dvh bg-base-100 text-base-content">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TanstackReactQueryProvider>
            <ToastProvider>{children}</ToastProvider>
          </TanstackReactQueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
