# WebSocket Implementation

This directory contains the WebSocket functionality for the Bun-based video chat application, implementing real-time chat, presence tracking, and WebRTC signaling.

## Architecture

The WebSocket implementation is modular and organized into several components:

- **`index.ts`** - Main WebSocket handler and message router
- **`connectionManager.ts`** - Manages WebSocket connections and room assignments
- **`utils.ts`** - Utility functions for broadcasting and message validation
- **`handlers/`** - Specific message type handlers

## Features

### 1. Connection Management
- Tracks all active WebSocket connections
- Maps users to their connections
- Manages room memberships
- Handles connection cleanup

### 2. Chat Functionality
- Real-time message broadcasting
- Message persistence to database
- Message editing and deletion
- Message reactions
- Room-based messaging

### 3. Typing Indicators
- Real-time typing status
- Automatic timeout (3 seconds)
- Prevents spam with state tracking

### 4. Presence Tracking
- Online/offline status
- User join/leave room notifications
- Room user lists
- Connection activity monitoring

### 5. WebRTC Signaling
- Offer/answer exchange
- ICE candidate relay
- Call session management
- Call notifications and status

## Message Types

### Core Message Structure
```typescript
interface WSMessage {
  type: string;
  payload: any;
  timestamp: number;
}
```

### Chat Messages
- `chat` - Send a chat message
- `message_edit` - Edit an existing message
- `message_delete` - Delete a message
- `message_reaction` - React to a message

### Typing Indicators
- `typing` - Send typing status

### Presence & Rooms
- `presence` - Update online status
- `join_room` - Join a chat room
- `leave_room` - Leave current room
- `user_joined` - Notification of user joining room
- `user_left` - Notification of user leaving room

### WebRTC Signaling
- `webrtc` - WebRTC signaling messages (offer/answer/ice_candidate)
- `call_end` - End an active call
- `call_reject` - Reject an incoming call
- `incoming_call` - Notification of incoming call
- `call_active` - Call successfully connected
- `call_ended` - Call ended notification

### System Messages
- `connected` - Connection established
- `error` - Error messages
- `ping`/`pong` - Heartbeat messages

## Usage

### Client Connection
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle message based on type
};
```

### Sending Messages
```javascript
// Chat message
ws.send(JSON.stringify({
  type: 'chat',
  payload: {
    room_id: 1,
    user_id: 'user123',
    content: 'Hello world!',
    type: 'text'
  },
  timestamp: Date.now()
}));

// Join room
ws.send(JSON.stringify({
  type: 'join_room',
  payload: { room_id: 1 },
  timestamp: Date.now()
}));

// WebRTC offer
ws.send(JSON.stringify({
  type: 'webrtc',
  payload: {
    type: 'offer',
    from_user_id: 'user123',
    to_user_id: 'user456',
    data: sdpOffer
  },
  timestamp: Date.now()
}));
```

## Error Handling

The implementation includes comprehensive error handling:
- Message validation
- Connection state checking
- Database error handling
- Graceful connection cleanup

## Performance Features

- Connection pooling and efficient lookup
- Message broadcasting optimization
- Heartbeat mechanism for connection health
- Automatic cleanup of stale connections

## Testing

Run the test suite:
```bash
bun test server/src/websocket/test.ts
```

## Security Considerations

- Message validation and sanitization
- User authentication verification
- Room access control
- Rate limiting considerations (to be implemented)

## Future Enhancements

- Message history loading
- File upload support
- Group video calls
- Message search
- Advanced presence features (away, busy, etc.)
- Message threading
- User mentions and notifications