import { useEffect, useState } from 'react'
import { preloadImage } from '../../utils/preloadAssets'

/** Crop bottom edge where Gemini watermarks sit on package photos. */
export const GEMINI_MARK_CLIP = 'inset(0 0 14% 0)'

/**
 * Image that preloads before fading in — avoids visible pop-in on slow networks.
 *
 * cropGeminiMark: clips the bottom so AI watermarks are not visible (display-only).
 */
export default function AppImage({
  src,
  alt = '',
  className = '',
  eager = false,
  cropGeminiMark = false,
  style,
  onLoad,
  onError,
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

  const cropStyle = cropGeminiMark
    ? {
        clipPath: GEMINI_MARK_CLIP,
        WebkitClipPath: GEMINI_MARK_CLIP,
      }
    : null

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleLoad}
      onError={onError}
      style={{ imageOrientation: 'from-image', ...cropStyle, ...style }}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      {...rest}
    />
  )
}
