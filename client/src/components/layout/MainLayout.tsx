import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useWebRTC } from '../../contexts/WebRTCContext';
import Sidebar from './Sidebar';
import ChatWindow from '../chat/ChatWindow';
import MessageInput from '../chat/MessageInput';
import VideoCall from '../video/VideoCall';
import VideoPreview from '../video/VideoPreview';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Menu, Video, VideoOff, LogOut } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, currentRoom } = useWebSocket();
  const {
    isInCall,
    showVideoPreview,
    previewTargetUser,
    hidePreview,
    startCallWithPreview,
  } = useWebRTC();
  const [showVideoCall, setShowVideoCall] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar - Fixed */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-40"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Fixed */}
        <header className="bg-card shadow-sm border-b px-4 md:px-6 py-4 flex-shrink-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg md:text-xl font-semibold">
                Bun Video Chat
              </h1>
              <Badge
                variant={isConnected ? 'default' : 'destructive'}
                className="hidden sm:flex"
              >
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Welcome, {user?.username}!
              </span>
              <Button
                onClick={() => setShowVideoCall(!showVideoCall)}
                variant="outline"
                size="sm"
                className="hidden md:flex"
              >
                {showVideoCall ? (
                  <VideoOff className="h-4 w-4 mr-2" />
                ) : (
                  <Video className="h-4 w-4 mr-2" />
                )}
                {showVideoCall ? 'Hide Video' : 'Show Video'}
              </Button>
              <Button
                onClick={() => setShowVideoCall(!showVideoCall)}
                variant="outline"
                size="icon"
                className="md:hidden"
              >
                {showVideoCall ? (
                  <VideoOff className="h-4 w-4" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={handleLogout}
                variant="destructive"
                size="sm"
                className="hidden md:flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <Button
                onClick={handleLogout}
                variant="destructive"
                size="icon"
                className="md:hidden"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Chat Area */}
          <div
            className={`${showVideoCall && !isInCall ? 'md:flex-1' : 'w-full'} flex flex-col min-h-0`}
          >
            <ChatWindow />
          </div>

          {/* Video Call Area - Desktop */}
          {showVideoCall && !isInCall && (
            <div className="hidden md:block w-96 border-l bg-card flex-shrink-0">
              <VideoCall />
            </div>
          )}

          {/* Video Call Area - Mobile (Full Width) */}
          {showVideoCall && !isInCall && (
            <div className="md:hidden h-64 border-t bg-card flex-shrink-0">
              <VideoCall />
            </div>
          )}
        </div>

        {/* Fixed Message Input at Bottom */}
        {currentRoom && (
          <div className="fixed bottom-0 left-0 right-0 z-20 bg-background border-t shadow-lg md:left-64">
            <MessageInput roomId={currentRoom} />
          </div>
        )}
      </div>

      {/* Full Screen Video Call Overlay */}
      {isInCall && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <VideoCall isFullScreen />
        </div>
      )}

      {/* Video Preview Modal */}
      {showVideoPreview && (
        <VideoPreview
          onStartCall={startCallWithPreview}
          onCancel={hidePreview}
          targetUser={previewTargetUser || undefined}
        />
      )}
    </div>
  );
};

export default MainLayout;
