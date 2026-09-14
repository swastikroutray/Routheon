/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        claude: {
          bg: '#000000',
          sidebar: '#111111',
          surface: '#1a1a1a',
          border: '#2a2a2a',
          text: '#f5f5f5',
          muted: '#9a9a9a',
          accent: '#ffffff',
          accentHover: '#e0e0e0',
        },
      },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [],
}
