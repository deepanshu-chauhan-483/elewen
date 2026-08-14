import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'elewen_inclusion_image_walkthrough_seen'
const AUTO_DISMISS_MS = 5000

function hasSeenWalkthrough() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return true
  }
}

function markWalkthroughSeen() {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export default function InclusionImageWalkthrough({ enabled = false }) {
  const hostRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!enabled || hasSeenWalkthrough()) return undefined

    const host = hostRef.current?.parentElement
    if (!host) return undefined

    let showTimer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        showTimer = window.setTimeout(() => setIsVisible(true), 350)
      },
      { threshold: 0.4 }
    )

    observer.observe(host)

    return () => {
      observer.disconnect()
      window.clearTimeout(showTimer)
    }
  }, [enabled])

  useEffect(() => {
    if (!isVisible) return undefined

    const dismiss = () => {
      markWalkthroughSeen()
      setIsVisible(false)
    }

    const autoTimer = window.setTimeout(dismiss, AUTO_DISMISS_MS)
    const host = hostRef.current?.parentElement

    const handleKeyDown = event => {
      if (event.key === 'Escape') dismiss()
    }

    const handleHostClick = () => dismiss()

    window.addEventListener('keydown', handleKeyDown)
    host?.addEventListener('click', handleHostClick)

    return () => {
      window.clearTimeout(autoTimer)
      window.removeEventListener('keydown', handleKeyDown)
      host?.removeEventListener('click', handleHostClick)
    }
  }, [isVisible])

  if (!enabled) return null

  const dismiss = () => {
    markWalkthroughSeen()
    setIsVisible(false)
  }

  return (
    <div ref={hostRef} className="pointer-events-none absolute inset-x-0 top-0 z-30">
      {isVisible ? (
        <div className="pointer-events-auto absolute bottom-full left-0 mb-1 sm:left-1/2 sm:-translate-x-1/2">
          <div
            className="relative flex max-w-[min(92vw,17.5rem)] items-start gap-2 rounded-[10px] bg-[#591902] px-3 py-2 text-left shadow-[0_8px_20px_rgba(89,25,2,0.22)]"
            role="status"
            aria-live="polite"
          >
            <p className="text-[12px] font-medium leading-[1.4] text-white">
              Click on inclusions to see image
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white/80 hover:text-white"
              aria-label="Dismiss inclusion hint"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                className="h-3 w-3"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <span
              className="inclusion-walkthrough-arrow pointer-events-none absolute left-8 top-[calc(100%-2px)] text-[#591902] sm:left-1/2 sm:-translate-x-1/2"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 28" className="h-7 w-6" fill="currentColor">
                <path d="M12 2c-.6 0-1 .4-1 1v16.2l-4.3-4.3a1 1 0 1 0-1.4 1.4l6 6c.4.4 1 .4 1.4 0l6-6a1 1 0 1 0-1.4-1.4L13 19.2V3c0-.6-.4-1-1-1Z" />
              </svg>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
