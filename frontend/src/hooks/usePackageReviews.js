import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'

function normalizeValue(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function toAbsoluteStrapiUrl(url) {
  if (!url || typeof url !== 'string') return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const base = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

function normaliseRelationArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}

function toDateLabel(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getReviewPackageCandidates(review) {
  return [
    review?.package,
    review?.packages,
    review?.package_id,
    review?.packageId,
    review?.selected_package,
    review?.selectedPackage,
  ]
    .flatMap(value =>
      normaliseRelationArray(value).length ? normaliseRelationArray(value) : [value]
    )
    .filter(Boolean)
}

function reviewMatchesPackage(review, packageRef = {}) {
  const normalizedPackageId = normalizeValue(packageRef.id)
  const normalizedDocumentId = normalizeValue(packageRef.documentId)
  const normalizedTitle = normalizeValue(packageRef.title)

  if (!normalizedPackageId && !normalizedDocumentId && !normalizedTitle) return true

  const candidates = getReviewPackageCandidates(review)

  return candidates.some(candidate => {
    const candidateId = normalizeValue(candidate?.id ?? candidate)
    const candidateDocumentId = normalizeValue(candidate?.documentId)
    const candidateTitle = normalizeValue(
      candidate?.title ?? candidate?.name ?? candidate?.package_name ?? candidate?.packageName
    )

    return (
      (normalizedPackageId && candidateId === normalizedPackageId) ||
      (normalizedDocumentId && candidateDocumentId === normalizedDocumentId) ||
      (normalizedTitle && candidateTitle === normalizedTitle)
    )
  })
}

function mapReview(review, index) {
  const imageCandidate =
    review?.image?.url ??
    review?.review_image?.url ??
    review?.cover_image?.url ??
    review?.customer_image?.url ??
    review?.images?.[0]?.url ??
    normaliseRelationArray(review?.images)?.[0]?.url ??
    ''

  return {
    id: review?.id ?? index,
    documentId: review?.documentId,
    name:
      review?.customer_name ??
      review?.author_name ??
      review?.name ??
      review?.reviewer_name ??
      'Customer',
    date: toDateLabel(
      review?.review_date ?? review?.event_date ?? review?.publishedAt ?? review?.createdAt ?? ''
    ),
    quote:
      review?.review_text ??
      review?.body ??
      review?.message ??
      review?.comment ??
      review?.review ??
      '',
    image: toAbsoluteStrapiUrl(imageCandidate),
  }
}

async function fetchBookingReviews() {
  const params = {
    sort: 'createdAt:desc',
    populate: '*',
  }

  try {
    const { data } = await strapiGet('/booking-reviews', params)
    return Array.isArray(data) ? data : []
  } catch {
    const { data } = await strapiGet('/booking_reviews', params)
    return Array.isArray(data) ? data : []
  }
}

export function usePackageReviews(packageRef = {}) {
  return useQuery({
    queryKey: [
      'package-reviews',
      String(packageRef?.id ?? ''),
      String(packageRef?.documentId ?? ''),
      String(packageRef?.title ?? ''),
    ],
    enabled: Boolean(packageRef?.id || packageRef?.documentId || packageRef?.title),
    queryFn: async () => {
      if (USE_FALLBACK) return []

      try {
        const reviews = await fetchBookingReviews()

        return reviews
          .filter(review => {
            if (review?.is_active === false) return false
            if (review?.published === false) return false
            return reviewMatchesPackage(review, packageRef)
          })
          .map(mapReview)
          .filter(review => review.quote)
      } catch {
        return []
      }
    },
    placeholderData: [],
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
