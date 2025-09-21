"use client";
import Navbar from "@/components/layouts/Navbar";
import Sidebar from "@/components/layouts/Sidebar";
import { usePathname } from "next/navigation";

const MainLayout = ({ children }) => {
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith("/chat");
  const isProfilePage = pathname?.startsWith("/profile");
  const isChangePasswordPage = pathname?.startsWith("/change-password");

  return (
    <>
      <div className="min-h-screen">
        <div className="flex">
          {/* SIDEBAR */}
          {isChatPage || isProfilePage || isChangePasswordPage ? null : (
            <Sidebar />
          )}

          <main className="flex-1 flex flex-col">
            <Navbar />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </main>
        </div>
      </div>
    </>
  );
};

export default MainLayout;
