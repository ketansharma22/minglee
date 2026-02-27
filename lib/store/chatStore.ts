// lib/store/chatStore.ts
import { create } from 'zustand';
import type { Message, UserStatus, ConnectionStatus, Theme } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface ChatState {
  // Status
  userStatus: UserStatus;
  connectionStatus: ConnectionStatus;
  theme: Theme;

  // Room
  roomId: string | null;
  isInitiator: boolean;

  // Messages
  messages: Message[];
  isTyping: boolean;

  // Stats
  onlineCount: number;
  waitingCount: number;
  chattingCount: number;

  // Interests
  interests: string[];

  // Actions
  setUserStatus: (status: UserStatus) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setTheme: (theme: Theme) => void;
  setRoom: (roomId: string | null, isInitiator?: boolean) => void;
  addMessage: (msg: Omit<Message, 'id'>) => void;
  addSystemMessage: (content: string) => void;
  clearMessages: () => void;
  setTyping: (isTyping: boolean) => void;
  setStats: (stats: { online: number; waiting: number; chatting: number }) => void;
  setInterests: (interests: string[]) => void;
  reset: () => void;
}

const initialState = {
  userStatus: 'idle' as UserStatus,
  connectionStatus: 'idle' as ConnectionStatus,
  theme: 'dark' as Theme,
  roomId: null,
  isInitiator: false,
  messages: [],
  isTyping: false,
  onlineCount: 0,
  waitingCount: 0,
  chattingCount: 0,
  interests: [],
};

export const useChatStore = create<ChatState>((set) => ({
  ...initialState,

  setUserStatus: (userStatus) => set({ userStatus }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setTheme: (theme) => set({ theme }),

  setRoom: (roomId, isInitiator = false) =>
    set({ roomId, isInitiator }),

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: uuidv4() },
      ],
    })),

  addSystemMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: uuidv4(),
          type: 'system',
          content,
          sender: 'system',
          timestamp: Date.now(),
        },
      ],
    })),

  clearMessages: () => set({ messages: [] }),

  setTyping: (isTyping) => set({ isTyping }),

  setStats: ({ online, waiting, chatting }) =>
    set({ onlineCount: online, waitingCount: waiting, chattingCount: chatting }),

  setInterests: (interests) => set({ interests }),

  reset: () => set({
    ...initialState,
    theme: (useChatStore.getState() as ChatState).theme, // persist theme
    interests: (useChatStore.getState() as ChatState).interests, // persist interests
  }),
}));
