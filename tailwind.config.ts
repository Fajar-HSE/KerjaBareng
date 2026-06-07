import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Industrial/Mature palette
        primary: {
          DEFAULT: "#1a5f7a",
          hover: "#0e4a60",
          light: "#e8f4f8",
          50: "#f0f8fb",
          100: "#d9eef5",
          200: "#b3ddeb",
          500: "#1a5f7a",
          600: "#0e4a60",
          700: "#0a3a4e",
        },
        secondary: {
          DEFAULT: "#d97706",
          hover: "#b45309",
          light: "#fef3c7",
        },
        success: "#059669",
        warning: "#d97706",
        error: "#dc2626",
        info: "#0284c7",
        // Cool slate grays
        gray: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        heading: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "heading-1": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "heading-2": ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "500" }],
        "heading-3": ["1.25rem", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "500" }],
        "body-lg": ["1rem", { lineHeight: "1.5" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.06)",
        sidebar: "1px 0 0 0 #e2e8f0",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
