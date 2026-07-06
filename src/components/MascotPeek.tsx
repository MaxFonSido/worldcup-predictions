"use client";

// V-ronaldo3 — CR7 stops idle wandering and becomes a reminder: he only shows
// up when the logged-in user has an unpicked, still-open match. Gentle mode
// nudges occasionally; urgent mode (kickoff within 6h) nudges more often with
// a louder pose. Each appearance: slide in from a random spot, short
// synthesized whistle, "Put your bet!" bubble, hold, slide out.
// Silent (no appearance at all) once everything open has been picked.

import { useEffect, useRef, useState } from "react";

type Edge = "bottom" | "left" | "right";
type Urgency = "gentle" | "urgent";
type ReminderStatus = "none" | "gentle" | "urgent";

const EDGES: Edge[] = ["bottom", "left", "right"];

const STATUS_POLL_MS = 60_000; // re-check pick status every minute
const GENTLE_GAP_MIN_MS = 25_000; // gentle: every 25–45s
const GENTLE_GAP_MAX_MS = 45_000;
const URGENT_GAP_MIN_MS = 8_000; // urgent: every 8–16s
const URGENT_GAP_MAX_MS = 16_000;
const HOLD_MS = 2800;
const SLIDE_MS = 600;

type Spot = { edge: Edge; offsetPct: number };

function randomSpot(prev: Spot | null): Spot {
  let edge: Edge;
  do {
    edge = EDGES[Math.floor(Math.random() * EDGES.length)];
  } while (prev && edge === prev.edge && EDGES.length > 1);
  const offsetPct = 15 + Math.random() * 55;
  return { edge, offsetPct };
}

// A short, cheerful synthesized whistle — two quick rising blasts — using the
// Web Audio API. No audio file needed.
function playWhistle() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx: AudioContext = new Ctx();
    const blast = (startAt: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(1800, startAt);
      osc.frequency.linearRampToValueAtTime(2600, startAt + duration * 0.6);
      osc.frequency.linearRampToValueAtTime(2200, startAt + duration);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(0.12, startAt + 0.02);
      gain.gain.linearRampToValueAtTime(0.0001, startAt + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.02);
    };
    const t0 = ctx.currentTime + 0.02;
    blast(t0, 0.16);
    blast(t0 + 0.22, 0.22);
    setTimeout(() => ctx.close().catch(() => {}), 700);
  } catch {
    // Web Audio unavailable — silently skip the sound, visuals still work.
  }
}

export default function MascotPeek() {
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus>("none");
  const [spot, setSpot] = useState<Spot | null>(null);
  const [phase, setPhase] = useState<"hidden" | "in" | "out">("hidden");
  const statusRef = useRef<ReminderStatus>("none");

  // Poll the reminder-status API periodically.
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/mascot/reminder-status", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          statusRef.current = data.status ?? "none";
          setReminderStatus(statusRef.current);
        }
      } catch {
        // Network hiccup — keep previous status, try again next tick.
      }
    }
    poll();
    const interval = setInterval(poll, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Peek loop — re-evaluates current status on every cycle so it adapts
  // live as urgency changes or the user finishes picking.
  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        timers.push(setTimeout(res, ms));
      });

    let prev: Spot | null = null;

    async function loop() {
      while (!cancelled) {
        const status = statusRef.current;
        if (status === "none") {
          await wait(2000); // idle check, cheap
          continue;
        }
        const urgency: Urgency = status === "urgent" ? "urgent" : "gentle";
        const s = randomSpot(prev);
        prev = s;
        setSpot(s);
        setPhase("hidden");
        await wait(60);
        if (cancelled) return;
        setPhase("in");
        playWhistle();
        await wait(SLIDE_MS + HOLD_MS);
        if (cancelled) return;
        setPhase("out");
        await wait(SLIDE_MS + 100);
        if (cancelled) return;
        setSpot(null);

        const [gapMin, gapMax] =
          urgency === "urgent"
            ? [URGENT_GAP_MIN_MS, URGENT_GAP_MAX_MS]
            : [GENTLE_GAP_MIN_MS, GENTLE_GAP_MAX_MS];
        await wait(gapMin + Math.random() * (gapMax - gapMin));
      }
    }

    loop();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  if (!spot || reminderStatus === "none") return null;

  const { edge, offsetPct } = spot;
  const isSide = edge === "left" || edge === "right";
  const onLeft = edge === "left";
  const urgent = reminderStatus === "urgent";

  const pos: React.CSSProperties = isSide
    ? ({ top: `${offsetPct}%`, [edge]: 0 } as React.CSSProperties)
    : ({ bottom: 0, left: `${offsetPct}%` } as React.CSSProperties);

  const hiddenTransform = isSide
    ? `translateX(${onLeft ? "-110%" : "110%"})`
    : "translateY(110%)";
  const shownTransform = "translate(0, 0)";
  const shownState = phase === "in";

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        zIndex: 60,
        pointerEvents: "none",
        transition: `transform ${SLIDE_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
        transform: shownState ? shownTransform : hiddenTransform,
        display: "flex",
        flexDirection: "column",
        alignItems: onLeft ? "flex-start" : edge === "right" ? "flex-end" : "center",
        ...pos,
      }}
    >
      <SpeechBubble show={shownState} urgent={urgent} pointLeft={edge === "left"} pointRight={edge === "right"} />
      <div style={{ transform: edge === "right" ? "scaleX(-1)" : "none" }}>
        <SiuuuGuy />
      </div>
    </div>
  );
}

function SpeechBubble({
  show,
  urgent,
  pointLeft,
  pointRight,
}: {
  show: boolean;
  urgent: boolean;
  pointLeft: boolean;
  pointRight: boolean;
}) {
  return (
    <div
      style={{
        marginBottom: "6px",
        marginLeft: pointRight ? "auto" : undefined,
        opacity: show ? 1 : 0,
        transform: show
          ? urgent
            ? "scale(1) translateY(0)"
            : "scale(1) translateY(0)"
          : "scale(0.7) translateY(6px)",
        transition: "opacity 300ms ease, transform 300ms ease",
        animation: show && urgent ? "vronaldo-shake 0.35s ease-in-out 2" : undefined,
      }}
    >
      <div
        style={{
          background: urgent ? "#c8102e" : "#ffffff",
          color: urgent ? "#ffffff" : "#1f2937",
          border: urgent ? "2px solid #7c0d20" : "2px solid #d1d5db",
          borderRadius: "14px",
          padding: urgent ? "8px 14px" : "6px 12px",
          fontWeight: 800,
          fontSize: urgent ? "15px" : "13px",
          whiteSpace: "nowrap",
          boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
        }}
      >
        Put your bet!
      </div>
      <style>{`
        @keyframes vronaldo-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px) rotate(-2deg); }
          75% { transform: translateX(3px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}

// Stylized cartoon footballer inspired by the classic #7 look, wearing
// Portugal's official kit: deep red shirt, green trim, gold number,
// green shorts, red socks.
function SiuuuGuy() {
  return (
    <svg
      width="120"
      height="150"
      viewBox="0 0 120 150"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))" }}
    >
      {/* Legs — wide siuuu stance */}
      <g stroke="#1f2937" strokeWidth="1.5">
        <path d="M52 108 L42 132" fill="none" stroke="#f1c8a5" strokeWidth="8" strokeLinecap="round" />
        <path d="M68 108 L78 132" fill="none" stroke="#f1c8a5" strokeWidth="8" strokeLinecap="round" />
      </g>
      {/* Shorts — Portugal green */}
      <path d="M46 96 h28 l-3 16 h-8 l-3-9 -3 9 h-8 Z" fill="#046a38" stroke="#03502a" strokeWidth="1.5" />
      {/* Boots */}
      <path d="M42 130 l-10 5 q-2 2 1 3 h13 q2 0 2-3 l-1-5 Z" fill="#111827" />
      <path d="M78 130 l10 5 q2 2 -1 3 h-13 q-2 0 -2-3 l1-5 Z" fill="#111827" />
      {/* Socks — Portugal red */}
      <rect x="40" y="120" width="9" height="12" rx="3" fill="#c8102e" stroke="#9d0d24" />
      <rect x="71" y="120" width="9" height="12" rx="3" fill="#c8102e" stroke="#9d0d24" />

      {/* Torso — chest puffed forward, Portugal deep red */}
      <path
        d="M46 64 q14 -8 28 0 l3 32 q-17 5 -34 0 Z"
        fill="#c8102e"
        stroke="#9d0d24"
        strokeWidth="1.5"
      />
      {/* Green collar trim + gold number 7 */}
      <path d="M46 64 q14 -8 28 0 l0.6 6 q-14.6 -7 -29.2 0 Z" fill="#046a38" opacity="0.95" />
      <text
        x="60"
        y="90"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="16"
        fontWeight="bold"
        fill="#f2c14e"
      >
        7
      </text>

      {/* Arms — thrown out and down-back, the siuuu */}
      <path
        d="M48 68 Q28 76 14 94"
        fill="none"
        stroke="#f1c8a5"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M72 68 Q92 76 106 94"
        fill="none"
        stroke="#f1c8a5"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Jersey sleeves — red with green cuff */}
      <path d="M46 64 q-8 3 -12 9 l6 6 q6 -7 12 -9 Z" fill="#c8102e" stroke="#046a38" strokeWidth="1.5" />
      <path d="M74 64 q8 3 12 9 l-6 6 q-6 -7 -12 -9 Z" fill="#c8102e" stroke="#046a38" strokeWidth="1.5" />

      {/* Head — tilted slightly up, confident */}
      <g transform="rotate(-6 60 44)">
        {/* Neck */}
        <rect x="56" y="54" width="8" height="8" fill="#f1c8a5" />
        {/* Face */}
        <ellipse cx="60" cy="42" rx="14" ry="15" fill="#f7d3ae" stroke="#e0b58c" strokeWidth="1" />
        {/* Hair — short spiky swept-up crop */}
        <path
          d="M46 38 q0 -14 14 -14 q14 0 14 14 q0 -4 -3 -6 l2 -5 -5 3 1 -6 -5 4 -1 -6 -4 5 -3 -5 -2 6 -5 -4 2 6 -5 -2 2 5 q-2 2 -2 5 Z"
          fill="#2b2118"
        />
        {/* Eyebrows — one raised */}
        <path d="M50 37 q4 -3 8 -1" fill="none" stroke="#2b2118" strokeWidth="2" strokeLinecap="round" />
        <path d="M63 35 q4 -2 8 0" fill="none" stroke="#2b2118" strokeWidth="2" strokeLinecap="round" />
        {/* Eyes — confident, slightly closed */}
        <path d="M52 41 q3 2 6 0" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
        <path d="M65 41 q3 2 6 0" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
        {/* Nose */}
        <path d="M60 43 q2 3 0 5" fill="none" stroke="#d9a97e" strokeWidth="1.5" strokeLinecap="round" />
        {/* Mouth — open shout */}
        <ellipse cx="60" cy="52" rx="4.5" ry="3" fill="#7c2d2d" />
        <ellipse cx="60" cy="51" rx="3" ry="1.4" fill="#ffffff" />
        {/* Jawline shading */}
        <path d="M50 50 q10 8 20 0" fill="none" stroke="#e0b58c" strokeWidth="1" opacity="0.6" />
      </g>
    </svg>
  );
}
