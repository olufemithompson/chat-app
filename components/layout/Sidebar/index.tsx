"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { House, MessageSquare, Compass, FolderOpen, Images, Sparkles } from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";
import AppLogoMenu from "./AppLogoMenu";
import ThemeModal from "@/components/ThemeModal";
import { useChatStore } from "@/store/chatStore";

const navItems = [
  { icon: House,         label: "Home",     active: false },
  { icon: MessageSquare, label: "Messages", active: true  },
  { icon: Compass,       label: "Explore",  active: false },
  { icon: FolderOpen,    label: "Files",    active: false },
  { icon: Images,        label: "Gallery",  active: false },
];

const AI_BOT_USER_ID = process.env.NEXT_PUBLIC_AI_BOT_USER_ID ?? "ai-assistant-bot";

export default function Sidebar() {
  const { data: session } = useSession();
  const { setPendingOpen, setConversations, conversations } = useChatStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>("light");

  // Read the actual applied theme after mount (ThemeSync sets it async)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setCurrentTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    // Set initial value
    setCurrentTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    return () => observer.disconnect();
  }, []);
  const logoRef = useRef<HTMLButtonElement>(null);

  const openAiChat = useCallback(async () => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: AI_BOT_USER_ID }),
    });
    const data = await res.json();
    if (!data.conversation) return;

    const conv = data.conversation;
    const botContact = {
      id: AI_BOT_USER_ID,
      name: "AI Assistant",
      image: null,
      isOnline: true,
    };

    // Add to conversation list if not already there
    if (!conversations.find((c) => c.id === conv.id)) {
      setConversations([
        {
          id: conv.id,
          lastMessage: conv.lastMessage ?? null,
          lastMessageAt: conv.lastMessageAt ?? null,
          unreadCount: 0,
          isArchived: false,
          isMuted: false,
          otherUser: botContact,
        },
        ...conversations,
      ]);
    }

    setPendingOpen({ conversationId: conv.id, contact: botContact });
  }, [conversations, setConversations, setPendingOpen]);
  const avatarSrc =
    session?.user?.image ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name ?? "You")}&background=2D9B83&color=fff`;

  return (
    <>
      <div className="flex flex-col items-center w-[62px] sidebar-bg h-full flex-shrink-0">
        {/* Logo — vertically centered with the top navbar (py-3 + p-3 outer = ~24px top) */}
        <button
          ref={logoRef}
          onClick={() => setMenuOpen((v) => !v)}
          className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-90 overflow-hidden mt-[10px]"
        >
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
        </button>

        {/* Nav icons — pt pushes first icon to align with "All Message" header */}
        <div className="flex flex-col items-center gap-1 flex-1 pt-[28px]">
          {navItems.map((item) => (
            <SidebarNavItem key={item.label} {...item} />
          ))}
        </div>

        {/* Bottom: AI assistant + user avatar */}
        <div className="flex flex-col items-center gap-3">
          <button
            title="Chat with AI"
            onClick={openAiChat}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-[#2D9B83] hover:bg-black/10 transition-all duration-150"
          >
            <Sparkles size={20} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#2D9B83] ring-offset-1"
            title={session?.user?.name ?? "Profile"}
          >
            <img src={avatarSrc} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </button>
        </div>
      </div>

      {/* AppLogoMenu floats over everything, rendered outside the sidebar */}
      {menuOpen && (
        <AppLogoMenu
          onClose={() => setMenuOpen(false)}
          anchorRef={logoRef}
          onOpenTheme={() => {
            setMenuOpen(false);
            setThemeModalOpen(true);
          }}
        />
      )}

      {themeModalOpen && (
        <ThemeModal
          currentTheme={currentTheme}
          onClose={() => setThemeModalOpen(false)}
          onThemeChange={(theme) => setCurrentTheme(theme)}
        />
      )}
    </>
  );
}
