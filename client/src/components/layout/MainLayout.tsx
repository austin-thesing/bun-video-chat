import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { useWebRTC } from "../../contexts/WebRTCContext";
import Sidebar from "./Sidebar";
import ChatWindow from "../chat/ChatWindow";
import VideoCall from "../video/VideoCall";

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const { isInCall } = useWebRTC();
  const [showVideoCall, setShowVideoCall] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Bun Video Chat</h1>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.username}!
              </span>
              <button
                onClick={() => setShowVideoCall(!showVideoCall)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                {showVideoCall ? "Hide Video" : "Show Video"}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Chat Area */}
          <div className={`${showVideoCall ? "flex-1" : "w-full"} flex flex-col`}>
            <ChatWindow />
          </div>

          {/* Video Call Area */}
          {showVideoCall && (
            <div className="w-96 border-l bg-white">
              <VideoCall />
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Video Call Overlay */}
      {isInCall && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <VideoCall isFullScreen />
        </div>
      )}
    </div>
  );
};

export default MainLayout;