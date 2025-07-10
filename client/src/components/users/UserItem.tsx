import React, { useState } from 'react';
import { User } from '../../types';

interface UserItemProps {
  user: User;
  onStartCall: () => void;
}

const UserItem: React.FC<UserItemProps> = ({ user, onStartCall }) => {
  const [showActions, setShowActions] = useState(false);

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className="w-full px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors duration-200"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="relative">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {getInitials(user.username)}
            </div>
            {/* Status indicator */}
            <div
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                user.status
              )}`}
            />
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate">
              {user.username}
            </h3>
            <p className="text-xs text-gray-500 capitalize">{user.status}</p>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onStartCall}
              className="p-1 text-blue-500 hover:bg-blue-100 rounded-md transition-colors"
              title="Start video call"
            >
              <svg
                className="w-4 h-4"
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
            </button>
            <button
              onClick={() => {
                // TODO: Start direct message
                console.log('Start DM with', user.username);
              }}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
              title="Send message"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserItem;
