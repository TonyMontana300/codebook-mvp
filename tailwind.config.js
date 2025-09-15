/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./views/**/*.ejs",
    "./public/**/*.{html,js}",
    "./src/**/*.{html,js}",
    "./public/codeBook/**/*.{html,js}", // Add CodeBook paths
  ],
  theme: {
    extend: {
      fontFamily: {
        'handwriting': ['Kalam', 'cursive'],
        'casual': ['Caveat', 'cursive'],
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s infinite',
        'fadeIn': 'fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      colors: {
        'codebook': {
          'primary': '#22c55e',
          'secondary': '#16a34a',
          'accent': '#7bf1a8',
          'bg': '#f0fdf4',
        }
      }
    },
  },
  plugins: [],
}
