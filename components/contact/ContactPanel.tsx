"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Contact, ContactTab } from "@/types";
import ContactCard from "./ContactCard";
import ContactTabs from "./ContactTabs";
import ContactMediaTab from "./ContactMediaTab";
import ContactLinksTab from "./ContactLinksTab";
import ContactDocsTab from "./ContactDocsTab";

interface ContactPanelProps {
  contact: Contact;
  conversationId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactPanel({
  contact,
  conversationId,
  isOpen,
  onClose,
}: ContactPanelProps) {
  const [activeTab, setActiveTab] = useState<ContactTab>("Media");

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40" onClick={onClose} />}

      <div
        className={`
          fixed right-0 z-50 flex flex-col shadow-2xl rounded-2xl themed-panel
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        style={{
          top: "12px",
          bottom: "12px",
          width: "310px",
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <h2 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>Contact Info</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all icon-btn"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <ContactCard contact={contact} />
          <ContactTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === "Media" && <ContactMediaTab conversationId={conversationId} />}
          {activeTab === "Link" && <ContactLinksTab conversationId={conversationId} />}
          {activeTab === "Docs" && <ContactDocsTab conversationId={conversationId} />}
        </div>
      </div>
    </>
  );
}
