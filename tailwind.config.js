/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#58180D',
        paper: '#fdf1dc',
        border: '#d2b38c',
      },
      fontFamily: {
        'display': ['Cinzel', 'serif'],
        'body': ['Crimson Pro', 'serif'],
      },
    },
  },
  plugins: [],
}

