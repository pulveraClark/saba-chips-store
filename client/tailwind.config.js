/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sabaGreen: '#16a34a',
        sabaYellow: '#eab308',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(0,0,0,0.08)',
        glow: '0 0 25px rgba(22, 163, 74, 0.15)',
        card: '0 10px 40px -8px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}