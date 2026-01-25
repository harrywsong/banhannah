
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pastel Blue as Primary (Lighter, softer shades)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',  // Light pastel blue
          400: '#38bdf8',  // Medium pastel blue
          500: '#7dd3fc',  // Main pastel blue (lighter)
          600: '#38bdf8',  // Darker pastel blue (still light)
          700: '#0ea5e9',  // Deeper blue
          800: '#0284c7',
          900: '#0369a1',
        },
        // Pastel Yellow as Accent
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',  // Light pastel yellow
          400: '#fde047',  // Main pastel yellow
          500: '#facc15',  // Medium yellow
          600: '#eab308',
          700: '#ca8a04',
          800: '#a16207',
          900: '#854d0e',
        },
        // Soft Neutrals
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
