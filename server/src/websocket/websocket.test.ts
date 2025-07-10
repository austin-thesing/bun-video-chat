import { test, expect } from "bun:test";
import { connectionManager } from "./connectionManager.ts";
import { broadcast } from "./utils.ts";

// Mock WebSocket for testing
class MockWebSocket {
  private messages: string[] = [];
  
  send(message: string) {
    this.messages.push(message);
  }
  
  getMessages() {
    return this.messages;
  }
  
  clearMessages() {
    this.messages = [];
  }
}

test("ConnectionManager - add and remove connections", () => {
  const mockWs = new MockWebSocket() as any;
  
  // Add connection
  connectionManager.addConnection(mockWs, {
    user_id: "user1",
    username: "testuser",
  });
  
  expect(connectionManager.getTotalConnections()).toBe(1);
  
  // Get connection data
  const data = connectionManager.getConnectionData(mockWs);
  expect(data?.user_id).toBe("user1");
  expect(data?.username).toBe("testuser");
  
  // Remove connection
  connectionManager.removeConnection(mockWs);
  expect(connectionManager.getTotalConnections()).toBe(0);
});

test("ConnectionManager - room management", () => {
  const mockWs1 = new MockWebSocket() as any;
  const mockWs2 = new MockWebSocket() as any;
  
  // Add connections
  connectionManager.addConnection(mockWs1, {
    user_id: "user1",
    username: "user1",
  });
  
  connectionManager.addConnection(mockWs2, {
    user_id: "user2", 
    username: "user2",
  });
  
  // Join room
  connectionManager.joinRoom(mockWs1, 1);
  connectionManager.joinRoom(mockWs2, 1);
  
  expect(connectionManager.getRoomConnectionCount(1)).toBe(2);
  
  // Get room users
  const users = connectionManager.getRoomUserList(1);
  expect(users).toHaveLength(2);
  expect(users.find(u => u.user_id === "user1")).toBeTruthy();
  expect(users.find(u => u.user_id === "user2")).toBeTruthy();
  
  // Leave room
  connectionManager.leaveRoom(mockWs1);
  expect(connectionManager.getRoomConnectionCount(1)).toBe(1);
  
  // Cleanup
  connectionManager.removeConnection(mockWs1);
  connectionManager.removeConnection(mockWs2);
});

test("ConnectionManager - user connection mapping", () => {
  const mockWs = new MockWebSocket() as any;
  
  connectionManager.addConnection(mockWs, {
    user_id: "user1",
    username: "testuser",
  });
  
  // Should be able to find user connection
  const userConnection = connectionManager.getUserConnection("user1");
  expect(userConnection).toBe(mockWs);
  
  // Should return undefined for non-existent user
  const noConnection = connectionManager.getUserConnection("nonexistent");
  expect(noConnection).toBeUndefined();
  
  // Cleanup
  connectionManager.removeConnection(mockWs);
});

test("Broadcast utilities", () => {
  const mockWs1 = new MockWebSocket() as any;
  const mockWs2 = new MockWebSocket() as any;
  
  // Setup connections in room
  connectionManager.addConnection(mockWs1, {
    user_id: "user1",
    username: "user1",
  });
  
  connectionManager.addConnection(mockWs2, {
    user_id: "user2",
    username: "user2", 
  });
  
  connectionManager.joinRoom(mockWs1, 1);
  connectionManager.joinRoom(mockWs2, 1);
  
  // Test room broadcast
  const message = {
    type: "chat" as const,
    payload: { content: "test message" },
    timestamp: Date.now(),
  };
  
  broadcast.toRoom(1, message);
  
  expect(mockWs1.getMessages()).toHaveLength(1);
  expect(mockWs2.getMessages()).toHaveLength(1);
  
  // Test user-specific broadcast
  mockWs1.clearMessages();
  mockWs2.clearMessages();
  
  broadcast.toUser("user1", message);
  
  expect(mockWs1.getMessages()).toHaveLength(1);
  expect(mockWs2.getMessages()).toHaveLength(0);
  
  // Cleanup
  connectionManager.removeConnection(mockWs1);
  connectionManager.removeConnection(mockWs2);
});

test("Message validation", () => {
  const { validateMessage } = require("./utils.ts");
  
  // Valid message
  expect(validateMessage({
    type: "chat",
    payload: { content: "test" },
    timestamp: Date.now(),
  })).toBe(true);
  
  // Invalid messages
  expect(validateMessage(null)).toBe(false);
  expect(validateMessage({})).toBe(false);
  expect(validateMessage({ type: "chat" })).toBe(false);
  expect(validateMessage({ payload: {} })).toBe(false);
  expect(validateMessage({ type: 123, payload: {} })).toBe(false);
});