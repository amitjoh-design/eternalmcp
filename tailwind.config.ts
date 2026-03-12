import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        surface: '#ffffff',
        'surface-2': '#f1f5f9',
        border: '#e2e8f0',
        'border-subtle': '#cbd5e1',
        primary: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
        accent: {
          DEFAULT: '#0891b2',
          light: '#22d3ee',
          dark: '#0e7490',
        },
        violet: {
          glow: '#8b5cf6',
        },
        muted: '#64748b',
        'text-primary': '#0f172a',
        'text-secondary': '#475569',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':
          'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(8,145,178,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(139,92,246,0.06) 0%, transparent 50%)',
        'hero-gradient':
          'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.03) 50%, rgba(8,145,178,0.06) 100%)',
        'card-gradient':
          'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.8) 100%)',
        'glow-gradient':
          'linear-gradient(90deg, #6366f1, #8b5cf6, #0891b2)',
      },
      boxShadow: {
        glow: '0 0 20px rgba(99,102,241,0.2)',
        'glow-lg': '0 0 40px rgba(99,102,241,0.25)',
        'glow-cyan': '0 0 20px rgba(8,145,178,0.2)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.2)',
        glass: '0 8px 32px rgba(0,0,0,0.08)',
        card: '0 4px 24px rgba(0,0,0,0.06)',
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'border-glow': 'border-glow 3s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
          '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shimmer: {
          '0%': { 'background-position': '-200% 0' },
          '100%': { 'background-position': '200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'border-glow': {
          '0%, 100%': { 'border-color': 'rgba(99,102,241,0.3)' },
          '50%': { 'border-color': 'rgba(34,211,238,0.5)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
