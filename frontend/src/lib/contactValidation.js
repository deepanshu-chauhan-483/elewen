import { normalizeIndianPhone } from './phone.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

export function isValidEmail(value) {
  const email = String(value ?? '').trim()
  return email.length > 0 && EMAIL_PATTERN.test(email)
}

export function isValidRequiredIndianPhone(value) {
  const normalized = normalizeIndianPhone(value)
  return normalized.length === 10 && /^[6-9]\d{9}$/.test(normalized)
}

export function isValidOptionalIndianPhone(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return true
  return isValidRequiredIndianPhone(trimmed)
}

export function validateCheckoutContactDetails({ fullName, email, phone }) {
  const errors = {}
  const trimmedName = String(fullName ?? '').trim()

  if (trimmedName.length < 2) {
    errors.fullName = 'Please enter your full name.'
  }
  if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (!isValidRequiredIndianPhone(phone)) {
    errors.phone = 'Enter a valid 10-digit Indian phone number.'
  }

  return errors
}
