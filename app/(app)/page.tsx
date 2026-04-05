"use client";

import { useState, useEffect } from "react";
import { Contact } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import TopNavbar from "@/components/layout/TopNavbar";
import ConversationList from "@/components/conversation/ConversationList";
import ChatThread from "@/components/chat/ChatThread";
import ContactPanel from "@/components/contact/ContactPanel";
import { useChatStore } from "@/store/chatStore";

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [contactPanelOpen, setContactPanelOpen] = useState(false);
  const [panelContact, setPanelContact] = useState<Contact | null>(null);
  const { pendingOpen, setPendingOpen } = useChatStore();

  // Open conversation requested by sidebar (e.g. AI chat button)
  useEffect(() => {
    if (!pendingOpen) return;
    const { conversationId, contact } = pendingOpen;
    setActiveConversationId(conversationId);
    setPanelContact({
      id: contact.id,
      name: contact.name ?? "AI Assistant",
      avatar: contact.image ?? "",
      email: "",
      online: contact.isOnline,
    });
    setContactPanelOpen(false);
    setPendingOpen(null);
  }, [pendingOpen, setPendingOpen]);

  const handleSelectConversation = (conversationId: string, contact: Contact) => {
    setActiveConversationId(conversationId);
    setPanelContact(contact);
    setContactPanelOpen(false);
  };

  const handleOpenContact = (contact: Contact) => {
    setPanelContact(contact);
    setContactPanelOpen(true);
  };

  return (
    <>
      <div className="flex w-screen h-screen overflow-hidden app-bg">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 p-3 gap-3 overflow-hidden">
          <TopNavbar />
          <div className="flex flex-1 min-h-0 gap-3 overflow-hidden">
            <ConversationList
              activeConversationId={activeConversationId}
              onSelect={handleSelectConversation}
              onOpenContact={handleOpenContact}
              onConversationRemoved={(id) => {
                if (id === activeConversationId) {
                  setActiveConversationId(null);
                  setPanelContact(null);
                  setContactPanelOpen(false);
                }
              }}
            />
            {activeConversationId && panelContact ? (
              <ChatThread
                conversationId={activeConversationId}
                contact={panelContact}
                onContactClick={() => setContactPanelOpen(true)}
              />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>

      {panelContact && (
        <ContactPanel
          contact={panelContact}
          conversationId={activeConversationId}
          isOpen={contactPanelOpen}
          onClose={() => setContactPanelOpen(false)}
        />
      )}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center themed-panel rounded-2xl" style={{ color: "var(--text-muted)" }}>
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p className="text-[15px] font-medium text-gray-500">Select a conversation</p>
      <p className="text-[13px] text-gray-400 mt-1">Choose from the list or start a new chat</p>
    </div>
  );
}
