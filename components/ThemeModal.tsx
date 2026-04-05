"use client";

import { useEffect, useRef, useState } from "react";
import { Sun, Moon, X } from "lucide-react";

interface ThemeModalProps {
  currentTheme: string;
  onClose: () => void;
  onThemeChange: (theme: "light" | "dark") => void;
}

export default function ThemeModal({ currentTheme, onClose, onThemeChange }: ThemeModalProps) {
  const [selected, setSelected] = useState<"light" | "dark">(
    currentTheme === "dark" ? "dark" : "light"
  );
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleApply = async () => {
    setSaving(true);
    // Apply immediately to the DOM and persist to localStorage
    document.documentElement.classList.toggle("dark", selected === "dark");
    localStorage.setItem("theme", selected);
    // Persist to DB
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: selected }),
    });
    setSaving(false);
    onThemeChange(selected);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={ref}
        className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[360px] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">Theme</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Options */}
        <div className="p-5 flex gap-4">
          {/* Light */}
          <button
            type="button"
            onClick={() => setSelected("light")}
            className={`flex-1 rounded-xl border-2 overflow-hidden transition-all ${
              selected === "light"
                ? "border-[#2D9B83]"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            {/* Preview */}
            <div className="h-24 bg-gray-50 flex flex-col gap-1.5 p-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <div className="flex-1 h-2 rounded-full bg-gray-200" />
              </div>
              <div className="flex gap-1.5 flex-1">
                <div className="w-10 rounded-lg bg-gray-200" />
                <div className="flex-1 rounded-lg bg-white border border-gray-100" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 py-2.5 bg-white">
              <Sun size={14} className="text-amber-500" strokeWidth={2} />
              <span className="text-[13px] font-semibold text-gray-800">Light</span>
            </div>
          </button>

          {/* Dark */}
          <button
            type="button"
            onClick={() => setSelected("dark")}
            className={`flex-1 rounded-xl border-2 overflow-hidden transition-all ${
              selected === "dark"
                ? "border-[#2D9B83]"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            {/* Preview */}
            <div className="h-24 bg-gray-900 flex flex-col gap-1.5 p-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-600" />
                <div className="flex-1 h-2 rounded-full bg-gray-700" />
              </div>
              <div className="flex gap-1.5 flex-1">
                <div className="w-10 rounded-lg bg-gray-800" />
                <div className="flex-1 rounded-lg bg-gray-800 border border-gray-700" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 py-2.5 bg-gray-900">
              <Moon size={14} className="text-indigo-400" strokeWidth={2} />
              <span className="text-[13px] font-semibold text-gray-100">Dark</span>
            </div>
          </button>
        </div>

        {/* Apply button */}
        <div className="px-5 pb-5">
          <button
            onClick={handleApply}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-[#2D9B83] hover:bg-[#257a68] text-white text-[13px] font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Apply"}
          </button>
        </div>
      </div>
    </>
  );
}
