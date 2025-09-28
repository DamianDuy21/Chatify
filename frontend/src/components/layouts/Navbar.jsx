import { Hexagon, LogOutIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { useLogout } from "../../hooks/useLogout";
import { useAuthStore } from "../../stores/useAuthStore";
import LocaleSwitcher from "../buttons/LocaleSwitcher";
import ThemeSelector from "../buttons/ThemeSelector";

const Navbar = () => {
  const authUser = useAuthStore((s) => s.authUser);
  const location = useLocation();
  const isChatPage = location.pathname?.includes("/chat");
  const isProfilePage = location.pathname?.includes("/profile");
  const isChangePasswordPage = location.pathname?.includes("/change-password");

  const { mutate: logoutMutation, isPending: isLoggingOut } = useLogout();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <nav
        className={`bg-base-200 border-b border-base-300 sticky top-0 z-30 flex items-center h-16 ${
          isChatPage || isProfilePage || isChangePasswordPage ? "w-screen" : ""
        } `}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end w-full">
            {/* LOGO - ONLY IN THE CHAT PAGE */}
            {isProfilePage || isChatPage || isChangePasswordPage ? (
              windowWidth > 1024 ? (
                <div className="relative -left-[2px]">
                  <Link to="/" className="flex items-center gap-2.5">
                    <Hexagon className="size-6 text-primary" />
                    <span className="text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                      Chatify
                    </span>
                  </Link>
                </div>
              ) : (
                <div
                  className={`w-12 flex items-center justify-center sm:w-auto`}
                >
                  <Link to="/" className="flex items-center gap-2.5">
                    <Hexagon className="size-8 text-primary" />
                  </Link>
                </div>
              )
            ) : null}

            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              {/* <Link to={"/notifications"}>
                <button className="btn btn-ghost btn-circle">
                  <BellIcon className="h-5 w-5 text-base-content opacity-70" />
                </button>
              </Link> */}

              <ThemeSelector />

              <LocaleSwitcher />

              <div className="avatar">
                <Link to={`/profile`} className="group">
                  <div className="size-8 rounded-full overflow-hidden mx-2 group-hover:scale-125 transition-transform">
                    <img
                      src={
                        authUser?.user?.profile?.profilePic ||
                        "https://avatar.iran.liara.run/public/20.png"
                      }
                      alt=""
                      rel="noreferrer"
                    />
                  </div>
                </Link>
              </div>

              {/* Logout button */}
              <button
                className="btn btn-ghost btn-circle"
                onClick={logoutMutation}
              >
                <LogOutIcon className="h-5 w-5 text-base-content opacity-70" />
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
