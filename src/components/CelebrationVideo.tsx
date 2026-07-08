"use client";

// V41.1 — 🦈 Celebration Video (Shark Wins)
// A cinematic overlay that premieres "The Prediction" after the final:
//   • Auto-opens ONCE per device when the admin flag is on (localStorage).
//   • A slim banner stays on every page so everyone can rewatch anytime.
//   • Tap ▶ Play → native <video> (self-hosted MP4, no YouTube branding)
//     starts WITH sound (the tap is the user gesture browsers require) and
//     we request fullscreen; a small rotate hint shows on portrait phones.
// Admin preview: while the flag is OFF the admin still sees everything,
// marked with a small "preview" chip.

import { useEffect, useRef, useState } from "react";

const SEEN_KEY = "seen_celebration_video_shark";

type Props = {
  videoUrl: string;
  lang: "en" | "fa";
  preview: boolean; // true = admin-only preview (flag still off)
};

export default function CelebrationVideo({ videoUrl, lang, preview }: Props) {
  const fa = lang === "fa";
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const playerBox = useRef<HTMLDivElement>(null);

  // Auto-premiere once per device (only when actually live, not in preview).
  useEffect(() => {
    if (preview) return;
    try {
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch {
      /* private mode etc. — banner still works */
    }
  }, [preview]);

  function markSeen() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
  }

  function close() {
    markSeen();
    setPlaying(false);
    setOpen(false);
  }

  function play() {
    markSeen();
    setPlaying(true);
    // Fullscreen on the same tap — Android rotates to landscape for 16:9;
    // iOS uses the native player where rotating the phone fills the screen.
    const el = playerBox.current;
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => {});
    // Gentle rotate hint for portrait phones.
    if (window.matchMedia("(orientation: portrait)").matches) {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 4000);
    }
  }

  return (
    <>
      {/* ---- persistent banner (every page) ---- */}
      <button
        onClick={() => setOpen(true)}
        className="fixed inset-x-3 z-40 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform active:scale-95"
        style={{
          bottom: "calc(64px + env(safe-area-inset-bottom, 0px))",
          background: "linear-gradient(90deg, #0b1c33, #14335c 40%, #b8860b)",
        }}
      >
        <span aria-hidden>🎬</span>
        {fa ? "فیلم «پیش‌بینی» را تماشا کن!" : "Watch the movie: The Prediction!"}
        <span aria-hidden>🏆</span>
        {preview && (
          <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
            preview
          </span>
        )}
      </button>

      {/* ---- premiere overlay ---- */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
          style={{ background: "rgba(2, 6, 16, 0.96)" }}
        >
          <button
            onClick={close}
            aria-label={fa ? "بستن" : "Close"}
            className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white"
          >
            ✕
          </button>

          <div ref={playerBox} className="w-full max-w-3xl">
            {playing ? (
              <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16 / 9" }}>
                <video
                  src={videoUrl}
                  autoPlay
                  playsInline
                  controls
                  className="absolute inset-0 h-full w-full"
                />
                {showHint && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                    <span className="rounded-full bg-black/70 px-3 py-1.5 text-sm text-white">
                      📱↻ {fa ? "گوشی را بچرخان" : "Rotate your phone"}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="text-5xl" aria-hidden>
                  🏆
                </div>
                <h1
                  className="mt-3 text-3xl font-extrabold text-white"
                  style={{ textShadow: "0 2px 24px rgba(184,134,11,0.55)" }}
                >
                  {fa ? "پیش‌بینی" : "The Prediction"}
                </h1>
                <p className="mt-1 text-sm text-white/70">
                  {fa ? "داستان جام‌جهانی یک خانواده" : "A Family World Cup Story"}
                </p>
                <button
                  onClick={play}
                  className="mt-6 flex items-center gap-2 rounded-full px-8 py-3.5 text-lg font-bold text-white shadow-xl transition-transform active:scale-95"
                  style={{ background: "linear-gradient(90deg, #b8860b, #ffd700)" }}
                >
                  <span aria-hidden>▶</span> {fa ? "پخش فیلم" : "Play the movie"}
                </button>
                <p className="mt-3 text-xs text-white/50">
                  {fa ? "با صدا تماشا کن 🔊" : "Best with sound on 🔊"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
