---
description: Bun Video Chat - Real-time chat and video calling application built with Bun runtime
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: true
---

# Bun Video Chat Application

A modern real-time chat and video calling application built with Bun runtime, featuring WebSocket messaging, WebRTC video calls, and SQLite database.

## 🛠️ Technology Stack

- **Runtime**: Bun (latest) - Fast JavaScript runtime with built-in bundler
- **Backend**: Bun.serve() with native WebSocket support
- **Frontend**: React 18 with TypeScript
- **Database**: SQLite (via bun:sqlite)
- **Authentication**: Auth.js with custom login/register
- **Real-time**: WebSockets for chat, WebRTC for video
- **Styling**: Tailwind CSS
- **Query Builder**: Kysely for type-safe database operations

## 🏗️ Architecture Overview

### Server Architecture (`/server`)

```
/server
├── index.ts              # Main server entry point with Bun.serve()
├── src/
│   ├── api.ts           # REST API endpoints
│   ├── auth.ts          # Authentication handlers
│   ├── database.ts      # Database connection & schema
│   ├── types.ts         # TypeScript type definitions
│   ├── websocket.ts     # Legacy WebSocket handler
│   ├── models/          # Database models with CRUD operations
│   │   ├── User.ts      # User model
│   │   ├── Room.ts      # Room model
│   │   ├── Message.ts   # Message model
│   │   └── RoomMember.ts# Room membership model
│   ├── websocket/       # Advanced WebSocket handlers
│   │   ├── index.ts     # Main WebSocket handler
│   │   ├── connectionManager.ts # Connection management
│   │   ├── handlers/    # Message type handlers
│   │   │   ├── chatHandler.ts
│   │   │   ├── presenceHandler.ts
│   │   │   ├── typingHandler.ts
│   │   │   └── webrtcHandler.ts
│   │   └── utils.ts     # WebSocket utilities
│   ├── migrations/      # Database migrations
│   ├── scripts/         # Database scripts (migrate, seed, test)
│   └── utils/           # Utility functions
```

### Client Architecture (`/client`)

```
/client
├── index.html           # Entry point HTML
├── src/
│   ├── App.tsx         # Main React application
│   ├── frontend.tsx    # React DOM rendering
│   ├── components/     # UI components
│   │   ├── auth/       # Authentication components
│   │   ├── chat/       # Chat interface components
│   │   ├── layout/     # Layout components
│   │   ├── rooms/      # Room management components
│   │   ├── users/      # User list components
│   │   └── video/      # Video call components
│   ├── contexts/       # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── WebSocketContext.tsx
│   │   └── WebRTCContext.tsx
│   ├── services/       # External service integrations
│   │   ├── websocket.ts
│   │   └── webrtc.ts
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── styles/         # CSS files
```

## 🚀 Development Commands

### Primary Commands
- `bun run dev` - Start development server with hot reloading
- `bun run build` - Build for production
- `bun test` - Run all tests
- `bun install` - Install dependencies

### Database Commands
- `bun run db:migrate` - Run database migrations
- `bun run db:seed` - Seed database with sample data
- `bun run db:test` - Test database operations

### CSS Commands
- `bun run build:css` - Build Tailwind CSS
- `bun run watch:css` - Watch and build CSS changes

### Quality Commands
- `bun run lint` - Run ESLint
- `bun run format` - Format code with Prettier

## 🔧 Bun-Specific Patterns

### Use Bun Native APIs
- `Bun.serve()` for HTTP/WebSocket server (not Express)
- `bun:sqlite` for database (not better-sqlite3)
- `Bun.file()` for file operations (not fs)
- `WebSocket` built-in (not ws library)
- `Bun.build()` for bundling (not webpack/vite)

### Development Commands
- `bun <file>` instead of `node <file>` or `ts-node <file>`
- `bun test` instead of `jest` or `vitest`
- `bun --hot` for hot reloading
- Environment variables loaded automatically (no dotenv needed)

## 📊 Database Schema

### Core Tables
```sql
-- Users (Auth.js compatible)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  name TEXT,
  password_hash TEXT,
  created_at TIMESTAMP,
  emailVerified TIMESTAMP,
  image TEXT
);

-- Rooms (group and direct)
CREATE TABLE rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  type TEXT CHECK (type IN ('group', 'direct')),
  created_by TEXT,
  created_at TIMESTAMP
);

-- Messages (with soft delete)
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER,
  user_id TEXT,
  content TEXT,
  type TEXT CHECK (type IN ('text', 'image', 'file')),
  created_at TIMESTAMP,
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Room Members (with roles)
CREATE TABLE room_members (
  room_id INTEGER,
  user_id TEXT,
  joined_at TIMESTAMP,
  role TEXT CHECK (role IN ('admin', 'member'))
);
```

### Database Access Patterns

#### Using Kysely (Type-safe)
```typescript
import { db } from './database';

// Get messages
const messages = await db
  .selectFrom('messages')
  .selectAll()
  .where('room_id', '=', roomId)
  .where('deleted_at', 'is', null)
  .orderBy('created_at', 'asc')
  .execute();
```

#### Using Model Classes
```typescript
import { dbModels } from './database';

// Create user
const user = dbModels.users.create({
  name: 'John Doe',
  email: 'john@example.com',
  username: 'johndoe'
});

// Get room messages with user info
const messages = dbModels.messages.findByRoomWithUsers(roomId, 50, 0);
```

## 🌐 WebSocket Protocol

### Message Types
```typescript
interface WSMessage {
  type: "chat" | "typing" | "presence" | "webrtc" | "join_room" | 
        "leave_room" | "message_edit" | "message_delete" | "ping" | "pong";
  payload: any;
  timestamp: number;
}
```

### Chat Messages
```typescript
// Send message
ws.send(JSON.stringify({
  type: "chat",
  payload: {
    room_id: 1,
    user_id: "user123",
    content: "Hello world!",
    type: "text"
  },
  timestamp: Date.now()
}));
```

### Presence Updates
```typescript
// Update presence
ws.send(JSON.stringify({
  type: "presence",
  payload: {
    user_id: "user123",
    username: "johndoe",
    status: "online"
  },
  timestamp: Date.now()
}));
```

## 🎥 WebRTC Implementation

### Signaling via WebSocket
```typescript
// Send WebRTC offer
ws.send(JSON.stringify({
  type: "webrtc",
  payload: {
    type: "offer",
    from_user_id: "user123",
    to_user_id: "user456",
    data: { sdp: offer.sdp, type: offer.type }
  },
  timestamp: Date.now()
}));
```

### WebRTC Context Usage
```typescript
// In React component
const { startCall, endCall, localStream, remoteStream } = useWebRTC();

// Start video call
const handleStartCall = async () => {
  await startCall(targetUserId);
};
```

## 🔒 Authentication

### Auth.js Integration
- Supports both Auth.js providers and custom login/register
- JWT-based session management
- Compatible database schema

### Custom Authentication
```typescript
// Register endpoint
POST /api/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword"
}

// Login endpoint
POST /api/login
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

## 🎨 Frontend Patterns

### React Context Architecture
```typescript
// App structure
<AuthProvider>
  <WebSocketProvider>
    <WebRTCProvider>
      <MainLayout />
    </WebRTCProvider>
  </WebSocketProvider>
</AuthProvider>
```

### Component Organization
- `components/auth/` - Authentication forms
- `components/chat/` - Chat interface
- `components/layout/` - Layout components
- `components/rooms/` - Room management
- `components/video/` - Video call interface

## 🧪 Testing

### Backend Tests
```typescript
// server/index.test.ts
import { test, expect } from "bun:test";

test("database connection", async () => {
  const result = await db.selectFrom("users").selectAll().execute();
  expect(Array.isArray(result)).toBe(true);
});
```

### WebSocket Tests
```typescript
// Test WebSocket message handling
test("chat message handling", async () => {
  const ws = new MockWebSocket();
  await websocketHandler.message(ws, JSON.stringify({
    type: "chat",
    payload: { room_id: 1, user_id: "test", content: "hello" }
  }));
  expect(ws.sentMessages).toHaveLength(1);
});
```

## 🔍 Development Workflow

### Getting Started
1. `bun install` - Install dependencies
2. `bun run db:migrate` - Set up database
3. `bun run db:seed` - Add sample data
4. `bun run dev` - Start development server
5. Open `http://localhost:3000`

### Code Style
- TypeScript with strict mode
- ESLint for linting
- Prettier for formatting
- Conventional commits

### File Naming
- camelCase for variables and functions
- PascalCase for React components and TypeScript types
- kebab-case for CSS classes

## 📦 Build & Deployment

### Production Build
```bash
bun run build      # Build server
bun run build:css  # Build CSS
```

### Environment Variables
```bash
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=./db.sqlite

# Auth
AUTH_SECRET=your-secret-key
```

## 🚨 Error Handling

### Server Errors
```typescript
try {
  await handleApiRequest(req);
} catch (error) {
  console.error("API Error:", error);
  return new Response(`Server Error: ${error.message}`, { status: 500 });
}
```

### WebSocket Errors
```typescript
ws.send(JSON.stringify({
  type: "error",
  payload: { message: "Invalid message format" },
  timestamp: Date.now()
}));
```

## 🔧 Troubleshooting

### Common Issues
1. **Database locked**: Check for uncommitted transactions
2. **WebSocket connection failed**: Verify server is running on correct port
3. **CSS not loading**: Run `bun run build:css` or `bun run watch:css`
4. **TypeScript errors**: Check `tsconfig.json` configuration

### Debug Commands
```bash
# Test database connection
bun run db:test

# Check WebSocket connections
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3000/ws

# Verbose logging
NODE_ENV=development bun run dev
```

## 📚 Additional Resources

- [Bun Documentation](https://bun.sh/docs)
- [Bun API Reference](https://bun.sh/docs/api)
- [Project PLAN.md](./PLAN.md) - Detailed development plan
- [DATABASE_IMPLEMENTATION.md](./DATABASE_IMPLEMENTATION.md) - Database implementation details
- [Server WebSocket README](./server/src/websocket/README.md) - WebSocket handler documentation
