"use client";

import { CheckCheck, MessageSquare, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import type { ChatConversation } from "@/store/chatStore";
import { useChatStore } from "@/store/chatStore";

interface ConversationItemProps {
  conversation: ChatConversation;
  isActive: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

export default function ConversationItem({
  conversation: conv,
  isActive,
  onSelect,
  onContextMenu,
}: ConversationItemProps) {
  const { data: session } = useSession();
  const user = conv.otherUser;
  const isOnline = useChatStore((s) => !!user?.id && s.onlineUsers.has(user.id));
  const iMySentLast = conv.lastMessageSenderId === session?.user?.id;
  const timeLabel = conv.lastMessageAt
    ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })
        .replace("less than a minute ago", "just now")
        .replace("about ", "")
    : "";

  const hasUnread = conv.unreadCount > 0 && !isActive;
  const isArchived = conv.isArchived;

  return (
    <div
      className="flex items-center gap-2 px-2 mb-1"
      onContextMenu={(e) => onContextMenu(e, conv.id)}
    >
      {/* Unread badge — outside hover area */}
      {hasUnread && (
        <div
          onClick={onSelect}
          className="w-12 h-12 rounded-xl bg-[#2D9B83] flex flex-col items-center justify-center gap-1 flex-shrink-0 cursor-pointer"
        >
          <MessageSquare size={16} className="text-white" strokeWidth={2.2} />
          <span className="text-white font-semibold leading-none tracking-wide" style={{ fontSize: "9px" }}>Unread</span>
        </div>
      )}

      {/* Hoverable section: avatar + content only */}
      <button
        onClick={onSelect}
        className={`flex-1 flex items-center gap-2 px-2 py-2 rounded-2xl transition-all duration-150 text-left min-w-0 conv-item ${
          isActive ? "active" : ""
        }`}
      >
        {/* Avatar — same w-12 width as unread badge */}
        <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
          {user?.image ? (
            <img src={user.image} alt={user.name ?? ""} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#2D9B83]/10 flex items-center justify-center text-[#2D9B83] font-semibold text-[15px]">
              {(user?.name ?? "?")[0].toUpperCase()}
            </div>
          )}
          {isOnline && (
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {user?.name ?? "Unknown"}
            </span>
            <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
              {timeLabel}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[12px] truncate" style={{ color: "var(--text-secondary)" }}>
              {conv.lastMessage ?? "No messages yet"}
            </span>
            {conv.lastMessage && iMySentLast && (
              <CheckCheck
                size={13}
                strokeWidth={2}
                className={`flex-shrink-0 ml-1 ${conv.lastMessageReadByOther ? "text-[#2D9B83]" : "text-gray-400"}`}
              />
            )}
          </div>
        </div>
      </button>

      {/* Archive badge — outside hover area */}
      {isArchived && (
        <div className="w-12 h-12 rounded-xl bg-[#2D9B83] flex flex-col items-center justify-center gap-1 flex-shrink-0">
          <Trash2 size={16} className="text-white" strokeWidth={2.2} />
          <span className="text-white font-semibold leading-none tracking-wide" style={{ fontSize: "9px" }}>Archived</span>
        </div>
      )}
    </div>
  );
}
