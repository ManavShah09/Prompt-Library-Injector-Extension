/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        surface: {
          DEFAULT: '#13131f',
          elevated: '#1a1a2e',
          border: '#252540',
          hover: '#1e1e35',
        },
        ink: {
          primary: '#f1f0ff',
          secondary: '#a9a8c8',
          muted: '#5e5c7a',
          accent: '#a78bfa',
        },
        status: {
          success: '#10b981',
          error: '#f87171',
          warning: '#fbbf24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', '"Fira Code"', 'monospace'],
      },
      width: {
        popup: '380px',
      },
      height: {
        popup: '560px',
      },
      animation: {
        'fade-in':   'fadeIn 0.18s ease-out',
        'slide-up':  'slideUp 0.2s ease-out',
        'slide-in':  'slideIn 0.2s ease-out',
        'spin-slow': 'spin 1.4s linear infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.2)' },
        },
      },
      boxShadow: {
        glow:       '0 0 20px rgba(124, 58, 237, 0.35)',
        'glow-sm':  '0 0 10px rgba(124, 58, 237, 0.25)',
        'inner-glow':'inset 0 0 12px rgba(124, 58, 237, 0.15)',
      },
    },
  },
  plugins: [],
};
