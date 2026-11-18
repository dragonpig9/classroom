/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', '"Noto Sans HK"', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { 50: '#eef5fd', 100: '#d6e7fa', 500: '#2a78d6', 600: '#1f63b8', 700: '#1a4f91', 900: '#0f2c52' },
      },
    },
  },
  plugins: [],
};
