/**
 * Build an optimized Cloudinary URL from any Strapi media URL.
 * If the URL is not from Cloudinary (e.g. local fallback), returns as-is.
 *
 * @param {string} url        - Original URL from Strapi API
 * @param {object} options
 * @param {number|'auto'} options.width   - Target width (default: 'auto')
 * @param {number|'auto'} options.quality - Compression quality (default: 'auto')
 * @param {string} options.format         - Output format (default: 'auto' → WebP/AVIF)
 * @param {number|null} options.blur      - Blur strength for LQIP placeholder (default: null)
 */
export function cloudinaryUrl(url, options = {}) {
  if (!url) return null
  if (!url.includes('res.cloudinary.com')) return url

  const { width = 'auto', quality = 'auto', format = 'auto', blur = null } = options

  const transforms = [`w_${width}`, `q_${quality}`, `f_${format}`, blur ? `e_blur:${blur}` : null]
    .filter(Boolean)
    .join(',')

  return url.replace('/upload/', `/upload/${transforms}/`)
}

/**
 * Generate a tiny blurred placeholder URL (LQIP).
 * Loads in under 1kb — renders instantly while full image fetches.
 */
export function placeholderUrl(url) {
  return cloudinaryUrl(url, { width: 20, quality: 10, blur: 200 })
}

/**
 * Responsive srcSet string for Cloudinary images.
 * Use on hero/large images for browser to pick the right size.
 *
 * @param {string} url
 * @param {number[]} widths - Array of widths e.g. [400, 800, 1200]
 */
export function cloudinarySrcSet(url, widths = [400, 800, 1200]) {
  if (!url || !url.includes('res.cloudinary.com')) return undefined
  return widths
    .map(w => `${cloudinaryUrl(url, { width: w, quality: 'auto', format: 'auto' })} ${w}w`)
    .join(', ')
}
