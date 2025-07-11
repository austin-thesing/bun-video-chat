import React, { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import FileUpload from './FileUpload';

interface MessageInputProps {
  roomId: number;
}

const MessageInput: React.FC<MessageInputProps> = ({ roomId }) => {
  const { sendMessage, sendTyping, isConnected } = useWebSocket();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
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
    setMessage('');

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="p-3 md:p-4 border-t bg-background">
      <form onSubmit={handleSubmit} className="flex space-x-2 items-end">
        <FileUpload roomId={roomId} />
        <Input
          type="text"
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0"
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        <Button
          type="submit"
          disabled={!isConnected || !message.trim()}
          size="sm"
          className="px-3 md:px-6 flex-shrink-0"
        >
          <span className="hidden sm:inline">Send</span>
          <span className="sm:hidden">→</span>
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;
