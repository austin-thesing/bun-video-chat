import { WebRTCSignal } from "../types";

export interface WebRTCConnection {
  peer: RTCPeerConnection;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export type SignalHandler = (signal: WebRTCSignal) => void;
export type StreamHandler = (stream: MediaStream, userId: string) => void;
export type ConnectionStateHandler = (state: RTCPeerConnectionState) => void;

export class WebRTCService {
  private connections: Map<string, WebRTCConnection> = new Map();
  private localStream: MediaStream | null = null;
  private signalHandlers: Set<SignalHandler> = new Set();
  private streamHandlers: Set<StreamHandler> = new Set();
  private connectionStateHandlers: Set<ConnectionStateHandler> = new Set();

  private stunServers = [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302",
    "stun:stun2.l.google.com:19302",
  ];

  async initializeLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio,
      });
      return this.localStream;
    } catch (error) {
      console.error("Failed to get user media:", error);
      throw error;
    }
  }

  async initializeScreenShare(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      return stream;
    } catch (error) {
      console.error("Failed to get screen share:", error);
      throw error;
    }
  }

  async createConnection(userId: string): Promise<WebRTCConnection> {
    const peerConnection = new RTCPeerConnection({
      iceServers: this.stunServers.map((url) => ({ urls: url })),
    });

    const connection: WebRTCConnection = {
      peer: peerConnection,
      localStream: this.localStream,
      remoteStream: null,
      isVideoEnabled: true,
      isAudioEnabled: true,
    };

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      connection.remoteStream = event.streams[0];
      this.notifyStreamHandlers(event.streams[0], userId);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.notifySignalHandlers({
          type: "ice-candidate",
          from: "local",
          to: userId,
          room_id: 0, // TODO: Pass actual room ID
          data: event.candidate,
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      this.notifyConnectionStateHandlers(peerConnection.connectionState);
    };

    this.connections.set(userId, connection);
    return connection;
  }

  async createOffer(userId: string): Promise<RTCSessionDescriptionInit> {
    const connection = this.connections.get(userId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    const offer = await connection.peer.createOffer();
    await connection.peer.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(userId: string): Promise<RTCSessionDescriptionInit> {
    const connection = this.connections.get(userId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    const answer = await connection.peer.createAnswer();
    await connection.peer.setLocalDescription(answer);
    return answer;
  }

  async handleOffer(userId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    let connection = this.connections.get(userId);
    if (!connection) {
      connection = await this.createConnection(userId);
    }

    await connection.peer.setRemoteDescription(new RTCSessionDescription(offer));
  }

  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const connection = this.connections.get(userId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    await connection.peer.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(userId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const connection = this.connections.get(userId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    await connection.peer.addIceCandidate(new RTCIceCandidate(candidate));
  }

  toggleVideo(userId?: string): void {
    if (userId) {
      const connection = this.connections.get(userId);
      if (connection?.localStream) {
        const videoTrack = connection.localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !videoTrack.enabled;
          connection.isVideoEnabled = videoTrack.enabled;
        }
      }
    } else if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        // Update all connections
        this.connections.forEach((connection) => {
          connection.isVideoEnabled = videoTrack.enabled;
        });
      }
    }
  }

  toggleAudio(userId?: string): void {
    if (userId) {
      const connection = this.connections.get(userId);
      if (connection?.localStream) {
        const audioTrack = connection.localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
          connection.isAudioEnabled = audioTrack.enabled;
        }
      }
    } else if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        // Update all connections
        this.connections.forEach((connection) => {
          connection.isAudioEnabled = audioTrack.enabled;
        });
      }
    }
  }

  closeConnection(userId: string): void {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.peer.close();
      this.connections.delete(userId);
    }
  }

  closeAllConnections(): void {
    this.connections.forEach((connection, userId) => {
      connection.peer.close();
    });
    this.connections.clear();
  }

  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  addSignalHandler(handler: SignalHandler): void {
    this.signalHandlers.add(handler);
  }

  removeSignalHandler(handler: SignalHandler): void {
    this.signalHandlers.delete(handler);
  }

  addStreamHandler(handler: StreamHandler): void {
    this.streamHandlers.add(handler);
  }

  removeStreamHandler(handler: StreamHandler): void {
    this.streamHandlers.delete(handler);
  }

  addConnectionStateHandler(handler: ConnectionStateHandler): void {
    this.connectionStateHandlers.add(handler);
  }

  removeConnectionStateHandler(handler: ConnectionStateHandler): void {
    this.connectionStateHandlers.delete(handler);
  }

  private notifySignalHandlers(signal: WebRTCSignal): void {
    this.signalHandlers.forEach((handler) => handler(signal));
  }

  private notifyStreamHandlers(stream: MediaStream, userId: string): void {
    this.streamHandlers.forEach((handler) => handler(stream, userId));
  }

  private notifyConnectionStateHandlers(state: RTCPeerConnectionState): void {
    this.connectionStateHandlers.forEach((handler) => handler(state));
  }

  getConnection(userId: string): WebRTCConnection | undefined {
    return this.connections.get(userId);
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getAllConnections(): Map<string, WebRTCConnection> {
    return this.connections;
  }
}