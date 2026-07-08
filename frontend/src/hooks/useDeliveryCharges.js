import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import { normalizeDeliveryCharge, normalizePincode } from '../lib/deliveryChargePricing'
import fallbackDeliveryCharges from '../data/deliveryCharges.json'

function mapFallbackCharges() {
  return fallbackDeliveryCharges.map(normalizeDeliveryCharge).filter(Boolean)
}

async function fetchDeliveryCharges() {
  if (USE_FALLBACK) {
    return mapFallbackCharges()
  }

  try {
    const { data } = await strapiGet('/delivery-charges', {
      'filters[is_active][$eq]': 'true',
      'pagination[pageSize]': 200,
      sort: 'pincode:asc',
    })

    const fromStrapi = (Array.isArray(data) ? data : [])
      .map(normalizeDeliveryCharge)
      .filter(Boolean)

    if (fromStrapi.length > 0) {
      return fromStrapi
    }
  } catch {
    // Fall through to bundled CSV export.
  }

  return mapFallbackCharges()
}

export function useDeliveryCharges() {
  return useQuery({
    queryKey: ['delivery-charges'],
    queryFn: fetchDeliveryCharges,
    placeholderData: mapFallbackCharges(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  })
}

export function buildDeliveryChargeMap(charges = []) {
  return new Map(
    (Array.isArray(charges) ? charges : [])
      .map(charge => [normalizePincode(charge.pincode), charge])
      .filter(([pincode]) => pincode)
  )
}

export function getDeliveryChargeForPincode(charges = [], pincode = '') {
  const normalizedPincode = normalizePincode(pincode)
  if (!normalizedPincode) return null

  const map = buildDeliveryChargeMap(charges)
  return map.get(normalizedPincode) ?? null
}
