# WebSocket Implementation Example

This document shows how to use the WebSocket functionality in the video chat application.

## Server Implementation

The WebSocket server is implemented using Bun's native WebSocket support and includes:

### Features Implemented:

1. **Connection Management**
   - Connection tracking and cleanup
   - User-to-connection mapping
   - Room-based connection grouping

2. **Chat Functionality**
   - Real-time message broadcasting
   - Message persistence
   - Message editing/deletion
   - Message reactions

3. **Typing Indicators**
   - Real-time typing status
   - Automatic timeout (3 seconds)
   - Spam prevention

4. **Presence Tracking**
   - Online/offline status
   - Room join/leave notifications
   - User lists

5. **WebRTC Signaling**
   - Offer/answer exchange
   - ICE candidate relay
   - Call session management

## Client Usage Example

```typescript
import { wsService } from './services/websocket';

// Connect to WebSocket server
await wsService.connect();

// Set up event listeners
wsService.on('chat', (message) => {
  console.log('New chat message:', message.payload);
});

wsService.on('typing', (message) => {
  console.log('Typing indicator:', message.payload);
});

wsService.on('presence', (message) => {
  console.log('User presence update:', message.payload);
});

wsService.on('webrtc', (message) => {
  console.log('WebRTC signaling:', message.payload);
});

// Set user presence
wsService.setPresence('user123', 'john_doe', 'online');

// Join a room
wsService.joinRoom(1);

// Send a chat message
wsService.sendChatMessage(1, 'user123', 'Hello everyone!');

// Send typing indicator
wsService.sendTypingIndicator(1, 'user123', 'john_doe', true);

// WebRTC call example
const offer = await peerConnection.createOffer();
wsService.sendWebRTCOffer('user123', 'user456', offer);
```

## Testing the Implementation

Run the test suite:
```bash
bun test server/src/websocket/websocket.test.ts
```

Start the server:
```bash
bun server/index.ts
```

## File Structure

```
server/src/websocket/
├── index.ts              # Main WebSocket handler
├── connectionManager.ts  # Connection management
├── utils.ts             # Utility functions
├── websocket.test.ts    # Test suite
├── README.md           # Documentation
└── handlers/
    ├── chatHandler.ts      # Chat message handling
    ├── typingHandler.ts    # Typing indicator handling
    ├── presenceHandler.ts  # Presence and room management
    └── webrtcHandler.ts    # WebRTC signaling
```

## Key Features

### Message Types Supported:
- `chat` - Chat messages
- `typing` - Typing indicators
- `presence` - User presence updates
- `webrtc` - WebRTC signaling
- `join_room` / `leave_room` - Room management
- `message_edit` / `message_delete` - Message management
- `call_end` / `call_reject` - Call management

### Broadcasting:
- Room-based message broadcasting
- User-specific message delivery
- Global announcements
- Efficient connection lookup

### Error Handling:
- Message validation
- Connection state checking
- Graceful error responses
- Automatic reconnection (client-side)

### Performance:
- Efficient connection management
- Optimized message broadcasting
- Heartbeat mechanism
- Connection cleanup

This implementation provides a solid foundation for real-time chat and video calling functionality using Bun's native WebSocket support.