/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1a2035',
          light: '#243050',
          dark: '#121728',
        },
        gold: {
          DEFAULT: '#c69c6d',
          light: '#d4b48a',
          dark: '#a87d4e',
        },
      },
    },
  },
  plugins: [],
}
