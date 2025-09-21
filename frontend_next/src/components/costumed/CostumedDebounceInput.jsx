"use client";
import { LoaderIcon, Search } from "lucide-react";
import { useEffect, useState } from "react";

const CostumedDebounceInput = ({
  type = "text",
  name,
  defaultValue = "",
  onChange,
  className,
  iconClassName = "",
  placeholder,
  maxLength = 50,
  searchIcon = true,
  isSearching = false,
}) => {
  const [searchValue, setSearchValue] = useState(defaultValue);
  const [debouncedSearch, setDebouncedSearch] = useState(defaultValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchValue]);

  useEffect(() => {
    onChange(debouncedSearch);
  }, [debouncedSearch]);

  return (
    <>
      <div className="relative w-full">
        <input
          type={type}
          name={name}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className={`input input-bordered w-full text-sm pr-12 ${className}`}
          placeholder={placeholder}
          maxLength={maxLength}
        />
        {searchIcon &&
          (isSearching ? (
            <LoaderIcon
              className={`size-4 animate-spin absolute top-[calc(50%-8px)] right-4 opacity-70 ${iconClassName}`}
            />
          ) : (
            <Search
              className={`size-4 absolute top-[calc(50%-8px)] right-4 opacity-20 ${iconClassName}`}
            />
          ))}
      </div>
    </>
  );
};

export default CostumedDebounceInput;
