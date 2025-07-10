import { Database } from "bun:sqlite";

export interface Message {
  id: number;
  room_id: number | null;
  user_id: string | null;
  content: string | null;
  type: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

export class MessageModel {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // Create a new message
  create(messageData: Omit<Message, "id" | "created_at" | "edited_at" | "deleted_at">): Message {
    const stmt = this.db.prepare(`
      INSERT INTO messages (room_id, user_id, content, type)
      VALUES ($room_id, $user_id, $content, $type)
      RETURNING *
    `);

    return stmt.get({
      $room_id: messageData.room_id,
      $user_id: messageData.user_id,
      $content: messageData.content,
      $type: messageData.type || 'text',
    }) as Message;
  }

  // Find message by ID
  findById(id: number): Message | null {
    const stmt = this.db.prepare("SELECT * FROM messages WHERE id = $id");
    return stmt.get({ $id: id }) as Message | null;
  }

  // Find messages in a room
  findByRoom(roomId: number, limit: number = 50, offset: number = 0): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages
      WHERE room_id = $roomId AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $limit OFFSET $offset
    `);
    
    const messages = stmt.all({
      $roomId: roomId,
      $limit: limit,
      $offset: offset,
    }) as Message[];

    // Return in chronological order for display
    return messages.reverse();
  }

  // Find messages by user
  findByUser(userId: string, limit: number = 50): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages
      WHERE user_id = $userId AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $limit
    `);
    
    return stmt.all({
      $userId: userId,
      $limit: limit,
    }) as Message[];
  }

  // Update message content (edit)
  edit(id: number, content: string): Message | null {
    const stmt = this.db.prepare(`
      UPDATE messages
      SET content = $content, edited_at = CURRENT_TIMESTAMP
      WHERE id = $id AND deleted_at IS NULL
      RETURNING *
    `);

    return stmt.get({
      $id: id,
      $content: content,
    }) as Message | null;
  }

  // Soft delete message
  softDelete(id: number): Message | null {
    const stmt = this.db.prepare(`
      UPDATE messages
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $id
      RETURNING *
    `);

    return stmt.get({ $id: id }) as Message | null;
  }

  // Hard delete message
  delete(id: number): boolean {
    const stmt = this.db.prepare("DELETE FROM messages WHERE id = $id");
    const result = stmt.run({ $id: id });
    return result.changes > 0;
  }

  // Search messages
  search(query: string, roomId?: number): Message[] {
    let sql = `
      SELECT * FROM messages
      WHERE content LIKE $query AND deleted_at IS NULL
    `;
    
    const params: any = { $query: `%${query}%` };

    if (roomId) {
      sql += " AND room_id = $roomId";
      params.$roomId = roomId;
    }

    sql += " ORDER BY created_at DESC LIMIT 100";

    const stmt = this.db.prepare(sql);
    return stmt.all(params) as Message[];
  }

  // Get unread messages count for a user in a room
  getUnreadCount(userId: string, roomId: number, lastSeenAt: string): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM messages
      WHERE room_id = $roomId
      AND user_id != $userId
      AND created_at > $lastSeenAt
      AND deleted_at IS NULL
    `);

    const result = stmt.get({
      $roomId: roomId,
      $userId: userId,
      $lastSeenAt: lastSeenAt,
    }) as { count: number };

    return result.count;
  }

  // Get messages with user info
  findByRoomWithUsers(roomId: number, limit: number = 50, offset: number = 0): any[] {
    const stmt = this.db.prepare(`
      SELECT 
        m.*,
        u.username,
        u.name,
        u.image as avatar_url
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.room_id = $roomId AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC
      LIMIT $limit OFFSET $offset
    `);
    
    const messages = stmt.all({
      $roomId: roomId,
      $limit: limit,
      $offset: offset,
    });

    // Return in chronological order for display
    return messages.reverse();
  }

  // Batch create messages (for imports or bulk operations)
  createBatch(messages: Array<Omit<Message, "id" | "created_at" | "edited_at" | "deleted_at">>): number {
    const stmt = this.db.prepare(`
      INSERT INTO messages (room_id, user_id, content, type)
      VALUES ($room_id, $user_id, $content, $type)
    `);

    let insertedCount = 0;
    const insertMany = this.db.transaction((messages) => {
      for (const message of messages) {
        stmt.run({
          $room_id: message.room_id,
          $user_id: message.user_id,
          $content: message.content,
          $type: message.type || 'text',
        });
        insertedCount++;
      }
    });

    insertMany(messages);
    return insertedCount;
  }
}