import { ServerWebSocket } from "bun";
import { db } from "./database.ts";
import { WSMessage, ChatMessage, TypingMessage, PresenceMessage, WebRTCMessage } from "./types.ts";

interface WebSocketData {
  user_id?: string;
  username?: string;
  room_id?: number;
}

const connections = new Map<ServerWebSocket<WebSocketData>, WebSocketData>();
const roomConnections = new Map<number, Set<ServerWebSocket<WebSocketData>>>();

const isDev = process.env.NODE_ENV !== "production";

function wsLog(...args: any[]) {
  if (isDev) {
    console.log(`[WS ${new Date().toISOString()}]`, ...args);
  }
}

export const websocketHandler = {
  open(ws: ServerWebSocket<WebSocketData>) {
    wsLog("WebSocket connection opened");
    connections.set(ws, {});
    wsLog(`Total connections: ${connections.size}`);
  },

  message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
    try {
      const data: WSMessage = JSON.parse(message.toString());
      wsLog(`Received message type: ${data.type}`, data.payload);
      
      switch (data.type) {
        case "chat":
          handleChatMessage(ws, data.payload as ChatMessage);
          break;
        case "typing":
          handleTypingMessage(ws, data.payload as TypingMessage);
          break;
        case "presence":
          handlePresenceMessage(ws, data.payload as PresenceMessage);
          break;
        case "webrtc":
          handleWebRTCMessage(ws, data.payload as WebRTCMessage);
          break;
        default:
          wsLog("Unknown message type:", data.type);
      }
    } catch (error) {
      wsLog("Error parsing WebSocket message:", error);
    }
  },

  close(ws: ServerWebSocket<WebSocketData>) {
    const userData = connections.get(ws);
    wsLog("WebSocket connection closing", userData);
    if (userData?.room_id) {
      const roomSockets = roomConnections.get(userData.room_id);
      if (roomSockets) {
        roomSockets.delete(ws);
        if (roomSockets.size === 0) {
          roomConnections.delete(userData.room_id);
          wsLog(`Room ${userData.room_id} is now empty`);
        }
      }
    }
    connections.delete(ws);
    wsLog(`WebSocket connection closed. Total connections: ${connections.size}`);
  },
};

async function handleChatMessage(ws: ServerWebSocket<WebSocketData>, message: ChatMessage) {
  try {
    wsLog("Handling chat message:", message);
    
    // Save message to database
    const result = await db
      .insertInto("messages")
      .values({
        room_id: message.room_id,
        user_id: message.user_id,
        content: message.content,
        type: message.type,
        created_at: new Date().toISOString(),
      })
      .returning("id")
      .executeTakeFirst();

    wsLog("Message saved to database:", result);

    if (result) {
      // Broadcast to all users in the room
      const roomSockets = roomConnections.get(message.room_id);
      wsLog(`Broadcasting to ${roomSockets?.size || 0} users in room ${message.room_id}`);
      
      if (roomSockets) {
        const broadcastMessage: WSMessage = {
          type: "chat",
          payload: { ...message, id: result.id },
          timestamp: Date.now(),
        };

        roomSockets.forEach((socket) => {
          socket.send(JSON.stringify(broadcastMessage));
        });
        wsLog("Message broadcasted successfully");
      }
    }
  } catch (error) {
    wsLog("Error handling chat message:", error);
  }
}

function handleTypingMessage(ws: ServerWebSocket<WebSocketData>, message: TypingMessage) {
  const roomSockets = roomConnections.get(message.room_id);
  if (roomSockets) {
    const broadcastMessage: WSMessage = {
      type: "typing",
      payload: message,
      timestamp: Date.now(),
    };

    roomSockets.forEach((socket) => {
      if (socket !== ws) {
        socket.send(JSON.stringify(broadcastMessage));
      }
    });
  }
}

function handlePresenceMessage(ws: ServerWebSocket<WebSocketData>, message: PresenceMessage) {
  wsLog("Handling presence message:", message);
  
  const userData = connections.get(ws);
  if (userData) {
    userData.user_id = message.user_id;
    userData.username = message.username;
    wsLog("Updated user data:", userData);
  }

  // Broadcast presence to all connections
  const broadcastMessage: WSMessage = {
    type: "presence",
    payload: message,
    timestamp: Date.now(),
  };

  wsLog(`Broadcasting presence to ${connections.size - 1} other connections`);
  connections.forEach((_, socket) => {
    if (socket !== ws) {
      socket.send(JSON.stringify(broadcastMessage));
    }
  });
}

function handleWebRTCMessage(ws: ServerWebSocket<WebSocketData>, message: WebRTCMessage) {
  // Find the target user's connection
  for (const [socket, userData] of connections) {
    if (userData.user_id === message.to_user_id) {
      const broadcastMessage: WSMessage = {
        type: "webrtc",
        payload: message,
        timestamp: Date.now(),
      };
      socket.send(JSON.stringify(broadcastMessage));
      break;
    }
  }
}

export function joinRoom(ws: ServerWebSocket<WebSocketData>, roomId: number) {
  wsLog(`User joining room ${roomId}`);
  
  const userData = connections.get(ws);
  if (userData) {
    userData.room_id = roomId;
    wsLog("Updated user data with room:", userData);
  }

  if (!roomConnections.has(roomId)) {
    roomConnections.set(roomId, new Set());
    wsLog(`Created new room: ${roomId}`);
  }
  roomConnections.get(roomId)!.add(ws);
  wsLog(`Room ${roomId} now has ${roomConnections.get(roomId)!.size} users`);
}