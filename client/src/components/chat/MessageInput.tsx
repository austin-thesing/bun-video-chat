import React, { useState, useRef, useEffect } from "react";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { useAuth } from "../../contexts/AuthContext";

interface MessageInputProps {
  roomId: number;
}

const MessageInput: React.FC<MessageInputProps> = ({ roomId }) => {
  const { sendMessage, sendTyping, isConnected } = useWebSocket();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isConnected || !user) return;

    sendMessage(message.trim(), roomId);
    setMessage("");
    
    // Stop typing indicator
    if (isTyping) {
      sendTyping(roomId, false);
      setIsTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!isConnected || !user) return;

    // Handle typing indicator
    if (e.target.value.trim() && !isTyping) {
      setIsTyping(true);
      sendTyping(roomId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        sendTyping(roomId, false);
        setIsTyping(false);
      }
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        <button
          type="submit"
          disabled={!isConnected || !message.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default MessageInput;