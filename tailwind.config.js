/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff5f2',
          100: '#ffe6de',
          200: '#ffc9b8',
          300: '#ffa286',
          400: '#ff7043',
          500: '#f4511e', // primary orange
          600: '#d63c0e',
          700: '#b22a08',
          800: '#8a2109',
          900: '#6b1c0c',
        },
        crimson: {
          500: '#c0392b',
          600: '#a93226',
          700: '#922b21',
        },
        cream: '#fdfaf6',
        charcoal: '#1f1b18',
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
