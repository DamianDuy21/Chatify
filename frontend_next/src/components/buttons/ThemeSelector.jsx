"use client";
import { PaletteIcon } from "lucide-react";
import { useThemeStore } from "../../stores/useThemeStore";
import { useEffect, useRef, useState } from "react";
import { THEMES } from "@/lib/constants";

const ThemeSelector = () => {
  const { theme, setTheme } = useThemeStore();
  const [dropUp, setDropUp] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const ulRef = useRef(null);
  const triggerRef = useRef(null);
  const selectedRef = useRef(null);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (isOpen && ulRef.current && triggerRef.current) {
      const rect = ulRef.current.getBoundingClientRect();
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      const height = rect.height || 204;

      if (spaceBelow < height + 8 && spaceAbove > height + 8) {
        setDropUp(true);
      } else {
        setDropUp(false);
      }
    }

    if (isOpen && ulRef.current && selectedRef.current) {
      const container = ulRef.current;
      const selected = selectedRef.current;

      const offsetTop = selected.offsetTop;
      const scrollTarget = offsetTop - 8;

      container.scrollTo({
        top: scrollTarget,
        behavior: "smooth",
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ulRef.current && !ulRef.current.contains(event.target)) {
        toggleDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        tabIndex={0}
        className="btn btn-ghost btn-circle"
        onClick={toggleDropdown}
        ref={triggerRef}
      >
        <PaletteIcon className="size-5 text-base-content opacity-70" />
      </button>

      {/* Dropdown content */}
      {isOpen && (
        <div
          ref={ulRef}
          className={`
        absolute z-50 w-56 mt-2 p-2 right-0 shadow-lg bg-base-200 backdrop-blur-lg rounded-card border border-primary/25
        max-h-[218px] overflow-y-auto costumedScrollbar transition-all
        ${dropUp ? "bottom-full mb-2" : "top-full mt-2"}
      `}
        >
          <div className="space-y-2">
            {THEMES.map((themeOption) => (
              <button
                ref={(el) => {
                  if (theme === themeOption.name) {
                    selectedRef.current = el;
                  }
                }}
                key={themeOption.name}
                className={`
              w-full px-4 py-3 rounded-btn flex items-center gap-3 transition-colors
              ${
                theme === themeOption.name
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-base-content/5"
              }
            `}
                onClick={() => {
                  setTheme(themeOption.name);
                  setIsOpen(false);
                }}
              >
                <span className="text-sm font-medium">{themeOption.label}</span>
                <div className="ml-auto flex gap-1">
                  {themeOption.colors.map((color, i) => (
                    <span
                      key={i}
                      className="size-2 rounded-card"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default ThemeSelector;
