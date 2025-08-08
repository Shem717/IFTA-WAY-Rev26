/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'light-bg': '#F7F8FA',
        'light-card': '#FFFFFF',
        'light-text': '#1e293b',
        'light-text-secondary': '#64748b',
        'light-accent': '#2563eb',
        'light-border': '#e2e8f0',
        'dark-bg': '#1C1F2D',
        'dark-card': '#2A2F45',
        'dark-text': '#f1f5f9',
        'dark-text-secondary': '#94a3b8',
        'dark-accent': '#22d3ee',
        'dark-border': '#334155',
      }
    },
  },
  plugins: [],
}
