"use client";

import { ContactTab } from "@/types";

interface ContactTabsProps {
  activeTab: ContactTab;
  onTabChange: (tab: ContactTab) => void;
}

const tabs: ContactTab[] = ["Media", "Link", "Docs"];

export default function ContactTabs({ activeTab, onTabChange }: ContactTabsProps) {
  return (
    <div className="px-5 pb-4">
      <div className="flex items-center p-1 rounded-xl" style={{ background: "var(--hover-bg)" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className="flex-1 py-1.5 text-[13px] font-medium rounded-lg transition-all"
            style={activeTab === tab
              ? { background: "var(--panel-bg)", color: "var(--text-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
              : { background: "transparent", color: "var(--text-muted)" }
            }
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
