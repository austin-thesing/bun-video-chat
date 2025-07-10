import React, { useEffect, useRef } from "react";
import { useWebRTC } from "../../contexts/WebRTCContext";
import VideoControls from "./VideoControls";
import VideoStream from "./VideoStream";

interface VideoCallProps {
  isFullScreen?: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({ isFullScreen = false }) => {
  const {
    localStream,
    remoteStreams,
    isVideoEnabled,
    isAudioEnabled,
    isInCall,
    connectionStates,
    endCall,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
  } = useWebRTC();

  const remoteStreamArray = Array.from(remoteStreams.entries());

  if (!isInCall && !localStream) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No active call
          </h3>
          <p className="text-gray-500 text-sm">
            Start a call from the user list or wait for incoming calls
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full ${
        isFullScreen ? "bg-black" : "bg-gray-900"
      }`}
    >
      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote streams */}
        <div className="h-full grid grid-cols-1 gap-2 p-2">
          {remoteStreamArray.length > 0 ? (
            remoteStreamArray.map(([userId, stream]) => (
              <VideoStream
                key={userId}
                stream={stream}
                userId={userId}
                isLocal={false}
                isFullScreen={isFullScreen}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <p className="text-lg">Waiting for participant...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local stream (picture-in-picture) */}
        {localStream && (
          <div
            className={`absolute ${
              isFullScreen ? "bottom-4 right-4" : "top-4 right-4"
            } ${
              isFullScreen ? "w-48 h-36" : "w-32 h-24"
            } bg-black rounded-lg overflow-hidden shadow-lg`}
          >
            <VideoStream
              stream={localStream}
              userId="local"
              isLocal={true}
              isFullScreen={false}
            />
          </div>
        )}

        {/* Connection status */}
        {connectionStates.size > 0 && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {Array.from(connectionStates.values()).map((state) => (
              <span key={state} className="capitalize">
                {state}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <VideoControls
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        onEndCall={() => endCall()}
        onScreenShare={startScreenShare}
        onStopScreenShare={stopScreenShare}
        isFullScreen={isFullScreen}
      />
    </div>
  );
};

export default VideoCall;