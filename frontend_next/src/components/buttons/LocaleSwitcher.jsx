"use client";

import { useEffect, useRef, useState } from "react";
import { setUserLocale } from "@/services/locale";
import { useLocale } from "next-intl";
import Image from "next/image";

const getFlagSrcByLocale = (locale) => {
  switch (locale) {
    case "vi":
      return "/images/flag/vietnamese.png";
    case "en":
      return "/images/flag/english.png";
    case "jp":
      return "/images/flag/japanese.png";
    case "id":
      return "/images/flag/indonesian.png";
    default:
      return "/images/flag/vietnamese.png";
  }
};

const locales = [
  { locale: "vi", name: "Tiếng Việt" },
  { locale: "en", name: "English" },
  // { locale: "jp", name: "日本語" },
  // { locale: "id", name: "Bahasa Indonesia" },
];

export default function LocaleSwitcher({ bordered = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const dropdownRef = useRef(null);
  const ulRef = useRef(null);

  const locale = useLocale();

  const toggleDropdown = () => setIsOpen((p) => !p);
  const closeDropdown = () => {
    setIsOpen(false);
    setDropUp(false);
  };

  const toggleLanguage = (lang) => {
    setUserLocale(lang);
    closeDropdown();
  };

  useEffect(() => {
    if (!isOpen || !ulRef.current) return;
    const rect = ulRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.top;
    setDropUp(spaceBelow < rect.height + 8);
  }, [isOpen]);

  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="dropdown relative" ref={dropdownRef}>
      <button
        type="button"
        className="btn btn-ghost btn-circle"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Image
          src={getFlagSrcByLocale(locale)}
          alt={`${locale} flag`}
          className="w-6 h-6 object-contain"
          width={24}
          height={24}
        />
      </button>

      {isOpen && (
        <ul
          ref={ulRef}
          tabIndex={-1}
          className={`${
            bordered ? "border border-primary/25" : ""
          } dropdown-content bg-base-200 rounded-card shadow-md p-2 ${
            dropUp ? "bottom-14" : "top-14"
          } -right-2 flex flex-col gap-1 z-50`}
          role="listbox"
        >
          {locales.map((lang) => (
            <li
              onClick={() => toggleLanguage(lang.locale)}
              key={lang.locale}
              role="option"
              aria-selected={locale === lang.locale}
            >
              <button
                className={`btn btn-ghost btn-circle ${
                  locale === lang.locale ? "pointer-events-none opacity-70" : ""
                }`}
                type="button"
                aria-label={lang.name}
                disabled={locale === lang.locale}
              >
                <Image
                  src={getFlagSrcByLocale(lang.locale)}
                  alt={lang.locale}
                  className="w-6 h-6 object-contain"
                  width={24}
                  height={24}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
