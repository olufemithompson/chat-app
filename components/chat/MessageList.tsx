"use client";

import { useEffect, useRef } from "react";
import { isToday, isYesterday, format } from "date-fns";
import type { ChatMessage } from "@/store/chatStore";
import MessageGroup from "./MessageGroup";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  otherUserId?: string;
  someoneElseTyping: boolean;
}

function dateLabel(d: Date) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, MMMM d");
}

type Row =
  | { kind: "date"; label: string; key: string }
  | { kind: "group"; isMe: boolean; messages: ChatMessage[]; key: string };

function buildRows(messages: ChatMessage[], currentUserId: string): Row[] {
  const rows: Row[] = [];
  let lastDay: string | null = null;

  for (let i = 0; i < messages.length; ) {
    const msg = messages[i];
    const dayKey = format(new Date(msg.createdAt), "yyyy-MM-dd");
    if (dayKey !== lastDay) {
      lastDay = dayKey;
      rows.push({
        kind: "date",
        label: dateLabel(new Date(msg.createdAt)),
        key: `sep-${dayKey}`,
      });
    }

    const isMe = msg.senderId === currentUserId;
    const group: ChatMessage[] = [msg];
    i++;
    while (i < messages.length) {
      const next = messages[i];
      const nextDay = format(new Date(next.createdAt), "yyyy-MM-dd");
      if (nextDay !== dayKey) break;
      if (next.senderId !== msg.senderId) break;
      group.push(next);
      i++;
    }
    rows.push({ kind: "group", isMe, messages: group, key: group[0].id });
  }

  return rows;
}

export default function MessageList({
  messages,
  currentUserId,
  otherUserId,
  someoneElseTyping,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const rows = buildRows(messages, currentUserId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, someoneElseTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 chat-bg min-h-0">
      {rows.map((row) =>
        row.kind === "date" ? (
          <div key={row.key} className="flex items-center justify-center mb-5">
            <span className="text-[12px] text-gray-500 bg-white/80 px-4 py-1 rounded-full shadow-sm font-medium">
              {row.label}
            </span>
          </div>
        ) : (
          <MessageGroup key={row.key} messages={row.messages} isMe={row.isMe} otherUserId={otherUserId} />
        )
      )}

      {someoneElseTyping && (
        <div className="flex items-end gap-2 mb-3">
          <div className="flex items-center gap-1 panel-bg px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
