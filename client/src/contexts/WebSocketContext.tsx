import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { WebSocketService } from '../services/websocket';
import { WSMessage, Message, User, Room, TypingStatus } from '../types';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  isConnected: boolean;
  messages: Message[];
  onlineUsers: User[];
  rooms: Room[];
  currentRoom: number | null;
  typingUsers: Map<number, Set<string>>;
  sendMessage: (content: string, roomId: number) => void;
  sendTyping: (roomId: number, isTyping: boolean) => void;
  joinRoom: (roomId: number) => void;
  createRoom: (
    name: string,
    type: 'direct' | 'group',
    memberIds?: string[]
  ) => void;
  send: (message: WSMessage) => void;
  addMessageHandler: (handler: (message: WSMessage) => void) => void;
  removeMessageHandler: (handler: (message: WSMessage) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const wsService = useRef<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<number | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<number, Set<string>>>(
    new Map()
  );

  useEffect(() => {
    if (!user) return;

    wsService.current = new WebSocketService();

    const handleMessage = (message: WSMessage) => {
      switch (message.type) {
        case 'chat':
          handleChatMessage(message);
          break;
        case 'presence':
          handlePresenceMessage(message);
          break;
        case 'typing':
          handleTypingMessage(message);
          break;
        case 'room_update':
          handleRoomUpdate(message);
          break;
        case 'error':
          console.error('WebSocket error:', message.payload);
          break;
      }
    };

    wsService.current.addMessageHandler(handleMessage);

    wsService.current.connect().then(() => {
      setIsConnected(true);
      // Send initial presence
      wsService.current?.send({
        type: 'presence',
        payload: {
          user_id: user.id,
          username: user.username,
          status: 'online',
        },
        timestamp: Date.now(),
      });
    });

    return () => {
      wsService.current?.removeMessageHandler(handleMessage);
      wsService.current?.disconnect();
    };
  }, [user]);

  const handleChatMessage = (message: WSMessage) => {
    const chatMessage: Message = {
      id: message.payload.id,
      room_id: message.payload.room_id,
      user_id: message.payload.user_id,
      username: message.payload.username,
      content: message.payload.content,
      type: message.payload.type || 'text',
      timestamp: message.timestamp,
    };
    setMessages((prev) => [...prev, chatMessage]);
  };

  const handlePresenceMessage = (message: WSMessage) => {
    setOnlineUsers((prev) => {
      const userId = message.payload.user_id;
      const existingUser = prev.find((u) => u.id === userId);

      if (message.payload.status === 'offline') {
        return prev.filter((u) => u.id !== userId);
      }

      if (existingUser) {
        return prev.map((u) =>
          u.id === userId ? { ...u, status: message.payload.status } : u
        );
      }

      return [
        ...prev,
        {
          id: userId,
          username: message.payload.username,
          email: message.payload.email || '',
          status: message.payload.status,
        },
      ];
    });
  };

  const handleTypingMessage = (message: WSMessage) => {
    const { room_id, user_id, is_typing } = message.payload;

    setTypingUsers((prev) => {
      const newMap = new Map(prev);
      const roomTypers = newMap.get(room_id) || new Set();

      if (is_typing) {
        roomTypers.add(user_id);
      } else {
        roomTypers.delete(user_id);
      }

      if (roomTypers.size === 0) {
        newMap.delete(room_id);
      } else {
        newMap.set(room_id, roomTypers);
      }

      return newMap;
    });
  };

  const handleRoomUpdate = (message: WSMessage) => {
    const room: Room = message.payload;
    setRooms((prev) => {
      const existingIndex = prev.findIndex((r) => r.id === room.id);
      if (existingIndex >= 0) {
        return [
          ...prev.slice(0, existingIndex),
          room,
          ...prev.slice(existingIndex + 1),
        ];
      }
      return [...prev, room];
    });
  };

  const sendMessage = (content: string, roomId: number) => {
    if (!wsService.current || !user) return;

    wsService.current.send({
      type: 'chat',
      payload: {
        room_id: roomId,
        user_id: user.id,
        username: user.username,
        content,
        type: 'text',
      },
      timestamp: Date.now(),
    });
  };

  const sendTyping = (roomId: number, isTyping: boolean) => {
    if (!wsService.current || !user) return;

    wsService.current.send({
      type: 'typing',
      payload: {
        room_id: roomId,
        user_id: user.id,
        username: user.username,
        is_typing: isTyping,
      },
      timestamp: Date.now(),
    });
  };

  const joinRoom = (roomId: number) => {
    setCurrentRoom(roomId);
    // TODO: Send join room message to server
  };

  const createRoom = (
    name: string,
    type: 'direct' | 'group',
    memberIds?: string[]
  ) => {
    // TODO: Send create room request to server
  };

  const send = (message: WSMessage) => {
    if (!wsService.current) return;
    wsService.current.send(message);
  };

  const addMessageHandler = (handler: (message: WSMessage) => void) => {
    if (!wsService.current) return;
    wsService.current.addMessageHandler(handler);
  };

  const removeMessageHandler = (handler: (message: WSMessage) => void) => {
    if (!wsService.current) return;
    wsService.current.removeMessageHandler(handler);
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        messages,
        onlineUsers,
        rooms,
        currentRoom,
        typingUsers,
        sendMessage,
        sendTyping,
        joinRoom,
        createRoom,
        send,
        addMessageHandler,
        removeMessageHandler,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
