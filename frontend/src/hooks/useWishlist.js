import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getStoredJwt, wishlistAdd, wishlistGet, wishlistRemove } from '../lib/api'
import { strapiGet } from '../lib/strapi'

const WISHLIST_EVENT = 'elewen-wishlist-change'
const AUTH_EVENT = 'elewen-auth-change'
const GUEST_WISHLIST_KEY = 'elewen_guest_wishlist'

function getToken() {
  return getStoredJwt()
}

function normalizePackageIds(packageIds) {
  return [...new Set((packageIds ?? []).map(id => String(id)).filter(Boolean))]
}

function readGuestWishlist() {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY)
    if (!raw) return []
    return normalizePackageIds(JSON.parse(raw))
  } catch {
    return []
  }
}

function writeGuestWishlist(packageIds) {
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(normalizePackageIds(packageIds)))
}

function normaliseMediaArray(media) {
  if (!media) return []
  if (Array.isArray(media)) return media
  if (Array.isArray(media?.data)) return media.data
  return []
}

function normaliseRelationArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}

function toAbsoluteStrapiUrl(url) {
  if (!url || typeof url !== 'string') return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const base = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

function normalizeServiceSlug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

function mapPackageToWishlistItem(pkg) {
  const serviceCategories = normaliseRelationArray(pkg?.service_categories).map(category => ({
    id: String(category?.id ?? ''),
    name: category?.name ?? '',
    slug: category?.slug ?? '',
  }))

  const events = normaliseRelationArray(pkg?.events).map(event => ({
    id: String(event?.id ?? ''),
    documentId: event?.documentId ?? '',
    name: event?.name ?? '',
    slug: event?.slug ?? '',
    tagline: event?.tagline ?? '',
  }))

  const imageUrl =
    normaliseMediaArray(pkg?.images)
      .map(image => toAbsoluteStrapiUrl(image?.url))
      .find(Boolean) ?? null

  const basePrice = Number(pkg?.base_price ?? 0) || 0

  return {
    id: String(pkg?.id ?? ''),
    documentId: '',
    packageId: String(pkg?.id ?? ''),
    packageDocumentId: pkg?.documentId ?? '',
    title: pkg?.title ?? '',
    slug: pkg?.slug ?? '',
    imageUrl,
    basePrice,
    serviceCategories,
    events,
    package: {
      id: String(pkg?.id ?? ''),
      documentId: pkg?.documentId ?? '',
      title: pkg?.title ?? '',
      slug: pkg?.slug ?? '',
      basePrice,
      imageUrl,
      serviceCategories,
      events,
    },
    serviceSlug:
      serviceCategories?.[0]?.slug || normalizeServiceSlug(serviceCategories?.[0]?.name) || '',
  }
}

async function fetchWishlistPackageSnapshot(packageId) {
  const normalizedId = String(packageId ?? '').trim()
  if (!normalizedId) return { packageId: normalizedId }

  const filters = /^\d+$/.test(normalizedId)
    ? { 'filters[id][$eq]': normalizedId }
    : { 'filters[documentId][$eq]': normalizedId }

  const { data } = await strapiGet('/packages', {
    'populate[images]': 'true',
    'populate[events][populate][0]': 'parent_event',
    'populate[service_categories][populate][0]': 'parent_category',
    ...filters,
  })

  const pkg = Array.isArray(data) ? data[0] : null
  return pkg ? mapPackageToWishlistItem(pkg) : { packageId: normalizedId }
}

async function buildGuestWishlistPayload(packageIds = readGuestWishlist()) {
  const normalizedPackageIds = normalizePackageIds(packageIds)
  const items = await Promise.all(
    normalizedPackageIds.map(async packageId => {
      try {
        return await fetchWishlistPackageSnapshot(packageId)
      } catch {
        return { packageId }
      }
    })
  )

  return {
    items,
    packageIds: normalizedPackageIds,
  }
}

function updateGuestWishlist({ packageId, saved }) {
  const normalizedPackageId = String(packageId ?? '').trim()
  const guestIds = readGuestWishlist()
  const nextIds = saved
    ? guestIds.filter(id => id !== normalizedPackageId)
    : guestIds.concat(normalizedPackageId)

  writeGuestWishlist(nextIds)
  return buildGuestWishlistPayload()
}

function normalizeWishlistPayload(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : []
  return {
    items,
    packageIds: normalizePackageIds(payload?.packageIds ?? items.map(item => item?.packageId)),
  }
}

export function dispatchWishlistChange() {
  window.dispatchEvent(new Event(WISHLIST_EVENT))
}

export function useWishlist() {
  const queryClient = useQueryClient()
  const token = getToken()
  const isLoggedIn = Boolean(token)

  const wishlistQuery = useQuery({
    queryKey: ['wishlist', token || 'guest'],
    retry: false,
    queryFn: async () => {
      if (!token) return buildGuestWishlistPayload()

      try {
        return normalizeWishlistPayload(await wishlistGet(token))
      } catch (err) {
        if (err?.code === 'AUTH_REQUIRED') {
          return buildGuestWishlistPayload()
        }
        throw err
      }
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  useEffect(() => {
    const syncWishlist = () => {
      const nextToken = getToken()
      queryClient.invalidateQueries({ queryKey: ['wishlist', nextToken || 'guest'] })
      queryClient.removeQueries({
        queryKey: ['wishlist', nextToken ? 'guest' : token || 'guest'],
        exact: true,
      })
    }

    window.addEventListener(AUTH_EVENT, syncWishlist)
    window.addEventListener(WISHLIST_EVENT, syncWishlist)
    window.addEventListener('storage', syncWishlist)

    return () => {
      window.removeEventListener(AUTH_EVENT, syncWishlist)
      window.removeEventListener(WISHLIST_EVENT, syncWishlist)
      window.removeEventListener('storage', syncWishlist)
    }
  }, [queryClient, token])

  const toggleMutation = useMutation({
    mutationFn: async ({ packageId, saved, customConfig }) => {
      const normalizedPackageId = String(packageId ?? '').trim()
      const activeToken = getToken()

      if (!activeToken) {
        return updateGuestWishlist({ packageId: normalizedPackageId, saved })
      }

      try {
        if (saved) {
          await wishlistRemove(activeToken, normalizedPackageId)
        } else {
          await wishlistAdd(activeToken, { packageId: normalizedPackageId, customConfig })
        }

        return normalizeWishlistPayload(await wishlistGet(activeToken))
      } catch (err) {
        if (err?.code === 'AUTH_REQUIRED') {
          return updateGuestWishlist({ packageId: normalizedPackageId, saved })
        }
        throw err
      }
    },
    onSuccess: nextWishlist => {
      const activeToken = getToken()
      queryClient.setQueryData(
        ['wishlist', activeToken || 'guest'],
        normalizeWishlistPayload(nextWishlist)
      )
      dispatchWishlistChange()
    },
  })

  const savedPackageIds = normalizePackageIds(wishlistQuery.data?.packageIds)
  const savedPackageIdSet = new Set(savedPackageIds)

  return {
    wishlist: wishlistQuery.data?.items ?? [],
    savedPackageIds,
    isLoggedIn,
    isLoading: wishlistQuery.isLoading,
    isFetching: wishlistQuery.isFetching,
    isPending: toggleMutation.isPending,
    pendingPackageId:
      toggleMutation.isPending && toggleMutation.variables?.packageId != null
        ? String(toggleMutation.variables.packageId)
        : '',
    isSaved: packageId => savedPackageIdSet.has(String(packageId)),
    toggleSavedPackage: ({ packageId, customConfig } = {}) =>
      toggleMutation.mutateAsync({
        packageId: String(packageId ?? '').trim(),
        saved: savedPackageIdSet.has(String(packageId)),
        customConfig,
      }),
  }
}
