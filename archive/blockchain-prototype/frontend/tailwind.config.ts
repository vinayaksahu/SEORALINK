import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        seoralink: {
          bg: '#040711',
          'bg-card': '#0d1424',
          'bg-surface': '#0b1120',
          gold: '#d4af37',
          cyan: '#38bdf8',
          'cyan-bright': '#00f2fe',
          green: '#10b981',
          purple: '#a855f7',
          'purple-deep': '#7928ca',
          'text-primary': '#ffffff',
          'text-secondary': '#e2e8f0',
          'text-body': '#cbd5e1',
          'text-muted': '#94a3b8',
          'text-dim': '#64748b',
          'border-gold': 'rgba(212, 175, 55, 0.3)',
          'border-subtle': 'rgba(148, 163, 184, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
