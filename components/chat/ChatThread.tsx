"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Contact } from "@/types";
import { useChatStore, type ChatMessage } from "@/store/chatStore";
import { useSocket } from "@/contexts/SocketContext";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

function normalizeMessage(m: ChatMessage): ChatMessage {
  const c = m.createdAt as unknown;
  const createdAt =
    typeof c === "string" ? c : new Date(c as Date).toISOString();
  return { ...m, createdAt };
}

interface ChatThreadProps {
  conversationId: string;
  contact: Contact;
  onContactClick: () => void;
}

export default function ChatThread({ conversationId, contact, onContactClick }: ChatThreadProps) {
  const { data: session } = useSession();
  const socket = useSocket();
  const { messages, setMessages, appendMessage, updateConversation } = useChatStore();
  const liveOnline = useChatStore((s) =>
    contact.id ? s.onlineUsers.has(contact.id) : contact.online
  );
  const contactLive: Contact = { ...contact, online: liveOnline };
  const typingKey = useChatStore((s) => {
    const uid = session?.user?.id;
    const set = s.typingUsers[conversationId] ?? new Set<string>();
    return [...set]
      .filter((id) => id !== uid)
      .sort()
      .join(",");
  });
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversationMessages = messages[conversationId] ?? [];
  const someoneElseTyping = typingKey.length > 0;

  useEffect(() => {
    socket?.emit("join:conversation", conversationId);
    socket?.emit("messages:read", { conversationId });

    fetch(`/api/conversations/${conversationId}/messages`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.messages)) {
          const normalized: ChatMessage[] = data.messages.map((m: ChatMessage) => ({
            ...m,
            createdAt:
              typeof m.createdAt === "string"
                ? m.createdAt
                : new Date(m.createdAt as unknown as string).toISOString(),
          }));
          setMessages(conversationId, normalized);
        }
        // Clear unread badge in store — DB is already reset by the GET handler
        updateConversation(conversationId, { unreadCount: 0 });
      });
  }, [conversationId, socket, setMessages]);

  const sendMessage = useCallback(
    async (text: string, uploadId?: string, type: ChatMessage["type"] = "TEXT") => {
      if (!text.trim() && !uploadId) return;
      if (!session?.user?.id) return;

      socket?.emit("typing:stop", { conversationId });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

      if (socket?.connected) {
        socket.emit("message:send", { conversationId, text: text || undefined, type, uploadId });
      } else {
        // REST fallback when socket is not connected
        const res = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text || undefined, type, uploadId }),
        });
        const data = await res.json();
        if (data.message) appendMessage(normalizeMessage(data.message as ChatMessage));
      }

      setInput("");
    },
    [conversationId, session, socket, appendMessage]
  );

  const handleInputChange = (value: string) => {
    setInput(value);
    socket?.emit("typing:start", { conversationId });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket?.emit("typing:stop", { conversationId });
    }, 1500);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);

    if (data.upload) {
      const type = data.upload.uploadType === "IMAGE" ? "IMAGE" : "DOCUMENT";
      await sendMessage("", data.upload.id, type);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 themed-panel rounded-2xl overflow-hidden">
      <ChatHeader contact={contactLive} onContactClick={onContactClick} />
      {/* White padding wrapper — gives the message area a bordered-window feel */}
      <div className="flex flex-col flex-1 min-h-0 px-3 pb-3 themed-panel">
        <div className="flex flex-col flex-1 min-h-0 rounded-xl overflow-hidden">
          <MessageList
            messages={conversationMessages}
            currentUserId={session?.user?.id ?? ""}
            otherUserId={contact.id}
            someoneElseTyping={someoneElseTyping}
          />
        </div>
      </div>
      <MessageInput
        value={input}
        onChange={handleInputChange}
        onSend={() => sendMessage(input)}
        onFileUpload={handleFileUpload}
        uploading={uploading}
      />
    </div>
  );
}
