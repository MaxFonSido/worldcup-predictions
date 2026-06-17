"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

type Tab = "matches" | "results" | "leaderboard" | "standings" | "champion" | "chat" | "pool" | "admin";

type Labels = {
  matches: string;
  results: string;
  ranking: string;
  standings: string;
  champion: string;
  chat: string;
  prize: string;
  admin: string;
  more: string;
  logout: string;
  hi: string;
};

const BAR_TABS: { key: Tab; icon: string; labelKey: keyof Labels }[] = [
  { key: "matches", icon: "⚽", labelKey: "matches" },
  { key: "results", icon: "📋", labelKey: "results" },
  { key: "leaderboard", icon: "📊", labelKey: "ranking" },
  { key: "standings", icon: "🏟️", labelKey: "standings" },
];

const MORE_TABS: { key: Tab | "logout"; icon: string; labelKey: keyof Labels; danger?: boolean }[] = [
  { key: "champion", icon: "🏆", labelKey: "champion" },
  { key: "chat", icon: "💬", labelKey: "chat" },
  { key: "pool", icon: "🎁", labelKey: "prize" },
  { key: "admin", icon: "⚙️", labelKey: "admin" },
  { key: "logout", icon: "🚪", labelKey: "logout", danger: true },
];

const TAB_ROUTES: Record<string, string> = {
  matches: "/matches",
  results: "/results",
  leaderboard: "/leaderboard",
  standings: "/standings",
  champion: "/champion",
  chat: "/chat",
  pool: "/pool",
  admin: "/admin",
};

const ROUTE_TO_TAB: Record<string, Tab> = {
  "/matches": "matches",
  "/results": "results",
  "/leaderboard": "leaderboard",
  "/standings": "standings",
  "/champion": "champion",
  "/chat": "chat",
  "/pool": "pool",
  "/admin": "admin",
};

export default function BottomNav({
  active,
  labels,
  displayName,
  isAdmin,
  initialUnread,
}: {
  active: Tab;
  labels: Labels;
  displayName: string;
  isAdmin: boolean;
  initialUnread: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);

  // Poll chat unread count (unless we're on the chat page)
  const currentTab = ROUTE_TO_TAB[pathname] ?? active;
  useEffect(() => {
    if (currentTab === "chat") {
      setUnread(0);
      return;
    }
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/chat/unread", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setUnread(Number(data.count) || 0);
      } catch { /* ignore */ }
    };
    const id = setInterval(tick, 8000);
    return () => { alive = false; clearInterval(id); };
  }, [currentTab]);

  const navigate = useCallback((tab: string) => {
    if (tab === "logout") {
      // Submit logout form
      const form = document.createElement("form");
      form.method = "post";
      form.action = "/api/logout";
      document.body.appendChild(form);
      form.submit();
      return;
    }
    const route = TAB_ROUTES[tab];
    if (route) router.push(route);
  }, [router]);

  const isBarTab = BAR_TABS.some((t) => t.key === currentTab);
  const isMoreActive = !isBarTab;

  // Close sheet on outside click (backdrop)
  const closeSheet = useCallback(() => setOpen(false), []);

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[#f5f5f0] shadow-[0_-4px_12px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)] dark:bg-[#0d1a15] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)]">
        <div className="mx-auto flex max-w-2xl">
          {BAR_TABS.map((tab) => {
            const on = currentTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setOpen(false); navigate(tab.key); }}
                className={`flex flex-1 flex-col items-center gap-0.5 pb-2 pt-2 text-[10px] transition-colors ${
                  on ? "font-semibold text-pitch" : "text-muted"
                }`}
              >
                <span className="text-lg leading-none">{tab.icon}</span>
                <span>{labels[tab.labelKey]}</span>
              </button>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className={`relative flex flex-1 flex-col items-center gap-0.5 pb-2 pt-2 text-[10px] transition-colors ${
              isMoreActive || open ? "font-semibold text-pitch" : "text-muted"
            }`}
          >
            <span className="text-lg leading-none">•••</span>
            <span>{labels.more}</span>
            {/* Red dot when chat has unread and we're not on chat */}
            {unread > 0 && currentTab !== "chat" && (
              <span className="absolute end-[22%] top-1.5 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>
      </nav>

      {/* More sheet overlay */}
      {open && (
        <div className="fixed inset-0 z-50" onClick={closeSheet}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Sheet */}
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] dark:bg-[#11201a]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="h-1 w-8 rounded-full bg-line" />
            </div>

            {/* Greeting */}
            <div className="px-5 pb-3 text-sm text-muted">
              {labels.hi}, {displayName}
            </div>

            {/* Items */}
            <div className="border-t border-line">
              {MORE_TABS.filter((tab) => {
                if (tab.key === "admin" && !isAdmin) return false;
                return true;
              }).map((tab) => {
                const on = currentTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => { setOpen(false); navigate(tab.key); }}
                    className={`flex w-full items-center gap-3 border-b border-line px-5 py-3.5 text-start transition-colors ${
                      tab.danger
                        ? "text-red-500"
                        : on
                          ? "bg-pitch/5 font-semibold text-pitch"
                          : "text-ink hover:bg-surface"
                    }`}
                  >
                    <span className="text-base">{tab.icon}</span>
                    <span className="flex-1 text-sm">{labels[tab.labelKey]}</span>
                    {/* Chat unread badge */}
                    {tab.key === "chat" && unread > 0 && (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-none text-white">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
