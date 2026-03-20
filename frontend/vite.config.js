import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
        '/cms': {
          target: env.VITE_STRAPI_URL || 'http://localhost:1337',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/cms/, ''),
        },
      },
    },
  }
})
