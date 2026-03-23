import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import SmoothScroll from './SmoothScroll'
import './index.css'

// Prevent browser from restoring scroll on reload — ensures page always starts from top
if (typeof window !== 'undefined') {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // CMS content: serve stale data instantly, refetch silently in background
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      // Don't retry aggressively — Strapi may not be running in dev
      retry: 1,
      retryDelay: 2000,
      // Never suspend or throw — fallback data handles empty states
      throwOnError: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SmoothScroll>
        <App />
      </SmoothScroll>
    </QueryClientProvider>
  </React.StrictMode>
)
