import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import SmoothScroll from './SmoothScroll'
import { ToastProvider } from './components/common/ToastProvider'
import { CartProvider } from './hooks/useCart'
// import { WishlistProvider } from './hooks/useWishlist'
import { strapiGet } from './lib/strapi'
import { fetchInHousePlannerPageData, fetchLandingPageData } from './hooks/useCmsPages'
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

// Prefetch all 3 public pages + global settings on app init.
// By the time user navigates to any page, CMS content is already cached.
const prefetchCmsPages = async () => {
  const populate = { 'populate[sections][populate]': '*' }
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['cms-page', 'landing'],
      queryFn: fetchLandingPageData,
      staleTime: 10 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['cms-page', 'about'],
      queryFn: () => strapiGet('/about-page', populate).then(r => r.data),
      staleTime: 10 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['cms-page', 'in-house-planner'],
      queryFn: fetchInHousePlannerPageData,
      staleTime: 10 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['global-settings'],
      queryFn: () => strapiGet('/global-setting').then(r => r.data),
      staleTime: 30 * 60 * 1000,
    }),
  ])
}

// Fire prefetch immediately — don't await, don't block render
prefetchCmsPages()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <CartProvider>
          {/* <WishlistProvider> */}
          <SmoothScroll>
            <App />
          </SmoothScroll>
          {/* </WishlistProvider> */}
        </CartProvider>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
