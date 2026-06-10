/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Luxury Ceylon Spice theme colors
        gold: {
          DEFAULT: "#D4A03A",
          hover: "#E5B94D",
          light: "#F0D48C",
          dark: "#B88A2F",
        },
        ivory: {
          DEFAULT: "#F4F1EA",
          muted: "#B8B2A6",
        },
        charcoal: {
          DEFAULT: "#0B0B0C",
          light: "#111114",
          card: "#151519",
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Cormorant Garamond Fallback', 'Georgia', 'serif'],
        body: ['Inter', 'Inter Fallback', 'Arial', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        'hero': ['clamp(44px, 5.2vw, 84px)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'h2': ['clamp(34px, 3.6vw, 56px)', { lineHeight: '1.0' }],
        'h3': ['clamp(24px, 2.4vw, 36px)', { lineHeight: '1.1' }],
        'body': ['clamp(15px, 1.1vw, 18px)', { lineHeight: '1.65' }],
        'label': ['12px', { lineHeight: '1.4', letterSpacing: '0.18em' }],
      },
      borderRadius: {
        'card': '22px',
        'pill': '999px',
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'card': '0 28px 70px rgba(0,0,0,0.55)',
        'button': '0 10px 28px rgba(0,0,0,0.35)',
        'gold': '0 25px 50px rgba(212,160,58,0.3)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-gold": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "float": "float 3s ease-in-out infinite",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
