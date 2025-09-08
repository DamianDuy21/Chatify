import { useLocation } from "react-router";
import Navbar from "../components/layouts/Navbar";
import Sidebar from "../components/layouts/Sidebar";
const MainLayout = ({ children }) => {
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");
  const isProfilePage = location.pathname?.startsWith("/profile");
  const isChangePasswordPage =
    location.pathname?.startsWith("/change-password");

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
