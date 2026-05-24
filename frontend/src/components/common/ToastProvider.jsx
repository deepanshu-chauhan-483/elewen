import { createElement, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { ToastContext } from './ToastContext'

// ---------------------------------------------------------------------------
// Single animated toast item
// ---------------------------------------------------------------------------
function ToastItem({ toast, onExited }) {
  const ref = useRef(null)
  const tlRef = useRef(null)
  const exitedRef = useRef(false)

  const triggerExit = useCallback(() => {
    if (exitedRef.current) return
    exitedRef.current = true
    tlRef.current?.kill()

    if (!ref.current) { onExited(toast.id); return }

    tlRef.current = gsap.timeline({ onComplete: () => onExited(toast.id) })
    tlRef.current.to(ref.current, {
      // Slide back off the right edge of the screen
      xPercent: 150,
      opacity: 0,
      duration: 0.4,
      ease: 'expo.in',
    })
  }, [toast.id, onExited])

  // Store exit fn so provider timer can reach it
  toast._exit = triggerExit

  // ── Slide IN from off-screen right ──────────────────────────────────────
  useLayoutEffect(() => {
    if (!ref.current) return
    // Push element fully off the right edge of the viewport
    gsap.set(ref.current, { xPercent: 150, opacity: 0 })

    tlRef.current = gsap.timeline()
    tlRef.current.to(ref.current, {
      xPercent: 0,
      opacity: 1,
      duration: 0.6,
      ease: 'expo.out',
    })
  }, [])

  return (
    <div
      ref={ref}
      className="pointer-events-auto rounded-2xl border border-[#D4BA8E] bg-[#1C1C1C] px-4 py-3 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
      role="status"
      aria-live="polite"
      style={{ willChange: 'transform, opacity' }}
    >
      <div className="flex items-center gap-3">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D4BA8E] text-[#1C1C1C]">
          <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
            <path
              d="M4.5 10.25L8 13.75L15.5 6.25"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="flex-1 whitespace-nowrap text-sm leading-6">{toast.message}</p>
        <button
          type="button"
          onClick={triggerExit}
          className="flex items-center justify-center text-sm text-white/70 transition hover:text-white"
          aria-label="Dismiss notification"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="#FAFAFA"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Viewport portal — NO overflow-hidden so toast can slide in from off-screen
// ---------------------------------------------------------------------------
function ToastViewport({ toasts, onExited }) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="pointer-events-none fixed right-2 top-16 z-[9999] flex w-fit max-w-[92vw] flex-col gap-3">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onExited={onExited} />
      ))}
    </div>,
    document.body
  )
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback(id => {
    setToasts(current => current.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback(
    ({ message, duration = 3200 }) => {
      const normalizedMessage = String(message ?? '').trim()
      if (!normalizedMessage) return ''

      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const toastObj = { id, message: normalizedMessage, _exit: null }

      setToasts(current => current.concat(toastObj))

      window.setTimeout(() => {
        if (toastObj._exit) {
          toastObj._exit()
        } else {
          removeToast(id)
        }
      }, duration)

      return id
    },
    [removeToast]
  )

  const dismissToast = useCallback(id => {
    setToasts(current => {
      const toast = current.find(t => t.id === id)
      if (toast?._exit) {
        toast._exit()
        return current
      }
      return current.filter(t => t.id !== id)
    })
  }, [])

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return createElement(
    ToastContext.Provider,
    { value },
    children,
    <ToastViewport toasts={toasts} onExited={removeToast} />
  )
}