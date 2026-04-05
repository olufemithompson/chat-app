"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import type { Contact } from "@/types";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isOnline: boolean;
}

interface NewConversationModalProps {
  onClose: () => void;
  onConversationCreated: (conversationId: string, contact: Contact) => void;
  anchorRect?: DOMRect;
}

export default function NewConversationModal({
  onClose,
  onConversationCreated,
  anchorRect,
}: NewConversationModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const { setConversations, conversations } = useChatStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = async (user: User) => {
    setCreating(user.id);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: user.id }),
    });
    const data = await res.json();
    if (data.conversation) {
      // Add to store if not already present
      if (!conversations.find((c) => c.id === data.conversation.id)) {
        setConversations([
          {
            id: data.conversation.id,
            lastMessage: data.conversation.lastMessage ?? null,
            lastMessageAt: data.conversation.lastMessageAt ?? null,
            unreadCount: 0,
            isArchived: false,
            isMuted: false,
            otherUser: {
              id: user.id,
              name: user.name,
              image: user.image,
              isOnline: user.isOnline,
            },
          },
          ...conversations,
        ]);
      }
      onConversationCreated(data.conversation.id, {
        id: user.id,
        name: user.name ?? "Unknown",
        avatar: user.image ?? "",
        email: user.email,
        online: user.isOnline,
      });
    }
    setCreating(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-50 rounded-2xl shadow-2xl w-[300px] overflow-hidden themed-panel"
        style={
          anchorRect
            ? { top: anchorRect.bottom + 8, right: window.innerWidth - anchorRect.right }
            : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--panel-border)" }}>
          <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>New conversation</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all icon-btn"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--panel-border)" }}>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 border" style={{ background: "var(--hover-bg)", borderColor: "var(--panel-border)" }}>
            <Search size={14} strokeWidth={2} style={{ color: "var(--text-muted)" }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              className="flex-1 bg-transparent text-[13px] outline-none border-none"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
        </div>

        {/* User list */}
        <div className="max-h-72 overflow-y-auto py-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full animate-pulse flex-shrink-0" style={{ background: "var(--hover-bg)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded animate-pulse w-2/3" style={{ background: "var(--hover-bg)" }} />
                  <div className="h-2 rounded animate-pulse w-1/3" style={{ background: "var(--hover-bg)" }} />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <p className="text-center text-[13px] py-8" style={{ color: "var(--text-muted)" }}>No users found</p>
          ) : (
            filtered.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelect(user)}
                disabled={creating === user.id}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left disabled:opacity-50 hover-bg"
                style={{ color: "var(--text-primary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <div className="relative flex-shrink-0">
                  {user.image ? (
                    <img src={user.image} alt={user.name ?? ""} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#2D9B83]/10 flex items-center justify-center text-[#2D9B83] font-semibold text-[14px]">
                      {(user.name ?? user.email)[0].toUpperCase()}
                    </div>
                  )}
                  {user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full ring-1.5 ring-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user.name ?? "—"}</p>
                  <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                </div>
                {creating === user.id && (
                  <span className="w-4 h-4 border-2 border-t-[#2D9B83] rounded-full animate-spin" style={{ borderColor: "var(--panel-border)", borderTopColor: "#2D9B83" }} />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
