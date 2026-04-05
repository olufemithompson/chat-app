"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { PencilLine } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { Contact } from "@/types";
import ConversationItem from "./ConversationItem";
import ConversationSearch from "./ConversationSearch";
import ConversationContextMenu from "./ConversationContextMenu";
import NewConversationModal from "./NewConversationModal";

interface ContextMenuState {
  x: number;
  y: number;
  conversationId: string;
}

interface ConversationListProps {
  activeConversationId: string | null;
  onSelect: (conversationId: string, contact: Contact) => void;
  onOpenContact: (contact: Contact) => void;
  /** Called when a conversation is archived or deleted so the parent can clear selection */
  onConversationRemoved?: (conversationId: string) => void;
}

export default function ConversationList({
  activeConversationId,
  onSelect,
  onOpenContact,
  onConversationRemoved,
}: ConversationListProps) {
  const { conversations, setConversations, removeConversation, updateConversation, clearMessages } =
    useChatStore();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const newMessageBtnRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(true);
  const [listFilter, setListFilter] = useState("");

  // Fetch conversations on mount
  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => {
        if (data.conversations) setConversations(data.conversations);
      })
      .finally(() => setLoading(false));
  }, [setConversations]);

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, conversationId: id });
  }, []);

  const closeMenu = useCallback(() => setContextMenu(null), []);

  const toContact = (conv: (typeof conversations)[0]): Contact | null => {
    if (!conv.otherUser) return null;
    return {
      id: conv.otherUser.id,
      name: conv.otherUser.name ?? "Unknown",
      avatar: conv.otherUser.image ?? "",
      email: "",
      online: conv.otherUser.isOnline,
    };
  };

  const filteredConversations = conversations.filter((conv) => {
    const q = listFilter.trim().toLowerCase();
    if (!q) return true;
    const name = conv.otherUser?.name?.toLowerCase() ?? "";
    const last = conv.lastMessage?.toLowerCase() ?? "";
    return name.includes(q) || last.includes(q);
  });

  const handleArchive = async (conversationId: string) => {
    const conv = conversations.find((c) => c.id === conversationId);
    const newArchived = !conv?.isArchived;
    await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: newArchived }),
    });
    updateConversation(conversationId, { isArchived: newArchived });
  };

  const handleMute = async (conversationId: string) => {
    const conv = conversations.find((c) => c.id === conversationId);
    const newMuted = !conv?.isMuted;
    await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isMuted: newMuted }),
    });
    updateConversation(conversationId, { isMuted: newMuted });
  };

  const handleMarkUnread = async (conversationId: string) => {
    await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unreadCount: 1 }),
    });
    updateConversation(conversationId, { unreadCount: 1 });
  };

  const handleClearChat = async (conversationId: string) => {
    await fetch(`/api/conversations/${conversationId}/messages`, { method: "DELETE" });
    clearMessages(conversationId);
    updateConversation(conversationId, { lastMessage: null, lastMessageAt: null });
  };

  const handleDeleteChat = async (conversationId: string) => {
    await fetch(`/api/conversations/${conversationId}`, { method: "DELETE" });
    removeConversation(conversationId);
    onConversationRemoved?.(conversationId);
  };

  return (
    <>
      <div className="flex flex-col w-[340px] themed-panel rounded-2xl h-full flex-shrink-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h1 className="text-[17px] font-medium" style={{ color: "var(--text-primary)" }}>All Message</h1>
          <button
            ref={newMessageBtnRef}
            onClick={() => setNewMessageOpen(true)}
            className="flex items-center gap-1.5 bg-[#2D9B83] text-white text-sm font-medium px-3 py-1.5 rounded-xl hover:bg-[#257a68] transition-colors"
          >
            <PencilLine size={13} strokeWidth={2.2} />
            <span className="text-[13px]">New Message</span>
          </button>
        </div>

        <ConversationSearch value={listFilter} onChange={setListFilter} />

        {/* Conversation items */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {loading ? (
            // Skeleton loaders
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 mb-0.5">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6 text-center">
              <p className="text-[13px] font-medium">
                {conversations.length === 0
                  ? "No conversations yet"
                  : "No matches"}
              </p>
              <p className="text-[12px] mt-1">
                {conversations.length === 0
                  ? "Click “New Message” to start chatting"
                  : "Try a different search"}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onSelect={() => {
                  if (conv.isArchived) return;
                  const c = toContact(conv);
                  if (c) {
                    updateConversation(conv.id, { unreadCount: 0 });
                    useChatStore.getState().setActiveConversation(conv.id);
                    onSelect(conv.id, c);
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Context menu at document level */}
      {contextMenu && (
        <ConversationContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          conversationId={contextMenu.conversationId}
          onClose={closeMenu}
          onContactInfo={() => {
            const conv = conversations.find((c) => c.id === contextMenu.conversationId);
            const c = conv && toContact(conv);
            if (c) onOpenContact(c);
            closeMenu();
          }}
          isArchived={conversations.find((c) => c.id === contextMenu.conversationId)?.isArchived ?? false}
          onMarkUnread={() => { handleMarkUnread(contextMenu.conversationId); closeMenu(); }}
          onArchive={() => { handleArchive(contextMenu.conversationId); closeMenu(); }}
          onMute={() => { handleMute(contextMenu.conversationId); closeMenu(); }}
          onClearChat={() => { handleClearChat(contextMenu.conversationId); closeMenu(); }}
          onDeleteChat={() => { handleDeleteChat(contextMenu.conversationId); closeMenu(); }}
        />
      )}

      {/* New conversation modal */}
      {newMessageOpen && (
        <NewConversationModal
          anchorRect={newMessageBtnRef.current?.getBoundingClientRect()}
          onClose={() => setNewMessageOpen(false)}
          onConversationCreated={(conversationId, contact) => {
            setNewMessageOpen(false);
            onSelect(conversationId, contact);
          }}
        />
      )}
    </>
  );
}
