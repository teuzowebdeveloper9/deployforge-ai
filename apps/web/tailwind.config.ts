import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        muted: "#64748b",
        line: "#d9e0ea",
        panel: "#f6f8fb",
        surface: "#ffffff",
        accent: "#0f766e",
        accentDark: "#0b5f59"
      }
    }
  },
  plugins: []
};

export default config;
