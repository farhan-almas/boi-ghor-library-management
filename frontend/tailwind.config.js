/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: [
    'bg-brand-100', 'text-brand-600', 'bg-emerald-100', 'text-emerald-600',
    'bg-amber-100', 'text-amber-600', 'bg-red-100', 'text-red-600',
    'bg-blue-100', 'text-blue-600',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#efede7',
          100: '#dfdbd1',
          300: '#b8b3a8',
          400: '#8c887f',
          500: '#68675f',
          600: '#53524c',
          700: '#3e3e39',
          800: '#2d2d2a',
        },
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
