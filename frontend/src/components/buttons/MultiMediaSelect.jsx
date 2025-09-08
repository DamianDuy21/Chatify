import { File, Image, PaletteIcon, Paperclip, Video } from "lucide-react";
import { cloneElement, useEffect, useRef, useState } from "react";
import { THEMES } from "../../constants";
import CommonRoundedButton from "./CommonRoundedButton";

const MultiMediaSelect = () => {
  const [isOpen, setIsOpen] = useState(false);

  const ulRef = useRef(null);
  const triggerRef = useRef(null);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ulRef.current && !ulRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (triggerRef.current && triggerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* Trigger */}
      <CommonRoundedButton
        ref={triggerRef}
        onClick={() => {
          handleToggle();
        }}
      >
        <Paperclip className="size-4 " />
      </CommonRoundedButton>

      {/* Dropdown content */}
      {isOpen && (
        <div
          ref={ulRef}
          className={`
        absolute z-50 w-[max-content] p-2 left-0 bottom-14 bg-base-200 rounded-card border border-primary/25
        max-h-[204px] overflow-y-auto costumedScrollbar transition-all
         
      `}
        >
          <div className="space-y-2">
            <button
              key={"image"}
              className={`w-full rounded-btn hover:bg-base-content/5 transition-colors flex items-center gap-3 px-4 py-3 border-none text-sm font-semibold`}
              onClick={() => {}}
            >
              <Image className="size-4" />
              <span className="text-sm ">Ảnh</span>
            </button>
            <button
              key={"video"}
              className={`w-full rounded-btn hover:bg-base-content/5 transition-colors flex items-center gap-3 px-4 py-3 border-none text-sm font-semibold`}
              onClick={() => {}}
            >
              <Video className="size-4" />
              <span className="text-sm ">Video</span>
            </button>
            <button
              key={"file"}
              className={`w-full rounded-btn hover:bg-base-content/5 transition-colors flex items-center gap-3 px-4 py-3 border-none text-sm font-semibold`}
              onClick={() => {}}
            >
              <File className="size-4" />
              <span className="text-sm ">Tệp</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default MultiMediaSelect;
