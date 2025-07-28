module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Ensures dark mode is controlled via class
  theme: {
    extend: {
      colors: {
        'midnight-blue': '#1e293b',
        'evening-blue': '#334155',
        'night-blue': '#0f172a',
      },
    },
  },
  plugins: [],
};