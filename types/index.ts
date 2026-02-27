// types/index.ts

export type UserStatus = 'idle' | 'waiting' | 'connected' | 'disconnected';
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed' | 'reconnecting';
export type MessageType = 'text' | 'system' | 'error';
export type Theme = 'dark' | 'light';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  sender: 'me' | 'stranger' | 'system';
  timestamp: number;
  status?: 'sending' | 'sent' | 'delivered';
}

export interface User {
  id: string;
  interests?: string[];
  joinedAt: number;
}

export interface Room {
  id: string;
  users: [string, string];
  createdAt: number;
}

// Socket event payloads
export interface MatchFoundPayload {
  roomId: string;
  peerId: string;
  isInitiator: boolean;
}

export interface MessagePayload {
  roomId: string;
  content: string;
  messageId: string;
  timestamp: number;
}

export interface TypingPayload {
  roomId: string;
  isTyping: boolean;
}

export interface SignalPayload {
  roomId: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export interface DisconnectPayload {
  roomId: string;
  reason?: string;
}

export interface QueuePayload {
  interests?: string[];
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export interface StatsPayload {
  online: number;
  waiting: number;
  chatting: number;
}

// Socket events (client → server)
export interface ClientToServerEvents {
  'queue:join': (payload: QueuePayload) => void;
  'queue:leave': () => void;
  'message:send': (payload: MessagePayload) => void;
  'typing:start': (payload: { roomId: string }) => void;
  'typing:stop': (payload: { roomId: string }) => void;
  'signal:send': (payload: SignalPayload) => void;
  'chat:next': () => void;
  'chat:disconnect': (payload: { roomId: string }) => void;
}

// Socket events (server → client)
export interface ServerToClientEvents {
  'queue:waiting': (payload: { position: number }) => void;
  'match:found': (payload: MatchFoundPayload) => void;
  'message:receive': (payload: MessagePayload) => void;
  'typing:update': (payload: TypingPayload) => void;
  'signal:receive': (payload: SignalPayload) => void;
  'chat:stranger_disconnected': (payload: DisconnectPayload) => void;
  'error': (payload: ErrorPayload) => void;
  'stats:update': (payload: StatsPayload) => void;
}

// Matchmaking server types
export interface QueuedUser {
  socketId: string;
  userId: string;
  interests: string[];
  joinedAt: number;
  previousPartners: Set<string>;
}

export interface ActiveRoom {
  id: string;
  users: [string, string]; // socket IDs
  createdAt: number;
}

export interface ServerStats {
  online: number;
  waiting: number;
  chatting: number;
}
