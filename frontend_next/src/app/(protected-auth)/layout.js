import { getAuthSession } from "@/lib/auth";
import AuthClientProvider from "@/providers/AuthClientProvider";
import { redirect } from "next/navigation";

export default async function ProtectedAuthLayout({ children }) {
  const authData = await getAuthSession();

  if (!authData || !authData.data.user) {
    return redirect("/signin");
  }
  if (authData && authData.data.user.isOnboarded) {
    return redirect("/");
  }
  return <AuthClientProvider>{children}</AuthClientProvider>;
}
