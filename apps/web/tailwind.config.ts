import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#f8fafc",
        muted: "#94a3b8",
        line: "rgba(255,255,255,0.10)",
        panel: "rgba(255,255,255,0.055)",
        surface: "rgba(8,11,23,0.72)",
        accent: "#67e8f9",
        accentDark: "#38bdf8"
      }
    }
  },
  plugins: []
};

export default config;
