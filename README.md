# Bun Video Chat

A modern real-time chat and video calling application built with Bun runtime, featuring advanced WebSocket messaging, WebRTC video calls, and a comprehensive SQLite database layer.

## 🚀 Technology Stack

- **Runtime**: Bun (latest) - Fast JavaScript runtime with built-in bundler
- **Backend**: Bun.serve() with native WebSocket support
- **Frontend**: React 18 with TypeScript
- **Database**: SQLite with dual access patterns (Kysely + Models)
- **Authentication**: Auth.js integration + custom login/register
- **Real-time**: WebSockets for chat, WebRTC for video
- **Styling**: Tailwind CSS with PostCSS
- **Query Builder**: Kysely for type-safe database operations
- **Testing**: Bun's built-in test runner

## 🏁 Quick Start

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Set up database**:
   ```bash
   bun run db:migrate
   bun run db:seed
   ```

3. **Start development server**:
   ```bash
   bun run dev
   ```

4. **Build CSS** (required for styling):
   ```bash
   bun run build:css
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

## 📊 Current Implementation Status

### ✅ Completed Features

#### Database Layer
- ✅ Complete SQLite schema with Auth.js compatibility
- ✅ Dual database access (Kysely + Model classes)
- ✅ Migration system with automated runners
- ✅ Database models with CRUD operations
- ✅ Comprehensive test suite
- ✅ Sample data seeding

#### WebSocket System
- ✅ Advanced WebSocket handler with connection management
- ✅ Message type handlers (chat, typing, presence, WebRTC)
- ✅ Room-based message broadcasting
- ✅ Connection pooling and heartbeat monitoring
- ✅ Error handling and message validation

#### Server Architecture
- ✅ Bun.serve() with integrated HTTP/WebSocket server
- ✅ REST API endpoints for users, rooms, messages
- ✅ Custom authentication with bcrypt password hashing
- ✅ Static file serving with TypeScript/JSX transpilation
- ✅ Hot reloading and development logging

#### Frontend Foundation
- ✅ React 18 with TypeScript setup
- ✅ Context-based state management (Auth, WebSocket, WebRTC)
- ✅ Component architecture with organized folders
- ✅ Tailwind CSS integration
- ✅ WebSocket service integration

### 🚧 In Progress / Planned

#### Authentication
- 🚧 Auth.js provider integration
- 🚧 JWT session management
- 🚧 Frontend auth forms completion

#### Chat Features
- 🚧 Complete chat interface
- 🚧 Message history loading
- 🚧 Typing indicators
- 🚧 Room management UI

#### Video Calling
- 🚧 WebRTC implementation
- 🚧 Video call UI components
- 🚧 Call signaling via WebSocket

## 🔄 Available Scripts

### Development
- `bun run dev` - Start development server with hot reloading
- `bun run build` - Build server for production
- `bun run test` - Run all tests

### Database
- `bun run db:migrate` - Run database migrations
- `bun run db:seed` - Seed database with sample data
- `bun run db:test` - Test database operations

### CSS & Styling
- `bun run build:css` - Build Tailwind CSS
- `bun run watch:css` - Watch and build CSS changes

### Code Quality
- `bun run lint` - Run ESLint
- `bun run format` - Format code with Prettier

## 📝 Project Structure

```
┌── Root Project (Bun Workspace)
├── server/                  # Backend server
│   ├── index.ts             # Main server entry point
│   └── src/
│       ├── api.ts           # REST API endpoints
│       ├── auth.ts          # Authentication handlers
│       ├── database.ts      # Database connection & schema
│       ├── types.ts         # Type definitions
│       ├── models/          # Database models
│       │   ├── User.ts
│       │   ├── Room.ts
│       │   ├── Message.ts
│       │   └── RoomMember.ts
│       ├── websocket/       # WebSocket handlers
│       │   ├── index.ts
│       │   ├── connectionManager.ts
│       │   ├── handlers/
│       │   └── utils.ts
│       ├── migrations/      # Database migrations
│       └── scripts/         # Utility scripts
│
├── client/                  # Frontend client
│   ├── index.html           # Entry point
│   └── src/
│       ├── App.tsx         # Main React app
│       ├── frontend.tsx    # React DOM setup
│       ├── components/     # UI components
│       │   ├── auth/       # Authentication
│       │   ├── chat/       # Chat interface
│       │   ├── layout/     # Layout components
│       │   ├── rooms/      # Room management
│       │   ├── users/      # User lists
│       │   └── video/      # Video calling
│       ├── contexts/       # React contexts
│       │   ├── AuthContext.tsx
│       │   ├── WebSocketContext.tsx
│       │   └── WebRTCContext.tsx
│       ├── services/       # External services
│       ├── types/          # Type definitions
│       ├── utils/          # Utility functions
│       └── styles/         # CSS files
│
└── Configuration Files
    ├── package.json         # Root package (workspace)
    ├── tsconfig.json        # TypeScript config
    ├── tailwind.config.js   # Tailwind CSS config
    ├── CLAUDE.md            # Development guide
    ├── PLAN.md              # Project plan
    └── DATABASE_IMPLEMENTATION.md
```

## 📊 Database Schema

### Core Tables
- **users** - User accounts (Auth.js compatible)
- **rooms** - Chat rooms (group and direct messages)
- **messages** - Chat messages with soft delete
- **room_members** - Room membership with roles
- **accounts** - OAuth provider accounts (Auth.js)
- **sessions** - User sessions (Auth.js)
- **verification_tokens** - Email verification (Auth.js)

### Database Access Patterns

#### Kysely (Type-safe queries)
```typescript
import { db } from './server/src/database';

const messages = await db
  .selectFrom('messages')
  .selectAll()
  .where('room_id', '=', roomId)
  .orderBy('created_at', 'asc')
  .execute();
```

#### Model Classes (Convenient CRUD)
```typescript
import { dbModels } from './server/src/database';

const user = dbModels.users.create({
  name: 'John Doe',
  email: 'john@example.com'
});
```

## 🌐 WebSocket Protocol

### Message Types
- `chat` - Chat messages
- `typing` - Typing indicators
- `presence` - User online/offline status
- `webrtc` - Video call signaling
- `join_room` / `leave_room` - Room management
- `ping` / `pong` - Connection heartbeat

### Example WebSocket Message
```json
{
  "type": "chat",
  "payload": {
    "room_id": 1,
    "user_id": "user123",
    "content": "Hello world!",
    "type": "text"
  },
  "timestamp": 1640995200000
}
```

## 🔍 Development

### Environment Setup
1. Ensure you have Bun installed: `curl -fsSL https://bun.sh/install | bash`
2. Clone the repository
3. Run `bun install` to install dependencies
4. Set up the database with migrations and seed data
5. Start the development server

### Key Features
- **Hot Reloading**: Changes automatically refresh the server
- **TypeScript**: Full type safety across the stack
- **Native Bun APIs**: No external HTTP/WebSocket libraries needed
- **Integrated Bundling**: Bun handles TypeScript, JSX, and CSS transpilation
- **Fast Testing**: Bun's built-in test runner
- **Dual Database Access**: Both type-safe Kysely and convenient model classes

### Configuration
- **TypeScript**: Strict mode enabled with latest features
- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Automatic code formatting
- **Tailwind CSS**: Utility-first styling

## 🔒 Authentication

### Dual Authentication Support
1. **Auth.js Integration**: OAuth providers (Google, GitHub, etc.)
2. **Custom Auth**: Username/email + password with bcrypt

### API Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/auth/*` - Auth.js endpoints

## 🔧 Testing

### Backend Tests
```bash
bun test                    # Run all tests
bun test server/           # Run server tests
bun run db:test           # Test database operations
```

### WebSocket Testing
```bash
# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3000/ws
```

### CSS Development
```bash
bun run watch:css          # Watch for CSS changes during development
```

## 📦 Deployment

### Production Build
```bash
bun run build              # Build server
bun run build:css          # Build CSS
```

### Environment Variables
```bash
PORT=3000
NODE_ENV=production
AUTH_SECRET=your-secret-key
DATABASE_URL=./db.sqlite
```

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive development guide
- **[PLAN.md](./PLAN.md)** - Detailed project plan and architecture
- **[DATABASE_IMPLEMENTATION.md](./DATABASE_IMPLEMENTATION.md)** - Database implementation details
- **[Server WebSocket README](./server/src/websocket/README.md)** - WebSocket documentation

## 🚀 Performance Features

- **Native Bun Runtime**: Up to 4x faster than Node.js
- **Built-in Bundling**: No webpack/vite needed
- **SQLite WAL Mode**: Concurrent read/write access
- **Connection Pooling**: Efficient WebSocket management
- **Prepared Statements**: Optimized database queries
- **Hot Module Reloading**: Fast development cycles

## 🤝 Contributing

This project follows modern web development practices:
- TypeScript for type safety
- ESLint and Prettier for code quality
- Conventional commits for git history
- Bun's native APIs for optimal performance

For detailed development guidelines, see [CLAUDE.md](./CLAUDE.md).

Built with Bun's native capabilities for maximum performance and minimal dependencies. The project demonstrates modern full-stack development with real-time features, type safety, and comprehensive testing.

## 🎯 Getting Started Tips

1. **First time setup**: Run the commands in the Quick Start section in order
2. **CSS issues**: If styles don't load, make sure to run `bun run build:css` first
3. **Database issues**: Use `bun run db:test` to verify database setup
4. **WebSocket issues**: Check that the server is running and accessible on port 3000
5. **Development workflow**: Use `bun run watch:css` in a separate terminal for CSS hot-reloading

The project is designed to work out-of-the-box with minimal configuration, leveraging Bun's built-in capabilities for optimal developer experience.
