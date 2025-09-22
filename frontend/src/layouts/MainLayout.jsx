import { useLocation } from "react-router";
import Navbar from "../components/layouts/Navbar";
import Sidebar from "../components/layouts/Sidebar";
const MainLayout = ({ children }) => {
  const location = useLocation();
  const isChatPage = location.pathname?.includes("/chat");
  const isProfilePage = location.pathname?.includes("/profile");
  const isChangePasswordPage = location.pathname?.includes("/change-password");

  return (
    <>
      <div className="min-h-screen bg-base-100 text-base-content">
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
