import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4A90E2',
          50: '#E8F2FC',
          100: '#D1E5F9',
          200: '#A3CBF3',
          300: '#75B1ED',
          400: '#4A90E2',
          500: '#4A90E2',
          600: '#3B73B5',
          700: '#2C5688',
          800: '#1D395B',
          900: '#0E1C2E',
        },
        secondary: {
          DEFAULT: '#50E3C2',
          50: '#E8FCF9',
          100: '#D1F9F3',
          200: '#A3F3E7',
          300: '#75EDDB',
          400: '#50E3C2',
          500: '#50E3C2',
          600: '#40B69B',
          700: '#308974',
          800: '#205C4D',
          900: '#102F26',
        },
        accent: {
          DEFAULT: '#F5A623',
          50: '#FEF5E8',
          100: '#FDEBD1',
          200: '#FBD7A3',
          300: '#F9C375',
          400: '#F5A623',
          500: '#F5A623',
          600: '#C4851C',
          700: '#936415',
          800: '#62430E',
          900: '#312207',
        },
        neutral: {
          DEFAULT: '#7B8D93',
          50: '#F5F7F8',
          100: '#EBEFF1',
          200: '#D7DFE3',
          300: '#C3CFD5',
          400: '#AFBFC7',
          500: '#7B8D93',
          600: '#627176',
          700: '#4A5559',
          800: '#31383C',
          900: '#181B1E',
        },
        dark: {
          bg: '#1C1C1C',
          bg2: '#2A2A2A',
          text: '#FFFFFF',
          textSecondary: '#D0D0D0',
          textLegal: '#A0A0A0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        heading: ['24px', { lineHeight: '1.2', fontWeight: '700' }],
        body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        legal: ['14px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        'gutter': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'particle': 'particle 20s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        particle: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100vh) translateX(100px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

