import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
      '/cms': {
        target: process.env.VITE_STRAPI_URL || 'http://localhost:1337',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/cms/, ''),
      },
    },
  },
})
