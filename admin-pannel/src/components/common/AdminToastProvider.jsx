import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const AdminToastContext = createContext(null)

export function AdminToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setToast(null)
  }, [])

  const showToast = useCallback(
    ({ message, tone = 'success', duration = 4500 }) => {
      const normalizedMessage = String(message ?? '').trim()
      if (!normalizedMessage) return

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      setToast({
        id: Date.now(),
        message: normalizedMessage,
        tone,
      })

      timerRef.current = setTimeout(hideToast, duration)
    },
    [hideToast]
  )

  useEffect(() => () => hideToast(), [hideToast])

  return (
    <AdminToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(
            toast ? (
              <div className="pointer-events-none fixed inset-x-4 top-4 z-[200] flex justify-end sm:inset-x-auto sm:right-6">
                <div
                  role="status"
                  className={[
                    'pointer-events-auto max-w-md rounded-2xl border px-4 py-3 text-sm shadow-lg',
                    toast.tone === 'error'
                      ? 'border-[#F1B7B7] bg-[#FFF3F3] text-[#8A1C1C]'
                      : 'border-[#C8EED6] bg-[#EAF8F1] text-[#12803D]',
                  ].join(' ')}
                >
                  {toast.message}
                </div>
              </div>
            ) : null,
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
