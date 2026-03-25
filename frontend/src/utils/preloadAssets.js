import { useEffect, useRef } from 'react'

/**
 * Immediately fire off browser fetches for an array of image URLs.
 * Results are cached so the actual <img> elements render from cache.
 */
export function preloadImages(urls) {
  urls.forEach(url => {
    const img = new Image()
    img.src = url
  })
}

/**
 * Hook: starts preloading `urls` once the returned ref element is within
 * `rootMargin` of the viewport. Fires only once per mount.
 *
 * Usage:
 *   const ref = usePreloadOnApproach([img1, img2], '200% 0px')
 *   <section ref={ref}>...</section>
 *
 * @param {string[]} urls        image URLs to preload
 * @param {string}   rootMargin  how far ahead to trigger (default 200vh)
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
    // urls / rootMargin are intentionally stable constants passed from module scope
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return ref
}
