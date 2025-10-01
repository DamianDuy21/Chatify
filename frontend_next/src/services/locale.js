"use server";

import { defaultLocale } from "@/i18n/config";
import { cookies } from "next/headers";

// In this example the locale is read from a cookie. You could alternatively
// also read it from a database, backend service, or any other source.
const COOKIE_NAME = "NEXT_LOCALE";
const JWT_NAME = "jwt_chatify";
const TOOLTIP_STATUS = "tooltip_status_chatify";

export async function getUserLocale() {
  return (await cookies()).get(COOKIE_NAME)?.value || defaultLocale;
}

export async function getUserToken() {
  return (await cookies()).get(JWT_NAME)?.value || null;
}

export async function setUserLocale(locale) {
  (await cookies()).set(COOKIE_NAME, locale);
}

export async function setUserTooltipStatus(status) {
  (await cookies()).set(TOOLTIP_STATUS, status);
}
