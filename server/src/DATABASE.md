# Database Layer Documentation

This document describes the database layer implementation for the Bun video chat application.

## Overview

The database layer is implemented using Bun's native SQLite support (`bun:sqlite`) with models that provide a clean abstraction over raw SQL operations. The implementation also maintains compatibility with Auth.js and includes Kysely for query building where needed.

## Architecture

```
server/src/
├── models/                 # Data models
│   ├── User.ts            # User model
│   ├── Room.ts            # Room model
│   ├── Message.ts         # Message model
│   ├── RoomMember.ts      # Room membership model
│   └── index.ts           # Export all models
├── migrations/            # Database migrations
│   ├── 001_initial_schema.ts
│   └── 002_auth_tables.ts
├── scripts/               # Database scripts
│   ├── migrate.ts         # Migration runner
│   ├── seed.ts            # Sample data seeder
│   └── test-db.ts         # Database tests
├── utils/
│   └── database.ts        # Database connection manager
└── database.ts            # Legacy Kysely compatibility
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  auth_id TEXT UNIQUE,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  avatar_url TEXT,
  name TEXT,
  emailVerified TIMESTAMP,
  image TEXT,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Rooms Table
```sql
CREATE TABLE rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  type TEXT CHECK(type IN ('direct', 'group')),
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  content TEXT,
  type TEXT DEFAULT 'text' CHECK(type IN ('text', 'image', 'file')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP
);
```

### Room Members Table
```sql
CREATE TABLE room_members (
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
  PRIMARY KEY (room_id, user_id)
);
```

### Auth.js Tables
The database also includes Auth.js compatibility tables:
- `accounts` - OAuth provider accounts
- `sessions` - User sessions
- `verification_tokens` - Email verification tokens

## Usage

### Database Connection

```typescript
import { db } from './utils/database';

// Access models
const user = db.users.findByEmail('user@example.com');
const room = db.rooms.create({ name: 'General', type: 'group' });
```

### User Operations

```typescript
// Create user
const newUser = db.users.create({
  name: 'John Doe',
  email: 'john@example.com',
  username: 'johndoe',
  avatar_url: 'https://example.com/avatar.jpg',
  password_hash: null,
  emailVerified: null,
  image: null,
});

// Find user
const user = db.users.findByEmail('john@example.com');
const userById = db.users.findById('user-id');

// Update user
const updatedUser = db.users.update('user-id', {
  name: 'John Smith',
  avatar_url: 'https://example.com/new-avatar.jpg',
});
```

### Room Operations

```typescript
// Create room
const room = db.rooms.create({
  name: 'General Discussion',
  type: 'group',
  created_by: 'user-id',
});

// Create direct message room
const directRoom = db.rooms.createDirectRoom('user1-id', 'user2-id');

// Find user's rooms
const userRooms = db.rooms.findUserRooms('user-id');
```

### Message Operations

```typescript
// Create message
const message = db.messages.create({
  room_id: 1,
  user_id: 'user-id',
  content: 'Hello, world!',
  type: 'text',
});

// Get room messages
const messages = db.messages.findByRoom(1, 50, 0);

// Get messages with user info
const messagesWithUsers = db.messages.findByRoomWithUsers(1, 50, 0);

// Edit message
const editedMessage = db.messages.edit(1, 'Updated message content');

// Soft delete message
const deletedMessage = db.messages.softDelete(1);
```

### Room Membership Operations

```typescript
// Add member to room
db.roomMembers.addMember(1, 'user-id', 'member');

// Check if user is member
const isMember = db.roomMembers.isMember(1, 'user-id');

// Get room members
const members = db.roomMembers.getRoomMembers(1);

// Update member role
const updatedMember = db.roomMembers.updateRole(1, 'user-id', 'admin');
```

## Database Scripts

### Migration
```bash
# Run migrations
bun run db:migrate
```

### Seeding
```bash
# Seed with sample data
bun run db:seed
```

### Testing
```bash
# Test database layer
bun run db:test
```

## Features

### Performance Optimizations
- WAL mode enabled for better concurrency
- Proper indexing on frequently queried columns
- Prepared statements for all queries
- Connection pooling via singleton pattern

### Data Integrity
- Foreign key constraints
- Check constraints for enum-like fields
- Soft deletes for messages
- Transactions for multi-step operations

### Auth.js Compatibility
- Maintains compatibility with existing Auth.js setup
- Supports both new models and legacy Kysely queries
- Dual export system for gradual migration

### Developer Experience
- TypeScript interfaces for all models
- Comprehensive error handling
- Database health checks
- Migration system with rollback support
- Sample data seeding for development

## Migration Strategy

The database layer supports both the new model-based approach and the existing Kysely setup:

1. **New code** should use the model-based approach: `db.users.create(...)`
2. **Legacy code** can continue using Kysely: `db.selectFrom('users')...`
3. **Auth.js** integration works with both approaches

This allows for gradual migration without breaking existing functionality.

## Best Practices

1. **Always use models** for new database operations
2. **Use transactions** for multi-step operations
3. **Implement proper error handling** around database operations
4. **Use soft deletes** for user-generated content
5. **Validate input** before database operations
6. **Use prepared statements** (handled automatically by models)
7. **Monitor database performance** using the built-in stats methods