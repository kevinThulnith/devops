/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        md: "0 4px 12px rgba(0, 0, 0, 0.6), 0 0 8px rgba(255, 255, 255, 0.05)",
        lg: "0 4px 16px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.04)",
      },
      colors: {
        "star-dust": {
          50: "oklch(0.98 0.002 270)", // very light gray
          100: "oklch(0.94 0.003 270)",
          200: "oklch(0.87 0.004 270)",
          300: "oklch(0.78 0.005 270)",
          400: "oklch(0.72 0.006 270)",
          500: "oklch(0.684 0.007 270)", // base: #a1a1a1
          600: "oklch(0.60 0.007 270)",
          700: "oklch(0.52 0.007 270)",
          800: "oklch(0.43 0.006 270)",
          900: "oklch(0.35 0.005 270)",
          950: "oklch(0.25 0.004 270)", // very dark gray
        },
        "card-main": "#2a2a2a",
        "card-sub": "#3a3a3a",
        "card-accent": "#4a4a4a",
      },
    },
  },
  plugins: [],
};
