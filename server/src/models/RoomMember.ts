import { Database } from "bun:sqlite";

export interface RoomMember {
  room_id: number | null;
  user_id: string | null;
  joined_at: string;
  role: string | null;
}

export interface RoomMemberWithUser extends RoomMember {
  username?: string;
  name?: string;
  email?: string;
  image?: string;
}

export class RoomMemberModel {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // Add member to room
  addMember(roomId: number, userId: string, role: string = 'member'): RoomMember {
    const stmt = this.db.prepare(`
      INSERT INTO room_members (room_id, user_id, role)
      VALUES ($room_id, $user_id, $role)
      RETURNING *
    `);

    return stmt.get({
      $room_id: roomId,
      $user_id: userId,
      $role: role,
    }) as RoomMember;
  }

  // Remove member from room
  removeMember(roomId: number, userId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM room_members
      WHERE room_id = $room_id AND user_id = $user_id
    `);

    const result = stmt.run({
      $room_id: roomId,
      $user_id: userId,
    });

    return result.changes > 0;
  }

  // Get all members of a room
  getRoomMembers(roomId: number): RoomMemberWithUser[] {
    const stmt = this.db.prepare(`
      SELECT 
        rm.*,
        u.username,
        u.name,
        u.email,
        u.image
      FROM room_members rm
      LEFT JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = $room_id
      ORDER BY rm.joined_at ASC
    `);

    return stmt.all({ $room_id: roomId }) as RoomMemberWithUser[];
  }

  // Get rooms for a user
  getUserRooms(userId: string): RoomMember[] {
    const stmt = this.db.prepare(`
      SELECT * FROM room_members
      WHERE user_id = $user_id
      ORDER BY joined_at DESC
    `);

    return stmt.all({ $user_id: userId }) as RoomMember[];
  }

  // Check if user is member of room
  isMember(roomId: number, userId: string): boolean {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM room_members
      WHERE room_id = $room_id AND user_id = $user_id
    `);

    const result = stmt.get({
      $room_id: roomId,
      $user_id: userId,
    }) as { count: number };

    return result.count > 0;
  }

  // Update member role
  updateRole(roomId: number, userId: string, role: string): RoomMember | null {
    const stmt = this.db.prepare(`
      UPDATE room_members
      SET role = $role
      WHERE room_id = $room_id AND user_id = $user_id
      RETURNING *
    `);

    return stmt.get({
      $room_id: roomId,
      $user_id: userId,
      $role: role,
    }) as RoomMember | null;
  }

  // Get member by room and user
  getMember(roomId: number, userId: string): RoomMember | null {
    const stmt = this.db.prepare(`
      SELECT * FROM room_members
      WHERE room_id = $room_id AND user_id = $user_id
    `);

    return stmt.get({
      $room_id: roomId,
      $user_id: userId,
    }) as RoomMember | null;
  }

  // Count members in room
  countMembers(roomId: number): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM room_members
      WHERE room_id = $room_id
    `);

    const result = stmt.get({ $room_id: roomId }) as { count: number };
    return result.count;
  }

  // Get admins of a room
  getRoomAdmins(roomId: number): RoomMemberWithUser[] {
    const stmt = this.db.prepare(`
      SELECT 
        rm.*,
        u.username,
        u.name,
        u.email,
        u.image
      FROM room_members rm
      LEFT JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = $room_id AND rm.role = 'admin'
      ORDER BY rm.joined_at ASC
    `);

    return stmt.all({ $room_id: roomId }) as RoomMemberWithUser[];
  }

  // Add multiple members at once (batch operation)
  addMembers(members: Array<{ roomId: number; userId: string; role?: string }>): number {
    const stmt = this.db.prepare(`
      INSERT INTO room_members (room_id, user_id, role)
      VALUES ($room_id, $user_id, $role)
    `);

    let insertedCount = 0;
    const insertMany = this.db.transaction((members) => {
      for (const member of members) {
        stmt.run({
          $room_id: member.roomId,
          $user_id: member.userId,
          $role: member.role || 'member',
        });
        insertedCount++;
      }
    });

    insertMany(members);
    return insertedCount;
  }

  // Leave all rooms for a user (useful when user deletes account)
  leaveAllRooms(userId: string): number {
    const stmt = this.db.prepare(`
      DELETE FROM room_members
      WHERE user_id = $user_id
    `);

    const result = stmt.run({ $user_id: userId });
    return result.changes;
  }

  // Remove all members from a room (useful when deleting room)
  removeAllMembers(roomId: number): number {
    const stmt = this.db.prepare(`
      DELETE FROM room_members
      WHERE room_id = $room_id
    `);

    const result = stmt.run({ $room_id: roomId });
    return result.changes;
  }
}