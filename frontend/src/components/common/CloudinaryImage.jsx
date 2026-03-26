import { useState, useRef, useEffect } from 'react'
import { cloudinaryUrl, placeholderUrl, cloudinarySrcSet } from '../../utils/cloudinary'

/**
 * CloudinaryImage
 *
 * Drop-in <img> replacement that:
 * - Serves optimized WebP/AVIF from Cloudinary
 * - Shows a blurred LQIP placeholder while full image loads
 * - Calls onReady() when image is loaded — use to gate animations
 * - Falls back gracefully for local/non-Cloudinary URLs
 *
 * Props:
 *   src        {string}   Strapi media URL (Cloudinary or local fallback)
 *   alt        {string}   Alt text
 *   width      {number}   Target render width for Cloudinary optimization
 *   srcSetWidths {number[]} Responsive breakpoints (default: [400, 800, 1200])
 *   sizes      {string}   HTML sizes attribute for responsive images
 *   eager      {boolean}  true = loading="eager" for above-fold/hero images
 *   onReady    {function} Fires when image finishes loading — use for animation gating
 *   className  {string}   Applied to the outer wrapper div
 *   imgClassName {string} Applied directly to the <img> element
 */
export default function CloudinaryImage({
  src,
  alt = '',
  width,
  srcSetWidths = [400, 800, 1200],
  sizes,
  eager = false,
  onReady,
  className = '',
  imgClassName = '',
}) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef(null)

  const optimizedSrc = cloudinaryUrl(src, { width, quality: 'auto', format: 'auto' })
  const placeholder = placeholderUrl(src)
  const srcSet = cloudinarySrcSet(src, srcSetWidths)

  // If image is already in browser cache, fire onReady immediately.
  // Use a microtask to avoid calling setState synchronously inside an effect.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      Promise.resolve().then(() => {
        setLoaded(true)
        onReady?.()
      })
    }
  }, [onReady])

  const handleLoad = () => {
    setLoaded(true)
    onReady?.()
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* LQIP blurred placeholder — renders instantly from tiny URL */}
      {!loaded && placeholder && src?.includes('res.cloudinary.com') && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm"
        />
      )}

      {/* Full optimized image */}
      <img
        ref={imgRef}
        src={optimizedSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${imgClassName}`}
      />
    </div>
  )
}
