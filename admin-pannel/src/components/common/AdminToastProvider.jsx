import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'

const AdminToastContext = createContext(null)

function ToastItem({ toast, onExited, onRegisterExit }) {
  const ref = useRef(null)
  const tlRef = useRef(null)
  const exitedRef = useRef(false)

  const triggerExit = useCallback(() => {
    if (exitedRef.current) return
    exitedRef.current = true
    tlRef.current?.kill()

    if (!ref.current) {
      onExited(toast.id)
      return
    }

    tlRef.current = gsap.timeline({ onComplete: () => onExited(toast.id) })
    tlRef.current.to(ref.current, {
      xPercent: 150,
      opacity: 0,
      duration: 0.4,
      ease: 'expo.in',
    })
  }, [toast.id, onExited])

  useLayoutEffect(() => {
    onRegisterExit(toast.id, triggerExit)
  }, [toast.id, triggerExit, onRegisterExit])

  useLayoutEffect(() => {
    if (!ref.current) return
    gsap.set(ref.current, { xPercent: 150, opacity: 0 })
    tlRef.current = gsap.timeline()
    tlRef.current.to(ref.current, {
      xPercent: 0,
      opacity: 1,
      duration: 0.6,
      ease: 'expo.out',
    })
  }, [])

  const isError = toast.tone === 'error'

  return (
    <div
      ref={ref}
      className="pointer-events-auto w-full min-w-0 max-w-full rounded-2xl border border-[#D4BA8E] bg-[#1C1C1C] px-4 py-3 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:max-w-md"
      role="status"
      aria-live="polite"
      style={{ willChange: 'transform, opacity' }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#1C1C1C] ${
            isError ? 'bg-[#E57373]' : 'bg-[#D4BA8E]'
          }`}
        >
          {isError ? (
            <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
              <path
                d="M6 6L14 14M14 6L6 14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
              <path
                d="M4.5 10.25L8 13.75L15.5 6.25"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <p className="min-w-0 flex-1 break-words text-sm leading-5">{toast.message}</p>
        <button
          type="button"
          onClick={triggerExit}
          className="mt-0.5 flex shrink-0 items-center justify-center text-sm text-white/70 transition hover:text-white"
          aria-label="Dismiss notification"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
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

const exitFns = new Map()

export function AdminToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback(id => {
    setToasts(current => current.filter(t => t.id !== id))
    exitFns.delete(id)
  }, [])

  const registerExitFn = useCallback((id, fn) => {
    exitFns.set(id, fn)
  }, [])

  const showToast = useCallback(
    ({ message, tone = 'success', duration = 3200 }) => {
      const normalizedMessage = String(message ?? '').trim()
      if (!normalizedMessage) return

      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      setToasts(current => current.concat({ id, message: normalizedMessage, tone }))

      window.setTimeout(() => {
        const fn = exitFns.get(id)
        if (fn) fn()
        else removeToast(id)
      }, duration)
    },
    [removeToast]
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(
            <div className="pointer-events-none fixed left-3 right-3 top-16 z-[9999] flex w-auto max-w-full flex-col items-stretch gap-3 sm:left-auto sm:right-4 sm:w-[min(100%,24rem)] sm:items-end">
              {toasts.map(toast => (
                <ToastItem
                  key={toast.id}
                  toast={toast}
                  onExited={removeToast}
                  onRegisterExit={registerExitFn}
                />
              ))}
            </div>,
            document.body
          )
        : null}
    </AdminToastContext.Provider>
  )
}

export function useAdminToast() {
  const context = useContext(AdminToastContext)
  if (!context) {
    throw new Error('useAdminToast must be used within AdminToastProvider')
  }
  return context
}
