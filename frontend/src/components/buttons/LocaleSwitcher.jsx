import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function LocaleSwitcher({ bordered = true }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [dropUp, setDropUp] = useState(false);
  const ulRef = useRef(null);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };
  const closeDropdown = () => {
    setIsOpen(false);
    setDropUp(false);
  };

  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang);
    closeDropdown();
  };

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

  useEffect(() => {
    if (isOpen) {
      if (ulRef.current) {
        const rect = ulRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.top;

        if (spaceBelow < rect.height + 8) {
          setDropUp(true);
        } else {
          setDropUp(false);
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="dropdown relative" ref={dropdownRef}>
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle"
        onClick={toggleDropdown}
      >
        <img
          src={getFlagSrcByLocale(i18n.language)}
          alt="Language flag"
          className="w-6 h-6 object-contain"
        />
      </div>

      {isOpen && (
        <ul
          ref={ulRef}
          tabIndex={-1}
          className={`${
            bordered ? "border border-primary/25" : ""
          } dropdown-content bg-base-200 rounded-card shadow-lg p-2 ${
            dropUp ? "bottom-14" : "top-14"
          } -right-2 flex flex-col gap-1`}
          role="listbox"
        >
          {locales.map((lang) => (
            <li
              onClick={() => toggleLanguage(lang.locale)}
              key={lang.locale}
              role="option"
              aria-selected={i18n.language === lang.locale}
            >
              <button
                className="btn btn-ghost btn-circle"
                type="button"
                aria-label={lang.name}
                disabled={i18n.language === lang.locale}
              >
                <img
                  src={getFlagSrcByLocale(lang.locale)}
                  alt={lang.locale}
                  className="w-6 h-6 object-contain"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
