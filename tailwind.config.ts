import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark green aesthetic from the AI Product Ops deck
        ink: {
          900: "#0a0f0d",
          800: "#0e1714",
          700: "#13201c",
          600: "#1a2b25",
          500: "#243a32",
        },
        brand: {
          50: "#e9fbf1",
          100: "#c8f7dd",
          200: "#9af0c2",
          300: "#5fe39e",
          400: "#2fd07f",
          500: "#16b86a",
          600: "#0f9457",
          700: "#0d7345",
        },
        accent: "#5fe39e",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
