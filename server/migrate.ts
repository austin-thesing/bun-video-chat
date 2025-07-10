import { Database } from 'bun:sqlite';

const db = new Database('db.sqlite');

// Drop all tables first to ensure clean state
db.exec(`
  DROP TABLE IF EXISTS accounts;
  DROP TABLE IF EXISTS sessions;
  DROP TABLE IF EXISTS verification_tokens;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS rooms;
  DROP TABLE IF EXISTS messages;
  DROP TABLE IF EXISTS room_members;
`);

// Create tables directly
db.exec(`
  -- Auth.js required tables
  CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    sessionToken TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL,
    expires TIMESTAMP NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMP NOT NULL,
    PRIMARY KEY (identifier, token)
  );

  -- Updated users table for Auth.js compatibility
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    emailVerified TIMESTAMP,
    image TEXT,
    username TEXT UNIQUE,
    password_hash TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE rooms (
    id INTEGER PRIMARY KEY,
    name TEXT,
    type TEXT,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
  );

  CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    room_id INTEGER,
    user_id TEXT,
    content TEXT,
    type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE room_members (
    room_id INTEGER,
    user_id TEXT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role TEXT,
    FOREIGN KEY (room_id) REFERENCES rooms (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  -- Insert a default room
  INSERT OR IGNORE INTO rooms (id, name, type, created_by) VALUES (1, 'General', 'group', NULL);
`);

console.log('Database migration completed successfully!');
db.close();
