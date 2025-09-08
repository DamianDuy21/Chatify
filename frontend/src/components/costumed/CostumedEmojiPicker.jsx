import EmojiPicker from "emoji-picker-react";
import { cloneElement, useEffect, useRef, useState } from "react";

const CostumedEmojiPicker = ({ trigger, onEmojiClick }) => {
  const [showPicker, setShowPicker] = useState(false);
  const emojiRef = useRef(null);
  const [emojiWidth, setEmojiWidth] = useState(240);

  const handleToggle = () => {
    setShowPicker((prev) => !prev);
  };

  const handleEmojiClick = (emojiData) => {
    onEmojiClick?.(emojiData);
  };

  const triggerWithHandler = cloneElement(trigger, {
    onClick: handleToggle,
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth < 1024 ? 240 : 400;
      setEmojiWidth(newWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative">
      {triggerWithHandler}
      {showPicker && (
        <div className="absolute bottom-14 -left-2 z-50" ref={emojiRef}>
          <EmojiPicker
            theme="dark"
            skinTonesDisabled={true}
            previewConfig={{ showPreview: false }}
            autoFocusSearch={false}
            onEmojiClick={handleEmojiClick}
            open={showPicker}
            width={emojiWidth}
            height={326}
            categories={["smileys_people"]}
            className="border !border-primary/25 !bg-base-200"
          />
        </div>
      )}
    </div>
  );
};

export default CostumedEmojiPicker;
