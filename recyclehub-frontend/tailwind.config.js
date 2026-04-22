/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
      },
      spacing: {
        navbar: 'var(--layout-navbar-height)',
        sidebar: 'var(--layout-sidebar-width)',
      },
      maxWidth: {
        content: 'var(--layout-content-max)',
        prose: '65ch',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      colors: {
        hub: {
          bg: 'var(--hub-bg)',
          section: 'var(--hub-section)',
          card: 'var(--hub-card)',
          surface: 'var(--hub-surface)',
          surface2: 'var(--hub-surface-2)',
          canvas: 'var(--hub-canvas)',
          border: 'var(--hub-border)',
          'border-subtle': 'var(--hub-border-subtle)',
          accent: 'var(--hub-accent)',
          accentHover: 'var(--hub-accent-hover)',
          accentSoft: 'var(--hub-accent-soft)',
          gold: '#f59e0b',
          danger: 'var(--hub-danger)',
          warning: 'var(--hub-warning)',
          success: 'var(--hub-success)',
          info: 'var(--hub-info)',
          muted: 'var(--hub-muted)',
          text: 'var(--hub-text)',
          textMuted: 'var(--hub-text-muted)',
          light: 'var(--hub-text-dim)',
          dark: 'var(--hub-dark)',
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)`,
        'app-canvas':
          'linear-gradient(180deg, var(--hub-canvas-top) 0%, var(--hub-canvas-mid) 42%, var(--hub-canvas-bottom) 100%)',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        btn: 'var(--shadow-btn)',
        shell: 'var(--shadow-shell)',
        nav: 'var(--shadow-nav)',
        inset: 'var(--shadow-inset)',
      },
      ringColor: {
        hub: 'var(--hub-ring)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))',
        'slide-up': 'slideUp 0.5s var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)) both',
        'pulse-emerald': 'pulseEmerald 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        pulseEmerald: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
      },
    },
  },
  plugins: [],
};
