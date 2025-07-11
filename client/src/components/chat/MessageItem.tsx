import React, { useState } from 'react';
import { Message } from '../../types';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import ImagePreview from './ImagePreview';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn }) => {
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    } else {
      return (
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
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      );
    }
  };

  const renderMessageContent = () => {
    if (message.type === 'image' && message.file_path) {
      return (
        <div className="max-w-xs">
          <img
            src={`/api/files/${message.file_path}`}
            alt={message.file_name || 'Image'}
            className="rounded-lg max-w-full h-auto max-h-48 object-cover cursor-pointer shadow-sm"
            onClick={() => setImagePreviewOpen(true)}
          />
          {message.content && message.content !== message.file_name && (
            <p className="text-sm mt-2">{message.content}</p>
          )}
        </div>
      );
    } else if (message.type === 'file' && message.file_path) {
      return (
        <div className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg border">
          <div className="flex-shrink-0">
            {getFileIcon(message.file_type || '')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {message.file_name || 'Unknown file'}
            </p>
            <p className="text-xs text-muted-foreground">
              {message.file_size
                ? formatFileSize(message.file_size)
                : 'Unknown size'}
            </p>
          </div>
          <a
            href={`/api/files/${message.file_path}`}
            download={message.file_name}
            className="flex-shrink-0 p-1 hover:bg-background/50 rounded transition-colors"
            title="Download file"
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </a>
        </div>
      );
    } else {
      return <p className="text-sm">{message.content}</p>;
    }
  };

  return (
    <>
      <div className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg flex ${
            isOwn ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          {/* Avatar */}
          <Avatar
            className={`flex-shrink-0 w-8 h-8 ${isOwn ? 'ml-2' : 'mr-2'}`}
          >
            <AvatarFallback
              className={
                isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }
            >
              {getInitials(message.username)}
            </AvatarFallback>
          </Avatar>

          {/* Message Content */}
          <div
            className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
          >
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
              className={`rounded-lg max-w-full break-words ${
                message.type === 'text'
                  ? `px-3 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`
                  : `p-2 ${
                      isOwn
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-muted/50 border border-muted'
                    }`
              }`}
            >
              {renderMessageContent()}
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

      {/* Image Preview Modal */}
      {message.type === 'image' && message.file_path && (
        <ImagePreview
          isOpen={imagePreviewOpen}
          onClose={() => setImagePreviewOpen(false)}
          imageSrc={`/api/files/${message.file_path}`}
          imageAlt={message.file_name || 'Image'}
        />
      )}
    </>
  );
};

export default MessageItem;
