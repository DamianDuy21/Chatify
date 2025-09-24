"use client";
import { getUserLocaleClient } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import CostumedDebounceInput from "./CostumedDebounceInput";

export default function CostumedSelect({
  placeholder,
  options = [],
  onSelect,
  defaultValue = null,
  className = "",
  isDeselectAble = true,
}) {
  const NEXT_LOCALE = getUserLocaleClient() || "vi";
  const t = useTranslations("Components.costumedSelect");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState();
  const dropdownRef = useRef(null);

  const [displayOptions, setDisplayOptions] = useState([]);

  const handleSelect = (option) => {
    setSelected(option);
    setOpen(false);
    onSelect(option);
  };

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (defaultValue) {
      setSelected(defaultValue);
    }
  }, [defaultValue]);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="costumedSelect w-full justify-between flex items-center"
      >
        {selected && selected?.name[NEXT_LOCALE]
          ? selected.name[NEXT_LOCALE]
          : placeholder}
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute z-10 w-full costumedSelectOptionContainer mt-2 p-2`}
        >
          {options.length > 1 && (
            <div className={`mb-2`}>
              <CostumedDebounceInput
                name={"searchInput"}
                onChange={(value) => {
                  setDisplayOptions(
                    options.filter((opt) =>
                      opt.name[NEXT_LOCALE].toLowerCase().includes(
                        value.toLowerCase()
                      )
                    )
                  );
                }}
                placeholder={t("search.placeholder")}
              />
            </div>
          )}
          <ul
            className={`flex flex-col gap-1 w-full overflow-y-scroll max-h-[100px] ${className}`}
          >
            {isDeselectAble && (
              <li key={"none-option"} className="">
                <button
                  type="button"
                  className="block w-full text-left px-4 py-2 hover:bg-base-200 text-sm h-[48px] rounded-btn"
                  onClick={() => handleSelect("")}
                >
                  {t("noneOption")}
                </button>
              </li>
            )}

            {displayOptions.map((opt, idx) => {
              return (
                <li key={opt.locale || idx} className="">
                  <button
                    type="button"
                    className="block w-full text-left px-4 py-2 hover:bg-base-200 text-sm h-[48px] rounded-btn"
                    onClick={() => handleSelect(opt)}
                  >
                    {opt.name[NEXT_LOCALE]}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
