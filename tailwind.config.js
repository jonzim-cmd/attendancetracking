/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        secondary: '#3B82F6',
        chatGray: {
          light: '#F7F7F8', // MainContent und Header im Light Mode
          dark: '#282828',  // Header im Dark Mode
          // Für Buttons bleibt der bestehende Farbwert erhalten:
          button: '#282828',
          // Die Sidebar erhält im Light Mode ein "dunkleres Weiß":
          sidebarLight: '#E5E5E5',
          // Und im Dark Mode einen noch dunkleren Hintergrund:
          sidebarDark: '#141414',
          textLight: '#000000',
          textDark: '#D1D5DB',
          hover: '#4A5568',
        },
      },
    },
  },
  plugins: [],
};
