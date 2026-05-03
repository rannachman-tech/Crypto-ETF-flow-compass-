import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        "fg-subtle": "rgb(var(--fg-subtle) / <alpha-value>)",
        "fg-muted": "rgb(var(--fg-muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        risk: "rgb(var(--risk) / <alpha-value>)",
        safe: "rgb(var(--safe) / <alpha-value>)",
        neutral: "rgb(var(--neutral) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        positive: "rgb(var(--positive) / <alpha-value>)",
        negative: "rgb(var(--negative) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      maxWidth: {
        "screen-2xl": "1440px",
      },
    },
  },
  plugins: [],
};

export default config;
