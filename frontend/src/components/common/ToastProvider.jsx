import { createElement, useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ToastContext } from './ToastContext'

function ToastViewport({ toasts, onDismiss }) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[min(92vw,380px)] flex-col gap-3">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-2xl border border-[#D4BA8E] bg-[#1C1C1C] px-4 py-3 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
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
            <p className="flex-1 text-sm leading-6">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-sm text-white/70 transition hover:text-white"
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback(id => {
    setToasts(current => current.filter(toast => toast.id !== id))
  }, [])

  const showToast = useCallback(
    ({ message, duration = 3200 }) => {
      const normalizedMessage = String(message ?? '').trim()
      if (!normalizedMessage) return ''

      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      setToasts(current => current.concat({ id, message: normalizedMessage }))

      window.setTimeout(() => {
        dismissToast(id)
      }, duration)

      return id
    },
    [dismissToast]
  )

  const value = useMemo(() => ({ showToast, dismissToast }), [dismissToast, showToast])

  return createElement(
    ToastContext.Provider,
    { value },
    children,
    <ToastViewport toasts={toasts} onDismiss={dismissToast} />
  )
}
