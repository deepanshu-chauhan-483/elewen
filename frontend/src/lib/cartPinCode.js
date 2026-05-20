const CART_PIN_CODE_KEY = 'elewen_cart_pin_code'

function normalizePinCode(value) {
  return String(value ?? '')
    .replace(/\D+/g, '')
    .slice(0, 6)
}

export function readStoredCartPinCode() {
  try {
    return normalizePinCode(localStorage.getItem(CART_PIN_CODE_KEY) || '')
  } catch {
    return ''
  }
}

export function writeStoredCartPinCode(value) {
  const normalizedValue = normalizePinCode(value)

  try {
    if (normalizedValue) {
      localStorage.setItem(CART_PIN_CODE_KEY, normalizedValue)
    } else {
      localStorage.removeItem(CART_PIN_CODE_KEY)
    }
  } catch {
    // Ignore storage failures and keep UI functional.
  }

  return normalizedValue
}
