"use client";
import { Hexagon, LogOutIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLogout } from "@/hooks/useLogout";
import { useAuthStore } from "@/stores/useAuthStore";
import LocaleSwitcher from "../buttons/LocaleSwitcher";
import ThemeSelector from "../buttons/ThemeSelector";
import Link from "next/link";
import Image from "next/image";

const Navbar = () => {
  const authUser = useAuthStore((s) => s.authUser);

  const pathname = usePathname();
  const isChatPage = pathname?.includes("/chat");
  const isProfilePage = pathname?.includes("/profile");
  const isChangePasswordPage = pathname?.includes("/change-password");

  const { mutate: logoutMutation, isPending: isLoggingOut } = useLogout();

  const [windowWidth, setWindowWidth] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth;
    return 0;
  });
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end w-full">
            {/* LOGO - ONLY IN THE CHAT PAGE */}
            {isProfilePage || isChatPage || isChangePasswordPage ? (
              windowWidth > 1024 ? (
                <div className="relative -left-[2px]">
                  <Link href="/" className="flex items-center gap-2.5">
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
                  <Link href="/" className="flex items-center gap-2.5">
                    <Hexagon className="size-8 text-primary" />
                  </Link>
                </div>
              )
            ) : null}

            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <ThemeSelector />

              <LocaleSwitcher />

              <div className="avatar">
                <Link href={`/profile`} className="group">
                  <div className="size-8 rounded-full overflow-hidden mx-2 group-hover:scale-125 transition-transform">
                    <Image
                      // src={
                      //   authUser?.user?.profile?.profilePic ||
                      //   "https://avatar.iran.liara.run/public/20.png"
                      // }
                      src={
                        authUser?.user?.profile?.profilePic
                          ? `/images/avatar/${authUser?.user?.profile?.profilePic}.png`
                          : `/images/avatar/1.png`
                      }
                      alt=""
                      rel="noreferrer"
                      width={32}
                      height={32}
                      className="object-cover"
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
