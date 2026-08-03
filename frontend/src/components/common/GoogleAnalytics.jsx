import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const GA_MEASUREMENT_ID = 'G-RZM6FDENC3'

/**
 * Sends a GA4 page_view on every client-side route change.
 * The initial page_view is already sent by gtag('config') in index.html.
 */
export default function GoogleAnalytics() {
  const location = useLocation()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (typeof window.gtag !== 'function') return

    const pagePath = `${location.pathname}${location.search}`
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
      send_to: GA_MEASUREMENT_ID,
    })
  }, [location.pathname, location.search])

  return null
}
