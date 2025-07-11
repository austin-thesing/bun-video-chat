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
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_path?: string;
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
  created_at: string | number; // Can be ISO string from API or timestamp
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
    | 'room_created'
    | 'error'
    | 'incoming_call'
    | 'call_active'
    | 'call_ended'
    | 'call_rejected'
    | 'call_end'
    | 'join_room'
    | 'leave_room'
    | 'room_joined'
    | 'room_left'
    | 'user_joined'
    | 'user_left'
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
