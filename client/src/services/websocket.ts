import { WSMessage } from "../../../server/src/types";

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: WSMessage) {
    console.log('Received message:', message);
    
    // Handle pings
    if (message.type === 'ping') {
      this.send({
        type: 'pong',
        payload: {},
        timestamp: Date.now(),
      });
      return;
    }
    
    // Emit to listeners
    const listeners = this.listeners.get(message.type) || [];
    listeners.forEach(listener => listener(message));
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  send(message: WSMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  on(eventType: string, listener: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);
  }

  off(eventType: string, listener: Function) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Chat methods
  sendChatMessage(roomId: number, userId: string, content: string, type: 'text' | 'image' | 'file' = 'text') {
    this.send({
      type: 'chat',
      payload: {
        room_id: roomId,
        user_id: userId,
        content: content,
        type: type,
      },
      timestamp: Date.now(),
    });
  }

  sendTypingIndicator(roomId: number, userId: string, username: string, isTyping: boolean) {
    this.send({
      type: 'typing',
      payload: {
        room_id: roomId,
        user_id: userId,
        username: username,
        is_typing: isTyping,
      },
      timestamp: Date.now(),
    });
  }

  setPresence(userId: string, username: string, status: 'online' | 'offline') {
    this.send({
      type: 'presence',
      payload: {
        user_id: userId,
        username: username,
        status: status,
      },
      timestamp: Date.now(),
    });
  }

  joinRoom(roomId: number) {
    this.send({
      type: 'join_room',
      payload: {
        room_id: roomId,
      },
      timestamp: Date.now(),
    });
  }

  leaveRoom() {
    this.send({
      type: 'leave_room',
      payload: {},
      timestamp: Date.now(),
    });
  }

  // WebRTC methods
  sendWebRTCOffer(fromUserId: string, toUserId: string, offer: RTCSessionDescriptionInit) {
    this.send({
      type: 'webrtc',
      payload: {
        type: 'offer',
        from_user_id: fromUserId,
        to_user_id: toUserId,
        data: offer,
      },
      timestamp: Date.now(),
    });
  }

  sendWebRTCAnswer(fromUserId: string, toUserId: string, answer: RTCSessionDescriptionInit) {
    this.send({
      type: 'webrtc',
      payload: {
        type: 'answer',
        from_user_id: fromUserId,
        to_user_id: toUserId,
        data: answer,
      },
      timestamp: Date.now(),
    });
  }

  sendWebRTCIceCandidate(fromUserId: string, toUserId: string, candidate: RTCIceCandidateInit) {
    this.send({
      type: 'webrtc',
      payload: {
        type: 'ice_candidate',
        from_user_id: fromUserId,
        to_user_id: toUserId,
        data: candidate,
      },
      timestamp: Date.now(),
    });
  }

  endCall(userId: string) {
    this.send({
      type: 'call_end',
      payload: {
        user_id: userId,
      },
      timestamp: Date.now(),
    });
  }

  rejectCall(callerId: string) {
    this.send({
      type: 'call_reject',
      payload: {
        caller_id: callerId,
      },
      timestamp: Date.now(),
    });
  }
}

// Singleton instance
export const wsService = new WebSocketService('ws://localhost:3000/ws');