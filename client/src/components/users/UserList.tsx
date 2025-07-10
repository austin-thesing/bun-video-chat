import React from "react";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { useAuth } from "../../contexts/AuthContext";
import { useWebRTC } from "../../contexts/WebRTCContext";
import UserItem from "./UserItem";

const UserList: React.FC = () => {
  const { onlineUsers } = useWebSocket();
  const { user: currentUser } = useAuth();
  const { initializeCall } = useWebRTC();

  // Filter out current user from the list
  const otherUsers = onlineUsers.filter((user) => user.id !== currentUser?.id);

  const handleStartCall = async (userId: string) => {
    try {
      await initializeCall(userId);
    } catch (error) {
      console.error("Failed to start call:", error);
    }
  };

  if (otherUsers.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 text-sm">No other users online</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      <div className="p-2">
        {otherUsers.map((user) => (
          <UserItem
            key={user.id}
            user={user}
            onStartCall={() => handleStartCall(user.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default UserList;