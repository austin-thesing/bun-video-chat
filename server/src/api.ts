import { db, sqlite } from "./database.ts";
import { handleAuthRequest } from "./auth.ts";
import bcrypt from "bcryptjs";

export async function handleApiRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  try {
    // Auth endpoints
    if (path.startsWith("/api/auth/")) {
      return await handleAuthRequest(req);
    }

    // Custom auth endpoints
    if (path === "/api/register" && method === "POST") {
      return await registerUser(req);
    }

    if (path === "/api/login" && method === "POST") {
      return await loginUser(req);
    }

    // Users endpoints
    if (path === "/api/users" && method === "GET") {
      return await getUsers();
    }
    
    if (path === "/api/users" && method === "POST") {
      return await createUser(req);
    }

    // Rooms endpoints
    if (path === "/api/rooms" && method === "GET") {
      return await getRooms();
    }
    
    if (path === "/api/rooms" && method === "POST") {
      return await createRoom(req);
    }

    // Messages endpoints
    if (path.startsWith("/api/rooms/") && path.endsWith("/messages") && method === "GET") {
      const roomId = parseInt(path.split("/")[3]);
      return await getMessages(roomId);
    }

    return new Response("Not Found", { status: 404 });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}

async function getUsers(): Promise<Response> {
  const users = await db.selectFrom("users").selectAll().execute();
  return new Response(JSON.stringify(users), {
    headers: { "Content-Type": "application/json" },
  });
}

async function createUser(req: Request): Promise<Response> {
  const body = await req.json();
  const { username, email, avatar_url } = body;

  const user = await db
    .insertInto("users")
    .values({
      username,
      email,
      avatar_url,
      created_at: new Date().toISOString(),
    })
    .returning("id")
    .executeTakeFirst();

  return new Response(JSON.stringify(user), {
    headers: { "Content-Type": "application/json" },
    status: 201,
  });
}

async function getRooms(): Promise<Response> {
  const rooms = await db.selectFrom("rooms").selectAll().execute();
  return new Response(JSON.stringify(rooms), {
    headers: { "Content-Type": "application/json" },
  });
}

async function createRoom(req: Request): Promise<Response> {
  const body = await req.json();
  const { name, type, created_by } = body;

  const room = await db
    .insertInto("rooms")
    .values({
      name,
      type,
      created_by,
      created_at: new Date().toISOString(),
    })
    .returning("id")
    .executeTakeFirst();

  return new Response(JSON.stringify(room), {
    headers: { "Content-Type": "application/json" },
    status: 201,
  });
}

async function getMessages(roomId: number): Promise<Response> {
  const messages = await db
    .selectFrom("messages")
    .selectAll()
    .where("room_id", "=", roomId)
    .where("deleted_at", "is", null)
    .orderBy("created_at", "asc")
    .execute();

  return new Response(JSON.stringify(messages), {
    headers: { "Content-Type": "application/json" },
  });
}

async function registerUser(req: Request): Promise<Response> {
  try {
    console.log("Registration request received");
    const body = await req.json();
    const { username, email, password } = body;
    console.log("Registration data:", { username, email, password: "***" });

    if (!username || !email || !password) {
      console.log("Missing required fields");
      return new Response("Missing required fields", { status: 400 });
    }

    // Check if user already exists
    console.log("Checking for existing user with email:", email);
    const existingUser = await db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst();

    if (existingUser) {
      console.log("User already exists");
      return new Response("User already exists", { status: 409 });
    }

    console.log("Checking for existing username:", username);
    const existingUsername = await db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", username)
      .executeTakeFirst();

    if (existingUsername) {
      console.log("Username already taken");
      return new Response("Username already taken", { status: 409 });
    }

    // Hash password and create user
    console.log("Hashing password");
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();
    console.log("Generated user ID:", userId);

    console.log("Inserting user into database");
    
    // Use raw SQLite for insert to ensure it's committed
    const stmt = sqlite.prepare(`
      INSERT INTO users (id, email, username, name, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertResult = stmt.run(userId, email, username, username, hashedPassword, new Date().toISOString());
    console.log("Raw SQLite insert result:", insertResult);
    
    // Verify with raw SQLite query
    const rawUser = sqlite.prepare("SELECT id, email, username, name FROM users WHERE id = ?").get(userId);
    console.log("Raw SQLite fetch result:", rawUser);
    
    // Also try with Kysely
    const kyselyUser = await db
      .selectFrom("users")
      .select(["id", "email", "username", "name"])
      .where("id", "=", userId)
      .executeTakeFirst();
    
    console.log("Kysely fetch result:", kyselyUser);
    
    const user = rawUser || kyselyUser;

    if (!user) {
      console.log("Failed to fetch created user");
      return new Response("Failed to create user", { status: 500 });
    }

    return new Response(JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    }), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(`Registration failed: ${error.message}`, { status: 500 });
  }
}

async function loginUser(req: Request): Promise<Response> {
  const body = await req.json();
  const { email, username, password } = body;
  const loginIdentifier = email || username;

  if (!loginIdentifier || !password) {
    return new Response("Missing email/username or password", { status: 400 });
  }

  // Check if the identifier is an email (contains @) or username
  const isEmail = loginIdentifier.includes("@");
  
  // Use raw SQLite for now since Kysely seems to have connection issues
  const query = isEmail 
    ? "SELECT * FROM users WHERE email = ?"
    : "SELECT * FROM users WHERE username = ?";
  
  const user = sqlite.prepare(query).get(loginIdentifier);

  if (!user || !user.password_hash) {
    return new Response("Invalid credentials", { status: 401 });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return new Response("Invalid credentials", { status: 401 });
  }

  return new Response(JSON.stringify({
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
  }), {
    headers: { "Content-Type": "application/json" },
  });
}