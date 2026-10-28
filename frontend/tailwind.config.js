/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F2F7F5',
          100: '#E1EDE9',
          200: '#C2DBD3',
          300: '#94C0B3',
          400: '#5C9F8F',
          500: '#398070',
          600: '#2C6659',
          700: '#234B43', // Primary deep green
          800: '#1D3D37',
          900: '#18312D',
        },
        tealmuted: {
          500: '#315F62',
          600: '#284E51',
          700: '#1F3C3E',
        },
        slatemuted: {
          400: '#829AB1',
          500: '#627D98', // Muted slate blue
          600: '#486581',
          700: '#334E68',
        },
        warmbg: '#F6F7F5',
        cardbg: '#FFFFFF',
        maintext: '#202A32',
        subtext: '#6B7280',
        lineborder: '#E3E8E5',
        clinicsuccess: '#2E7D32',
        clinicamber: '#B45309',
        clinicdanger: '#C53030',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
