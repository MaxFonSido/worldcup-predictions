"use client";

import { useEffect, useState, useCallback, useRef } from "react";


type LiveMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeCode: string;
  awayCode: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: string;
  awayScore: string;
  clock: string;
  period: number;
  status: "pre" | "in" | "post";
  statusText: string;
  venue: string;
  group: string;
};

export default function LiveScoreboard() {
  const RADIO_STREAM = "http://s0.cdn1.iranseda.ir:1935/liveedge/radio-varzesh/playlist.m3u8";
  const RADIO_FALLBACK = "http://player.iranseda.ir/live-player/?VALID=TRUE&CH=18&t=b&auto=true&SAVE=TRUE";
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [radioPlaying, setRadioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hlsRef = useRef<any>(null);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("live-dismissed") === "1";
    }
    return false;
  });
  const [loading, setLoading] = useState(true);

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("live-dismissed", "1");
  };

  const reopen = () => {
    setDismissed(false);
    sessionStorage.removeItem("live-dismissed");
  };

  const toggleRadio = async () => {
    if (radioPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setRadioPlaying(false);
      return;
    }

    try {
      const audio = audioRef.current || new Audio();
      audioRef.current = audio;

      if (audio.canPlayType("application/vnd.apple.mpegurl")) {
        audio.src = RADIO_STREAM;
        await audio.play();
        setRadioPlaying(true);
      } else {
        // Load hls.js from CDN if not already loaded
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        if (!w.Hls) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js";
            s.onload = () => resolve();
            s.onerror = () => reject();
            document.head.appendChild(s);
          });
        }
        if (w.Hls && w.Hls.isSupported()) {
          const hls = new w.Hls();
          hlsRef.current = hls;
          hls.loadSource(RADIO_STREAM);
          hls.attachMedia(audio);
          hls.on(w.Hls.Events.MANIFEST_PARSED, () => { audio.play(); });
          setRadioPlaying(true);
        } else {
          window.open(RADIO_FALLBACK, "_blank");
        }
      }
    } catch {
      window.open(RADIO_FALLBACK, "_blank");
    }
  };

  // Track which match IDs were live on the last poll
  const prevLiveIds = useRef<Set<string>>(new Set());
  // Track which finished match IDs we've already started a sync retry loop for
  const triggeredIds = useRef<Set<string>>(new Set());

  // Fire /api/espn-trigger immediately, then retry every 2 min for up to 10 min
  const startSyncRetry = useCallback((matchId: string) => {
    if (triggeredIds.current.has(matchId)) return;
    triggeredIds.current.add(matchId);

    let attempts = 0;
    const MAX_ATTEMPTS = 5; // 5 × 2 min = 10 minutes max

    const trigger = async () => {
      try {
        await fetch("/api/espn-trigger", { method: "POST", cache: "no-store" });
      } catch { /* ignore */ }
      attempts++;
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(trigger, 2 * 60 * 1000); // retry in 2 minutes
      }
    };

    trigger(); // fire immediately
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/livescores", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const allMatches: LiveMatch[] = data.matches ?? [];

      const live = allMatches.filter((m) => m.status === "in");
      const finished = allMatches.filter((m) => m.status === "post");

      // Detect matches that just transitioned from live → finished
      finished.forEach((m) => {
        if (prevLiveIds.current.has(m.id)) {
          // This match was live last poll and is now finished — trigger sync
          startSyncRetry(m.id);
        }
      });

      // Update the set of currently live IDs for next poll comparison
      prevLiveIds.current = new Set(live.map((m) => m.id));

      setMatches(live);
      // When all matches end, reset dismissed so next live match shows the overlay
      if (live.length === 0 && typeof window !== "undefined") {
        sessionStorage.removeItem("live-dismissed");
        setDismissed(false);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [startSyncRetry]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 5000); // poll every 5 seconds
    return () => clearInterval(id);
  }, [poll]);

  // Still loading or no live matches
  if (loading || matches.length === 0) return null;

  // Dismissed — show floating "LIVE" button to reopen
  if (dismissed) {
    return (
      <div className="fixed bottom-24 end-4 z-40 flex flex-col items-end gap-2">
        <button
          onClick={toggleRadio}
          className={`flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg transition-transform hover:scale-105 active:scale-95 ${
            radioPlaying ? "bg-amber-600" : "bg-amber-500"
          }`}
        >
          <span className="text-base">{radioPlaying ? "🔊" : "📻"}</span>
          <span className="text-sm font-bold text-white">{radioPlaying ? "On Air" : "Radio"}</span>
        </button>
        <button
          onClick={() => reopen()}
          className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2.5 shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <span className="text-sm font-bold text-white">
            LIVE {matches.length > 1 ? `(${matches.length})` : ""}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-pitch-dark via-pitch-deep to-pitch-dark">
      {/* Close button */}
      <button
        onClick={() => dismiss()}
        className="absolute end-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Close"
      >
        ✕
      </button>

      {/* Header */}
      <div className="pt-12 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[3px] text-gold">
          Live Now
        </div>
      </div>

      {/* Match cards — stacked, scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto flex max-w-md flex-col gap-5">
          {matches.map((m) => (
            <div
              key={m.id}
              className="rounded-3xl bg-white/10 px-6 py-6 backdrop-blur-sm"
            >
              {/* Live badge + venue */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                  </span>
                  <span className="text-sm font-bold text-white">
                    LIVE {m.clock}
                  </span>
                </div>
                <span className="text-xs text-white/50">
                  {m.group || m.venue}
                </span>
              </div>

              {/* Teams + Score */}
              <div className="flex items-center justify-between gap-2">
                {/* Home */}
                <div className="flex w-20 shrink-0 flex-col items-center gap-2">
                  {m.homeLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.homeLogo}
                      alt=""
                      className="h-12 w-12 object-contain sm:h-14 sm:w-14"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-base font-bold text-white sm:h-14 sm:w-14 sm:text-lg">
                      {m.homeCode}
                    </div>
                  )}
                  <span className="text-center text-xs font-semibold text-white sm:text-sm">
                    {m.homeTeam}
                  </span>
                </div>

                {/* Score */}
                <div className="min-w-0 flex-1 text-center">
                  <div className="whitespace-nowrap text-4xl font-extrabold tabular-nums text-white sm:text-5xl">
                    {m.homeScore}&nbsp;–&nbsp;{m.awayScore}
                  </div>
                  <div className="mt-1 text-xs font-medium text-white/50">
                    {m.statusText}
                  </div>
                </div>

                {/* Away */}
                <div className="flex w-20 shrink-0 flex-col items-center gap-2">
                  {m.awayLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.awayLogo}
                      alt=""
                      className="h-12 w-12 object-contain sm:h-14 sm:w-14"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-base font-bold text-white sm:h-14 sm:w-14 sm:text-lg">
                      {m.awayCode}
                    </div>
                  )}
                  <span className="text-center text-xs font-semibold text-white sm:text-sm">
                    {m.awayTeam}
                  </span>
                </div>
              </div>

              {/* Venue (if group is shown above) */}
              {m.group && m.venue && (
                <div className="mt-4 text-center text-xs text-white/40">
                  {m.venue}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Radio button */}
      <div className="pb-4 text-center">
        <button
          onClick={toggleRadio}
          className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-white transition-colors active:scale-95 ${
            radioPlaying ? "bg-amber-500/80" : "bg-white/15 hover:bg-white/25"
          }`}
        >
          <span className="text-lg">{radioPlaying ? "🔊" : "📻"}</span>
          <span className="text-sm font-bold">{radioPlaying ? "گزارش زنده — قطع" : "گزارش زنده فارسی"}</span>
        </button>
      </div>

      {/* Bottom hint */}
      <div className="pb-8 text-center text-xs text-white/30">
        Tap ✕ to see matches and place your bets
      </div>
    </div>
  );
}
