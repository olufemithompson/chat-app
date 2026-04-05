"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { useChatStore } from "@/store/chatStore";
import type { ChatMessage } from "@/store/chatStore";
import { publicAppUrl } from "@/lib/env";

const SocketContext = createContext<Socket | null>(null);

export default function SocketProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  console.log(`[SocketProvider] render — status="${status}" userId="${session?.user?.id ?? "none"}"`);
  const [socket, setSocket] = useState<Socket | null>(null);
  const {
    setUserOnline,
    setUserOffline,
    appendMessage,
    updateConversation,
    setTyping,
    markMessagesRead,
  } = useChatStore();

  useEffect(() => {
    const userId = session?.user?.id;
    console.log(`[socket] useEffect fired — status="${status}" userId="${userId ?? "none"}"`);

    if (status === "loading") {
      console.log("[socket] session still loading, waiting...");
      return;
    }
    if (!userId) {
      console.log("[socket] no userId — not connecting (user not logged in)");
      setSocket(null);
      return;
    }

    console.log(`[socket] connecting to ${publicAppUrl} path=/api/socket with userId=${userId}`);

    const s = io(publicAppUrl, {
      path: "/api/socket",
      auth: { userId },
      reconnectionAttempts: 5,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    setSocket(s);

    s.on("connect", () => {
      console.log(`[socket] connected — socketId=${s.id}`);
    });

    s.on("connect_error", (err) => {
      console.error(`[socket] connect_error — ${err.message}`, err);
    });

    s.on("disconnect", (reason) => {
      console.warn(`[socket] disconnected — reason="${reason}"`);
    });

    s.on("reconnect_attempt", (attempt) => {
      console.log(`[socket] reconnect attempt #${attempt}`);
    });

    s.on("reconnect_failed", () => {
      console.error("[socket] all reconnect attempts failed");
    });

    // Presence events
    s.on("users:online-list", ({ userIds }: { userIds: string[] }) => {
      console.log("[socket] users:online-list received —", userIds);
      userIds.forEach((uid) => setUserOnline(uid));
    });

    s.on("user:online", ({ userId: uid }: { userId: string }) => {
      console.log("[socket] user:online —", uid);
      setUserOnline(uid);
    });

    s.on("user:offline", ({ userId: uid }: { userId: string }) => {
      console.log("[socket] user:offline —", uid);
      setUserOffline(uid);
    });

    // New message
    s.on("message:received", (message: ChatMessage) => {
      console.log("[socket] message:received —", message.id, message.text);
      appendMessage(message);
      const activeId = useChatStore.getState().activeConversationId;
      const isActive = activeId === message.conversationId;

      if (isActive) {
        // User is already looking at this conversation — reset DB count immediately
        fetch(`/api/conversations/${message.conversationId}/messages/read`, { method: "POST" });
        updateConversation(message.conversationId, {
          lastMessage: message.text ?? "Sent a file",
          lastMessageAt: message.createdAt,
          unreadCount: 0,
        });
      } else {
        // Conversation is in the background — increment the badge
        const current = useChatStore.getState().conversations.find(c => c.id === message.conversationId)?.unreadCount ?? 0;
        updateConversation(message.conversationId, {
          lastMessage: message.text ?? "Sent a file",
          lastMessageAt: message.createdAt,
          unreadCount: current + 1,
        });
      }
    });

    s.on(
      "conversation:updated",
      ({
        conversationId,
        lastMessage,
        lastMessageAt,
        lastMessageSenderId,
        lastMessageReadByOther,
      }: {
        conversationId: string;
        lastMessage: string;
        lastMessageAt: string;
        lastMessageSenderId?: string;
        lastMessageReadByOther?: boolean;
      }) => {
        console.log("[socket] conversation:updated —", conversationId);
        updateConversation(conversationId, { lastMessage, lastMessageAt, lastMessageSenderId, lastMessageReadByOther });
      }
    );

    s.on(
      "messages:read",
      ({ userId: readerUserId, conversationId }: { userId: string; conversationId: string }) => {
        markMessagesRead(conversationId, readerUserId);
        updateConversation(conversationId, { lastMessageReadByOther: true });
      }
    );

    s.on(
      "typing:start",
      ({ userId: uid, conversationId }: { userId: string; conversationId: string }) => {
        setTyping(conversationId, uid, true);
      }
    );

    s.on(
      "typing:stop",
      ({ userId: uid, conversationId }: { userId: string; conversationId: string }) => {
        setTyping(conversationId, uid, false);
      }
    );

    return () => {
      console.log(`[socket] cleanup — disconnecting socketId=${s.id}`);
      s.disconnect();
      setSocket(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- zustand store actions are stable
  }, [session?.user?.id, status]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
