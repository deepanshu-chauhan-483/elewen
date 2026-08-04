export function loadCashfreeScript() {
  return new Promise(resolve => {
    if (window.Cashfree) {
      resolve(true)
      return
    }

    const existing = document.querySelector('script[data-cashfree="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true })
      existing.addEventListener('error', () => resolve(false), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
    script.async = true
    script.dataset.cashfree = 'true'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function isMobileCheckoutDevice() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 768px)').matches
}

export async function openCashfreeCheckout({ paymentSessionId, environment = 'sandbox' }) {
  const scriptLoaded = await loadCashfreeScript()
  if (!scriptLoaded || !window.Cashfree) {
    throw new Error('Cashfree checkout could not be loaded.')
  }

  const cashfree = window.Cashfree({
    mode: environment === 'production' ? 'production' : 'sandbox',
  })

  return cashfree.checkout({
    paymentSessionId,
    redirectTarget: isMobileCheckoutDevice() ? '_self' : '_modal',
  })
}
