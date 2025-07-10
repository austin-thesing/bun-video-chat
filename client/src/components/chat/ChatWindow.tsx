import React from "react";
import { useWebSocket } from "../../contexts/WebSocketContext";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";

const ChatWindow: React.FC = () => {
  const { currentRoom } = useWebSocket();

  if (!currentRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Welcome to Bun Video Chat
          </h2>
          <p className="text-gray-500">
            Select a room from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white shadow-sm p-4 border-b">
        <h3 className="text-lg font-semibold">
          Room #{currentRoom}
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <MessageList roomId={currentRoom} />
        <TypingIndicator roomId={currentRoom} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t">
        <MessageInput roomId={currentRoom} />
      </div>
    </div>
  );
};

export default ChatWindow;