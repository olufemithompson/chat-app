"use client";

import { useEffect, useState } from "react";

interface MediaItem {
  id: string;
  url: string;
  name: string;
}

interface MediaGroup {
  month: string;
  images: MediaItem[];
}

export default function ContactMediaTab({ conversationId }: { conversationId: string | null }) {
  const [groups, setGroups] = useState<MediaGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setGroups([]);
      return;
    }
    setLoading(true);
    fetch(`/api/conversations/${conversationId}/media`)
      .then((r) => r.json())
      .then((data) => setGroups(data.mediaGroups ?? []))
      .finally(() => setLoading(false));
  }, [conversationId]);

  if (!conversationId) {
    return <p className="text-center text-[13px] py-10 px-4" style={{ color: "var(--text-muted)" }}>Open a conversation</p>;
  }

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg animate-pulse" style={{ background: "var(--selected-bg)" }} />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No images yet</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {groups.map((group) => (
        <div key={group.month} className="mb-5">
          <div className="px-1 py-1.5 mb-2 rounded-lg" style={{ background: "var(--panel-border)" }}>
            <p className="text-[11px] font-medium px-1" style={{ color: "var(--text-muted)" }}>{group.month}</p>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {group.images.map((img) => (
              <a
                key={img.id}
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: "var(--hover-bg)" }}
              >
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
