"use client";

import { Phone, Video } from "lucide-react";
import { Contact } from "@/types";

interface ContactCardProps {
  contact: Contact;
}

export default function ContactCard({ contact }: ContactCardProps) {
  const src =
    contact.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=2D9B83&color=fff`;

  return (
    <>
      {/* Avatar + name + email */}
      <div className="flex flex-col items-center px-5 pb-5">
        <img
          src={src}
          alt={contact.name}
          className="w-[72px] h-[72px] rounded-full object-cover mb-3 shadow-sm"
          referrerPolicy="no-referrer"
        />
        <p className="text-[15px] font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{contact.name}</p>
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{contact.email}</p>
      </div>

      {/* Audio / Video call buttons */}
      <div className="flex gap-3 px-5 pb-5">
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-xl transition-colors icon-btn" style={{ borderColor: "var(--panel-border)", color: "var(--text-primary)" }}>
          <Phone size={14} strokeWidth={1.8} style={{ color: "var(--text-secondary)" }} />
          <span className="text-[13px] font-medium">Audio</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-xl transition-colors icon-btn" style={{ borderColor: "var(--panel-border)", color: "var(--text-primary)" }}>
          <Video size={14} strokeWidth={1.8} style={{ color: "var(--text-secondary)" }} />
          <span className="text-[13px] font-medium">Video</span>
        </button>
      </div>
    </>
  );
}
