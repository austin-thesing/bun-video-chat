import type { DatabaseConnection } from "../utils/database";

export function up(db: DatabaseConnection): void {
  const rawDb = db.getRawDb();
  
  // Create users table (compatible with Auth.js but following PLAN.md structure)
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      auth_id TEXT UNIQUE,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      avatar_url TEXT,
      name TEXT,
      emailVerified TIMESTAMP,
      image TEXT,
      password_hash TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  // Create rooms table
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT CHECK(type IN ('direct', 'group')),
      created_by TEXT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);
    CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);
  `);

  // Create messages table
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id),
      content TEXT,
      type TEXT DEFAULT 'text' CHECK(type IN ('text', 'image', 'file')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      edited_at TIMESTAMP,
      deleted_at TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
  `);

  // Create room_members table
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS room_members (
      room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
      PRIMARY KEY (room_id, user_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
  `);

  // Create a default general room
  rawDb.exec(`
    INSERT OR IGNORE INTO rooms (id, name, type, created_by) 
    VALUES (1, 'General', 'group', NULL);
  `);
}

export function down(db: DatabaseConnection): void {
  const rawDb = db.getRawDb();
  
  rawDb.exec(`
    DROP TABLE IF EXISTS room_members;
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS rooms;
    DROP TABLE IF EXISTS users;
  `);
}