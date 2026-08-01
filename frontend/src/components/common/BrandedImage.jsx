import { useState } from 'react'
import AppImage from './AppImage'

const POSITION_MAP = {
  'bottom-left': 'bottom-2 left-2',
  'bottom-right': 'bottom-0.5 right-1',
}

/**
 * BrandedImage
 *
 * Fills the frame fully. When cropWatermark is on, scales from the top so only
 * the bottom strip (Gemini mark) is clipped by overflow — no empty white gaps.
 */
export default function BrandedImage({
  src,
  alt = '',
  fallbackSrc,
  position = 'bottom-right',
  showLogo = false,
  showLogoBg = true,
  cropWatermark = true,
  eager = false,
  className = '',
  imgClassName = '',
  logoClassName = '',
}) {
  const [failedSources, setFailedSources] = useState({})
  const hasFailed = Boolean(src) && Boolean(failedSources[src])
  const activeSrc = hasFailed && fallbackSrc ? fallbackSrc : src

  const handleError = () => {
    if (src && fallbackSrc && !hasFailed) {
      setFailedSources(prev => ({ ...prev, [src]: true }))
    }
  }

  const positionClasses = POSITION_MAP[position] ?? POSITION_MAP['bottom-right']
  // Scale from top; parent overflow:hidden clips the bottom watermark only.
  const cropClasses = cropWatermark ? 'scale-[1.12] origin-top' : ''

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AppImage
        src={activeSrc}
        alt={alt}
        eager={eager}
        onError={handleError}
        className={`h-full w-full object-cover object-top ${cropClasses} ${imgClassName}`}
      />

      {showLogo ? (
        <div
          aria-hidden="true"
          className={`absolute ${positionClasses} z-10 p-1.5 ${
            showLogoBg ? 'bg-white/10 backdrop-blur-xs rounded-full' : ''
          } ${logoClassName}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 343 398"
            fill="none"
          >
            <path
              d="M94.5506 0L0 46.2991L4.29775 55.2139C16.9045 49.2707 26.7416 46.2991 33.809 46.2991C38.7753 46.2991 42.9775 47.737 46.4157 50.6127C50.0449 53.4884 52.5281 57.9937 53.8652 64.1286C55.7753 72.1806 56.7303 90.3935 56.7303 118.767V329.27C56.7303 352.659 55.6798 366.75 53.5787 371.543C51.4775 376.145 47.7528 379.883 42.4045 382.759C37.0562 385.443 25.2135 386.976 6.8764 387.36V398H104.006V329.27V0H94.5506Z"
              fill="black"
            />
            <path
              d="M255.343 0L124 69.6041L128.298 78.5188C140.905 72.5756 187.533 46.2991 194.601 46.2991C199.567 46.2991 203.769 47.737 207.207 50.6127C210.836 53.4884 213.32 57.9937 214.657 64.1286C216.567 72.1806 217.522 90.3935 217.522 118.767V132H264.798V0H255.343Z"
              fill="black"
            />
            <path
              d="M167.668 387.36V398H264.798V329.27V328H217.522V329.27C217.522 352.659 216.471 366.75 214.37 371.543C212.269 376.145 208.544 379.883 203.196 382.759C197.848 385.443 186.005 386.976 167.668 387.36Z"
              fill="black"
            />
            <path
              d="M132 356.32C132.524 363.657 133.324 368.551 134.402 371C136.499 375.571 140.164 379.643 145.5 382.5C150.208 384.853 160.349 386.537 175.235 387.163L207 387.375V398H124V0H132V356.32Z"
              fill="black"
            />
            <path
              d="M293 356.32C293.524 363.657 294.324 368.551 295.402 371C297.499 375.571 301.164 379.643 306.5 382.5C311.836 385.167 324.152 386.976 342.448 387.357L342.436 387.488L343 387.494V398H285V0H293V356.32Z"
              fill="black"
            />
          </svg>
        </div>
      ) : null}
    </div>
  )
}
