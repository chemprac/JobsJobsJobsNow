import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        app: {
          background: "#0f0f0f",
          card: "#1a1a1a",
          border: "#2a2a2a",
          muted: "#a3a3a3"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
