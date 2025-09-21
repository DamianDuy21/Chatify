import MainLayout from "@/components/layouts/MainLayout";
import { getAuthSession } from "@/lib/auth";
import AuthAndOnboardClientProvider from "@/providers/AuthAndOnboardClientProvider";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuthAndOnboardLayout({ children }) {
  const authData = await getAuthSession();

  if (!authData || !authData.data.user) {
    return redirect("/signin");
  }
  if (authData && !authData.data.user.isOnboarded) {
    return redirect("/onboarding");
  }

  return (
    <AuthAndOnboardClientProvider>
      <MainLayout>{children}</MainLayout>
    </AuthAndOnboardClientProvider>
  );
}
