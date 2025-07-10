export interface Message {
  id: number;
  room_id: number;
  user_id: string;
  username: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: number;
  edited_at?: number;
  deleted_at?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  status: 'online' | 'offline';
  avatar_url?: string;
}

export interface Room {
  id: number;
  name: string;
  type: 'direct' | 'group';
  created_by: string;
  created_at: number;
  members?: User[];
  last_message?: Message;
  unread_count?: number;
}

export interface WSMessage {
  type:
    | 'chat'
    | 'typing'
    | 'presence'
    | 'webrtc'
    | 'room_update'
    | 'error'
    | 'incoming_call'
    | 'call_active'
    | 'call_ended'
    | 'call_rejected'
    | 'call_end'
    | 'ping'
    | 'pong';
  payload: any;
  timestamp: number;
}

export interface TypingStatus {
  room_id: number;
  user_id: string;
  username: string;
  is_typing: boolean;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-start' | 'call-end';
  from: string;
  to: string;
  room_id: number;
  data?: any;
}
