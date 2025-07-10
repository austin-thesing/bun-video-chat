import { ServerWebSocket } from "bun";
import { WSMessage, WebRTCMessage } from "../../types.ts";
import { WebSocketData, connectionManager } from "../connectionManager.ts";

interface CallSession {
  caller_id: string;
  callee_id: string;
  room_id?: number;
  started_at: number;
  status: "pending" | "active" | "ended";
}

// Track active call sessions
const callSessions = new Map<string, CallSession>();

export function handleWebRTCMessage(
  ws: ServerWebSocket<WebSocketData>,
  message: WebRTCMessage
) {
  const userData = connectionManager.getConnectionData(ws);
  if (!userData || !userData.user_id) {
    ws.send(JSON.stringify({
      type: "error",
      payload: { message: "Authentication required" },
      timestamp: Date.now(),
    }));
    return;
  }

  // Validate the sender
  if (userData.user_id !== message.from_user_id) {
    ws.send(JSON.stringify({
      type: "error",
      payload: { message: "Invalid sender" },
      timestamp: Date.now(),
    }));
    return;
  }

  // Find the target user's connection
  const targetConnection = connectionManager.getUserConnection(message.to_user_id);
  if (!targetConnection) {
    ws.send(JSON.stringify({
      type: "webrtc_error",
      payload: {
        error: "User not available",
        to_user_id: message.to_user_id,
      },
      timestamp: Date.now(),
    }));
    return;
  }

  // Handle different WebRTC message types
  switch (message.type) {
    case "offer":
      handleCallOffer(ws, message, userData);
      break;
    case "answer":
      handleCallAnswer(ws, message, userData);
      break;
    case "ice_candidate":
      handleIceCandidate(ws, message);
      break;
  }

  // Forward the WebRTC message to the target user
  const forwardMessage: WSMessage = {
    type: "webrtc",
    payload: message,
    timestamp: Date.now(),
  };

  targetConnection.send(JSON.stringify(forwardMessage));
}

function handleCallOffer(
  ws: ServerWebSocket<WebSocketData>,
  message: WebRTCMessage,
  userData: WebSocketData
) {
  const sessionKey = getSessionKey(message.from_user_id, message.to_user_id);
  
  // Create new call session
  const session: CallSession = {
    caller_id: message.from_user_id,
    callee_id: message.to_user_id,
    room_id: userData.room_id,
    started_at: Date.now(),
    status: "pending",
  };
  
  callSessions.set(sessionKey, session);

  // Send call notification
  const targetConnection = connectionManager.getUserConnection(message.to_user_id);
  if (targetConnection) {
    targetConnection.send(JSON.stringify({
      type: "incoming_call",
      payload: {
        from_user_id: message.from_user_id,
        from_username: userData.username || "Unknown",
      },
      timestamp: Date.now(),
    }));
  }
}

function handleCallAnswer(
  ws: ServerWebSocket<WebSocketData>,
  message: WebRTCMessage,
  userData: WebSocketData
) {
  const sessionKey = getSessionKey(message.to_user_id, message.from_user_id);
  const session = callSessions.get(sessionKey);
  
  if (session) {
    session.status = "active";
    
    // Notify both users that call is active
    const callActiveMessage: WSMessage = {
      type: "call_active",
      payload: {
        caller_id: session.caller_id,
        callee_id: session.callee_id,
      },
      timestamp: Date.now(),
    };

    // Send to both participants
    const callerConnection = connectionManager.getUserConnection(session.caller_id);
    const calleeConnection = connectionManager.getUserConnection(session.callee_id);
    
    if (callerConnection) callerConnection.send(JSON.stringify(callActiveMessage));
    if (calleeConnection) calleeConnection.send(JSON.stringify(callActiveMessage));
  }
}

function handleIceCandidate(
  ws: ServerWebSocket<WebSocketData>,
  message: WebRTCMessage
) {
  // ICE candidates are just forwarded, no special handling needed
  // The forwarding is already handled in the main function
}

export function handleCallEnd(
  ws: ServerWebSocket<WebSocketData>,
  payload: { user_id: string }
) {
  const userData = connectionManager.getConnectionData(ws);
  if (!userData || !userData.user_id) return;

  // Find and end any active call sessions for this user
  for (const [key, session] of callSessions.entries()) {
    if (session.caller_id === userData.user_id || session.callee_id === userData.user_id) {
      session.status = "ended";
      
      // Notify the other participant
      const otherUserId = session.caller_id === userData.user_id 
        ? session.callee_id 
        : session.caller_id;
      
      const otherConnection = connectionManager.getUserConnection(otherUserId);
      if (otherConnection) {
        otherConnection.send(JSON.stringify({
          type: "call_ended",
          payload: {
            ended_by: userData.user_id,
            reason: "User ended call",
          },
          timestamp: Date.now(),
        }));
      }
      
      // Remove the session
      callSessions.delete(key);
    }
  }
}

export function handleCallReject(
  ws: ServerWebSocket<WebSocketData>,
  payload: { caller_id: string }
) {
  const userData = connectionManager.getConnectionData(ws);
  if (!userData || !userData.user_id) return;

  const sessionKey = getSessionKey(payload.caller_id, userData.user_id);
  const session = callSessions.get(sessionKey);
  
  if (session && session.status === "pending") {
    // Notify the caller
    const callerConnection = connectionManager.getUserConnection(payload.caller_id);
    if (callerConnection) {
      callerConnection.send(JSON.stringify({
        type: "call_rejected",
        payload: {
          rejected_by: userData.user_id,
          username: userData.username || "Unknown",
        },
        timestamp: Date.now(),
      }));
    }
    
    // Remove the session
    callSessions.delete(sessionKey);
  }
}

export function clearUserCalls(userId: string) {
  // Clear any active calls when user disconnects
  for (const [key, session] of callSessions.entries()) {
    if (session.caller_id === userId || session.callee_id === userId) {
      const otherUserId = session.caller_id === userId 
        ? session.callee_id 
        : session.caller_id;
      
      const otherConnection = connectionManager.getUserConnection(otherUserId);
      if (otherConnection) {
        otherConnection.send(JSON.stringify({
          type: "call_ended",
          payload: {
            ended_by: userId,
            reason: "User disconnected",
          },
          timestamp: Date.now(),
        }));
      }
      
      callSessions.delete(key);
    }
  }
}

function getSessionKey(userId1: string, userId2: string): string {
  // Create a consistent key regardless of order
  return [userId1, userId2].sort().join(":");
}

export function getActiveCallsCount(): number {
  return Array.from(callSessions.values()).filter(s => s.status === "active").length;
}

export function getUserActiveCall(userId: string): CallSession | undefined {
  for (const session of callSessions.values()) {
    if ((session.caller_id === userId || session.callee_id === userId) && 
        session.status === "active") {
      return session;
    }
  }
  return undefined;
}