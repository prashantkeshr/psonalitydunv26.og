/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#06070A', 900: '#0A0C11', 800: '#10131A', 700: '#171B24', 600: '#222836' },
        line: 'rgba(255,255,255,0.08)',
        mist: '#A7B0C0',
        teal: { DEFAULT: '#29D8F2', soft: '#8CEBFA' },
        magenta: { DEFAULT: '#E14BD7', soft: '#F29BEB' },
        violet: { DEFAULT: '#8B5CF6', soft: '#B59BFF' },
        ember: '#FF7A45',
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: { page: '1240px' },
      keyframes: {
        scan: { '0%,100%': { transform: 'translateY(0%)' }, '50%': { transform: 'translateY(100%)' } },
        pulseDot: { '0%,100%': { opacity: '0.35' }, '50%': { opacity: '1' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      animation: {
        scan: 'scan 4s ease-in-out infinite',
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
};
