import { Database } from "bun:sqlite";

export interface Room {
  id: number;
  name: string | null;
  type: string | null;
  created_by: string | null;
  created_at: string;
}

export class RoomModel {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // Create a new room
  create(roomData: Omit<Room, "id" | "created_at">): Room {
    const stmt = this.db.prepare(`
      INSERT INTO rooms (name, type, created_by)
      VALUES ($name, $type, $created_by)
      RETURNING *
    `);

    return stmt.get({
      $name: roomData.name,
      $type: roomData.type,
      $created_by: roomData.created_by,
    }) as Room;
  }

  // Find room by ID
  findById(id: number): Room | null {
    const stmt = this.db.prepare("SELECT * FROM rooms WHERE id = $id");
    return stmt.get({ $id: id }) as Room | null;
  }

  // Find rooms by type
  findByType(type: string): Room[] {
    const stmt = this.db.prepare("SELECT * FROM rooms WHERE type = $type ORDER BY created_at DESC");
    return stmt.all({ $type: type }) as Room[];
  }

  // Find rooms created by a user
  findByCreator(userId: string): Room[] {
    const stmt = this.db.prepare("SELECT * FROM rooms WHERE created_by = $userId ORDER BY created_at DESC");
    return stmt.all({ $userId: userId }) as Room[];
  }

  // Update room
  update(id: number, updates: Partial<Omit<Room, "id" | "created_at">>): Room | null {
    const fields = [];
    const values: any = { $id: id };

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${key}`);
      values[`$${key}`] = value;
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    const stmt = this.db.prepare(`
      UPDATE rooms
      SET ${fields.join(", ")}
      WHERE id = $id
      RETURNING *
    `);

    return stmt.get(values) as Room | null;
  }

  // Delete room
  delete(id: number): boolean {
    const stmt = this.db.prepare("DELETE FROM rooms WHERE id = $id");
    const result = stmt.run({ $id: id });
    return result.changes > 0;
  }

  // Get all rooms
  findAll(): Room[] {
    const stmt = this.db.prepare("SELECT * FROM rooms ORDER BY created_at DESC");
    return stmt.all() as Room[];
  }

  // Get rooms for a user (rooms they are a member of)
  findUserRooms(userId: string): Room[] {
    const stmt = this.db.prepare(`
      SELECT r.* FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      WHERE rm.user_id = $userId
      ORDER BY r.created_at DESC
    `);
    return stmt.all({ $userId: userId }) as Room[];
  }

  // Create a direct message room between two users
  createDirectRoom(user1Id: string, user2Id: string): Room {
    // First check if a direct room already exists between these users
    const existingRoomStmt = this.db.prepare(`
      SELECT r.* FROM rooms r
      WHERE r.type = 'direct'
      AND EXISTS (
        SELECT 1 FROM room_members rm1
        WHERE rm1.room_id = r.id AND rm1.user_id = $user1Id
      )
      AND EXISTS (
        SELECT 1 FROM room_members rm2
        WHERE rm2.room_id = r.id AND rm2.user_id = $user2Id
      )
    `);
    
    const existingRoom = existingRoomStmt.get({ $user1Id: user1Id, $user2Id: user2Id }) as Room | null;
    
    if (existingRoom) {
      return existingRoom;
    }

    // Create new direct room
    return this.create({
      name: null,
      type: 'direct',
      created_by: user1Id,
    });
  }
}