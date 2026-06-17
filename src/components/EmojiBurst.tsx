"use client";

import { useState, useCallback } from "react";

const EMOJI_SETS = [
  ["🌸", "🌺", "🌻", "🌹", "🌷", "🌼"],
  ["💋", "💄", "❤️‍🔥", "😘", "🫦", "💌"],
  ["❤️", "🧡", "💛", "💚", "💙", "💜", "🩷", "🤍"],
  ["⭐", "🌟", "✨", "💫", "🌙", "☀️"],
  ["🎉", "🎊", "🥳", "🎈", "🎁", "🎀"],
  ["⚽", "🏆", "🥇", "🎯", "🔥", "💪"],
];

type Particle = { id: number; emoji: string; x: number; y: number; angle: number; distance: number };

let nextId = 0;

export default function EmojiBurst() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const burst = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];

    const newParticles: Particle[] = Array.from({ length: 24 }, () => ({
      id: nextId++,
      emoji: set[Math.floor(Math.random() * set.length)],
      x: cx,
      y: cy,
      angle: Math.random() * 360,
      distance: 60 + Math.random() * 120,
    }));

    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
    }, 1200);
  }, []);

  return (
    <>
      <button
        onClick={burst}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg transition-transform active:scale-90"
        aria-label="Emoji burst"
      >
        <span className="text-xl">✨</span>
      </button>

      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <span
            key={p.id}
            className="emoji-burst-particle"
            style={{
              left: p.x,
              top: p.y,
              // @ts-expect-error CSS custom properties
              "--tx": `${tx}px`,
              "--ty": `${ty}px`,
            }}
          >
            {p.emoji}
          </span>
        );
      })}
    </>
  );
}
