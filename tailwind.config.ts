import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        clay: {
          50: "#f8f5f0",
          100: "#f0e8dd",
          200: "#ddccb8",
          300: "#c3a486",
          400: "#b07b54",
          500: "#9a5f36",
          600: "#7b4929",
          700: "#5c341f",
          800: "#3b2114",
          900: "#1d1009"
        },
        sage: {
          50: "#f3f7f2",
          100: "#e3ece1",
          200: "#c3d6be",
          300: "#98b18c",
          400: "#6f8f61",
          500: "#537149",
          600: "#40583a",
          700: "#31442d",
          800: "#222f20",
          900: "#121a12"
        },
        ember: {
          500: "#d16437"
        }
      },
      boxShadow: {
        panel: "0 20px 60px rgba(49, 68, 45, 0.18)"
      },
      fontFamily: {
        sans: ['"Avenir Next"', "Avenir", '"Segoe UI"', "sans-serif"],
        display: ['"Trebuchet MS"', '"Avenir Next"', "sans-serif"]
      },
      backgroundImage: {
        halo:
          "radial-gradient(circle at top left, rgba(209, 100, 55, 0.22), transparent 35%), radial-gradient(circle at right, rgba(111, 143, 97, 0.18), transparent 32%)"
      }
    }
  },
  plugins: []
};

export default config;

