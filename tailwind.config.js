module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'zen-green': '#00FF99',
        'zen-yellow': '#FFFF00',
        'zen-dark-green': '#00CC80',
        'zen-light-green': '#E6FFED',
        'zen-black': '#1A1A1A',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};