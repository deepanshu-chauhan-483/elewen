import { useEffect, useState } from 'react'
import { preloadImage } from '../../utils/preloadAssets'

/**
 * Image that preloads before fading in — avoids visible pop-in on slow networks.
 */
export default function AppImage({
  src,
  alt = '',
  className = '',
  eager = false,
  onLoad,
  onError,
  style,
  ...rest
}) {
  const [loadedSrc, setLoadedSrc] = useState('')
  const isLoaded = Boolean(src) && loadedSrc === src

  useEffect(() => {
    if (!src) return undefined

    let cancelled = false

    preloadImage(src).then(() => {
      if (!cancelled) setLoadedSrc(src)
    })

    return () => {
      cancelled = true
    }
  }, [src])

  const handleLoad = event => {
    if (src) setLoadedSrc(src)
    onLoad?.(event)
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleLoad}
      onError={onError}
      style={{ imageOrientation: 'from-image', ...style }}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      {...rest}
    />
  )
}
