import React from "react";
import { Room } from "../../types";

interface RoomItemProps {
  room: Room;
  isActive: boolean;
  onClick: () => void;
}

const RoomItem: React.FC<RoomItemProps> = ({ room, isActive, onClick }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getRoomIcon = () => {
    if (room.type === "direct") {
      return "👤";
    } else {
      return "#";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`w-full p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
        isActive
          ? "bg-blue-100 border-blue-300 border"
          : "hover:bg-gray-50 border border-transparent"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div
            className={`text-lg ${
              room.type === "direct" ? "text-gray-600" : "text-blue-500"
            }`}
          >
            {getRoomIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3
                className={`font-medium text-sm truncate ${
                  isActive ? "text-blue-800" : "text-gray-900"
                }`}
              >
                {room.name}
              </h3>
              {room.unread_count && room.unread_count > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {room.unread_count > 99 ? "99+" : room.unread_count}
                </span>
              )}
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