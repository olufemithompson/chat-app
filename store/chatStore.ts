import { create } from "zustand";

export interface ChatUser {
  id: string;
  name: string | null;
  image: string | null;
  isOnline: boolean;
  lastSeen?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string | null;
  type: "TEXT" | "IMAGE" | "DOCUMENT" | "LINK";
  createdAt: string;
  readBy: string[];
  sender: Pick<ChatUser, "id" | "name" | "image">;
  uploads?: ChatUpload[];
}

export interface ChatUpload {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadType: "IMAGE" | "DOCUMENT" | "LINK";
  linkUrl?: string | null;
}

export interface ChatConversation {
  id: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  otherUser: ChatUser | null;
  lastMessageSenderId?: string | null;
  lastMessageReadByOther?: boolean;
}

interface ChatStore {
  // Active conversation
  activeConversationId: string | null;

  // Conversations list
  conversations: ChatConversation[];

  // Messages keyed by conversationId
  messages: Record<string, ChatMessage[]>;

  // Online user IDs (kept in sync via socket events)
  onlineUsers: Set<string>;

  // Typing indicators: conversationId → Set of userIds currently typing
  typingUsers: Record<string, Set<string>>;

  // Pending conversation to open (used by sidebar AI button)
  pendingOpen: { conversationId: string; contact: ChatUser } | null;
  setPendingOpen: (val: { conversationId: string; contact: ChatUser } | null) => void;

  // Actions
  setActiveConversation: (id: string | null) => void;
  setConversations: (conversations: ChatConversation[]) => void;
  updateConversation: (id: string, updates: Partial<ChatConversation>) => void;
  removeConversation: (id: string) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  clearMessages: (conversationId: string) => void;
  appendMessage: (message: ChatMessage) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  isTyping: (conversationId: string, userId: string) => boolean;
  markMessagesRead: (conversationId: string, readerUserId: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  activeConversationId: null,
  pendingOpen: null,
  setPendingOpen: (val) => set({ pendingOpen: val }),
  conversations: [],
  messages: {},
  onlineUsers: new Set(),
  typingUsers: {},

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setConversations: (conversations) => set({ conversations }),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
    })),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),

  clearMessages: (conversationId) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: [] },
      typingUsers: { ...state.typingUsers, [conversationId]: new Set() },
    })),

  appendMessage: (message) =>
    set((state) => {
      const existing = state.messages[message.conversationId] ?? [];
      // Avoid duplicates (socket + REST race condition)
      if (existing.some((m) => m.id === message.id)) return state;
      return {
        messages: {
          ...state.messages,
          [message.conversationId]: [...existing, message],
        },
      };
    }),

  setUserOnline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.add(userId);
      // Also update any conversation that has this user
      const conversations = state.conversations.map((c) =>
        c.otherUser?.id === userId
          ? { ...c, otherUser: { ...c.otherUser, isOnline: true } }
          : c
      );
      return { onlineUsers: next, conversations };
    }),

  setUserOffline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(userId);
      const conversations = state.conversations.map((c) =>
        c.otherUser?.id === userId
          ? { ...c, otherUser: { ...c.otherUser, isOnline: false } }
          : c
      );
      return { onlineUsers: next, conversations };
    }),

  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = new Set(state.typingUsers[conversationId] ?? []);
      if (isTyping) current.add(userId);
      else current.delete(userId);
      return {
        typingUsers: { ...state.typingUsers, [conversationId]: current },
      };
    }),

  isTyping: (conversationId, userId) => {
    return get().typingUsers[conversationId]?.has(userId) ?? false;
  },

  markMessagesRead: (conversationId, readerUserId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
          !m.readBy.includes(readerUserId)
            ? { ...m, readBy: [...m.readBy, readerUserId] }
            : m
        ),
      },
    })),
}));
