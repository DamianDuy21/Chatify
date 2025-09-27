import { getAuthSession } from "@/lib/auth";
import PublicClientProvider from "@/providers/PublicClientProvider";
import { redirect } from "next/navigation";

export default async function PublicLayout({ children }) {
  const authData = await getAuthSession();

  if (authData && authData.data.user && authData.data.user.isOnboarded) {
    return redirect("/");
  }
  if (authData && !authData.data.user.isOnboarded) {
    return redirect("/onboarding");
  }

  return <PublicClientProvider>{children}</PublicClientProvider>;
}
