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
        blade: {
          navy: "#07162C",
          darkNavy: "#02042B",
          blue: "#0066FF",
          blueHover: "#0052CC",
          lightBlue: "#EBF3FF",
          bg: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          subtleText: "#64748B",
          heading: "#0F172A",
          whatsapp: "#25D366",
          whatsappHover: "#20BD5A",
        },
      },
      boxShadow: {
        blade: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        bladeHover: "0 4px 12px -2px rgba(0, 102, 255, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
