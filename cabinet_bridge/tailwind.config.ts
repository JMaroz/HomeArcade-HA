import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        /* MD3 Shape Scale */
        sm:   "0.25rem",   /* 4px  — extra-small */
        md:   "0.5rem",    /* 8px  — small       */
        lg:   "0.75rem",   /* 12px — medium      */
        xl:   "1rem",      /* 16px — large       */
        "2xl":"1.75rem",   /* 28px — extra-large */
      },
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input:  "hsl(var(--input) / <alpha-value>)",

        /* MD3 Surface containers */
        surface: {
          DEFAULT:  "hsl(var(--surface-container) / <alpha-value>)",
          lowest:   "hsl(var(--surface-container-lowest) / <alpha-value>)",
          low:      "hsl(var(--surface-container-low) / <alpha-value>)",
          high:     "hsl(var(--surface-container-high) / <alpha-value>)",
          highest:  "hsl(var(--surface-container-highest) / <alpha-value>)",
        },

        card: {
          DEFAULT:    "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border:     "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border:     "hsl(var(--popover-border) / <alpha-value>)",
        },
        primary: {
          DEFAULT:            "hsl(var(--primary) / <alpha-value>)",
          foreground:         "hsl(var(--primary-foreground) / <alpha-value>)",
          border:             "var(--primary-border)",
          container:          "hsl(var(--primary-container) / <alpha-value>)",
          "on-container":     "hsl(var(--on-primary-container) / <alpha-value>)",
        },
        secondary: {
          DEFAULT:            "hsl(var(--secondary) / <alpha-value>)",
          foreground:         "hsl(var(--secondary-foreground) / <alpha-value>)",
          border:             "var(--secondary-border)",
          container:          "hsl(var(--secondary-container) / <alpha-value>)",
          "on-container":     "hsl(var(--on-secondary-container) / <alpha-value>)",
        },
        tertiary: {
          DEFAULT:            "hsl(var(--tertiary) / <alpha-value>)",
          foreground:         "hsl(var(--tertiary-foreground) / <alpha-value>)",
          container:          "hsl(var(--tertiary-container) / <alpha-value>)",
          "on-container":     "hsl(var(--on-tertiary-container) / <alpha-value>)",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border:     "var(--muted-border)",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border:     "var(--accent-border)",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border:     "var(--destructive-border)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring:       "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT:    "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border:     "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT:    "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border:     "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT:    "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border:     "var(--sidebar-accent-border)",
        },
        status: {
          online:  "rgb(34 197 94)",
          away:    "rgb(245 158 11)",
          busy:    "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },
      },
      fontFamily: {
        sans:    ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono:    ["var(--font-mono)"],
      },
      backgroundImage: {
        "arcade-gradient":
          "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
