import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
} from 'react';
import { WebRTCService, WebRTCConnection } from '../services/webrtc';
import { WebRTCSignal, WSMessage } from '../types';
import { useWebSocket } from './WebSocketContext';

interface WebRTCContextType {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  connections: Map<string, WebRTCConnection>;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isInCall: boolean;
  connectionStates: Map<string, RTCPeerConnectionState>;
  initializeCall: (userId: string) => Promise<void>;
  acceptCall: (userId: string) => Promise<void>;
  endCall: (userId?: string) => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isConnected, send, addMessageHandler, removeMessageHandler } = useWebSocket();
  const webRTCService = useRef<WebRTCService | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );
  const [connections, setConnections] = useState<Map<string, WebRTCConnection>>(
    new Map()
  );
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [connectionStates, setConnectionStates] = useState<
    Map<string, RTCPeerConnectionState>
  >(new Map());

  // Initialize WebRTC service
  useEffect(() => {
    if (!webRTCService.current) {
      webRTCService.current = new WebRTCService();
      
      // Set up stream handler
      webRTCService.current.addStreamHandler((stream: MediaStream, userId: string) => {
        setRemoteStreams(prev => new Map(prev).set(userId, stream));
      });
      
      // Set up connection state handler
      webRTCService.current.addConnectionStateHandler((state: RTCPeerConnectionState) => {
        setConnectionStates(prev => new Map(prev).set('current', state));
      });
    }
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const handleWebRTCMessage = (message: WSMessage) => {
      if (message.type !== "webrtc") return;

      const { payload } = message;
      const { type, from_user_id, data } = payload;

      if (!webRTCService.current) return;

      switch (type) {
        case "offer":
          webRTCService.current.handleOffer(from_user_id, data);
          break;
        case "answer":
          webRTCService.current.handleAnswer(from_user_id, data);
          break;
        case "ice_candidate":
          webRTCService.current.handleIceCandidate(from_user_id, data);
          break;
      }
    };

    const handleIncomingCall = (message: WSMessage) => {
      if (message.type !== "incoming_call") return;
      // TODO: Show incoming call UI
      console.log('Incoming call from:', message.payload.from_username);
    };

    const handleCallActive = (message: WSMessage) => {
      if (message.type !== "call_active") return;
      setIsInCall(true);
    };

    const handleCallEnded = (message: WSMessage) => {
      if (message.type !== "call_ended") return;
      endCall();
    };

    addMessageHandler(handleWebRTCMessage);
    addMessageHandler(handleIncomingCall);
    addMessageHandler(handleCallActive);
    addMessageHandler(handleCallEnded);

    return () => {
      removeMessageHandler(handleWebRTCMessage);
      removeMessageHandler(handleIncomingCall);
      removeMessageHandler(handleCallActive);
      removeMessageHandler(handleCallEnded);
    };
  }, [isConnected, addMessageHandler, removeMessageHandler]);

  const initializeCall = async (userId: string) => {
    if (!webRTCService.current) return;

    try {
      // Initialize local stream
      const stream = await webRTCService.current.initializeLocalStream(
        true,
        true
      );
      setLocalStream(stream);

      // Create connection
      const connection = await webRTCService.current.createConnection(userId);
      setConnections((prev) => new Map(prev).set(userId, connection));

      // Create offer
      const offer = await webRTCService.current.createOffer(userId);

      // TODO: Send offer through WebSocket
      console.log('Sending offer to', userId, offer);
      send({
        type: 'webrtc',
        payload: {
          type: 'offer',
          to_user_id: userId,
          data: offer,
        },
      });

      setIsInCall(true);
    } catch (error) {
      console.error('Failed to initialize call:', error);
    }
  };

  const acceptCall = async (userId: string) => {
    if (!webRTCService.current) return;

    try {
      // Initialize local stream
      const stream = await webRTCService.current.initializeLocalStream(
        true,
        true
      );
      setLocalStream(stream);

      // Create connection
      const connection = await webRTCService.current.createConnection(userId);
      setConnections((prev) => new Map(prev).set(userId, connection));

      // TODO: Handle incoming offer and create answer
      const answer = await webRTCService.current.createAnswer(userId);
      send({
        type: 'webrtc',
        payload: {
          type: 'answer',
          to_user_id: userId,
          data: answer,
        },
      });

      setIsInCall(true);
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const endCall = (userId?: string) => {
    if (!webRTCService.current) return;

    if (userId) {
      webRTCService.current.closeConnection(userId);
      setConnections((prev) => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    } else {
      webRTCService.current.closeAllConnections();
      webRTCService.current.stopLocalStream();
      setConnections(new Map());
      setRemoteStreams(new Map());
      setLocalStream(null);
      setIsInCall(false);
    }
  };

  const toggleVideo = () => {
    if (webRTCService.current) {
      webRTCService.current.toggleVideo();
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (webRTCService.current) {
      webRTCService.current.toggleAudio();
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const startScreenShare = async () => {
    if (!webRTCService.current) return;

    try {
      const screenStream = await webRTCService.current.initializeScreenShare();
      setLocalStream(screenStream);

      // TODO: Update existing connections with screen share
      connections.forEach(async (connection, userId) => {
        const offer = await webRTCService.current.createOffer(userId);
        send({
          type: "webrtc",
          payload: {
            type: "offer",
            to_user_id: userId,
            data: offer
          }
        })
      })
      
  const stopScreenShare = () => {
    if (!webRTCService.current) return;

    // Stop screen share and return to camera
    webRTCService.current.stopLocalStream();
    webRTCService.current.initializeLocalStream(true, true).then((stream) => {
      setLocalStream(stream);
    });
  };

  return (
    <WebRTCContext.Provider
      value={{
        localStream,
        remoteStreams,
        connections,
        isVideoEnabled,
        isAudioEnabled,
        isInCall,
        connectionStates,
        initializeCall,
        acceptCall,
        endCall,
        toggleVideo,
        toggleAudio,
        startScreenShare,
        stopScreenShare,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};
