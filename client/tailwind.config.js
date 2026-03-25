/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        sabaYellow: "#FFD84D",
        sabaGreen: "#2F855A",
        sabaLight: "#FFF9DB",
      },
    },
  },
  plugins: [],
}