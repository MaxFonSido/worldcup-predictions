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

type Particle = { id: number; emoji: string; x: number; y: number; angle: number; distance: number; size: number; delay: number };

let nextId = 0;

export default function EmojiBurst() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const burst = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];
    const maxDim = Math.max(window.innerWidth, window.innerHeight);

    const newParticles: Particle[] = Array.from({ length: 50 }, () => ({
      id: nextId++,
      emoji: set[Math.floor(Math.random() * set.length)],
      x: cx,
      y: cy,
      angle: Math.random() * 360,
      distance: maxDim * 0.3 + Math.random() * maxDim * 0.6,
      size: 1.2 + Math.random() * 1.8,
      delay: Math.random() * 150,
    }));

    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
    }, 2000);
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
              fontSize: `${p.size}rem`,
              animationDelay: `${p.delay}ms`,
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
