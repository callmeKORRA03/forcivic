import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  server: {
    proxy: {
      // '/api': 'https://civic-issue-reporter-application.onrender.com',
      '/api': 'http://localhost:4000/',
    },
  },
  plugins: [
    tailwindcss(),
  ],
})