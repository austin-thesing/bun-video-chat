import React from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';

const ChatWindow: React.FC = () => {
  const { currentRoom } = useWebSocket();

  if (!currentRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              Welcome to Bun Video Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Select a room from the sidebar to start chatting
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="bg-card shadow-sm p-4 border-b">
        <h3 className="text-lg font-semibold">Room #{currentRoom}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList roomId={currentRoom} />
        <TypingIndicator roomId={currentRoom} />
      </div>

      <Separator />

      {/* Message Input */}
      <MessageInput roomId={currentRoom} />
    </div>
  );
};

export default ChatWindow;
