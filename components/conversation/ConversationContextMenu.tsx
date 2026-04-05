"use client";

import { useEffect, useRef } from "react";
import {
  MessageCircle, Archive, ArchiveRestore, MicOff, Info, Share2, X, Trash2, ChevronRight,
} from "lucide-react";

interface ConversationContextMenuProps {
  x: number;
  y: number;
  conversationId: string;
  isArchived: boolean;
  onClose: () => void;
  onContactInfo: () => void;
  onMarkUnread: () => void;
  onArchive: () => void;
  onMute: () => void;
  onClearChat: () => void;
  onDeleteChat: () => void;
}

export default function ConversationContextMenu({
  x, y, isArchived, onClose, onContactInfo, onMarkUnread, onArchive, onMute, onClearChat, onDeleteChat,
}: ConversationContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => onClose();
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const t = setTimeout(() => {
      document.addEventListener("click", handleClick);
      document.addEventListener("keydown", handleKey);
    }, 50);
    return () => { clearTimeout(t); document.removeEventListener("click", handleClick); document.removeEventListener("keydown", handleKey); };
  }, [onClose]);

  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const el = menuRef.current;
    if (rect.right > window.innerWidth) el.style.left = `${window.innerWidth - rect.width - 8}px`;
    if (rect.bottom > window.innerHeight) el.style.top = `${window.innerHeight - rect.height - 8}px`;
  }, [x, y]);

  const ic = "flex-shrink-0";
  const icStyle = { color: "var(--text-secondary)" };
  const s = 15; const sw = 1.8;

  const items = [
    { icon: <MessageCircle size={s} strokeWidth={sw} className={ic} style={icStyle} />, label: "Mark as unread", onClick: onMarkUnread },
    { icon: isArchived
        ? <ArchiveRestore size={s} strokeWidth={sw} className={ic} style={icStyle} />
        : <Archive        size={s} strokeWidth={sw} className={ic} style={icStyle} />,
      label: isArchived ? "Unarchive" : "Archive", onClick: onArchive },
    { icon: <MicOff  size={s} strokeWidth={sw} className={ic} style={icStyle} />, label: "Mute",         onClick: onMute, hasSubmenu: true },
    { icon: <Info    size={s} strokeWidth={sw} className={ic} style={icStyle} />, label: "Contact info", onClick: onContactInfo, dividerAbove: true },
    { icon: <Share2  size={s} strokeWidth={sw} className={ic} style={icStyle} />, label: "Export chat",  onClick: onClose },
    { icon: <X       size={s} strokeWidth={sw} className={ic} style={icStyle} />, label: "Clear chat",   onClick: onClearChat, dividerAbove: true },
    { icon: <Trash2  size={s} strokeWidth={sw} className="flex-shrink-0 text-red-500" />, label: "Delete chat", danger: true, onClick: onDeleteChat },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] rounded-2xl shadow-xl py-1.5 overflow-hidden themed-panel"
      style={{ top: y, left: x, width: "210px", border: "1px solid var(--panel-border)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, idx) => (
        <div key={idx}>
          {item.dividerAbove && <div className="my-1 border-t" style={{ borderColor: "var(--panel-border)" }} />}
          <button
            onClick={item.onClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors icon-btn"
            style={{ color: item.danger ? "#ef4444" : "var(--text-primary)" }}
          >
            {item.icon}
            <span className="flex-1 text-[13px] font-medium">{item.label}</span>
            {item.hasSubmenu && <ChevronRight size={14} strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />}
          </button>
        </div>
      ))}
    </div>
  );
}
