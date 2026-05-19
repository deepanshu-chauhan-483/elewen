import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      ViteImageOptimizer({
        jpg: { quality: 80 },
        jpeg: { quality: 80 },
        png: { quality: 85 },
        webp: { quality: 80 },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-animation': ['framer-motion', 'gsap'],
            'vendor-ui': ['swiper'],
            'vendor-query': ['@tanstack/react-query'],
          },
        },
      },
    },
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
