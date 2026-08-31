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
        rzp: {
          navy: "#07162C",
          dark: "#02042B",
          blue: "#0066FF",
          blueHover: "#0052CC",
          lightBlue: "#EBF3FF",
          bg: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          subtle: "#64748B",
          text: "#0F172A",
          testMode: "#F59E0B",
        },
      },
    },
  },
  plugins: [],
};
export default config;
