import React from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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
    <div className="flex-1 flex flex-col bg-background min-h-0">
      {/* Chat Header - Fixed */}
      <div className="bg-card shadow-sm p-4 border-b flex-shrink-0">
        <h3 className="text-lg font-semibold">Room #{currentRoom}</h3>
      </div>

      {/* Messages - Scrollable with bottom padding for fixed input */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-20">
        <MessageList roomId={currentRoom} />
        <div className="p-4">
          <TypingIndicator roomId={currentRoom} />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
