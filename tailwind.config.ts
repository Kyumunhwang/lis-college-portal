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
        brand: {
          900: "#0F172A", // Sidebar Background, Heavy Headers
          800: "#1E3A8A", // Primary Key UI, Active Nav, Buttons
          700: "#1D4ED8", // Button Hover, Interactive Focus
          100: "#DBEAFE", // Active Selection Tint, Badge Background
          50: "#EFF6FF",  // Table Row Highlight, Focused Container
        },
        navy: {
          900: "#0F172A",
          800: "#1E3A8A",
          700: "#1D4ED8",
          100: "#DBEAFE",
          50: "#EFF6FF",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "Roboto Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
