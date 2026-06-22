import bulb1 from '../assets/lightbulb_images/bulb1.png'
import bulb2 from '../assets/lightbulb_images/bulb2.png'
import navLogo from '../assets/images/navbar.png'
import { preloadImages } from './preloadAssets'

/** Images visible immediately after the hero preloader fades (landing tier 1). */
export const HOME_TIER1_IMAGE_URLS = [bulb1, bulb2, navLogo]

const VIDEO_READY_TIMEOUT_MS = 15000
const CMS_READY_TIMEOUT_MS = 12000

export function preloadVideo(url) {
  if (!url || typeof url !== 'string') return Promise.resolve()

  return new Promise(resolve => {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true

    const finish = () => {
      video.removeAttribute('src')
      video.load()
      resolve()
    }

    const timeoutId = setTimeout(finish, VIDEO_READY_TIMEOUT_MS)

    video.oncanplaythrough = () => {
      clearTimeout(timeoutId)
      finish()
    }
    video.onloadeddata = () => {
      clearTimeout(timeoutId)
      finish()
    }
    video.onerror = () => {
      clearTimeout(timeoutId)
      finish()
    }

    video.src = url
    video.load()
  })
}

export function waitForVideoElement(videoEl, timeoutMs = VIDEO_READY_TIMEOUT_MS) {
  if (!videoEl) return Promise.resolve()
  if (videoEl.readyState >= 2) return Promise.resolve()

  return new Promise(resolve => {
    const finish = () => {
      videoEl.removeEventListener('canplay', finish)
      videoEl.removeEventListener('loadeddata', finish)
      videoEl.removeEventListener('error', finish)
      resolve()
    }

    const timeoutId = setTimeout(finish, timeoutMs)
    const wrappedFinish = () => {
      clearTimeout(timeoutId)
      finish()
    }

    videoEl.addEventListener('canplay', wrappedFinish, { once: true })
    videoEl.addEventListener('loadeddata', wrappedFinish, { once: true })
    videoEl.addEventListener('error', wrappedFinish, { once: true })

    if (videoEl.readyState >= 2) wrappedFinish()
  })
}

function waitForCmsReady(isCmsReady, timeoutMs = CMS_READY_TIMEOUT_MS) {
  if (isCmsReady()) return Promise.resolve()

  return new Promise(resolve => {
    const started = Date.now()

    const tick = () => {
      if (isCmsReady()) {
        resolve()
        return
      }
      if (Date.now() - started >= timeoutMs) {
        resolve()
        return
      }
      requestAnimationFrame(tick)
    }

    tick()
  })
}

/**
 * Resolves when critical home-page assets are ready for the hero reveal.
 * Reports 0–100 progress via onProgress.
 */
export async function waitForHomePageAssets({
  videoSrc,
  getVideoEl,
  isCmsReady = () => true,
  onProgress,
} = {}) {
  const steps = [
    preloadImages(HOME_TIER1_IMAGE_URLS),
    preloadVideo(videoSrc),
    waitForVideoElement(getVideoEl?.()),
    waitForCmsReady(isCmsReady),
  ]

  const total = steps.length
  let completed = 0

  const report = () => {
    completed += 1
    onProgress?.(Math.min(100, Math.round((completed / total) * 100)))
  }

  onProgress?.(0)

  await Promise.all(steps.map(step => Promise.resolve(step).then(report).catch(report)))

  onProgress?.(100)
}
