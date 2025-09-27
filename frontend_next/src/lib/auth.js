import "server-only";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const JWT_NAME = "jwt_chatify";

export async function getAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_NAME)?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const authData = await res.json();
    return authData;
  } catch (error) {
    console.error("Auth session error:", error);
    return null;
  }
}
