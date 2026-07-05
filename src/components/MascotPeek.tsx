"use client";

// V-ronaldo — CR7-inspired mascot that peeks in from a random edge shortly
// after login, hits the Siuuu pose, holds it, and slides back out.
// Shows once per browser session (sessionStorage flag). Purely decorative:
// pointer-events disabled, aria-hidden, no layout impact.

import { useEffect, useState } from "react";

type Edge = "bottom-right" | "bottom-left" | "side-right" | "side-left";

const EDGES: Edge[] = ["bottom-right", "bottom-left", "side-right", "side-left"];

const APPEAR_DELAY_MS = 2500; // "first few seconds" after landing
const HOLD_MS = 2600; // how long the pose is held
const SLIDE_MS = 600; // slide in/out duration

export default function MascotPeek() {
  const [edge, setEdge] = useState<Edge | null>(null);
  const [phase, setPhase] = useState<"hidden" | "in" | "out">("hidden");

  useEffect(() => {
    if (sessionStorage.getItem("mascot-shown") === "1") return;
    sessionStorage.setItem("mascot-shown", "1");

    const chosen = EDGES[Math.floor(Math.random() * EDGES.length)];
    const t1 = setTimeout(() => {
      setEdge(chosen);
      // next frame so the transition actually animates
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase("in")));
    }, APPEAR_DELAY_MS);
    const t2 = setTimeout(() => setPhase("out"), APPEAR_DELAY_MS + SLIDE_MS + HOLD_MS);
    const t3 = setTimeout(
      () => setEdge(null),
      APPEAR_DELAY_MS + SLIDE_MS + HOLD_MS + SLIDE_MS + 100
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (!edge) return null;

  const onLeft = edge === "bottom-left" || edge === "side-left";
  const isSide = edge === "side-left" || edge === "side-right";

  // Position + off/on-screen transforms per edge
  const pos: React.CSSProperties = isSide
    ? { top: "40%", [onLeft ? "left" : "right"]: 0 } as React.CSSProperties
    : { bottom: 0, [onLeft ? "left" : "right"]: "12px" } as React.CSSProperties;

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
        // Mirror the character so he faces into the screen from either side
        ...(onLeft ? {} : {}),
        ...pos,
      }}
    >
      <div style={{ transform: onLeft ? "none" : "scaleX(-1)" }}>
        <SiuuuGuy />
      </div>
    </div>
  );
}

// Stylized cartoon footballer inspired by the classic #7 look —
// spiky swept hair, white jersey with green trim, arms-out celebration pose.
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
      {/* Shorts */}
      <path d="M46 96 h28 l-3 16 h-8 l-3-9 -3 9 h-8 Z" fill="#1e3a5f" stroke="#16304f" strokeWidth="1.5" />
      {/* Boots */}
      <path d="M42 130 l-10 5 q-2 2 1 3 h13 q2 0 2-3 l-1-5 Z" fill="#111827" />
      <path d="M78 130 l10 5 q2 2 -1 3 h-13 q-2 0 -2-3 l1-5 Z" fill="#111827" />
      {/* Socks */}
      <rect x="40" y="120" width="9" height="12" rx="3" fill="#ffffff" stroke="#d1d5db" />
      <rect x="71" y="120" width="9" height="12" rx="3" fill="#ffffff" stroke="#d1d5db" />

      {/* Torso — chest puffed forward */}
      <path
        d="M46 64 q14 -8 28 0 l3 32 q-17 5 -34 0 Z"
        fill="#ffffff"
        stroke="#d1d5db"
        strokeWidth="1.5"
      />
      {/* Green trim + number 7 */}
      <path d="M46 64 q14 -8 28 0 l0.6 6 q-14.6 -7 -29.2 0 Z" fill="#15803d" opacity="0.9" />
      <text
        x="60"
        y="90"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="16"
        fontWeight="bold"
        fill="#15803d"
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
      {/* Jersey sleeves */}
      <path d="M46 64 q-8 3 -12 9 l6 6 q6 -7 12 -9 Z" fill="#ffffff" stroke="#d1d5db" strokeWidth="1.2" />
      <path d="M74 64 q8 3 12 9 l-6 6 q-6 -7 -12 -9 Z" fill="#ffffff" stroke="#d1d5db" strokeWidth="1.2" />

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
