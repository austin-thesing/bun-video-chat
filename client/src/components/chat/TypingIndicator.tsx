import React from "react";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { useAuth } from "../../contexts/AuthContext";

interface TypingIndicatorProps {
  roomId: number;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ roomId }) => {
  const { typingUsers, onlineUsers } = useWebSocket();
  const { user } = useAuth();

  const roomTypingUsers = typingUsers.get(roomId);
  if (!roomTypingUsers || roomTypingUsers.size === 0) {
    return null;
  }

  // Filter out current user from typing users
  const otherTypingUsers = Array.from(roomTypingUsers).filter(
    (userId) => userId !== user?.id
  );

  if (otherTypingUsers.length === 0) {
    return null;
  }

  // Get usernames for typing users
  const typingUsernames = otherTypingUsers
    .map((userId) => {
      const onlineUser = onlineUsers.find((u) => u.id === userId);
      return onlineUser?.username || `User ${userId}`;
    })
    .slice(0, 3); // Limit to 3 usernames

  const getTypingText = () => {
    if (typingUsernames.length === 1) {
      return `${typingUsernames[0]} is typing...`;
    } else if (typingUsernames.length === 2) {
      return `${typingUsernames[0]} and ${typingUsernames[1]} are typing...`;
    } else if (typingUsernames.length === 3) {
      return `${typingUsernames[0]}, ${typingUsernames[1]} and ${typingUsernames[2]} are typing...`;
    } else {
      return `${typingUsernames.length} people are typing...`;
    }
  };

  return (
    <div className="px-4 py-2">
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-150"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-300"></div>
        </div>
        <span>{getTypingText()}</span>
      </div>
    </div>
  );
};

export default TypingIndicator;