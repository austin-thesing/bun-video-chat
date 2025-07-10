import { Database } from 'bun:sqlite';
import { Kysely, SqliteDialect } from 'kysely';
import { DatabaseConnection } from './utils/database';

export interface DatabaseSchema {
  accounts: {
    id: string;
    userId: string;
    type: string;
    provider: string;
    providerAccountId: string;
    refresh_token: string | null;
    access_token: string | null;
    expires_at: number | null;
    token_type: string | null;
    scope: string | null;
    id_token: string | null;
    session_state: string | null;
  };
  sessions: {
    id: string;
    sessionToken: string;
    userId: string;
    expires: string;
  };
  verification_tokens: {
    identifier: string;
    token: string;
    expires: string;
  };
  users: {
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
  };
  rooms: {
    id: number;
    name: string | null;
    type: string | null;
    created_by: string | null;
    created_at: string;
  };
  messages: {
    id?: number;
    room_id: number | null;
    user_id: string | null;
    content: string | null;
    type: string | null;
    created_at?: string;
    edited_at: string | null;
    deleted_at: string | null;
  };
  room_members: {
    room_id: number | null;
    user_id: string | null;
    joined_at: string;
    role: string | null;
  };
}

const sqlite = new Database('db.sqlite');

// Enable WAL mode for better concurrency
sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA synchronous = NORMAL;');

export const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({
    database: sqlite,
  }),
});

// Export the new model-based database connection
export const dbModels = DatabaseConnection.getInstance('db.sqlite');

export { sqlite };
