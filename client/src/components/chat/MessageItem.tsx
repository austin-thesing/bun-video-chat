import React from 'react';
import { Message } from '../../types';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <div className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg flex ${
          isOwn ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar */}
        <Avatar className={`flex-shrink-0 w-8 h-8 ${isOwn ? 'ml-2' : 'mr-2'}`}>
          <AvatarFallback
            className={
              isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }
          >
            {getInitials(message.username)}
          </AvatarFallback>
        </Avatar>

        {/* Message Content */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Username and Time */}
          <div
            className={`flex items-center mb-1 ${
              isOwn ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <span className="font-semibold text-sm text-foreground">
              {message.username}
            </span>
            <span
              className={`text-xs text-muted-foreground ${
                isOwn ? 'mr-2' : 'ml-2'
              }`}
            >
              {formatTime(message.timestamp)}
            </span>
          </div>

          {/* Message Bubble */}
          <div
            className={`rounded-lg px-3 py-2 max-w-full break-words ${
              isOwn
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <p className="text-sm">{message.content}</p>
          </div>

          {/* Message Status */}
          {message.edited_at && (
            <Badge variant="secondary" className="text-xs mt-1">
              edited {formatTime(message.edited_at)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
