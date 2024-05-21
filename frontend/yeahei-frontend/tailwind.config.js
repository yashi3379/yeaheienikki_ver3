/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html}"],
  theme: {
    extend: {
      backgroundImage: theme => ({
        'custom-background': "url('/src/images/PC_background.jpg')",
      })
    }
  },
  plugins: [
    require('@tailwindcss/line-clamp')
  ],
}