"use client";

import { useRef, useState, useEffect } from "react";
import { Mic, Smile, Paperclip, Send } from "lucide-react";
import dynamic from "next/dynamic";
import data from "@emoji-mart/data";

// Load the picker client-side only — it uses browser APIs
const Picker = dynamic(() => import("@emoji-mart/react").then((m) => m.default), { ssr: false });

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileUpload?: (file: File) => void;
  uploading?: boolean;
  disabled?: boolean;
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  onFileUpload,
  uploading = false,
  disabled = false,
}: MessageInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [showPicker, setShowPicker] = useState(false);

  // Close picker when clicking outside
  useEffect(() => {
    if (!showPicker) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPicker]);

  const handleEmojiSelect = (emoji: { native: string }) => {
    const input = inputRef.current;
    if (!input) {
      onChange(value + emoji.native);
      return;
    }
    // Insert emoji at cursor position
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji.native + value.slice(end);
    onChange(next);
    // Restore cursor after the inserted emoji
    requestAnimationFrame(() => {
      input.focus();
      const pos = start + emoji.native.length;
      input.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !uploading) onSend();
    }
  };

  const busy = disabled || uploading;

  return (
    <div className="relative flex items-center gap-3 px-4 py-3 panel-bg flex-shrink-0">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.zip,.txt"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && onFileUpload) onFileUpload(f);
          e.target.value = "";
        }}
      />

      {/* Emoji picker */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute bottom-full left-4 mb-2 z-50 shadow-xl rounded-2xl overflow-hidden"
        >
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme="light"
            previewPosition="none"
            skinTonePosition="none"
          />
        </div>
      )}

      <div className="flex-1 flex items-center gap-3 themed-input rounded-full pl-4 pr-1.5 py-1.5 border">
        <input
          ref={inputRef}
          type="text"
          placeholder={busy ? "Uploading…" : "Type any message…"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
          className="flex-1 bg-transparent text-[13.5px] border-none outline-none disabled:opacity-60 themed-input"
        />
        <div className="flex items-center gap-1" style={{ color: "var(--icon-color)" }}>
          <button
            type="button"
            disabled={busy}
            className="w-7 h-7 flex items-center justify-center transition-colors rounded-lg hover:bg-gray-200 disabled:opacity-40"
            title="Voice (soon)"
          >
            <Mic size={16} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowPicker((p) => !p)}
            className={`w-7 h-7 flex items-center justify-center transition-colors rounded-lg hover:bg-gray-200 disabled:opacity-40 ${
              showPicker ? "text-[#2D9B83] bg-gray-200" : ""
            }`}
            title="Emoji"
          >
            <Smile size={16} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            disabled={busy || !onFileUpload}
            onClick={() => fileRef.current?.click()}
            className="w-7 h-7 flex items-center justify-center transition-colors rounded-lg hover:bg-gray-200 disabled:opacity-40"
            title="Attach file"
          >
            <Paperclip size={16} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={busy || !value.trim()}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2D9B83] text-white hover:bg-[#257a68] transition-all flex-shrink-0 disabled:opacity-40 disabled:pointer-events-none ml-1"
          >
            <Send size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
