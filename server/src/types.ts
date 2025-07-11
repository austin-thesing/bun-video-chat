export interface WSMessage {
  type:
    | 'chat'
    | 'typing'
    | 'presence'
    | 'webrtc'
    | 'join_room'
    | 'leave_room'
    | 'message_edit'
    | 'message_delete'
    | 'message_reaction'
    | 'call_end'
    | 'call_reject'
    | 'ping'
    | 'pong'
    | 'connected'
    | 'error'
    | 'chat_sent'
    | 'message_edited'
    | 'message_deleted'
    | 'message_reaction'
    | 'user_joined'
    | 'user_left'
    | 'room_joined'
    | 'room_left'
    | 'online_users'
    | 'room_users'
    | 'room_update'
    | 'room_created'
    | 'incoming_call'
    | 'call_active'
    | 'call_ended'
    | 'call_rejected'
    | 'webrtc_error';
  payload: any;
  timestamp: number;
}

export interface ChatMessage {
  id?: number;
  room_id: number;
  user_id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_path?: string;
}

export interface TypingMessage {
  room_id: number;
  user_id: string;
  username: string;
  is_typing: boolean;
}

export interface PresenceMessage {
  user_id: string;
  username: string;
  status: 'online' | 'offline';
}

export interface WebRTCMessage {
  type: 'offer' | 'answer' | 'ice_candidate';
  from_user_id: string;
  to_user_id: string;
  data: any;
}
