import type { DatabaseConnection } from '../utils/database';

export function up(db: DatabaseConnection): void {
  const rawDb = db.getRawDb();

  // Add file metadata columns to messages table
  rawDb.exec(`
    ALTER TABLE messages ADD COLUMN file_name TEXT;
    ALTER TABLE messages ADD COLUMN file_size INTEGER;
    ALTER TABLE messages ADD COLUMN file_type TEXT;
    ALTER TABLE messages ADD COLUMN file_path TEXT;
  `);

  // Create index for file messages
  rawDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_file_type ON messages(file_type);
  `);
}

export function down(): void {
  // SQLite doesn't support DROP COLUMN, so we'd need to recreate the table
  // For now, we'll just leave the columns (they'll be NULL for existing messages)
  console.log(
    "Note: SQLite doesn't support DROP COLUMN. File columns will remain but be unused."
  );
}
