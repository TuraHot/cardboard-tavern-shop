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
        vanguard: {
          void: '#05070b',
          dark: '#080c14',
          surface: '#0e1422',
          card: '#121929',
          cardHover: '#162035',
          border: 'rgba(255, 255, 255, 0.08)',
          borderGold: 'rgba(245, 158, 11, 0.3)',
          gold: '#f59e0b',
          goldLight: '#fde68a',
          dragon: '#ef4444',
          darkstates: '#818cf8',
          brandt: '#22d3ee',
          keter: '#fbbf24',
          stoicheia: '#34d399',
          lyrical: '#f472b6',
        }
      },
      fontFamily: {
        sans: ['Prompt', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'card-glow': '0 0 25px -5px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'gold-glow': '0 0 30px -5px rgba(245, 158, 11, 0.25)',
        'cyan-glow': '0 0 30px -5px rgba(34, 211, 238, 0.25)',
      }
    },
  },
  plugins: [],
}
