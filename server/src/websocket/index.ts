import { ServerWebSocket } from "bun";
import { WSMessage } from "../types.ts";
import { WebSocketData, connectionManager } from "./connectionManager.ts";
import { handleChatMessage, handleMessageEdit, handleMessageDelete, handleMessageReaction } from "./handlers/chatHandler.ts";
import { handleTypingMessage } from "./handlers/typingHandler.ts";
import { handlePresenceMessage, handleUserDisconnect, handleJoinRoom, handleLeaveRoom } from "./handlers/presenceHandler.ts";
import { handleWebRTCMessage, handleCallEnd, handleCallReject, clearUserCalls } from "./handlers/webrtcHandler.ts";
import { validateMessage, createErrorMessage, startHeartbeat } from "./utils.ts";

const isDev = process.env.NODE_ENV !== "production";

function wsLog(...args: any[]) {
  if (isDev) {
    console.log(`[WS ${new Date().toISOString()}]`, ...args);
  }
}

export const websocketHandler = {
  open(ws: ServerWebSocket<WebSocketData>) {
    wsLog("WebSocket connection opened");
    
    // Add connection to manager
    connectionManager.addConnection(ws);
    
    // Start heartbeat
    startHeartbeat(ws);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: "connected",
      payload: {
        message: "Connected to chat server",
        server_time: new Date().toISOString(),
      },
      timestamp: Date.now(),
    }));
    
    wsLog(`Total connections: ${connectionManager.getTotalConnections()}`);
  },

  message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
    try {
      const data = JSON.parse(message.toString());
      
      // Validate message format
      if (!validateMessage(data)) {
        ws.send(JSON.stringify(createErrorMessage("Invalid message format")));
        return;
      }
      
      // Update last activity
      connectionManager.updateConnection(ws, { last_activity: Date.now() });
      
      wsLog(`Received message type: ${data.type}`);
      
      // Handle different message types
      switch (data.type) {
        // Chat messages
        case "chat":
          handleChatMessage(ws, data.payload);
          break;
        case "message_edit":
          handleMessageEdit(ws, data.payload);
          break;
        case "message_delete":
          handleMessageDelete(ws, data.payload);
          break;
        case "message_reaction":
          handleMessageReaction(ws, data.payload);
          break;
          
        // Typing indicators
        case "typing":
          handleTypingMessage(ws, data.payload);
          break;
          
        // Presence and room management
        case "presence":
          handlePresenceMessage(ws, data.payload);
          break;
        case "join_room":
          handleJoinRoom(ws, data.payload);
          break;
        case "leave_room":
          handleLeaveRoom(ws);
          break;
          
        // WebRTC signaling
        case "webrtc":
          handleWebRTCMessage(ws, data.payload);
          break;
        case "call_end":
          handleCallEnd(ws, data.payload);
          break;
        case "call_reject":
          handleCallReject(ws, data.payload);
          break;
          
        // Heartbeat
        case "pong":
          // Client responded to ping, connection is alive
          break;
          
        default:
          wsLog("Unknown message type:", data.type);
          ws.send(JSON.stringify(createErrorMessage(`Unknown message type: ${data.type}`)));
      }
    } catch (error) {
      wsLog("Error parsing WebSocket message:", error);
      ws.send(JSON.stringify(createErrorMessage("Failed to process message")));
    }
  },

  close(ws: ServerWebSocket<WebSocketData>) {
    const userData = connectionManager.getConnectionData(ws);
    wsLog("WebSocket connection closing", userData);
    
    // Handle user disconnect
    if (userData?.user_id) {
      handleUserDisconnect(ws);
      clearUserCalls(userData.user_id);
    }
    
    // Remove connection
    connectionManager.removeConnection(ws);
    
    wsLog(`WebSocket connection closed. Total connections: ${connectionManager.getTotalConnections()}`);
  },

  error(ws: ServerWebSocket<WebSocketData>, error: Error) {
    wsLog("WebSocket error:", error);
    
    // Try to notify client
    try {
      ws.send(JSON.stringify(createErrorMessage("Server error occurred")));
    } catch (e) {
      // Connection might be broken
    }
  },
};

// Export additional utilities for external use
export { connectionManager } from "./connectionManager.ts";
export { broadcast } from "./utils.ts";