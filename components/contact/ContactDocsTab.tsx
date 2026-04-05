"use client";

import { useEffect, useState } from "react";

interface DocFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  ext: string;
}

interface DocGroup {
  month: string;
  files: DocFile[];
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function badgeStyle(ext: string) {
  const e = ext.toLowerCase();
  if (e === "pdf") return { bg: "#ef4444", label: "PDF" };
  if (e === "doc" || e === "docx") return { bg: "#3b82f6", label: e.toUpperCase() };
  if (e === "zip") return { bg: "#8b5cf6", label: "ZIP" };
  return { bg: "#64748b", label: ext.slice(0, 4).toUpperCase() };
}

export default function ContactDocsTab({ conversationId }: { conversationId: string | null }) {
  const [groups, setGroups] = useState<DocGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setGroups([]);
      return;
    }
    setLoading(true);
    fetch(`/api/conversations/${conversationId}/docs`)
      .then((r) => r.json())
      .then((data) => setGroups(data.docGroups ?? []))
      .finally(() => setLoading(false));
  }, [conversationId]);

  if (!conversationId) {
    return <p className="text-center text-[13px] py-10 px-4" style={{ color: "var(--text-muted)" }}>Open a conversation</p>;
  }

  if (loading) {
    return (
      <div className="py-3 px-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--selected-bg)" }} />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No documents yet</p>
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
            {group.files.map((file) => {
              const b = badgeStyle(file.ext);
              return (
                <a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-3 border-b last:border-0 rounded-xl px-1 transition-colors hover:opacity-80"
                  style={{ borderColor: "var(--panel-border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: b.bg }}
                  >
                    <span className="text-[9px] font-bold text-white tracking-tight">{b.label}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate mb-0.5" style={{ color: "var(--text-primary)" }}>{file.name}</p>
                    <p className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>
                      {formatSize(file.size)} · {file.mimeType}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
