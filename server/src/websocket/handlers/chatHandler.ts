import { ServerWebSocket } from 'bun';
import { db, sqlite } from '../../database.ts';
import { WSMessage, ChatMessage } from '../../types.ts';
import { WebSocketData, connectionManager } from '../connectionManager.ts';
import { broadcast } from '../utils.ts';

export async function handleChatMessage(
  ws: ServerWebSocket<WebSocketData>,
  message: ChatMessage
) {
  try {
    // Validate user is in the room
    const userData = connectionManager.getConnectionData(ws);
    if (!userData || userData.room_id !== message.room_id) {
      ws.send(
        JSON.stringify({
          type: 'error',
          payload: { message: 'You are not in this room' },
          timestamp: Date.now(),
        })
      );
      return;
    }

    // Save message to database using sqlite directly
    const stmt = sqlite.prepare(`
      INSERT INTO messages (room_id, user_id, content, type, created_at) 
      VALUES (?, ?, ?, ?, ?) 
      RETURNING id, created_at
    `);

    const result = stmt.get(
      message.room_id,
      message.user_id,
      message.content,
      message.type || 'text',
      new Date().toISOString()
    ) as { id: number; created_at: string };

    if (!result) {
      throw new Error('Failed to save message');
    }

    // Prepare broadcast message
    const broadcastMessage: WSMessage = {
      type: 'chat',
      payload: {
        ...message,
        id: result.id,
        created_at: result.created_at,
        username: userData.username,
      },
      timestamp: Date.now(),
    };

    // Broadcast to all users in the room
    broadcast.toRoom(message.room_id, broadcastMessage);

    // Send confirmation to sender
    ws.send(
      JSON.stringify({
        type: 'chat_sent',
        payload: { message_id: result.id },
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error('Error handling chat message:', error);
    ws.send(
      JSON.stringify({
        type: 'error',
        payload: { message: 'Failed to send message' },
        timestamp: Date.now(),
      })
    );
  }
}

export async function handleMessageEdit(
  ws: ServerWebSocket<WebSocketData>,
  payload: { message_id: number; content: string; room_id: number }
) {
  try {
    const userData = connectionManager.getConnectionData(ws);
    if (!userData) return;

    // Update message in database
    const result = await db
      .updateTable('messages')
      .set({
        content: payload.content,
        edited_at: new Date().toISOString(),
      })
      .where('id', '=', payload.message_id)
      .where('user_id', '=', userData.user_id!)
      .returning(['id', 'edited_at'])
      .executeTakeFirst();

    if (!result) {
      throw new Error('Message not found or unauthorized');
    }

    // Broadcast update to room
    const broadcastMessage: WSMessage = {
      type: 'message_edited',
      payload: {
        message_id: payload.message_id,
        content: payload.content,
        edited_at: result.edited_at,
        room_id: payload.room_id,
      },
      timestamp: Date.now(),
    };

    broadcast.toRoom(payload.room_id, broadcastMessage);
  } catch (error) {
    console.error('Error editing message:', error);
    ws.send(
      JSON.stringify({
        type: 'error',
        payload: { message: 'Failed to edit message' },
        timestamp: Date.now(),
      })
    );
  }
}

export async function handleMessageDelete(
  ws: ServerWebSocket<WebSocketData>,
  payload: { message_id: number; room_id: number }
) {
  try {
    const userData = connectionManager.getConnectionData(ws);
    if (!userData) return;

    // Soft delete message
    const result = await db
      .updateTable('messages')
      .set({
        deleted_at: new Date().toISOString(),
      })
      .where('id', '=', payload.message_id)
      .where('user_id', '=', userData.user_id!)
      .returning('id')
      .executeTakeFirst();

    if (!result) {
      throw new Error('Message not found or unauthorized');
    }

    // Broadcast deletion to room
    const broadcastMessage: WSMessage = {
      type: 'message_deleted',
      payload: {
        message_id: payload.message_id,
        room_id: payload.room_id,
      },
      timestamp: Date.now(),
    };

    broadcast.toRoom(payload.room_id, broadcastMessage);
  } catch (error) {
    console.error('Error deleting message:', error);
    ws.send(
      JSON.stringify({
        type: 'error',
        payload: { message: 'Failed to delete message' },
        timestamp: Date.now(),
      })
    );
  }
}

export async function handleMessageReaction(
  ws: ServerWebSocket<WebSocketData>,
  payload: { message_id: number; reaction: string; room_id: number }
) {
  try {
    const userData = connectionManager.getConnectionData(ws);
    if (!userData || !userData.user_id) return;

    // For now, we'll just broadcast the reaction
    // In a real app, you'd store this in a reactions table
    const broadcastMessage: WSMessage = {
      type: 'message_reaction',
      payload: {
        message_id: payload.message_id,
        reaction: payload.reaction,
        user_id: userData.user_id,
        username: userData.username,
        room_id: payload.room_id,
      },
      timestamp: Date.now(),
    };

    broadcast.toRoom(payload.room_id, broadcastMessage);
  } catch (error) {
    console.error('Error handling reaction:', error);
  }
}
