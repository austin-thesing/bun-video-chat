import { db, sqlite } from './database.ts';
import { handleAuthRequest } from './auth.ts';
import { handleRoomCreated } from './websocket/handlers/presenceHandler.ts';
import bcrypt from 'bcryptjs';

// Ensure General room exists
function ensureGeneralRoom() {
  const generalRoom = sqlite
    .prepare('SELECT * FROM rooms WHERE name = ? OR id = 1')
    .get('General');

  if (!generalRoom) {
    const stmt = sqlite.prepare(`
      INSERT INTO rooms (id, name, type, created_by, created_at)
      VALUES (1, 'General', 'group', 'system', ?)
    `);
    stmt.run(new Date().toISOString());
    console.log('Created default General room');
  }
}

// Initialize General room on startup
ensureGeneralRoom();

function createAuthCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    'HttpOnly',
    'Path=/',
    'Max-Age=86400',
    isProduction ? 'Secure' : '',
    'SameSite=Strict',
  ]
    .filter(Boolean)
    .join('; ');

  return `auth-token=${token}; ${cookieOptions}`;
}

export async function handleApiRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  try {
    // Auth endpoints
    if (path.startsWith('/api/auth/')) {
      return await handleAuthRequest(req);
    }

    // Custom auth endpoints
    if (path === '/api/register' && method === 'POST') {
      return await registerUser(req);
    }

    if (path === '/api/login' && method === 'POST') {
      return await loginUser(req);
    }

    if (path === '/api/logout' && method === 'POST') {
      return await logoutUser(req);
    }

    if (path === '/api/me' && method === 'GET') {
      return await getCurrentUser(req);
    }

    // Users endpoints
    if (path === '/api/users' && method === 'GET') {
      return await getUsers();
    }

    if (path === '/api/users' && method === 'POST') {
      return await createUser(req);
    }

    // Rooms endpoints
    if (path === '/api/rooms' && method === 'GET') {
      return await getRooms();
    }

    if (path === '/api/rooms' && method === 'POST') {
      return await createRoom(req);
    }

    // Room management endpoints
    if (path.startsWith('/api/rooms/') && method === 'PUT') {
      const roomId = parseInt(path.split('/')[3]);
      return await updateRoom(req, roomId);
    }

    if (path.startsWith('/api/rooms/') && method === 'DELETE') {
      const roomId = parseInt(path.split('/')[3]);
      return await deleteRoom(req, roomId);
    }

    // Messages endpoints
    if (
      path.startsWith('/api/rooms/') &&
      path.endsWith('/messages') &&
      method === 'GET'
    ) {
      const roomId = parseInt(path.split('/')[3]);
      return await getMessages(roomId);
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(`Internal Server Error: ${error.message}`, {
      status: 500,
    });
  }
}

async function getUsers(): Promise<Response> {
  const users = await db.selectFrom('users').selectAll().execute();
  return new Response(JSON.stringify(users), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function createUser(req: Request): Promise<Response> {
  const body = await req.json();
  const { username, email, avatar_url } = body;

  const user = await db
    .insertInto('users')
    .values({
      id: crypto.randomUUID(),
      username,
      email,
      avatar_url,
      created_at: new Date().toISOString(),
    })
    .returning('id')
    .executeTakeFirst();

  return new Response(JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
    status: 201,
  });
}

async function getRooms(): Promise<Response> {
  // Use raw SQLite to avoid schema issues
  const stmt = sqlite.prepare('SELECT * FROM rooms ORDER BY created_at DESC');
  const rooms = stmt.all();

  return new Response(JSON.stringify(rooms), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function createRoom(req: Request): Promise<Response> {
  const body = await req.json();
  const { name, type, created_by } = body;

  // Use raw SQLite for room creation since it has auto-increment ID
  const stmt = sqlite.prepare(`
    INSERT INTO rooms (name, type, created_by, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(name, type, created_by, new Date().toISOString());

  const room = sqlite
    .prepare('SELECT * FROM rooms WHERE id = ?')
    .get(result.lastInsertRowid);

  // Broadcast room creation to all WebSocket clients
  handleRoomCreated(room);

  return new Response(JSON.stringify(room), {
    headers: { 'Content-Type': 'application/json' },
    status: 201,
  });
}

async function updateRoom(req: Request, roomId: number): Promise<Response> {
  try {
    const body = await req.json();
    const { name, user_id } = body;

    // Check if user is the creator of the room
    const room = sqlite
      .prepare('SELECT * FROM rooms WHERE id = ?')
      .get(roomId) as any;
    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (room.created_by !== user_id) {
      return new Response(
        JSON.stringify({ error: 'Only room creator can edit room' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    // Prevent editing the General room
    if (room.name === 'General' || roomId === 1) {
      return new Response(
        JSON.stringify({ error: 'Cannot edit the General room' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    // Update room name
    const stmt = sqlite.prepare('UPDATE rooms SET name = ? WHERE id = ?');
    stmt.run(name, roomId);

    // Get updated room
    const updatedRoom = sqlite
      .prepare('SELECT * FROM rooms WHERE id = ?')
      .get(roomId);

    // Broadcast room update to all WebSocket clients
    handleRoomCreated(updatedRoom);

    return new Response(JSON.stringify(updatedRoom), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update room' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function deleteRoom(req: Request, roomId: number): Promise<Response> {
  try {
    const body = await req.json();
    const { user_id } = body;

    // Check if user is the creator of the room
    const room = sqlite
      .prepare('SELECT * FROM rooms WHERE id = ?')
      .get(roomId) as any;
    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (room.created_by !== user_id) {
      return new Response(
        JSON.stringify({ error: 'Only room creator can delete room' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    // Prevent deleting the General room
    if (room.name === 'General' || roomId === 1) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete the General room' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    // Delete room and related data
    const deleteRoomStmt = sqlite.prepare('DELETE FROM rooms WHERE id = ?');
    const deleteMessagesStmt = sqlite.prepare(
      'DELETE FROM messages WHERE room_id = ?'
    );
    const deleteMembersStmt = sqlite.prepare(
      'DELETE FROM room_members WHERE room_id = ?'
    );

    // Execute deletions in transaction
    const transaction = sqlite.transaction(() => {
      deleteMessagesStmt.run(roomId);
      deleteMembersStmt.run(roomId);
      deleteRoomStmt.run(roomId);
    });

    transaction();

    // Broadcast room deletion to all WebSocket clients
    handleRoomCreated({ id: roomId, deleted: true });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete room' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function getMessages(roomId: number): Promise<Response> {
  const messages = await db
    .selectFrom('messages')
    .selectAll()
    .where('room_id', '=', roomId)
    .where('deleted_at', 'is', null)
    .orderBy('created_at', 'asc')
    .execute();

  return new Response(JSON.stringify(messages), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function registerUser(req: Request): Promise<Response> {
  try {
    console.log('Registration request received');
    const body = await req.json();
    const { username, email, password } = body;
    console.log('Registration data:', { username, email, password: '***' });

    if (!username || !email || !password) {
      console.log('Missing required fields');
      return new Response('Missing required fields', { status: 400 });
    }

    // Check if user already exists
    console.log('Checking for existing user with email:', email);
    const existingUser = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();

    if (existingUser) {
      console.log('User already exists');
      return new Response('User already exists', { status: 409 });
    }

    console.log('Checking for existing username:', username);
    const existingUsername = await db
      .selectFrom('users')
      .selectAll()
      .where('username', '=', username)
      .executeTakeFirst();

    if (existingUsername) {
      console.log('Username already taken');
      return new Response('Username already taken', { status: 409 });
    }

    // Hash password and create user
    console.log('Hashing password');
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();
    console.log('Generated user ID:', userId);

    console.log('Inserting user into database');

    // Use raw SQLite for insert to ensure it's committed
    const stmt = sqlite.prepare(`
      INSERT INTO users (id, email, username, name, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertResult = stmt.run(
      userId,
      email,
      username,
      username,
      hashedPassword,
      new Date().toISOString()
    );
    console.log('Raw SQLite insert result:', insertResult);

    // Verify with raw SQLite query
    const rawUser = sqlite
      .prepare('SELECT id, email, username, name FROM users WHERE id = ?')
      .get(userId) as any;
    console.log('Raw SQLite fetch result:', rawUser);

    // Also try with Kysely
    const kyselyUser = await db
      .selectFrom('users')
      .select(['id', 'email', 'username', 'name'])
      .where('id', '=', userId)
      .executeTakeFirst();

    console.log('Kysely fetch result:', kyselyUser);

    const user = rawUser || kyselyUser;

    if (!user) {
      console.log('Failed to fetch created user');
      return new Response('Failed to create user', { status: 500 });
    }

    // Create JWT token for auto-login after registration
    const { createJWT } = await import('./auth.ts');
    const token = await createJWT({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    });

    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    };

    return new Response(JSON.stringify(userData), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': createAuthCookie(token),
      },
      status: 201,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(`Registration failed: ${error.message}`, {
      status: 500,
    });
  }
}

async function loginUser(req: Request): Promise<Response> {
  const body = await req.json();
  const { email, username, password } = body;
  const loginIdentifier = email || username;

  if (!loginIdentifier || !password) {
    return new Response('Missing email/username or password', { status: 400 });
  }

  // Check if the identifier is an email (contains @) or username
  const isEmail = loginIdentifier.includes('@');

  // Use raw SQLite for now since Kysely seems to have connection issues
  const query = isEmail
    ? 'SELECT * FROM users WHERE email = ?'
    : 'SELECT * FROM users WHERE username = ?';

  const user = sqlite.prepare(query).get(loginIdentifier) as any;

  if (!user || !user.password_hash) {
    return new Response('Invalid credentials', { status: 401 });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return new Response('Invalid credentials', { status: 401 });
  }

  // Create JWT token
  const { createJWT } = await import('./auth.ts');
  const token = await createJWT({
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
  });

  const userData = {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
  };

  return new Response(JSON.stringify(userData), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': createAuthCookie(token),
    },
  });
}

async function logoutUser(req: Request): Promise<Response> {
  // Clear the auth cookie with environment-aware settings
  const isProduction = process.env.NODE_ENV === 'production';
  const clearCookieOptions = [
    'HttpOnly',
    'Path=/',
    'Max-Age=0',
    isProduction ? 'Secure' : '',
    'SameSite=Strict',
  ]
    .filter(Boolean)
    .join('; ');

  return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `auth-token=; ${clearCookieOptions}`,
    },
  });
}

async function getCurrentUser(req: Request): Promise<Response> {
  try {
    // Get token from cookie
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const cookies = cookieHeader.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );

    const token = cookies['auth-token'];
    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify JWT token
    const { verifyJWT } = await import('./auth.ts');
    const payload = await verifyJWT(token);

    if (!payload) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Return user data from token
    return new Response(
      JSON.stringify({
        id: payload.id,
        email: payload.email,
        username: payload.username,
        name: payload.name,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return new Response('Unauthorized', { status: 401 });
  }
}
