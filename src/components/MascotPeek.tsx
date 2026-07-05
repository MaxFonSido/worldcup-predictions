"use client";

// V-ronaldo2 — CR7-inspired mascot in Portugal colors that repeatedly peeks
// in from random spots along random edges while the user is on the page.
// After each peek he waits a random few seconds and pops up somewhere else.
// Purely decorative: pointer-events disabled, aria-hidden, no layout impact.

import { useEffect, useState } from "react";

type Edge = "bottom" | "left" | "right";

const EDGES: Edge[] = ["bottom", "left", "right"];

const FIRST_DELAY_MS = 2500; // first appearance shortly after landing
const MIN_GAP_MS = 4000; // random pause between peeks: 4–12 s
const MAX_GAP_MS = 12000;
const HOLD_MS = 2500; // how long the pose is held
const SLIDE_MS = 600; // slide in/out duration

type Spot = { edge: Edge; offsetPct: number };

function randomSpot(prev: Spot | null): Spot {
  // Never repeat the exact same edge twice in a row
  let edge: Edge;
  do {
    edge = EDGES[Math.floor(Math.random() * EDGES.length)];
  } while (prev && edge === prev.edge && EDGES.length > 1);
  // Random position along the edge (kept away from the extreme corners/Nav)
  const offsetPct = 15 + Math.random() * 55; // 15%–70%
  return { edge, offsetPct };
}

export default function MascotPeek() {
  const [spot, setSpot] = useState<Spot | null>(null);
  const [phase, setPhase] = useState<"hidden" | "in" | "out">("hidden");

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        timers.push(setTimeout(res, ms));
      });

    let prev: Spot | null = null;

    async function loop() {
      await wait(FIRST_DELAY_MS);
      while (!cancelled) {
        const s = randomSpot(prev);
        prev = s;
        if (cancelled) return;
        setSpot(s);
        setPhase("hidden");
        await wait(60); // let it mount off-screen before animating
        if (cancelled) return;
        setPhase("in");
        await wait(SLIDE_MS + HOLD_MS);
        if (cancelled) return;
        setPhase("out");
        await wait(SLIDE_MS + 100);
        if (cancelled) return;
        setSpot(null);
        await wait(MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS));
      }
    }

    loop();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  if (!spot) return null;

  const { edge, offsetPct } = spot;
  const isSide = edge === "left" || edge === "right";
  const onLeft = edge === "left";

  const pos: React.CSSProperties = isSide
    ? ({ top: `${offsetPct}%`, [edge]: 0 } as React.CSSProperties)
    : ({ bottom: 0, left: `${offsetPct}%` } as React.CSSProperties);

  const hiddenTransform = isSide
    ? `translateX(${onLeft ? "-110%" : "110%"})`
    : "translateY(110%)";
  const shownTransform = "translate(0, 0)";

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        zIndex: 60,
        pointerEvents: "none",
        transition: `transform ${SLIDE_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
        transform: phase === "in" ? shownTransform : hiddenTransform,
        ...pos,
      }}
    >
      {/* Mirror when entering from the right so he faces into the screen */}
      <div style={{ transform: edge === "right" ? "scaleX(-1)" : "none" }}>
        <SiuuuGuy />
      </div>
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
