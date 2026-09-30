import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        surface: '#1E293B',
        'surface-2': '#253349',
        border: '#334155',
        text: '#F1F5F9',
        muted: '#94A3B8',
        primary: '#6366F1',
        'primary-dark': '#4F46E5',
        sponsorship: '#8B5CF6',
        match: {
          high: '#22C55E',
          medium: '#F59E0B',
          low: '#EF4444',
        },
        skill: {
          matched: '#16A34A',
          missing: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        score: ['40px', { lineHeight: '1', fontWeight: '800', letterSpacing: '-0.02em' }],
        verdict: ['15px', { lineHeight: '1.6', fontWeight: '500' }],
        chip: ['12px', { lineHeight: '1.2', fontWeight: '600' }],
        company: ['16px', { lineHeight: '1.3', fontWeight: '600' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.30), 0 1px 3px rgba(0, 0, 0, 0.22)',
        lift: '0 18px 40px rgba(0, 0, 0, 0.45)',
        focus: '0 0 0 4px rgba(99, 102, 241, 0.22)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-520px 0' },
          '100%': { backgroundPosition: '520px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.3s ease-out both',
        shimmer: 'shimmer 1.5s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
