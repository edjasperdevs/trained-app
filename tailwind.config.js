/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme-driven colors via CSS variables
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        border: 'var(--color-border)',
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-muted': 'var(--color-primary-muted)',
        secondary: 'var(--color-secondary)',
        'secondary-hover': 'var(--color-secondary-hover)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-accent': 'var(--color-text-accent)',
        'text-on-primary': 'var(--color-text-on-primary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        'xp-bar': 'var(--color-xp-bar)',
        'xp-bar-bg': 'var(--color-xp-bar-bg)',
        'streak-active': 'var(--color-streak-active)',
        'streak-inactive': 'var(--color-streak-inactive)',
        // Legacy color mappings for backward compatibility during migration
        bg: {
          primary: 'var(--color-background)',
          secondary: 'var(--color-surface)',
          card: 'var(--color-surface)',
        },
        accent: {
          primary: 'var(--color-primary)',
          secondary: 'var(--color-secondary)',
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          danger: 'var(--color-error)',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.05)',
          medium: 'rgba(255, 255, 255, 0.08)',
          heavy: 'rgba(255, 255, 255, 0.12)',
          border: 'var(--color-border)',
        }
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Oswald', 'sans-serif'],
        body: ['var(--font-body)', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: 'var(--border-radius)',
        lg: 'var(--border-radius-lg)',
        card: 'var(--border-radius-card)',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        modal: 'var(--shadow-modal)',
        glow: 'var(--shadow-glow)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'xp-pop': 'xp-pop 0.5s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px var(--color-primary-muted)' },
          '50%': { boxShadow: '0 0 40px var(--color-primary)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'xp-pop': {
          '0%': { transform: 'scale(0) translateY(0)', opacity: '1' },
          '50%': { transform: 'scale(1.2) translateY(-20px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(-40px)', opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
