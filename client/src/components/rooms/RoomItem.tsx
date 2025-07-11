import React, { useState, useEffect, useRef } from 'react';
import { Room } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface RoomItemProps {
  room: Room;
  isActive: boolean;
  onClick: () => void;
}

const RoomItem: React.FC<RoomItemProps> = ({ room, isActive, onClick }) => {
  const { user } = useAuth();
  const { updateRoom, deleteRoom } = useWebSocket();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(room.name);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCreator = user?.id === room.created_by;
  const canEdit = isCreator && room.name !== 'General' && room.id !== 1;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleEdit = async () => {
    if (editName.trim() && editName !== room.name) {
      await updateRoom(room.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${room.name}"?`)) {
      await deleteRoom(room.id);
    }
    setShowMenu(false);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const formatTime = (timestamp: number | string) => {
    const date =
      typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getRoomIcon = () => {
    if (room.type === 'direct') {
      return '👤';
    } else {
      return '#';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`w-full px-3 py-2 rounded-md cursor-pointer transition-colors duration-200 ${
        isActive
          ? 'bg-blue-100 border-blue-300 border'
          : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div
            className={`text-lg ${
              room.type === 'direct' ? 'text-gray-600' : 'text-blue-500'
            }`}
          >
            {getRoomIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEdit();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  className="font-medium text-sm bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h3
                  className={`font-medium text-sm truncate ${
                    isActive ? 'text-blue-800' : 'text-gray-900'
                  }`}
                >
                  {room.name}
                </h3>
              )}

              <div className="flex items-center space-x-1">
                {room.unread_count && room.unread_count > 0 && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    {room.unread_count > 99 ? '99+' : room.unread_count}
                  </span>
                )}

                {canEdit && (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={handleMenuClick}
                      className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                    >
                      ⋮
                    </button>

                    {showMenu && (
                      <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                        {' '}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {room.last_message && (
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500 truncate">
                  {room.last_message.content}
                </p>
                <span className="text-xs text-gray-400 ml-2">
                  {formatTime(room.last_message.timestamp)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomItem;
