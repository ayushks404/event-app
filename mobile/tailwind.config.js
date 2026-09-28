/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F46E5', dark: '#3730A3', light: '#EEF2FF' },
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#D97706',
        ink: '#111827',
        muted: '#6B7280',
        line: '#E5E7EB',
        surface: '#F9FAFB',
      },
      borderRadius: { card: '16px', btn: '12px' },
    },
  },
  plugins: [],
};
