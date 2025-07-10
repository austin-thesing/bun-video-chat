import { ServerWebSocket } from "bun";
import { WSMessage, TypingMessage } from "../../types.ts";
import { WebSocketData, connectionManager } from "../connectionManager.ts";
import { broadcast } from "../utils.ts";

// Track typing states to prevent spam
const typingStates = new Map<string, { room_id: number; timeout?: Timer }>();

export function handleTypingMessage(
  ws: ServerWebSocket<WebSocketData>,
  message: TypingMessage
) {
  const userData = connectionManager.getConnectionData(ws);
  if (!userData || !userData.user_id || userData.room_id !== message.room_id) {
    return;
  }

  const key = `${userData.user_id}:${message.room_id}`;
  const existingState = typingStates.get(key);

  // Clear existing timeout
  if (existingState?.timeout) {
    clearTimeout(existingState.timeout);
  }

  if (message.is_typing) {
    // Set typing state with auto-clear after 3 seconds
    const timeout = setTimeout(() => {
      typingStates.delete(key);
      // Broadcast typing stopped
      const broadcastMessage: WSMessage = {
        type: "typing",
        payload: {
          room_id: message.room_id,
          user_id: userData.user_id!,
          username: userData.username!,
          is_typing: false,
        },
        timestamp: Date.now(),
      };
      broadcast.toRoomExcept(message.room_id, broadcastMessage, ws);
    }, 3000);

    typingStates.set(key, { room_id: message.room_id, timeout });
  } else {
    typingStates.delete(key);
  }

  // Broadcast typing status to others in the room
  const broadcastMessage: WSMessage = {
    type: "typing",
    payload: {
      room_id: message.room_id,
      user_id: userData.user_id,
      username: userData.username || message.username,
      is_typing: message.is_typing,
    },
    timestamp: Date.now(),
  };

  broadcast.toRoomExcept(message.room_id, broadcastMessage, ws);
}

export function clearUserTypingStates(userId: string) {
  // Clear all typing states for a user when they disconnect
  for (const [key, state] of typingStates.entries()) {
    if (key.startsWith(`${userId}:`)) {
      if (state.timeout) {
        clearTimeout(state.timeout);
      }
      typingStates.delete(key);
      
      // Broadcast typing stopped
      const broadcastMessage: WSMessage = {
        type: "typing",
        payload: {
          room_id: state.room_id,
          user_id: userId,
          username: "",
          is_typing: false,
        },
        timestamp: Date.now(),
      };
      broadcast.toRoom(state.room_id, broadcastMessage);
    }
  }
}

export function getTypingUsers(roomId: number): Array<{ user_id: string; username: string }> {
  const typingUsers: Array<{ user_id: string; username: string }> = [];
  
  for (const [key, state] of typingStates.entries()) {
    if (state.room_id === roomId) {
      const [userId] = key.split(":");
      const connection = connectionManager.getUserConnection(userId);
      if (connection) {
        const userData = connectionManager.getConnectionData(connection);
        if (userData?.username) {
          typingUsers.push({ user_id: userId, username: userData.username });
        }
      }
    }
  }
  
  return typingUsers;
}