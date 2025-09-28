import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import {
  CallControls,
  CallingState,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useAuthStore } from "../stores/useAuthStore";
import { getVideoCallTokenAPI } from "../lib/api";
import { showToast } from "../components/costumed/CostumedToast";
import ScreenShareFullscreen from "../components/chats/ScreenShareFullscreen";
import CommonPageLoader from "../components/loaders/CommonPageLoader";
import { useTranslation } from "react-i18next";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const VideoCallPage = () => {
  const { t } = useTranslation("videoCallPage");
  const { id: videoCallId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const authUser = useAuthStore((s) => s.authUser);

  const { data: videoCallTokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getVideoCallTokenAPI,
    enabled: !!authUser,
  });

  useEffect(() => {
    const initCall = async () => {
      if (!videoCallTokenData?.data?.token || !authUser || !videoCallId) return;

      try {
        setIsConnecting(true);
        const user = {
          id: authUser.user._id,
          name: authUser.user.fullName,
          image: authUser.user.profile.profilePic,
        };

        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: videoCallTokenData.data.token,
        });

        const callInstance = videoClient.call("default", videoCallId);

        await callInstance.join({ create: true });

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.error("Error joining call:", error);
        showToast({
          message: error?.response?.data?.message || t("initCall.error"),
          type: "error",
        });
      } finally {
        setIsConnecting(false);
      }
    };

    initCall();
  }, [videoCallTokenData, authUser, videoCallId]);

  if (isConnecting) return <CommonPageLoader />;

  return (
    //  flex flex-col items-center justify-center
    <div className="min-h-screen w-screen flex flex-col">
      <div className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center" />

      {client && call ? (
        <div className="relative h-[calc(100vh-64px)] flex items-center justify-center">
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <div className="bg-base-300 pb-0 p-4 w-full h-full">
                <CallContent />
              </div>
            </StreamCall>
          </StreamVideo>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          {t("initCall.error")}
        </div>
      )}
    </div>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const navigate = useNavigate();

  if (callingState === CallingState.LEFT) return navigate("/");

  return (
    <StreamTheme>
      <ScreenShareFullscreen />
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};

export default VideoCallPage;
