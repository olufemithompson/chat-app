"use client";

import { Search, Phone, Video, MoreHorizontal } from "lucide-react";
import { Contact } from "@/types";

interface ChatHeaderProps {
  contact: Contact;
  onContactClick: () => void;
}

export default function ChatHeader({ contact, onContactClick }: ChatHeaderProps) {
  const displaySrc =
    contact.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=2D9B83&color=fff`;

  return (
    <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0">
      <button
        onClick={onContactClick}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
      >
        <img src={displaySrc} alt={contact.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
        <div>
          <p className="text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>{contact.name}</p>
          <p className="text-[12px] font-normal" style={{ color: "var(--text-secondary)" }}>
            {contact.online ? (
              <span className="text-[#2D9B83]">Online</span>
            ) : (
              <span>Offline</span>
            )}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-1">
        {[Search, Phone, Video].map((Icon, idx) => (
          <button
            key={idx}
            type="button"
            className="icon-btn w-9 h-9 flex items-center justify-center rounded-lg border ml-1.5 transition-colors"
            style={{ color: "var(--icon-color)", borderColor: "var(--panel-border)" }}
          >
            <Icon size={16} strokeWidth={1.8} />
          </button>
        ))}
        <button
          type="button"
          className="icon-btn w-9 h-9 flex items-center justify-center rounded-lg border ml-1.5 transition-colors"
          style={{ color: "var(--icon-color)", borderColor: "var(--panel-border)" }}
        >
          <MoreHorizontal size={16} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
