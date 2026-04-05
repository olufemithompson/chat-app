"use client";

import { CheckCheck, FileText } from "lucide-react";
import { format } from "date-fns";
import type { ChatMessage } from "@/store/chatStore";

interface MessageGroupProps {
  messages: ChatMessage[];
  isMe: boolean;
  otherUserId?: string;
}

function bubbleContent(msg: ChatMessage) {
  if (msg.type === "IMAGE" && msg.uploads?.[0]?.url) {
    return (
      <img
        src={msg.uploads[0].url}
        alt={msg.uploads[0].originalName ?? ""}
        className="max-w-full max-h-56 rounded-lg object-cover"
      />
    );
  }
  if (msg.type === "DOCUMENT" && msg.uploads?.[0]) {
    const u = msg.uploads[0];
    return (
      <a
        href={u.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-[#2D9B83] hover:underline"
      >
        <FileText size={16} strokeWidth={1.8} />
        <span className="truncate">{u.originalName}</span>
      </a>
    );
  }
  // For all text-based messages (including those with links), render inline with URLs highlighted
  if (msg.text) {
    const URL_REGEX = /(https?:\/\/[^\s]+)/g;
    const parts = msg.text.split(URL_REGEX);
    return (
      <span className="whitespace-pre-wrap break-words">
        {parts.map((part, i) =>
          URL_REGEX.test(part) ? (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2D9B83] underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  }
  return null;
}

export default function MessageGroup({ messages, isMe, otherUserId }: MessageGroupProps) {
  const lastMessage = messages[messages.length - 1];
  const timeStr = format(new Date(lastMessage.createdAt), "HH:mm");
  const isRead = otherUserId ? (lastMessage.readBy ?? []).includes(otherUserId) : false;

  return (
    <div className={`flex flex-col mb-3 ${isMe ? "items-end" : "items-start"}`}>
      {messages.map((msg, idx) => (
        <div
          key={msg.id}
          className={`max-w-[min(65%,420px)] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed shadow-sm mb-0.5 ${
            isMe ? "bubble-me" : "bubble-them"
          } ${idx === 0 ? (isMe ? "rounded-tr-md" : "rounded-tl-md") : ""
          } ${idx === messages.length - 1 ? (isMe ? "rounded-br-md" : "rounded-bl-md") : ""}`}
        >
          {bubbleContent(msg)}
        </div>
      ))}

      {isMe ? (
        <div className="flex items-center gap-1 mt-0.5 mr-0.5">
          <CheckCheck size={13} strokeWidth={2} className={isRead ? "text-[#2D9B83]" : "text-gray-400"} />
          <span className="text-[11px] text-gray-400">{timeStr}</span>
        </div>
      ) : (
        <span className="text-[11px] text-gray-400 mt-0.5 ml-0.5">{timeStr}</span>
      )}
    </div>
  );
}
