import { useEffect, useRef } from 'react'

const preloadedUrls = new Set()
const inflightPreloads = new Map()

/**
 * Preload a single image URL. Resolves when cached or decoded.
 * Safe to call repeatedly — deduped per URL.
 */
export function preloadImage(url) {
  if (!url || typeof url !== 'string') return Promise.resolve()

  if (preloadedUrls.has(url)) return Promise.resolve()

  const pending = inflightPreloads.get(url)
  if (pending) return pending

  const promise = new Promise(resolve => {
    const img = new Image()
    img.decoding = 'async'

    const finish = () => {
      preloadedUrls.add(url)
      inflightPreloads.delete(url)
      resolve()
    }

    img.onload = finish
    img.onerror = finish
    img.src = url

    if (img.complete && img.naturalWidth > 0) {
      finish()
    }
  })

  inflightPreloads.set(url, promise)
  return promise
}

/**
 * Preload multiple image URLs in parallel.
 */
export function preloadImages(urls = []) {
  const unique = [...new Set((urls ?? []).filter(Boolean))]
  return Promise.all(unique.map(preloadImage))
}

/**
 * Hook: starts preloading `urls` once the returned ref element is within
 * `rootMargin` of the viewport. Fires only once per mount.
 */
export function usePreloadOnApproach(urls, rootMargin = '200% 0px') {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !urls.length) return
    let fired = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired) {
          fired = true
          preloadImages(urls)
          observer.disconnect()
        }
      },
      { rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return ref
}
