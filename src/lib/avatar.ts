// A fun, stable emoji for each player — derived from their name, so it's the same
// everywhere with no storage and no input needed.
export const AVATARS = [
  "⚽️", "🦁", "🐯", "🦅", "🐉", "🔥", "⭐️", "🚀", "🦊", "🐻",
  "🐼", "🦄", "⚡️", "🎯", "👑", "🦈", "🐺", "🐸", "🦖", "🌟",
  "🎩", "🧿", "🪄", "🌺", "🍀", "💎", "🦋", "🐝", "🌊", "🎪"
];

export function emojiFor(name: string, customEmoji?: string | null): string {
  if (customEmoji) return customEmoji;
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATARS[h % AVATARS.length];
}
