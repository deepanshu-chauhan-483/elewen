/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        admin: {
          ink: '#2B211B',
          clay: '#5D2E17',
          sand: '#F3EBE4',
          mist: '#FBF7F4',
        },
      },
    },
  },
  plugins: [],
}
