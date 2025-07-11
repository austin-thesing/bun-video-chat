import postgres from 'postgres';
import { Database } from 'bun:sqlite';

export type DatabaseType = 'sqlite' | 'postgresql';

export interface DatabaseConfig {
  type: DatabaseType;
  url: string;
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: string | null;
  image: string | null;
  username: string | null;
  password_hash: string | null;
  created_at: string;
  auth_id?: string | null;
  avatar_url?: string | null;
}

export interface Room {
  id: number;
  name: string | null;
  type: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Message {
  id?: number;
  room_id: number | null;
  user_id: string | null;
  content: string | null;
  type: string | null;
  created_at?: string;
  edited_at: string | null;
  deleted_at: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  file_path: string | null;
}

export interface RoomMember {
  room_id: number | null;
  user_id: string | null;
  joined_at: string;
  role: string | null;
}

class DatabaseService {
  private type: DatabaseType;
  private sql: any; // postgres connection or sqlite database

  constructor(config: DatabaseConfig) {
    this.type = config.type;

    if (config.type === 'postgresql') {
      this.sql = postgres(config.url, {
        // Connection pool settings
        max: 20,
        idle_timeout: 20,
        connect_timeout: 10,
      });
    } else {
      // SQLite
      const dbPath = config.url.replace('sqlite://', '').replace('file:', '');
      this.sql = new Database(dbPath);

      // Enable WAL mode for better concurrency
      this.sql.exec('PRAGMA journal_mode = WAL;');
      this.sql.exec('PRAGMA synchronous = NORMAL;');
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (this.type === 'postgresql') {
      const result = await this.sql.unsafe(sql, params);
      return Array.isArray(result) ? result : [result];
    } else {
      // SQLite
      const stmt = this.sql.prepare(sql);
      if (sql.trim().toLowerCase().startsWith('select')) {
        return stmt.all(...params);
      } else {
        const result = stmt.run(...params);
        return [{ ...result, id: result.lastInsertRowid }];
      }
    }
  }

  async queryOne(sql: string, params: any[] = []): Promise<any | null> {
    const results = await this.query(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  // User operations
  async createUser(
    user: Omit<User, 'created_at'> & { created_at?: string }
  ): Promise<User> {
    const now = user.created_at || new Date().toISOString();
    const sql = `
      INSERT INTO users (id, name, email, emailVerified, image, username, password_hash, created_at, auth_id, avatar_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await this.queryOne(sql, [
      user.id,
      user.name,
      user.email,
      user.emailVerified,
      user.image,
      user.username,
      user.password_hash,
      now,
      user.auth_id,
      user.avatar_url,
    ]);

    return result;
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.queryOne('SELECT * FROM users WHERE id = $1', [id]);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.queryOne('SELECT * FROM users WHERE email = $1', [email]);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await this.queryOne('SELECT * FROM users WHERE username = $1', [
      username,
    ]);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.query('SELECT * FROM users ORDER BY created_at DESC');
  }

  // Room operations
  async createRoom(
    room: Omit<Room, 'id' | 'created_at'> & { created_at?: string }
  ): Promise<Room> {
    const now = room.created_at || new Date().toISOString();
    const sql = `
      INSERT INTO rooms (name, type, created_by, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    return await this.queryOne(sql, [
      room.name,
      room.type,
      room.created_by,
      now,
    ]);
  }

  async getRoomById(id: number): Promise<Room | null> {
    return await this.queryOne('SELECT * FROM rooms WHERE id = $1', [id]);
  }

  async getAllRooms(): Promise<Room[]> {
    return await this.query('SELECT * FROM rooms ORDER BY created_at DESC');
  }

  async updateRoom(id: number, name: string): Promise<Room | null> {
    const sql = 'UPDATE rooms SET name = $1 WHERE id = $2 RETURNING *';
    return await this.queryOne(sql, [name, id]);
  }

  async deleteRoom(id: number): Promise<void> {
    await this.query('DELETE FROM rooms WHERE id = $1', [id]);
  }

  // Message operations
  async createMessage(
    message: Omit<Message, 'id' | 'created_at'> & { created_at?: string }
  ): Promise<Message> {
    const now = message.created_at || new Date().toISOString();
    const sql = `
      INSERT INTO messages (room_id, user_id, content, type, created_at, edited_at, deleted_at, file_name, file_size, file_type, file_path)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    return await this.queryOne(sql, [
      message.room_id,
      message.user_id,
      message.content,
      message.type,
      now,
      message.edited_at,
      message.deleted_at,
      message.file_name,
      message.file_size,
      message.file_type,
      message.file_path,
    ]);
  }

  async getMessagesByRoom(
    roomId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    const sql = `
      SELECT m.*, u.username 
      FROM messages m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.room_id = $1 AND m.deleted_at IS NULL
      ORDER BY m.created_at ASC 
      LIMIT $2 OFFSET $3
    `;

    return await this.query(sql, [roomId, limit, offset]);
  }

  async getMessageById(id: number): Promise<any | null> {
    const sql = `
      SELECT m.*, u.username 
      FROM messages m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = $1
    `;

    return await this.queryOne(sql, [id]);
  }

  async getMessageByFilePath(filePath: string): Promise<any | null> {
    return await this.queryOne('SELECT * FROM messages WHERE file_path = $1', [
      filePath,
    ]);
  }

  // Room member operations
  async addRoomMember(
    roomId: number,
    userId: string,
    role: string = 'member'
  ): Promise<void> {
    const sql = `
      INSERT INTO room_members (room_id, user_id, joined_at, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (room_id, user_id) DO NOTHING
    `;

    await this.query(sql, [roomId, userId, new Date().toISOString(), role]);
  }

  async getRoomMembers(roomId: number): Promise<any[]> {
    const sql = `
      SELECT rm.*, u.username, u.email, u.avatar_url
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = $1
      ORDER BY rm.joined_at ASC
    `;

    return await this.query(sql, [roomId]);
  }

  async removeRoomMember(roomId: number, userId: string): Promise<void> {
    await this.query(
      'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );
  }

  async close(): Promise<void> {
    if (this.type === 'postgresql') {
      await this.sql.end();
    } else {
      this.sql.close();
    }
  }
}

// Initialize database service
const getDatabaseConfig = (): DatabaseConfig => {
  const databaseUrl = process.env.DATABASE_URL || 'sqlite://./db.sqlite';

  if (
    databaseUrl.startsWith('postgresql://') ||
    databaseUrl.startsWith('postgres://')
  ) {
    return {
      type: 'postgresql',
      url: databaseUrl,
    };
  } else {
    return {
      type: 'sqlite',
      url: databaseUrl,
    };
  }
};

const dbConfig = getDatabaseConfig();
export const dbService = new DatabaseService(dbConfig);

console.log(`✅ Database service initialized (${dbConfig.type})`);

export { DatabaseService };
