import { useEffect } from 'react'
import AppImage from '../common/AppImage'

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
            className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-[16px] leading-none text-white transition-colors hover:bg-black/70"
            aria-label="Close image preview"
          >
            ×
          </button>
          <div className="h-[150px] w-full bg-[#E8E2DA]">
            <AppImage
              src={image}
              alt="Inclusion preview"
              eager
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
