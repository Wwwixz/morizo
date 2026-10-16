import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Бэкенд Spring Boot по умолчанию слушает 8080.
const BACKEND = 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/uploads': { target: BACKEND, changeOrigin: true },
    },
  },
})
