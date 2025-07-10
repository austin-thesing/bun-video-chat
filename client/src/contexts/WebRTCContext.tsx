import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { WebRTCService, WebRTCConnection } from "../services/webrtc";
import { WebRTCSignal } from "../types";
import { useWebSocket } from "./WebSocketContext";

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
    throw new Error("useWebRTC must be used within a WebRTCProvider");
  }
  return context;
};

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useWebSocket();
  const webRTCService = useRef<WebRTCService | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [connections, setConnections] = useState<Map<string, WebRTCConnection>>(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [connectionStates, setConnectionStates] = useState<Map<string, RTCPeerConnectionState>>(new Map());

  useEffect(() => {
    if (!isConnected) return;

    webRTCService.current = new WebRTCService();

    const handleSignal = (signal: WebRTCSignal) => {
      // TODO: Send signal through WebSocket
      console.log("Sending WebRTC signal:", signal);
    };

    const handleStream = (stream: MediaStream, userId: string) => {
      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        newMap.set(userId, stream);
        return newMap;
      });
    };

    const handleConnectionState = (state: RTCPeerConnectionState) => {
      console.log("Connection state changed:", state);
      // TODO: Update connection state for specific user
    };

    webRTCService.current.addSignalHandler(handleSignal);
    webRTCService.current.addStreamHandler(handleStream);
    webRTCService.current.addConnectionStateHandler(handleConnectionState);

    return () => {
      webRTCService.current?.removeSignalHandler(handleSignal);
      webRTCService.current?.removeStreamHandler(handleStream);
      webRTCService.current?.removeConnectionStateHandler(handleConnectionState);
      webRTCService.current?.closeAllConnections();
      webRTCService.current?.stopLocalStream();
    };
  }, [isConnected]);

  const initializeCall = async (userId: string) => {
    if (!webRTCService.current) return;

    try {
      // Initialize local stream
      const stream = await webRTCService.current.initializeLocalStream(true, true);
      setLocalStream(stream);

      // Create connection
      const connection = await webRTCService.current.createConnection(userId);
      setConnections((prev) => new Map(prev).set(userId, connection));

      // Create offer
      const offer = await webRTCService.current.createOffer(userId);
      
      // TODO: Send offer through WebSocket
      console.log("Sending offer to", userId, offer);
      
      setIsInCall(true);
    } catch (error) {
      console.error("Failed to initialize call:", error);
    }
  };

  const acceptCall = async (userId: string) => {
    if (!webRTCService.current) return;

    try {
      // Initialize local stream
      const stream = await webRTCService.current.initializeLocalStream(true, true);
      setLocalStream(stream);

      // Create connection
      const connection = await webRTCService.current.createConnection(userId);
      setConnections((prev) => new Map(prev).set(userId, connection));

      // TODO: Handle incoming offer and create answer
      
      setIsInCall(true);
    } catch (error) {
      console.error("Failed to accept call:", error);
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
      
    } catch (error) {
      console.error("Failed to start screen share:", error);
    }
  };

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