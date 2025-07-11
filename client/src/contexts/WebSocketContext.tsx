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
  updateRoom: (roomId: number, name: string) => Promise<void>;
  deleteRoom: (roomId: number) => Promise<void>;
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
        case 'room_created':
          handleRoomUpdate(message);
          break;
        case 'room_joined':
          console.log('Successfully joined room:', message.payload.room_id);
          break;
        case 'room_left':
          console.log('Left room:', message.payload.room_id);
          break;
        case 'user_joined':
          console.log('User joined room:', message.payload);
          break;
        case 'user_left':
          console.log('User left room:', message.payload);
          break;
        case 'error':
          console.error('WebSocket error:', message.payload);
          break;
      }
    };

    wsService.current.addMessageHandler(handleMessage);

    wsService.current.connect().then(() => {
      setIsConnected(true);

      // Load initial rooms
      loadRooms();

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

      // Auto-join General room (ID: 1)
      setTimeout(() => {
        joinRoom(1);
      }, 1000); // Small delay to ensure rooms are loaded
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
      file_name: message.payload.file_name,
      file_path: message.payload.file_path,
      file_type: message.payload.file_type,
      file_size: message.payload.file_size,
      edited_at: message.payload.edited_at,
      deleted_at: message.payload.deleted_at,
    };

    // Prevent duplicate messages by checking if message already exists
    setMessages((prev) => {
      const exists = prev.some((msg) => msg.id === chatMessage.id);
      if (exists) return prev;
      return [...prev, chatMessage];
    });
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
    if (!wsService.current || !user) return;

    // Don't rejoin the same room
    if (currentRoom === roomId) return;

    setCurrentRoom(roomId);

    // Clear messages when switching rooms to avoid showing old messages
    setMessages([]);

    // Send join room message to server
    wsService.current.send({
      type: 'join_room',
      payload: {
        room_id: roomId,
      },
      timestamp: Date.now(),
    });
  };

  const loadRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const roomsData = await response.json();
        setRooms(roomsData);
      } else {
        console.error('Failed to load rooms:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const createRoom = async (
    name: string,
    type: 'direct' | 'group',
    memberIds?: string[]
  ) => {
    if (!user) return;

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          type,
          created_by: user.id,
        }),
      });

      if (response.ok) {
        const newRoom = await response.json();

        // Add room to local state
        setRooms((prev) => [...prev, newRoom]);

        // Auto-join the created room
        joinRoom(newRoom.id);

        // Note: Server will broadcast room creation to other users via WebSocket
      } else {
        console.error('Failed to create room:', response.statusText);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const updateRoom = async (roomId: number, name: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          user_id: user.id,
        }),
      });

      if (response.ok) {
        const updatedRoom = await response.json();

        // Update room in local state
        setRooms((prev) =>
          prev.map((room) => (room.id === roomId ? updatedRoom : room))
        );
      } else {
        const error = await response.json();
        console.error('Failed to update room:', error.error);
        alert(error.error || 'Failed to update room');
      }
    } catch (error) {
      console.error('Error updating room:', error);
      alert('Failed to update room');
    }
  };

  const deleteRoom = async (roomId: number) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      });

      if (response.ok) {
        // Remove room from local state
        setRooms((prev) => prev.filter((room) => room.id !== roomId));

        // If user was in the deleted room, switch to General room
        if (currentRoom === roomId) {
          joinRoom(1); // Join General room
        }
      } else {
        const error = await response.json();
        console.error('Failed to delete room:', error.error);
        alert(error.error || 'Failed to delete room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete room');
    }
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
        updateRoom,
        deleteRoom,
        send,
        addMessageHandler,
        removeMessageHandler,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
