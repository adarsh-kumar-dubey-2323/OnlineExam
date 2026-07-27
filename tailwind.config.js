/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: "#F5F5F7",
          blue: "#0071E3",
          text: "#1D1D1F",
          gray: "#86868B"
        }
      }
    },
  },
  plugins: [],
}