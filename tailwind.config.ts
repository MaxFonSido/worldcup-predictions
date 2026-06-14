import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: "#0E7A4F", // vibrant pitch green (brand)
          deep: "#0B5138",
          dark: "#093A2A"
        },
        gold: {
          DEFAULT: "#D9A521", // the "Golden Token"
          soft: "#F3D88A"
        },
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["var(--font-vazir)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,32,26,.06), 0 8px 24px rgba(20,32,26,.06)"
      }
    }
  },
  plugins: []
};
export default config;
