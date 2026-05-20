import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'

const DEFAULT_MESSAGES = {
  cart: 'Package added to cart successfully.',
  coupon: 'Coupon applied successfully.',
  checkout: 'Checkout is ready. Review your details and continue.',
  paymentFailed: 'Your payment could not be completed. Please try again.',
  paymentCancelled: 'Payment cancelled. You can continue from checkout anytime.',
  bookingConfirmation: 'Your booking has been confirmed successfully.',
  bookingCancellation: 'Your booking has been cancelled successfully.',
}

const TEXT_KEYS = [
  'toast_message',
  'success_message',
  'message',
  'description',
  'body',
  'text',
  'heading',
  'title',
  'label',
]

function normalizeSection(section) {
  return section?.attributes && typeof section.attributes === 'object'
    ? { ...section.attributes, id: section.id ?? section.attributes.id }
    : section
}

function firstNonEmptyString(value, seen = new WeakSet()) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || ''
  }

  if (!value || typeof value !== 'object') return ''
  if (seen.has(value)) return ''
  seen.add(value)

  if (Array.isArray(value)) {
    for (const item of value) {
      const match = firstNonEmptyString(item, seen)
      if (match) return match
    }
    return ''
  }

  for (const key of TEXT_KEYS) {
    const match = firstNonEmptyString(value[key], seen)
    if (match) return match
  }

  for (const nestedValue of Object.values(value)) {
    const match = firstNonEmptyString(nestedValue, seen)
    if (match) return match
  }

  return ''
}

function extractMessageFromSections(sections = [], fallbackMessage) {
  const normalizedSections = (Array.isArray(sections) ? sections : []).map(normalizeSection)
  const prioritizedSections = [
    ...normalizedSections.filter(section =>
      /toast|success|message|notification/i.test(String(section?.section_key ?? ''))
    ),
    ...normalizedSections.filter(
      section => !/toast|success|message|notification/i.test(String(section?.section_key ?? ''))
    ),
  ]

  for (const section of prioritizedSections) {
    const content = section?.content_json ?? section?.contentJson ?? {}
    const match = firstNonEmptyString(content)
    if (match) return match
  }

  return fallbackMessage
}

function buildPathCandidates(path) {
  const normalizedPath = String(path ?? '').trim()
  if (!normalizedPath) return []

  const trimmed = normalizedPath.replace(/\/+$/, '')
  const candidates = [trimmed]

  if (!trimmed.endsWith('s')) {
    candidates.push(`${trimmed}s`)
  }

  return [...new Set(candidates)]
}

async function fetchSingleTypeMessage(path, fallbackMessage) {
  const candidates = buildPathCandidates(path)
  let lastError = null

  for (const candidate of candidates) {
    try {
      const response = await strapiGet(candidate, { 'populate[sections][populate]': '*' })
      const data = response?.data?.attributes ?? response?.data ?? null
      return extractMessageFromSections(data?.sections ?? [], fallbackMessage)
    } catch (error) {
      lastError = error
      if (!String(error?.message ?? '').includes('404')) {
        throw error
      }
    }
  }

  if (lastError) {
    throw lastError
  }

  return fallbackMessage
}

function useSingleTypeMessage(queryKey, path, fallbackMessage) {
  return useQuery({
    queryKey: ['single-type-message', queryKey],
    queryFn: async () => {
      if (USE_FALLBACK) return fallbackMessage

      try {
        return await fetchSingleTypeMessage(path, fallbackMessage)
      } catch (error) {
        if (!String(error?.message ?? '').includes('404')) {
          console.warn(`Failed to fetch Strapi message for ${path}`, error)
        }
        return fallbackMessage
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  })
}

export function useCartToastMessage() {
  return useSingleTypeMessage('cart', '/cart-messaging', DEFAULT_MESSAGES.cart)
}

export function useCouponToastMessage() {
  return useSingleTypeMessage('coupon', '/coupon-messaging', DEFAULT_MESSAGES.coupon)
}

export function useCheckoutToastMessage() {
  return useSingleTypeMessage('checkout', '/checkout-messaging', DEFAULT_MESSAGES.checkout)
}

export function usePaymentFailedToastMessage() {
  return useSingleTypeMessage(
    'payment-failed',
    '/payment-failed-messaging',
    DEFAULT_MESSAGES.paymentFailed
  )
}

export function usePaymentCancelledToastMessage() {
  return useSingleTypeMessage(
    'payment-cancelled',
    '/payment-cancelled-messaging',
    DEFAULT_MESSAGES.paymentCancelled
  )
}

export function useBookingConfirmationToastMessage() {
  return useSingleTypeMessage(
    'booking-confirmation',
    '/booking-confirmation-messaging',
    DEFAULT_MESSAGES.bookingConfirmation
  )
}

export function useBookingCancellationToastMessage() {
  return useSingleTypeMessage(
    'booking-cancellation',
    '/booking-cancellation-messaging',
    DEFAULT_MESSAGES.bookingCancellation
  )
}
