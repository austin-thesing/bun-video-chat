import { ServerWebSocket } from "bun";
import { WSMessage } from "../types.ts";
import { WebSocketData, connectionManager } from "./connectionManager.ts";

export const broadcast = {
  toRoom(roomId: number, message: WSMessage) {
    const connections = connectionManager.getRoomConnections(roomId);
    const messageStr = JSON.stringify(message);
    
    connections.forEach((socket) => {
      try {
        socket.send(messageStr);
      } catch (error) {
        console.error("Error broadcasting to room:", error);
      }
    });
  },

  toRoomExcept(roomId: number, message: WSMessage, except: ServerWebSocket<WebSocketData>) {
    const connections = connectionManager.getRoomConnections(roomId);
    const messageStr = JSON.stringify(message);
    
    connections.forEach((socket) => {
      if (socket !== except) {
        try {
          socket.send(messageStr);
        } catch (error) {
          console.error("Error broadcasting to room:", error);
        }
      }
    });
  },

  toUser(userId: string, message: WSMessage) {
    const connection = connectionManager.getUserConnection(userId);
    if (connection) {
      try {
        connection.send(JSON.stringify(message));
      } catch (error) {
        console.error("Error sending to user:", error);
      }
    }
  },

  toAll(message: WSMessage) {
    const connections = connectionManager.getAllConnections();
    const messageStr = JSON.stringify(message);
    
    connections.forEach((_, socket) => {
      try {
        socket.send(messageStr);
      } catch (error) {
        console.error("Error broadcasting to all:", error);
      }
    });
  },

  toAllExcept(message: WSMessage, except: ServerWebSocket<WebSocketData>) {
    const connections = connectionManager.getAllConnections();
    const messageStr = JSON.stringify(message);
    
    connections.forEach((_, socket) => {
      if (socket !== except) {
        try {
          socket.send(messageStr);
        } catch (error) {
          console.error("Error broadcasting to all:", error);
        }
      }
    });
  },
};

export function validateMessage(message: any): boolean {
  if (!message || typeof message !== "object") return false;
  if (!message.type || typeof message.type !== "string") return false;
  if (!message.payload || typeof message.payload !== "object") return false;
  return true;
}

export function createErrorMessage(error: string): WSMessage {
  return {
    type: "error",
    payload: { message: error },
    timestamp: Date.now(),
  };
}

export function createSuccessMessage(type: string, payload: any): WSMessage {
  return {
    type: type as any,
    payload,
    timestamp: Date.now(),
  };
}

// Heartbeat/ping functionality
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 60000; // 60 seconds

export function startHeartbeat(ws: ServerWebSocket<WebSocketData>) {
  const interval = setInterval(() => {
    const userData = connectionManager.getConnectionData(ws);
    if (!userData) {
      clearInterval(interval);
      return;
    }

    const now = Date.now();
    const lastActivity = userData.last_activity || 0;
    
    if (now - lastActivity > HEARTBEAT_TIMEOUT) {
      // Connection is stale, close it
      ws.close(1000, "Connection timeout");
      clearInterval(interval);
    } else {
      // Send ping
      try {
        ws.send(JSON.stringify({
          type: "ping",
          payload: {},
          timestamp: now,
        }));
      } catch (error) {
        clearInterval(interval);
      }
    }
  }, HEARTBEAT_INTERVAL);

  // Store interval reference if needed for cleanup
  return interval;
}