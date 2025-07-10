import { ServerWebSocket } from "bun";

export interface WebSocketData {
  user_id?: string;
  username?: string;
  room_id?: number;
  last_activity?: number;
}

export class ConnectionManager {
  private connections = new Map<ServerWebSocket<WebSocketData>, WebSocketData>();
  private roomConnections = new Map<number, Set<ServerWebSocket<WebSocketData>>>();
  private userConnections = new Map<string, ServerWebSocket<WebSocketData>>();

  addConnection(ws: ServerWebSocket<WebSocketData>, data: WebSocketData = {}) {
    data.last_activity = Date.now();
    this.connections.set(ws, data);
    
    if (data.user_id) {
      this.userConnections.set(data.user_id, ws);
    }
  }

  updateConnection(ws: ServerWebSocket<WebSocketData>, data: Partial<WebSocketData>) {
    const existing = this.connections.get(ws);
    if (existing) {
      const updated = { ...existing, ...data, last_activity: Date.now() };
      this.connections.set(ws, updated);
      
      // Update user connection mapping
      if (data.user_id) {
        this.userConnections.set(data.user_id, ws);
      }
    }
  }

  removeConnection(ws: ServerWebSocket<WebSocketData>) {
    const data = this.connections.get(ws);
    
    if (data) {
      // Remove from room
      if (data.room_id) {
        const roomSockets = this.roomConnections.get(data.room_id);
        if (roomSockets) {
          roomSockets.delete(ws);
          if (roomSockets.size === 0) {
            this.roomConnections.delete(data.room_id);
          }
        }
      }
      
      // Remove from user connections
      if (data.user_id) {
        this.userConnections.delete(data.user_id);
      }
    }
    
    this.connections.delete(ws);
  }

  joinRoom(ws: ServerWebSocket<WebSocketData>, roomId: number) {
    const data = this.connections.get(ws);
    if (!data) return false;

    // Leave previous room if any
    if (data.room_id && data.room_id !== roomId) {
      this.leaveRoom(ws);
    }

    // Join new room
    data.room_id = roomId;
    this.updateConnection(ws, { room_id: roomId });

    if (!this.roomConnections.has(roomId)) {
      this.roomConnections.set(roomId, new Set());
    }
    this.roomConnections.get(roomId)!.add(ws);

    return true;
  }

  leaveRoom(ws: ServerWebSocket<WebSocketData>) {
    const data = this.connections.get(ws);
    if (!data || !data.room_id) return false;

    const roomSockets = this.roomConnections.get(data.room_id);
    if (roomSockets) {
      roomSockets.delete(ws);
      if (roomSockets.size === 0) {
        this.roomConnections.delete(data.room_id);
      }
    }

    this.updateConnection(ws, { room_id: undefined });
    return true;
  }

  getRoomConnections(roomId: number): Set<ServerWebSocket<WebSocketData>> {
    return this.roomConnections.get(roomId) || new Set();
  }

  getUserConnection(userId: string): ServerWebSocket<WebSocketData> | undefined {
    return this.userConnections.get(userId);
  }

  getConnectionData(ws: ServerWebSocket<WebSocketData>): WebSocketData | undefined {
    return this.connections.get(ws);
  }

  getAllConnections(): Map<ServerWebSocket<WebSocketData>, WebSocketData> {
    return this.connections;
  }

  getRoomUserList(roomId: number): Array<{ user_id: string; username: string }> {
    const roomSockets = this.roomConnections.get(roomId);
    if (!roomSockets) return [];

    const users: Array<{ user_id: string; username: string }> = [];
    roomSockets.forEach((socket) => {
      const data = this.connections.get(socket);
      if (data?.user_id && data?.username) {
        users.push({ user_id: data.user_id, username: data.username });
      }
    });

    return users;
  }

  getActiveRooms(): number[] {
    return Array.from(this.roomConnections.keys());
  }

  getTotalConnections(): number {
    return this.connections.size;
  }

  getRoomConnectionCount(roomId: number): number {
    return this.roomConnections.get(roomId)?.size || 0;
  }
}

export const connectionManager = new ConnectionManager();