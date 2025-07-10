import React from "react";
import { Message } from "../../types";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg flex ${
          isOwn ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
            isOwn ? "bg-blue-500 ml-2" : "bg-gray-500 mr-2"
          }`}
        >
          {getInitials(message.username)}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          {/* Username and Time */}
          <div
            className={`flex items-center mb-1 ${
              isOwn ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <span className="font-semibold text-sm text-gray-700">
              {message.username}
            </span>
            <span
              className={`text-xs text-gray-500 ${
                isOwn ? "mr-2" : "ml-2"
              }`}
            >
              {formatTime(message.timestamp)}
            </span>
          </div>

          {/* Message Bubble */}
          <div
            className={`rounded-lg px-3 py-2 max-w-full break-words ${
              isOwn
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            <p className="text-sm">{message.content}</p>
          </div>

          {/* Message Status */}
          {message.edited_at && (
            <span className="text-xs text-gray-400 mt-1">
              edited {formatTime(message.edited_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;