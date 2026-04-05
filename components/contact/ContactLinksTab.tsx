"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";

interface LinkRow {
  id: string;
  url: string;
  title: string;
}

interface LinkGroup {
  month: string;
  links: LinkRow[];
}

export default function ContactLinksTab({ conversationId }: { conversationId: string | null }) {
  const [groups, setGroups] = useState<LinkGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setGroups([]);
      return;
    }
    setLoading(true);
    fetch(`/api/conversations/${conversationId}/links`)
      .then((r) => r.json())
      .then((data) => setGroups(data.linkGroups ?? []))
      .finally(() => setLoading(false));
  }, [conversationId]);

  if (!conversationId) {
    return <p className="text-center text-[13px] py-10 px-4" style={{ color: "var(--text-muted)" }}>Open a conversation</p>;
  }

  if (loading) {
    return (
      <div className="py-3 px-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--selected-bg)" }} />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "var(--hover-bg)" }}>
          <Link2 size={20} strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />
        </div>
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No links yet</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {groups.map((group) => (
        <div key={group.month}>
          <div className="mx-4 mb-2 px-2 py-1.5 rounded-lg" style={{ background: "var(--panel-border)" }}>
            <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{group.month}</span>
          </div>
          <div className="px-4 py-1">
            {group.links.map((link) => (
              <a
                key={link.id}
                href={link.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 py-3 border-b last:border-0 hover:opacity-80 transition-opacity"
                style={{ borderColor: "var(--panel-border)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--hover-bg)" }}>
                  <Link2 size={18} className="text-[#2D9B83]" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold mb-0.5 truncate" style={{ color: "var(--text-primary)" }}>
                    {link.title || link.url}
                  </p>
                  <p className="text-[11.5px] leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>{link.url}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
