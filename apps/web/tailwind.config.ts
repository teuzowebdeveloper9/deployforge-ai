import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17212b",
        line: "#d8dee7",
        panel: "#f8fafc",
        accent: "#0f766e"
      }
    }
  },
  plugins: []
};

export default config;
