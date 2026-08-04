import { useEffect } from 'react'
import BrandedImage from '../common/BrandedImage'

const AUTO_DISMISS_MS = 3000

export default function InclusionImageToast({ image, onClose }) {
  useEffect(() => {
    if (!image) return undefined

    const timer = setTimeout(() => {
      onClose?.()
    }, AUTO_DISMISS_MS)

    return () => clearTimeout(timer)
  }, [image, onClose])

  if (!image) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-[150] -translate-x-1/2 md:hidden">
      <div className="animate-[slideInBottom_0.3s_ease-out]">
        <div className="relative w-[200px] overflow-hidden rounded-[12px] border border-[#E2CDB8] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            aria-label="Close image preview"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div className="h-[150px] w-full overflow-hidden bg-[#E8E2DA]">
            <BrandedImage
              src={image}
              alt="Inclusion preview"
              eager
              className="h-full w-full"
              imgClassName="object-cover object-top"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
