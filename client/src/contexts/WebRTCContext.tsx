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
import { useAuth } from './AuthContext';

interface WebRTCContextType {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  connections: Map<string, WebRTCConnection>;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isInCall: boolean;
  connectionStates: Map<string, RTCPeerConnectionState>;
  showVideoPreview: boolean;
  previewTargetUser: string | null;
  initializeCall: (userId: string) => Promise<void>;
  acceptCall: (userId: string) => Promise<void>;
  endCall: (userId?: string) => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  showPreview: (userId: string) => void;
  hidePreview: () => void;
  startCallWithPreview: () => Promise<void>;
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
  const { isConnected, send, addMessageHandler, removeMessageHandler } =
    useWebSocket();
  const { user } = useAuth();
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
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [previewTargetUser, setPreviewTargetUser] = useState<string | null>(
    null
  );

  // Initialize WebRTC service
  useEffect(() => {
    if (!webRTCService.current) {
      webRTCService.current = new WebRTCService();

      // Set up stream handler
      webRTCService.current.addStreamHandler(
        (stream: MediaStream, userId: string) => {
          setRemoteStreams((prev) => new Map(prev).set(userId, stream));
        }
      );

      // Set up connection state handler
      webRTCService.current.addConnectionStateHandler(
        (state: RTCPeerConnectionState) => {
          setConnectionStates((prev) => new Map(prev).set('current', state));
        }
      );

      // Set up signal handler to send WebRTC messages
      webRTCService.current.addSignalHandler((signal: WebRTCSignal) => {
        if (!user) return;

        send({
          type: 'webrtc',
          payload: {
            type:
              signal.type === 'ice-candidate' ? 'ice_candidate' : signal.type,
            from_user_id: user.id,
            to_user_id: signal.to,
            data: signal.data,
          },
          timestamp: Date.now(),
        });
      });
    }
  }, [user, send]);

  useEffect(() => {
    if (!isConnected) return;

    const handleWebRTCMessage = (message: WSMessage) => {
      if (message.type !== 'webrtc') return;

      const { payload } = message;
      const { type, from_user_id, data } = payload;

      if (!webRTCService.current) return;

      switch (type) {
        case 'offer':
          webRTCService.current.handleOffer(from_user_id, data);
          break;
        case 'answer':
          webRTCService.current.handleAnswer(from_user_id, data);
          break;
        case 'ice_candidate':
          webRTCService.current.handleIceCandidate(from_user_id, data);
          break;
      }
    };

    const handleIncomingCall = (message: WSMessage) => {
      if (message.type !== 'incoming_call') return;
      // TODO: Show incoming call UI
      console.log('Incoming call from:', message.payload.from_username);
    };

    const handleCallActive = (message: WSMessage) => {
      if (message.type !== 'call_active') return;
      setIsInCall(true);
    };

    const handleCallEnded = (message: WSMessage) => {
      if (message.type !== 'call_ended') return;
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
    if (!webRTCService.current || !user) return;

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

      // Send offer through WebSocket
      send({
        type: 'webrtc',
        payload: {
          type: 'offer',
          from_user_id: user.id,
          to_user_id: userId,
          data: offer,
        },
        timestamp: Date.now(),
      });

      setIsInCall(true);
    } catch (error) {
      console.error('Failed to initialize call:', error);
    }
  };

  const acceptCall = async (userId: string) => {
    if (!webRTCService.current || !user) return;

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

      // Create answer
      const answer = await webRTCService.current.createAnswer(userId);
      send({
        type: 'webrtc',
        payload: {
          type: 'answer',
          from_user_id: user.id,
          to_user_id: userId,
          data: answer,
        },
        timestamp: Date.now(),
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

    // Send call end message
    if (user) {
      send({
        type: 'call_end',
        payload: {
          user_id: user.id,
          target_user_id: userId,
        },
        timestamp: Date.now(),
      });
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

      // Update existing connections with screen share
      connections.forEach(async (connection, userId) => {
        if (!webRTCService.current || !user) return;

        // Replace video track in existing connection
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = connection.peer
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      });
    } catch (error) {
      console.error('Failed to start screen share:', error);
    }
  };

  const stopScreenShare = async () => {
    if (!webRTCService.current) return;

    try {
      // Stop screen share and return to camera
      webRTCService.current.stopLocalStream();
      const stream = await webRTCService.current.initializeLocalStream(
        true,
        true
      );
      setLocalStream(stream);

      // Update existing connections with camera
      connections.forEach(async (connection, userId) => {
        if (!webRTCService.current || !user) return;

        // Replace video track in existing connection
        const videoTrack = stream.getVideoTracks()[0];
        const sender = connection.peer
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      });
    } catch (error) {
      console.error('Failed to stop screen share:', error);
    }
  };

  const showPreview = (userId: string) => {
    setPreviewTargetUser(userId);
    setShowVideoPreview(true);
  };

  const hidePreview = () => {
    setShowVideoPreview(false);
    setPreviewTargetUser(null);
  };

  const startCallWithPreview = async () => {
    if (previewTargetUser) {
      hidePreview();
      await initializeCall(previewTargetUser);
    }
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
        showVideoPreview,
        previewTargetUser,
        initializeCall,
        acceptCall,
        endCall,
        toggleVideo,
        toggleAudio,
        startScreenShare,
        stopScreenShare,
        showPreview,
        hidePreview,
        startCallWithPreview,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};
