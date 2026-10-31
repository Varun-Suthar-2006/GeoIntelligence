/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0F19', // Dark navy/charcoal
        surface: {
          DEFAULT: '#111827',
          light: '#1F2937',
          border: '#374151'
        },
        primary: {
          DEFAULT: '#2563EB', // Restrained electric blue
          light: '#3B82F6',
          dark: '#1D4ED8'
        },
        accent: {
          teal: '#0D9488',
          amber: '#D97706',
          rose: '#E11D48',
          emerald: '#059669'
        },
        text: {
          primary: '#F9FAFB',
          secondary: '#9CA3AF',
          muted: '#6B7280'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
