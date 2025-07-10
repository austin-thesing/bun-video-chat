import { Database } from "bun:sqlite";
import { UserModel } from "../models/User";
import { RoomModel } from "../models/Room";
import { MessageModel } from "../models/Message";
import { RoomMemberModel } from "../models/RoomMember";

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database;
  
  // Model instances
  public users: UserModel;
  public rooms: RoomModel;
  public messages: MessageModel;
  public roomMembers: RoomMemberModel;

  private constructor(dbPath: string = "db.sqlite") {
    this.db = new Database(dbPath);
    
    // Enable WAL mode for better concurrency
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA synchronous = NORMAL;");
    
    // Initialize models
    this.users = new UserModel(this.db);
    this.rooms = new RoomModel(this.db);
    this.messages = new MessageModel(this.db);
    this.roomMembers = new RoomMemberModel(this.db);
  }

  // Singleton pattern to ensure single database connection
  static getInstance(dbPath?: string): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection(dbPath);
    }
    return DatabaseConnection.instance;
  }

  // Get the raw database instance if needed
  getRawDb(): Database {
    return this.db;
  }

  // Execute raw SQL if needed
  exec(sql: string): void {
    this.db.exec(sql);
  }

  // Prepare statement for custom queries
  prepare(sql: string) {
    return this.db.prepare(sql);
  }

  // Transaction wrapper
  transaction<T>(fn: () => T): T {
    const transaction = this.db.transaction(fn);
    return transaction();
  }

  // Close database connection
  close(): void {
    this.db.close();
  }

  // Run migrations
  async runMigrations(): Promise<void> {
    // Check if migrations table exists
    const migrationTableExists = this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='migrations'
    `).get();

    if (!migrationTableExists) {
      // Create migrations table
      this.db.exec(`
        CREATE TABLE migrations (
          id INTEGER PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Check which migrations have been run
    const executedMigrations = this.db.prepare("SELECT name FROM migrations").all() as { name: string }[];
    const executedNames = new Set(executedMigrations.map(m => m.name));

    // Import and run migrations
    const migrationsDir = `${import.meta.dir}/../migrations`;
    const migrationFiles = await Array.fromAsync(
      new Bun.Glob("*.ts").scan({ cwd: migrationsDir })
    );

    for (const file of migrationFiles.sort()) {
      const migrationName = file.replace('.ts', '');
      
      if (!executedNames.has(migrationName)) {
        console.log(`Running migration: ${migrationName}`);
        
        try {
          const migration = await import(`${migrationsDir}/${file}`);
          
          // Run migration in a transaction
          this.transaction(() => {
            migration.up(this);
            
            // Record migration as executed
            const stmt = this.db.prepare("INSERT INTO migrations (name) VALUES ($name)");
            stmt.run({ $name: migrationName });
          });
          
          console.log(`✓ Migration ${migrationName} completed`);
        } catch (error) {
          console.error(`✗ Migration ${migrationName} failed:`, error);
          throw error;
        }
      }
    }
  }

  // Utility method to check database health
  checkHealth(): boolean {
    try {
      const result = this.db.prepare("SELECT 1").get();
      return result !== null;
    } catch {
      return false;
    }
  }

  // Utility method to get database stats
  getStats() {
    const stats = {
      users: this.db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number },
      rooms: this.db.prepare("SELECT COUNT(*) as count FROM rooms").get() as { count: number },
      messages: this.db.prepare("SELECT COUNT(*) as count FROM messages").get() as { count: number },
      activeRooms: this.db.prepare(`
        SELECT COUNT(DISTINCT room_id) as count 
        FROM messages 
        WHERE created_at > datetime('now', '-1 day')
      `).get() as { count: number },
    };

    return {
      totalUsers: stats.users.count,
      totalRooms: stats.rooms.count,
      totalMessages: stats.messages.count,
      activeRoomsLast24h: stats.activeRooms.count,
    };
  }
}

// Export a default instance
export const db = DatabaseConnection.getInstance();