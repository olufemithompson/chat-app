"use client";

import { Search, Bell, Settings, ChevronDown, MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";

export default function TopNavbar() {
  const { data: session } = useSession();
  const avatarSrc =
    session?.user?.image ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name ?? "You")}&background=2D9B83&color=fff`;

  return (
    <div className="flex items-center justify-between px-5 py-3 themed-panel rounded-2xl flex-shrink-0">
      {/* Left: title */}
      <div className="flex items-center gap-2">
        <MessageSquare size={17} strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />
        <span className="text-[15px] font-medium" style={{ color: "var(--text-primary)" }}>Message</span>
      </div>

      {/* Right: search + action icons + avatar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 mr-2"
          style={{ background: "transparent", borderColor: "var(--panel-border)" }}>
          <Search size={14} strokeWidth={2} style={{ color: "var(--icon-color)" }} />
          <input
            type="text"
            placeholder="Search"
            className="w-[130px] bg-transparent text-[13px] border-none outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          <span className="text-[11px] px-1.5 py-0.5 rounded font-mono" style={{ color: "var(--text-muted)", background: "var(--panel-border)" }}>
            ⌘+K
          </span>
        </div>

        <button className="icon-btn w-8 h-8 flex items-center justify-center rounded-lg border ml-1.5 transition-colors"
          style={{ color: "var(--icon-color)", borderColor: "var(--panel-border)" }}>
          <Bell size={16} strokeWidth={1.8} />
        </button>

        <button className="icon-btn w-8 h-8 flex items-center justify-center rounded-lg border ml-1.5 transition-colors"
          style={{ color: "var(--icon-color)", borderColor: "var(--panel-border)" }}>
          <Settings size={16} strokeWidth={1.8} />
        </button>

        <div className="flex items-center gap-1.5 ml-1 cursor-pointer hover:opacity-80 transition-opacity">
          <img src={avatarSrc} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
          <ChevronDown size={14} strokeWidth={2} style={{ color: "var(--text-muted)" }} />
        </div>
      </div>
    </div>
  );
}
