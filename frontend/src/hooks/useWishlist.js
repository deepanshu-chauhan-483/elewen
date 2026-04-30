import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  clearStoredJwt,
  getStoredJwt,
  wishlistAdd,
  wishlistGet,
  wishlistRemove,
} from '../lib/api'

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

function buildGuestWishlistPayload() {
  const packageIds = readGuestWishlist()
  return {
    items: packageIds.map(packageId => ({ packageId })),
    packageIds,
  }
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
          clearStoredJwt()
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
        const guestIds = readGuestWishlist()
        const nextIds = saved
          ? guestIds.filter(id => id !== normalizedPackageId)
          : guestIds.concat(normalizedPackageId)

        writeGuestWishlist(nextIds)
        return { items: nextIds.map(id => ({ packageId: id })), packageIds: nextIds }
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
          clearStoredJwt()
          const guestIds = readGuestWishlist()
          const nextIds = saved
            ? guestIds.filter(id => id !== normalizedPackageId)
            : guestIds.concat(normalizedPackageId)

          writeGuestWishlist(nextIds)
          return { items: nextIds.map(id => ({ packageId: id })), packageIds: nextIds }
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
