import React from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWebRTC } from '../../contexts/WebRTCContext';
import UserItem from './UserItem';

const UserList: React.FC = () => {
  const { onlineUsers } = useWebSocket();
  const { user: currentUser } = useAuth();
  const { showPreview } = useWebRTC();

  // Filter out current user from the list
  const otherUsers = onlineUsers.filter((user) => user.id !== currentUser?.id);

  const handleStartCall = (userId: string) => {
    showPreview(userId);
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
      <div className="p-3 space-y-1">
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
