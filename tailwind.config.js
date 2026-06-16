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
        slate: {
          50: 'rgb(var(--tw-color-slate-50) / <alpha-value>)',
          100: 'rgb(var(--tw-color-slate-100) / <alpha-value>)',
          200: 'rgb(var(--tw-color-slate-200) / <alpha-value>)',
          300: 'rgb(var(--tw-color-slate-300) / <alpha-value>)',
          400: 'rgb(var(--tw-color-slate-400) / <alpha-value>)',
          500: 'rgb(var(--tw-color-slate-500) / <alpha-value>)',
          600: 'rgb(var(--tw-color-slate-600) / <alpha-value>)',
          700: 'rgb(var(--tw-color-slate-700) / <alpha-value>)',
          800: 'rgb(var(--tw-color-slate-800) / <alpha-value>)',
          900: 'rgb(var(--tw-color-slate-900) / <alpha-value>)',
          950: 'rgb(var(--tw-color-slate-950) / <alpha-value>)',
        },
        white: 'rgb(var(--tw-color-white) / <alpha-value>)',
        black: 'rgb(var(--tw-color-black) / <alpha-value>)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        shake: 'shake 0.5s ease-in-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        float: 'float 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
