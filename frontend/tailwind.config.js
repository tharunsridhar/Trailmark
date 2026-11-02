/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        stone: {
          50: '#FAF9F6',
          100: '#F4F4F0',
          200: '#EAEAE2',
          300: '#DCDCD2',
          400: '#A8A89A',
          500: '#7A7A6E',
          600: '#5A5B4C', // Reference olive-taupe primary accent
          700: '#4A4B3E',
          800: '#3A3B30',
          900: '#262720',
        },
        page: '#F4F4F0',
        card: '#FFFFFF',
        accent: {
          DEFAULT: '#5A5B4C',
          hover: '#4A4B3E',
          light: '#F0F0E8',
        },
        ink: {
          title: '#1F201B',
          body: '#3A3B34',
          muted: '#7A7B72',
          subtle: '#A2A399',
        },
        border: {
          DEFAULT: '#E6E6DE',
          subtle: '#EFEFEA',
        },
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(35, 36, 30, 0.04), 0 1px 3px -1px rgba(35, 36, 30, 0.02)',
        elevated: '0 8px 24px -4px rgba(35, 36, 30, 0.06), 0 2px 6px -2px rgba(35, 36, 30, 0.03)',
      },
    },
  },
  plugins: [],
}
