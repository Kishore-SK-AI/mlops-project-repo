/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(215, 85%, 38%)",
          foreground: "#ffffff",
          hover: "hsl(215, 85%, 32%)",
        },
        secondary: {
          DEFAULT: "hsl(210, 40%, 96%)",
          foreground: "hsl(222.2, 47.4%, 11.2%)",
        },
        accent: {
          DEFAULT: "hsl(187, 85%, 43%)",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "hsl(210, 40%, 96.1%)",
          foreground: "hsl(215.4, 16.3%, 46.9%)",
        },
        card: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(222.2, 84%, 4.9%)",
        },
      },
    },
  },
  plugins: [],
};
