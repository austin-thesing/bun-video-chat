import React, { useEffect, useRef } from "react";

interface VideoStreamProps {
  stream: MediaStream;
  userId: string;
  isLocal: boolean;
  isFullScreen: boolean;
}

const VideoStream: React.FC<VideoStreamProps> = ({
  stream,
  userId,
  isLocal,
  isFullScreen,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream?.getVideoTracks().length > 0;
  const hasAudio = stream?.getAudioTracks().length > 0;
  const isVideoEnabled = hasVideo && stream.getVideoTracks()[0]?.enabled;

  return (
    <div className="relative h-full w-full bg-gray-800 rounded-lg overflow-hidden">
      {isVideoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Mute local video to prevent feedback
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <p className="text-sm">
              {isLocal ? "You" : `User ${userId}`}
            </p>
          </div>
        </div>
      )}

      {/* User label */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
        {isLocal ? "You" : `User ${userId}`}
      </div>

      {/* Audio indicator */}
      {hasAudio && (
        <div className="absolute top-2 right-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              stream.getAudioTracks()[0]?.enabled
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          >
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {stream.getAudioTracks()[0]?.enabled ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              )}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoStream;