/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // WhatsApp color palette
        'wa-green': '#075E54',
        'wa-green-light': '#128C7E',
        'wa-green-lighter': '#25D366',
        'wa-blue': '#34B7F1',
        'wa-bg': '#ECE5DD',
        'wa-bg-darker': '#E5DDD5',
        'wa-chat-bg': '#F0F2F5',
        'wa-msg-user': '#DCF8C6',
        'wa-msg-bot': '#FFFFFF',
        'wa-text-light': '#8696A0',
      }
    },
  },
  plugins: [],
}