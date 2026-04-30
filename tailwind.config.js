/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary:    '#7C6EF8',
        accent:     '#F472B6',
        success:    '#34D399',
        error:      '#F87171',
        warn:       '#FBBF24',
        'bg-base':  '#0A0A0F',
        'bg-surface':'#111118',
        'bg-card':  '#1A1A24',
        'text-main': '#F8F8FF',
        'text-sub': '#A0A0B8',
        'text-muted': '#5A5A78',
        border:     '#2A2A38',
        ring:       '#7C6EF8',
        background: '#0A0A0F',
        foreground: '#F8F8FF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
