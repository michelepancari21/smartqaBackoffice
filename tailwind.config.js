/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'dark',
    {
      pattern: /^(bg|text|border|from|via|to)-(slate|gray|purple|cyan|blue|yellow|green|red)-(50|100|200|300|400|500|600|700|800|900)$/,
      variants: ['dark', 'hover', 'dark:hover'],
    },
  ],
};
