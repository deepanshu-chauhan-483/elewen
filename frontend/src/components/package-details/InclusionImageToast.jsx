import { useEffect } from 'react'
import BrandedImage from '../common/BrandedImage'

/**
 * Mobile inclusion preview: full-screen lightbox (not a fixed bottom thumbnail).
 * Shows the complete image with object-contain.
 */
export default function InclusionImageToast({ image, onClose }) {
  useEffect(() => {
    if (!image) return undefined

    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose?.()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [image, onClose])

  if (!image) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Inclusion image preview"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
        aria-label="Close image preview"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <div
        className="relative flex max-h-[90vh] max-w-full items-center justify-center overflow-auto"
        onClick={event => event.stopPropagation()}
        onKeyDown={() => {}}
        role="presentation"
      >
        <BrandedImage
          src={image}
          alt="Inclusion preview"
          eager
          fill={false}
          cropWatermark={false}
          className="max-h-[90vh] max-w-full"
          imgClassName="max-h-[90vh] max-w-full object-contain"
        />
      </div>
    </div>
  )
}
