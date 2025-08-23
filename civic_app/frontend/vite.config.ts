import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  server: {
    proxy: {
      '/api': 'https://forcivic-1.onrender.com',
    },
  },
  plugins: [
    tailwindcss(),
  ],
})