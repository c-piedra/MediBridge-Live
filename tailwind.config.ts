import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Healthcare App palette — calm cyan + health green (UI/UX Pro Max, row 8)
      colors: {
        primary: {
          DEFAULT: "#0891B2",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#22D3EE",
          foreground: "#0F172A",
        },
        accent: {
          DEFAULT: "#059669",
          foreground: "#FFFFFF",
        },
        background: "#ECFEFF",
        foreground: "#164E63",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#164E63",
        },
        muted: {
          DEFAULT: "#E8F1F6",
          foreground: "#64748B",
        },
        border: "#A5F3FC",
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        ring: "#0891B2",
        // Panel-specific tints
        spanish: {
          bg: "#F0FDFF",
          border: "#67E8F9",
          badge: "#0E7490",
          text: "#164E63",
        },
        english: {
          bg: "#F0FDF9",
          border: "#6EE7B7",
          badge: "#065F46",
          text: "#064E3B",
        },
      },
      // Corporate Trust typography — Lexend + Source Sans 3 (row 16)
      fontFamily: {
        heading: ["Lexend", "sans-serif"],
        body: ["Source Sans 3", "sans-serif"],
        sans: ["Source Sans 3", "sans-serif"],
      },
      fontSize: {
        "transcript": ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        "translation": ["1.125rem", { lineHeight: "1.625rem" }],
      },
      animation: {
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        "fade-in": "fade-in 200ms ease-out",
        "slide-up": "slide-up 200ms ease-out",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "1" },
          "70%": { transform: "scale(1.2)", opacity: "0.4" },
          "100%": { transform: "scale(0.9)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
