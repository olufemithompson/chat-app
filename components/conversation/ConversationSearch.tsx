"use client";

import { Search, Filter } from "lucide-react";

interface ConversationSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ConversationSearch({ value, onChange }: ConversationSearchProps) {
  return (
    <div className="px-4 pb-3 flex items-center gap-2">
      <div className="flex-1 flex items-center gap-2 border rounded-xl px-3 py-2" style={{ background: "var(--panel-bg)", borderColor: "var(--panel-border)" }}>
        <Search size={14} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} strokeWidth={2} />
        <input
          type="text"
          placeholder="Search in message"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-[13px] border-none outline-none"
          style={{ color: "var(--text-primary)" }}
        />
      </div>
      <button className="w-9 h-9 flex items-center justify-center rounded-xl border transition-colors flex-shrink-0" style={{ background: "var(--panel-bg)", borderColor: "var(--panel-border)", color: "var(--text-secondary)" }}>
        <Filter size={15} strokeWidth={1.8} />
      </button>
    </div>
  );
}
