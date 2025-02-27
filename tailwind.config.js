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
          button: '#282828', // Für Buttons bleibt der bestehende Farbwert erhalten:
          sidebarLight: '#eaeaea', // Die Sidebar erhält im Light Mode ein "dunkleres Weiß":
          sidebarDark: '#141414',  // Und im Dark Mode einen noch dunkleren Hintergrund:
          textLight: '#000000',
          textDark: '#D1D5DB',
          hover: '#4A5568',
        },
        // Kontext-spezifische Button-Farben für Header
        'header-btn': {
          DEFAULT: '#F7F7F8', // Light Mode Default
          dark: '#282828',    // Dark Mode Default
          hover: {
            DEFAULT: '#eaeaea', // Light Mode Hover
            dark: '#333333',    // Dark Mode Hover
          },
          selected: {
            DEFAULT: '#eaeaea', // Light Mode Selected
            dark: '#333333',    // Dark Mode Selected
          },
          input: {
            DEFAULT: '#F7F7F8', // Light Mode Input
            dark: '#333333',    // Dark Mode Input
            hover: {
              DEFAULT: '#eaeaea', // Light Mode Input Hover
              dark: '#383838',    // Dark Mode Input Hover
            },
          },
          dropdown: {
            DEFAULT: '#F7F7F8', // Light Mode Dropdown Default
            dark: '#282828',    // Dark Mode Dropdown Default
            hover: {
              DEFAULT: '#eaeaea', // Light Mode Dropdown Hover
              dark: '#444444',    // Dark Mode Dropdown Hover
            },
          },
        },
        // Kontext-spezifische Button-Farben für Sidebar
        'sidebar-btn': {
          DEFAULT: '#eaeaea',
          dark: '#141414',
          hover: {
            DEFAULT: '#F7F7F8',
            dark: '#282828',
          },
          selected: {
            DEFAULT: '#F7F7F8',
            dark: '#282828',
          },
          input: {
            DEFAULT: '#eaeaea',
            dark: '#282828',
            hover: {
              DEFAULT: '#F7F7F8',
              dark: '#141414',
            },
          },
          dropdown: {
            DEFAULT: '#eaeaea', // Light Mode Dropdown Default für Sidebar
            dark: '#141414',    // Dark Mode Dropdown Default für Sidebar
            hover: {
              DEFAULT: '#F7F7F8', // Light Mode Dropdown Hover für Sidebar
              dark: '#282828',    // Dark Mode Dropdown Hover für Sidebar (angepasst!)
            },
          },
        },
        // Kontext-spezifische Button-Farben für MainContent
        'main-btn': {
          DEFAULT: '#F7F7F8', // Light Mode Default
          dark: '#282828',    // Dark Mode Default
          hover: {
            DEFAULT: '#1C86EE', // Light Mode Hover
            dark: '#141414',    // Dark Mode Hover
          },
          selected: {
            DEFAULT: '#FF6347', // Light Mode Selected
            dark: '#141414',    // Dark Mode Selected
          },
          input: {
            DEFAULT: '#00BFFF', // Light Mode Input
            dark: '#141414',    // Dark Mode Input
            hover: {
              DEFAULT: '#00A2E8', // Light Mode Input Hover
              dark: '#282828',    // Dark Mode Input Hover
            },
          },
          dropdown: {
            DEFAULT: '#FFFFFF',
            dark: '#1A1A1A',
            hover: {
              DEFAULT: '#F5F5F5',
              dark: '#2A2A2A',
            },
          },
        },
      },
      // Beispielhafte Utility-Erweiterung, um global Buttons einen Rahmen zu geben
      borderWidth: {
        btn: '2px',
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['dark', 'hover', 'active'],
      borderColor: ['dark', 'hover', 'active'],
    },
  },
  plugins: [],
};