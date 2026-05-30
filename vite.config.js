import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/auth': 'http://127.0.0.1:3001',
    },
    watch: {
      ignored: ['**/mockServiceWorker.js'],
    },
  },
})
