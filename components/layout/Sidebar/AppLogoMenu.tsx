"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, PenLine, Gift, Settings2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

interface AppLogoMenuProps {
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onOpenTheme: () => void;
}

interface MeUser {
  name: string | null;
  email: string;
  creditsUsed: number;
  creditsTotal: number;
  creditsReset: string;
  theme: string;
}

function msUntilDailyReset(resetIso: string) {
  const end = new Date(new Date(resetIso).getTime() + 24 * 60 * 60 * 1000).getTime();
  return Math.max(0, end - Date.now());
}

function formatDuration(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function AppLogoMenu({ onClose, anchorRef, onOpenTheme }: AppLogoMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<MeUser | null>(null);

  const refreshProfile = useCallback(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setProfile(data.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const t = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKey);
    }, 50);

    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose, anchorRef]);

  const creditsUsed = profile?.creditsUsed ?? 0;
  const creditsTotal = profile?.creditsTotal ?? 25;
  const creditsLeft = Math.max(0, creditsTotal - creditsUsed);
  const progressPct = creditsTotal > 0 ? Math.min(100, (creditsUsed / creditsTotal) * 100) : 0;
  const renewIn =
    profile?.creditsReset != null ? formatDuration(msUntilDailyReset(profile.creditsReset)) : "—";

  const displayName = profile?.name ?? session?.user?.name ?? "User";
  const displayEmail = profile?.email ?? session?.user?.email ?? "";


  const handleLogout = () => {
    onClose();
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      style={{ top: "12px", left: "70px", width: "232px" }}
    >
      <div className="pt-2 pb-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push("/");
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={15} strokeWidth={1.8} className="text-gray-500 flex-shrink-0" />
          <span className="text-[13px] font-medium">Go back to dashboard</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <PenLine size={15} strokeWidth={1.8} className="text-gray-500 flex-shrink-0" />
          <span className="text-[13px] font-medium">Rename file</span>
        </button>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800" />

      <div className="mx-2 my-2 rounded-xl bg-gray-50 dark:bg-gray-800/80 px-3 py-3">
        <p className="text-[13.5px] font-bold text-gray-900 dark:text-gray-100 mb-0.5 truncate">
          {displayName}
        </p>
        <p className="text-[11.5px] text-gray-400 mb-3 truncate">{displayEmail}</p>

        <div className="flex items-start justify-between mb-1.5">
          <div>
            <p className="text-[10.5px] text-gray-400 font-medium mb-0.5">Credits</p>
            <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{creditsLeft} left</p>
          </div>
          <div className="text-right">
            <p className="text-[10.5px] text-gray-400 font-medium mb-0.5">Renews in</p>
            <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{renewIn}</p>
          </div>
        </div>

        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full bg-[#2D9B83] rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            {creditsUsed} of {creditsTotal} used today
          </span>
          <span className="text-[11px] font-semibold text-[#2D9B83]">+{creditsTotal} next cycle</span>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800" />

      <div className="pt-1 pb-1">
        <button
          type="button"
          onClick={onClose}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Gift size={15} strokeWidth={1.8} className="text-gray-500 flex-shrink-0" />
          <span className="text-[13px] font-medium">Win free credits</span>
        </button>
        <button
          type="button"
          onClick={onOpenTheme}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Settings2 size={15} strokeWidth={1.8} className="text-gray-500 flex-shrink-0" />
          <span className="text-[13px] font-medium">Theme Style</span>
        </button>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800" />

      <div className="py-1">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <LogOut size={15} strokeWidth={1.8} className="text-gray-500 flex-shrink-0" />
          <span className="text-[13px] font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
}
