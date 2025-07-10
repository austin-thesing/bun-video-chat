import { Database } from "bun:sqlite";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: string | null;
  image: string | null;
  username: string | null;
  password_hash: string | null;
  created_at: string;
}

export class UserModel {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // Create a new user
  create(userData: Omit<User, "id" | "created_at">): User {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, name, email, emailVerified, image, username, password_hash)
      VALUES ($id, $name, $email, $emailVerified, $image, $username, $password_hash)
      RETURNING *
    `);

    const id = crypto.randomUUID();
    return stmt.get({
      $id: id,
      $name: userData.name,
      $email: userData.email,
      $emailVerified: userData.emailVerified,
      $image: userData.image,
      $username: userData.username,
      $password_hash: userData.password_hash,
    }) as User;
  }

  // Find user by ID
  findById(id: string): User | null {
    const stmt = this.db.prepare("SELECT * FROM users WHERE id = $id");
    return stmt.get({ $id: id }) as User | null;
  }

  // Find user by email
  findByEmail(email: string): User | null {
    const stmt = this.db.prepare("SELECT * FROM users WHERE email = $email");
    return stmt.get({ $email: email }) as User | null;
  }

  // Find user by username
  findByUsername(username: string): User | null {
    const stmt = this.db.prepare("SELECT * FROM users WHERE username = $username");
    return stmt.get({ $username: username }) as User | null;
  }

  // Update user
  update(id: string, updates: Partial<Omit<User, "id" | "created_at">>): User | null {
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
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $id
      RETURNING *
    `);

    return stmt.get(values) as User | null;
  }

  // Delete user
  delete(id: string): boolean {
    const stmt = this.db.prepare("DELETE FROM users WHERE id = $id");
    const result = stmt.run({ $id: id });
    return result.changes > 0;
  }

  // Get all users
  findAll(): User[] {
    const stmt = this.db.prepare("SELECT * FROM users ORDER BY created_at DESC");
    return stmt.all() as User[];
  }
}