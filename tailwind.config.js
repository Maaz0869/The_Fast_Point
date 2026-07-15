/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand/accent palette is driven by CSS variables so it can be
        // swapped at runtime via the color-theme picker (see index.css +
        // ThemeContext). Alpha modifiers still work via <alpha-value>.
        brand: {
          50: 'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
        },
        crimson: {
          500: '#c0392b',
          600: '#a93226',
          700: '#922b21',
        },
        // Theme-aware tokens (flip in dark mode via CSS variables in index.css).
        // `cream`  = page background,  `charcoal` = primary foreground/text.
        // In dark mode the background goes dark and cards stay white.
        cream: 'rgb(var(--cream) / <alpha-value>)',
        charcoal: 'rgb(var(--charcoal) / <alpha-value>)',
        // Fixed dark shade for always-dark areas (footer, dark hero/sidebar).
        night: '#1f1b18',
      },
      fontFamily: {
        display: ['"Poppins"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(0,0,0,0.15)',
        'card-hover': '0 20px 40px -12px rgba(214,60,14,0.25)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-fast': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(120%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out both',
        'fade-in-fast': 'fade-in-fast 0.3s ease-out both',
        'slide-up': 'slide-up 0.6s ease-out both',
        'scale-in': 'scale-in 0.25s ease-out both',
        'toast-in': 'toast-in 0.35s cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
