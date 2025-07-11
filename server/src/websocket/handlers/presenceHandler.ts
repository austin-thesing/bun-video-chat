import { ServerWebSocket } from 'bun';
import { WSMessage, PresenceMessage } from '../../types.ts';
import { WebSocketData, connectionManager } from '../connectionManager.ts';
import { broadcast } from '../utils.ts';
import { clearUserTypingStates } from './typingHandler.ts';
import { sqlite } from '../../database.ts';

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
    type: 'presence',
    payload: {
      user_id: message.user_id,
      username: message.username,
      status: message.status,
      room_id: roomId,
    },
    timestamp: Date.now(),
  };

  if (message.status === 'online') {
    // Broadcast to all connections
    broadcast.toAll(broadcastMessage);

    // Send current online users to the newly connected user
    sendOnlineUsersList(ws);

    // If user is in a room, send room user list
    if (roomId) {
      sendRoomUsersList(ws, roomId);
    }
  } else if (message.status === 'offline') {
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
    type: 'presence',
    payload: {
      user_id: userData.user_id,
      username: userData.username || '',
      status: 'offline',
      room_id: userData.room_id,
    },
    timestamp: Date.now(),
  };

  broadcast.toAll(broadcastMessage);

  // If user was in a room, notify room members
  if (userData.room_id) {
    const roomUpdateMessage: WSMessage = {
      type: 'user_left',
      payload: {
        user_id: userData.user_id,
        username: userData.username || '',
        room_id: userData.room_id,
      },
      timestamp: Date.now(),
    };

    broadcast.toRoom(userData.room_id, roomUpdateMessage);
  }
}

export async function handleJoinRoom(
  ws: ServerWebSocket<WebSocketData>,
  payload: { room_id: number }
) {
  const userData = connectionManager.getConnectionData(ws);
  if (!userData || !userData.user_id) {
    ws.send(
      JSON.stringify({
        type: 'error',
        payload: { message: 'Authentication required' },
        timestamp: Date.now(),
      })
    );
    return;
  }

  // Join the room
  const success = connectionManager.joinRoom(ws, payload.room_id);
  if (!success) {
    ws.send(
      JSON.stringify({
        type: 'error',
        payload: { message: 'Failed to join room' },
        timestamp: Date.now(),
      })
    );
    return;
  }

  try {
    // Load existing messages from database using sqlite directly
    const stmt = sqlite.prepare(`
      SELECT 
        m.id,
        m.room_id,
        m.user_id,
        m.content,
        m.type,
        m.created_at,
        m.edited_at,
        m.file_name,
        m.file_size,
        m.file_type,
        m.file_path,
        u.username,
        u.name,
        u.image as avatar_url
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ? AND m.deleted_at IS NULL
      ORDER BY m.created_at ASC
      LIMIT 50
    `);

    const messages = stmt.all(payload.room_id) as Array<{
      id: number;
      room_id: number;
      user_id: string;
      content: string;
      type: string;
      created_at: string;
      edited_at: string | null;
      file_name: string | null;
      file_size: number | null;
      file_type: string | null;
      file_path: string | null;
      username: string | null;
      name: string | null;
      avatar_url: string | null;
    }>;

    // Send existing messages to the user
    for (const message of messages) {
      const chatMessage: WSMessage = {
        type: 'chat',
        payload: {
          id: message.id,
          room_id: message.room_id,
          user_id: message.user_id,
          username: message.username || 'Unknown',
          content: message.content,
          type: message.type || 'text',
          created_at: message.created_at,
          edited_at: message.edited_at,
          file_name: message.file_name,
          file_size: message.file_size,
          file_type: message.file_type,
          file_path: message.file_path,
        },
        timestamp: new Date(message.created_at || Date.now()).getTime(),
      };
      ws.send(JSON.stringify(chatMessage));
    }
  } catch (error) {
    console.error('Error loading room messages:', error);
  }

  // Notify room members
  const joinMessage: WSMessage = {
    type: 'user_joined',
    payload: {
      user_id: userData.user_id,
      username: userData.username || '',
      room_id: payload.room_id,
    },
    timestamp: Date.now(),
  };

  broadcast.toRoomExcept(payload.room_id, joinMessage, ws);

  // Send room info to the user
  sendRoomUsersList(ws, payload.room_id);

  // Confirm join
  ws.send(
    JSON.stringify({
      type: 'room_joined',
      payload: {
        room_id: payload.room_id,
        users: connectionManager.getRoomUserList(payload.room_id),
      },
      timestamp: Date.now(),
    })
  );
}

export function handleLeaveRoom(ws: ServerWebSocket<WebSocketData>) {
  const userData = connectionManager.getConnectionData(ws);
  if (!userData || !userData.room_id) return;

  const roomId = userData.room_id;
  connectionManager.leaveRoom(ws);

  // Notify room members
  const leaveMessage: WSMessage = {
    type: 'user_left',
    payload: {
      user_id: userData.user_id!,
      username: userData.username || '',
      room_id: roomId,
    },
    timestamp: Date.now(),
  };

  broadcast.toRoom(roomId, leaveMessage);

  // Confirm leave
  ws.send(
    JSON.stringify({
      type: 'room_left',
      payload: { room_id: roomId },
      timestamp: Date.now(),
    })
  );
}

function sendOnlineUsersList(ws: ServerWebSocket<WebSocketData>) {
  const onlineUsers: Array<{
    user_id: string;
    username: string;
    status: string;
  }> = [];

  connectionManager.getAllConnections().forEach((data) => {
    if (data.user_id && data.username) {
      onlineUsers.push({
        user_id: data.user_id,
        username: data.username,
        status: 'online',
      });
    }
  });

  ws.send(
    JSON.stringify({
      type: 'online_users',
      payload: { users: onlineUsers },
      timestamp: Date.now(),
    })
  );
}

function sendRoomUsersList(ws: ServerWebSocket<WebSocketData>, roomId: number) {
  const users = connectionManager.getRoomUserList(roomId);

  ws.send(
    JSON.stringify({
      type: 'room_users',
      payload: {
        room_id: roomId,
        users: users,
      },
      timestamp: Date.now(),
    })
  );
}

export function handleRoomCreated(roomData: any) {
  // Broadcast new room to all connected users
  const broadcastMessage: WSMessage = {
    type: 'room_update',
    payload: roomData,
    timestamp: Date.now(),
  };

  broadcast.toAll(broadcastMessage);
}
