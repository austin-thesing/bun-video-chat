import React, { useEffect, useRef } from "react";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { useAuth } from "../../contexts/AuthContext";
import MessageItem from "./MessageItem";

interface MessageListProps {
  roomId: number;
}

const MessageList: React.FC<MessageListProps> = ({ roomId }) => {
  const { messages } = useWebSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roomMessages = messages.filter((message) => message.room_id === roomId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages]);

  if (roomMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No messages yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Be the first to send a message!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {roomMessages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={message.user_id === user?.id}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;