import type { DatabaseConnection } from "../utils/database";

export function up(db: DatabaseConnection): void {
  const rawDb = db.getRawDb();
  
  // Auth.js required tables
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
      UNIQUE(provider, providerAccountId)
    );
    
    CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts(userId);
  `);

  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      sessionToken TEXT UNIQUE NOT NULL,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires TIMESTAMP NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
    CREATE INDEX IF NOT EXISTS idx_sessions_sessionToken ON sessions(sessionToken);
  `);

  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires TIMESTAMP NOT NULL,
      PRIMARY KEY (identifier, token)
    );
    
    CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
  `);
}

export function down(db: DatabaseConnection): void {
  const rawDb = db.getRawDb();
  
  rawDb.exec(`
    DROP TABLE IF EXISTS verification_tokens;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS accounts;
  `);
}