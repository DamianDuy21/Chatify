"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ParticipantView,
  useCallStateHooks,
  hasScreenShare,
} from "@stream-io/video-react-sdk";
import { ExternalLink } from "lucide-react";
import CommonRoundedButton from "../buttons/CommonRoundedButton";

export default function ScreenShareFullscreen() {
  const { useParticipants, useHasOngoingScreenShare } = useCallStateHooks();
  const participants = useParticipants();
  const hasShare = useHasOngoingScreenShare();

  // tìm người đang chia sẻ
  const sharer = useMemo(
    () => participants.find((p) => hasScreenShare(p)) || null,
    [participants]
  );

  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const openFullscreen = async () => {
    const el = containerRef.current;
    if (!el || !el.requestFullscreen) return;
    try {
      await el.requestFullscreen();
    } catch (error) {
      console.error("RequestFullscreen failed:", error);
    }
  };

  const closeFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error("ExitFullscreen failed:", error);
      }
    }
  };

  if (!hasShare || !sharer) return null;

  return (
    <>
      <CommonRoundedButton
        className={
          "btn-primary absolute top-[26px] right-[26px] lg:top-4 lg:right-4 z-50"
        }
        onClick={openFullscreen}
        tooltip={{
          isShowTooltip: true,
          positionTooltip: "left",
          classNameTooltip: "",
          idTooltip: "tooltip-fullscreen",
          contentTooltip: "Open fullscreen",
        }}
      >
        <ExternalLink className="size-4" />
      </CommonRoundedButton>

      <div
        ref={containerRef}
        className={`fixed inset-0 ${isFullscreen ? "block" : "hidden"}`}
      >
        <div className="relative h-screen w-screen flex items-center justify-center">
          {/* <button
            onClick={closeFullscreen}
            className="absolute top-3 right-3 z-50 rounded-card size-8 text-sm font-medium bg-black/60 text-white hover:bg-black/70 transition"
            title="Thoát toàn màn hình"
          >
            ✕
          </button> */}

          <ParticipantView
            participant={sharer}
            trackType="screenShareTrack"
            className={`h-full w-full !rounded-[none] ${
              isFullscreen ? "!max-w-[100vw]" : ""
            }`}
          />
        </div>
      </div>
    </>
  );
}
