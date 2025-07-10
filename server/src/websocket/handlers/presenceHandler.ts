import { ServerWebSocket } from "bun";
import { WSMessage, PresenceMessage } from "../../types.ts";
import { WebSocketData, connectionManager } from "../connectionManager.ts";
import { broadcast } from "../utils.ts";
import { clearUserTypingStates } from "./typingHandler.ts";

export function handlePresenceMessage(
  ws: ServerWebSocket<WebSocketData>,
  message: PresenceMessage
) {
  // Update connection data
  connectionManager.updateConnection(ws, {
    user_id: message.user_id,
    username: message.username,
  });

  // Get current room if user is in one
  const userData = connectionManager.getConnectionData(ws);
  const roomId = userData?.room_id;

  // Broadcast presence update
  const broadcastMessage: WSMessage = {
    type: "presence",
    payload: {
      user_id: message.user_id,
      username: message.username,
      status: message.status,
      room_id: roomId,
    },
    timestamp: Date.now(),
  };

  if (message.status === "online") {
    // Broadcast to all connections
    broadcast.toAll(broadcastMessage);

    // Send current online users to the newly connected user
    sendOnlineUsersList(ws);

    // If user is in a room, send room user list
    if (roomId) {
      sendRoomUsersList(ws, roomId);
    }
  } else if (message.status === "offline") {
    // Clear any typing states
    clearUserTypingStates(message.user_id);
    
    // Broadcast offline status
    broadcast.toAllExcept(broadcastMessage, ws);
  }
}

export function handleUserDisconnect(ws: ServerWebSocket<WebSocketData>) {
  const userData = connectionManager.getConnectionData(ws);
  if (!userData || !userData.user_id) return;

  // Clear typing states
  clearUserTypingStates(userData.user_id);

  // Broadcast offline presence
  const broadcastMessage: WSMessage = {
    type: "presence",
    payload: {
      user_id: userData.user_id,
      username: userData.username || "",
      status: "offline",
      room_id: userData.room_id,
    },
    timestamp: Date.now(),
  };

  broadcast.toAll(broadcastMessage);

  // If user was in a room, notify room members
  if (userData.room_id) {
    const roomUpdateMessage: WSMessage = {
      type: "user_left",
      payload: {
        user_id: userData.user_id,
        username: userData.username || "",
        room_id: userData.room_id,
      },
      timestamp: Date.now(),
    };

    broadcast.toRoom(userData.room_id, roomUpdateMessage);
  }
}

export function handleJoinRoom(
  ws: ServerWebSocket<WebSocketData>,
  payload: { room_id: number }
) {
  const userData = connectionManager.getConnectionData(ws);
  if (!userData || !userData.user_id) {
    ws.send(JSON.stringify({
      type: "error",
      payload: { message: "Authentication required" },
      timestamp: Date.now(),
    }));
    return;
  }

  // Join the room
  const success = connectionManager.joinRoom(ws, payload.room_id);
  if (!success) {
    ws.send(JSON.stringify({
      type: "error",
      payload: { message: "Failed to join room" },
      timestamp: Date.now(),
    }));
    return;
  }

  // Notify room members
  const joinMessage: WSMessage = {
    type: "user_joined",
    payload: {
      user_id: userData.user_id,
      username: userData.username || "",
      room_id: payload.room_id,
    },
    timestamp: Date.now(),
  };

  broadcast.toRoomExcept(payload.room_id, joinMessage, ws);

  // Send room info to the user
  sendRoomUsersList(ws, payload.room_id);

  // Confirm join
  ws.send(JSON.stringify({
    type: "room_joined",
    payload: {
      room_id: payload.room_id,
      users: connectionManager.getRoomUserList(payload.room_id),
    },
    timestamp: Date.now(),
  }));
}

export function handleLeaveRoom(ws: ServerWebSocket<WebSocketData>) {
  const userData = connectionManager.getConnectionData(ws);
  if (!userData || !userData.room_id) return;

  const roomId = userData.room_id;
  connectionManager.leaveRoom(ws);

  // Notify room members
  const leaveMessage: WSMessage = {
    type: "user_left",
    payload: {
      user_id: userData.user_id!,
      username: userData.username || "",
      room_id: roomId,
    },
    timestamp: Date.now(),
  };

  broadcast.toRoom(roomId, leaveMessage);

  // Confirm leave
  ws.send(JSON.stringify({
    type: "room_left",
    payload: { room_id: roomId },
    timestamp: Date.now(),
  }));
}

function sendOnlineUsersList(ws: ServerWebSocket<WebSocketData>) {
  const onlineUsers: Array<{ user_id: string; username: string; status: string }> = [];
  
  connectionManager.getAllConnections().forEach((data) => {
    if (data.user_id && data.username) {
      onlineUsers.push({
        user_id: data.user_id,
        username: data.username,
        status: "online",
      });
    }
  });

  ws.send(JSON.stringify({
    type: "online_users",
    payload: { users: onlineUsers },
    timestamp: Date.now(),
  }));
}

function sendRoomUsersList(ws: ServerWebSocket<WebSocketData>, roomId: number) {
  const users = connectionManager.getRoomUserList(roomId);
  
  ws.send(JSON.stringify({
    type: "room_users",
    payload: {
      room_id: roomId,
      users: users,
    },
    timestamp: Date.now(),
  }));
}