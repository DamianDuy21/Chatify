import "server-only";
import { cookies } from "next/headers";

const rawSecret = process.env.JWT_SECRET_KEY;
if (!rawSecret) {
  throw new Error("Missing JWT_SECRET_KEY env var");
}

export async function getAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  if (!token) return null;

  try {
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
      .join("; ");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`,
      {
        headers: {
          Cookie: cookieHeader,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const authData = await res.json();
    return authData;
  } catch (error) {
    console.error("Auth session error:", error);
    return null;
  }
}
