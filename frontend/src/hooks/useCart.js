import { useEffect, useState } from 'react'
import {
  cartAddItem,
  cartApplyCoupon,
  cartGet,
  cartRemoveCoupon,
  cartRemoveItem,
  cartUpdate,
  cartUpdateItem,
  getStoredJwt,
} from '../lib/api'

const CART_EVENT = 'elewen-cart-change'
const GUEST_CART_KEY = 'elewen_guest_cart'
const CART_META_SEPARATOR = '||__ELEWEN_META__||'

function getToken() {
  return getStoredJwt()
}

function getItemCount(cart) {
  return (cart?.items ?? []).reduce((sum, item) => sum + Number(item?.quantity ?? 0), 0)
}

function normalizeSelectedOptions(selectedOptions) {
  if (!selectedOptions || typeof selectedOptions !== 'object' || Array.isArray(selectedOptions)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(selectedOptions)
      .map(([key, value]) => [String(key ?? '').trim(), String(value ?? '').trim()])
      .filter(([key, value]) => key && value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
  )
}

function buildSelectionKey(selectedOptions) {
  const normalized = normalizeSelectedOptions(selectedOptions)
  const serialized = JSON.stringify(normalized)
  if (!serialized || serialized === '{}') return null

  let hash = 5381
  for (let index = 0; index < serialized.length; index += 1) {
    hash = ((hash << 5) + hash + serialized.charCodeAt(index)) >>> 0
  }

  return `pkgopt_${hash.toString(36)}`
}

function buildCartItemTitle(title, selectedOptions) {
  const normalized = normalizeSelectedOptions(selectedOptions)
  if (!Object.keys(normalized).length) return title

  return `${title}${CART_META_SEPARATOR}${JSON.stringify({ selectedOptions: normalized })}`
}

function createGuestCartItemId() {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function buildEmptyGuestCart() {
  return {
    id: 'guest-cart',
    items: [],
    eventDate: null,
    eventCity: '',
    guestCount: null,
    subtotal: '0.00',
    discountAmount: '0.00',
    total: '0.00',
    couponId: null,
  }
}

function withGuestCartTotals(cart) {
  const items = Array.isArray(cart?.items) ? cart.items : []
  const subtotal = items.reduce((sum, item) => sum + Number(item?.totalPrice ?? 0), 0)

  return {
    ...buildEmptyGuestCart(),
    ...cart,
    items,
    subtotal: subtotal.toFixed(2),
    discountAmount: '0.00',
    total: subtotal.toFixed(2),
    couponId: null,
  }
}

function readGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY)
    if (!raw) return buildEmptyGuestCart()
    return withGuestCartTotals(JSON.parse(raw))
  } catch {
    return buildEmptyGuestCart()
  }
}

function writeGuestCart(cart) {
  const normalized = withGuestCartTotals(cart)
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(normalized))
  return normalized
}

function clearGuestCartStorage() {
  localStorage.removeItem(GUEST_CART_KEY)
}

function createGuestCartUnsupportedError(message) {
  const error = new Error(message)
  error.code = 'AUTH_REQUIRED'
  return error
}

async function fetchPackageSnapshot(packageId) {
  const base = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'
  const url = new URL('/api/packages', base)
  url.searchParams.set('filters[id][$eq]', String(packageId))

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error('Package not found')
  }

  const payload = await res.json()
  const pkg = payload?.data?.[0]
  if (!pkg) throw new Error('Package not found')

  return {
    id: pkg.id,
    title: pkg.title ?? 'Package',
    basePrice: Number(pkg.base_price ?? 0),
  }
}

async function migrateGuestCartToServer(token) {
  const guestCart = readGuestCart()
  if (!guestCart.items.length) return null

  for (const item of guestCart.items) {
    await cartAddItem(token, {
      packageId: Number(item.packageId),
      quantity: Number(item.quantity ?? 1),
      selectedOptions: (() => {
        const rawTitle = String(item?.title ?? '')
        const [, metaPart] = rawTitle.split(CART_META_SEPARATOR)
        if (!metaPart) return undefined
        try {
          const parsed = JSON.parse(metaPart)
          return parsed?.selectedOptions ?? undefined
        } catch {
          return undefined
        }
      })(),
    })
  }

  const nextDetails = {}
  if (guestCart.eventDate) nextDetails.eventDate = guestCart.eventDate
  if (guestCart.eventCity) nextDetails.eventCity = guestCart.eventCity
  if (guestCart.guestCount != null) nextDetails.guestCount = Number(guestCart.guestCount)

  if (Object.keys(nextDetails).length) {
    await cartUpdate(token, nextDetails)
  }

  clearGuestCartStorage()
  return guestCart
}

export function dispatchCartChange(cart) {
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { cart } }))
}

export function useCart() {
  const [cart, setCart] = useState(() => (getToken() ? null : readGuestCart()))
  const [itemCount, setItemCount] = useState(() =>
    getItemCount(getToken() ? null : readGuestCart())
  )
  const [loading, setLoading] = useState(() => !!getToken())
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getToken())

  useEffect(() => {
    let cancelled = false

    const applyCart = nextCart => {
      if (cancelled) return
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
    }

    const syncGuestCart = () => {
      const guestCart = readGuestCart()
      applyCart(guestCart)
      if (!cancelled) {
        setLoading(false)
        setIsLoggedIn(false)
      }
      return guestCart
    }

    const syncCart = async () => {
      const token = getToken()
      if (!token) {
        syncGuestCart()
        return
      }

      setIsLoggedIn(true)
      setLoading(true)
      try {
        await migrateGuestCartToServer(token)
        const data = await cartGet(token)
        applyCart(data.cart ?? null)
      } catch (err) {
        if (cancelled) return
        if (err?.code === 'AUTH_REQUIRED') {
          syncGuestCart()
          return
        }
        console.error('[cart] sync failed', err)
        setError(err.message ?? 'Failed to load cart')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    const handleAuthChange = () => {
      setIsLoggedIn(!!getToken())
      syncCart()
    }

    const handleCartChange = event => {
      const nextCart = event?.detail?.cart
      if (nextCart) {
        applyCart(nextCart)
        return
      }
      syncCart()
    }

    syncCart()
    window.addEventListener('elewen-auth-change', handleAuthChange)
    window.addEventListener(CART_EVENT, handleCartChange)
    window.addEventListener('storage', handleAuthChange)

    return () => {
      cancelled = true
      window.removeEventListener('elewen-auth-change', handleAuthChange)
      window.removeEventListener(CART_EVENT, handleCartChange)
      window.removeEventListener('storage', handleAuthChange)
    }
  }, [])

  const addPackage = async ({ packageId, quantity = 1, selectedOptions }) => {
    const token = getToken()

    if (!token) {
      const snapshot = await fetchPackageSnapshot(packageId)
      const guestCart = readGuestCart()
      const selectionKey = buildSelectionKey(selectedOptions)
      const existing = guestCart.items.find(
        item =>
          String(item.packageId) === String(packageId) &&
          String(item.packageElementId ?? '') === String(selectionKey ?? '')
      )

      let nextItems
      if (existing) {
        nextItems = guestCart.items.map(item => {
          if (item.id !== existing.id) return item
          const nextQuantity = Number(item.quantity ?? 0) + quantity
          return {
            ...item,
            quantity: nextQuantity,
            totalPrice: (snapshot.basePrice * nextQuantity).toFixed(2),
          }
        })
      } else {
        nextItems = guestCart.items.concat({
          id: createGuestCartItemId(),
          packageId: String(packageId),
          packageElementId: selectionKey,
          addonId: null,
          title: buildCartItemTitle(snapshot.title, selectedOptions),
          quantity,
          unitPrice: snapshot.basePrice.toFixed(2),
          totalPrice: (snapshot.basePrice * quantity).toFixed(2),
          createdAt: new Date().toISOString(),
        })
      }

      const nextCart = writeGuestCart({ ...guestCart, items: nextItems })
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
      dispatchCartChange(nextCart)
      return nextCart
    }

    try {
      const data = await cartAddItem(token, { packageId, quantity, selectedOptions })
      const nextCart = data.cart ?? null
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
      dispatchCartChange(nextCart)
      return nextCart
    } catch (err) {
      setError(err.message ?? 'Failed to add package to cart')
      throw err
    }
  }

  const updateItemQuantity = async (itemId, quantity) => {
    const token = getToken()

    if (!token) {
      const guestCart = readGuestCart()
      const item = guestCart.items.find(entry => entry.id === itemId)
      if (!item) throw new Error('Cart item not found')

      const nextItems = guestCart.items.map(entry =>
        entry.id === itemId
          ? {
              ...entry,
              quantity,
              totalPrice: (Number(entry.unitPrice ?? 0) * quantity).toFixed(2),
            }
          : entry
      )

      const nextCart = writeGuestCart({ ...guestCart, items: nextItems })
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
      dispatchCartChange(nextCart)
      return nextCart
    }

    try {
      const data = await cartUpdateItem(token, itemId, { quantity })
      const nextCart = data.cart ?? null
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
      dispatchCartChange(nextCart)
      return nextCart
    } catch (err) {
      setError(err.message ?? 'Failed to update cart item')
      throw err
    }
  }

  const removeItem = async itemId => {
    const token = getToken()

    if (!token) {
      const guestCart = readGuestCart()
      const nextCart = writeGuestCart({
        ...guestCart,
        items: guestCart.items.filter(item => item.id !== itemId),
      })
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
      dispatchCartChange(nextCart)
      return nextCart
    }

    try {
      const data = await cartRemoveItem(token, itemId)
      const nextCart = data.cart ?? null
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
      dispatchCartChange(nextCart)
      return nextCart
    } catch (err) {
      setError(err.message ?? 'Failed to remove cart item')
      throw err
    }
  }

  const updateCartDetails = async body => {
    const token = getToken()

    if (!token) {
      const guestCart = readGuestCart()
      const nextCart = writeGuestCart({
        ...guestCart,
        ...(body?.eventDate !== undefined && { eventDate: body.eventDate || null }),
        ...(body?.eventCity !== undefined && { eventCity: body.eventCity || '' }),
        ...(body?.guestCount !== undefined && {
          guestCount: body.guestCount ? Number(body.guestCount) : null,
        }),
      })
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
      dispatchCartChange(nextCart)
      return nextCart
    }

    try {
      const data = await cartUpdate(token, body)
      const nextCart = data.cart ?? null
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
      dispatchCartChange(nextCart)
      return nextCart
    } catch (err) {
      setError(err.message ?? 'Failed to update cart details')
      throw err
    }
  }

  const updateCartItemDetails = async ({ itemId, quantity, selectedOptions }) => {
    const token = getToken()

    if (!token) {
      const guestCart = readGuestCart()
      const item = guestCart.items.find(entry => entry.id === String(itemId))
      if (!item) throw new Error('Cart item not found')

      const normalizedSelectedOptions = normalizeSelectedOptions(selectedOptions)
      const nextSelectionKey = buildSelectionKey(normalizedSelectedOptions)
      const baseTitle = String(item.title ?? '').split(CART_META_SEPARATOR)[0] || item.title
      const nextTitle = buildCartItemTitle(baseTitle, normalizedSelectedOptions)

      const duplicateItem = guestCart.items.find(
        entry =>
          entry.id !== item.id &&
          String(entry.packageId) === String(item.packageId) &&
          String(entry.packageElementId ?? '') === String(nextSelectionKey ?? '')
      )

      let nextItems
      if (duplicateItem) {
        nextItems = guestCart.items
          .map(entry => {
            if (entry.id !== duplicateItem.id) return entry
            const mergedQuantity =
              Number(entry.quantity ?? 0) + Number(quantity ?? item.quantity ?? 1)
            return {
              ...entry,
              quantity: mergedQuantity,
              totalPrice: (Number(entry.unitPrice ?? 0) * mergedQuantity).toFixed(2),
            }
          })
          .filter(entry => entry.id !== item.id)
      } else {
        const nextQuantity = Number(quantity ?? item.quantity ?? 1)
        nextItems = guestCart.items.map(entry =>
          entry.id === item.id
            ? {
                ...entry,
                title: nextTitle,
                packageElementId: nextSelectionKey,
                quantity: nextQuantity,
                totalPrice: (Number(entry.unitPrice ?? 0) * nextQuantity).toFixed(2),
              }
            : entry
        )
      }

      const nextCart = writeGuestCart({ ...guestCart, items: nextItems })
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
      dispatchCartChange(nextCart)
      return nextCart
    }

    try {
      const data = await cartUpdate(token, { itemId, quantity, selectedOptions })
      const nextCart = data.cart ?? null
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
      dispatchCartChange(nextCart)
      return nextCart
    } catch (err) {
      setError(err.message ?? 'Failed to update cart item')
      throw err
    }
  }

  const applyCoupon = async code => {
    const token = getToken()
    if (!token) {
      throw createGuestCartUnsupportedError('Sign in to apply coupon codes.')
    }
    try {
      const data = await cartApplyCoupon(token, { code })
      const nextCart = data.cart ?? null
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
      dispatchCartChange(nextCart)
      return data
    } catch (err) {
      setError(err.message ?? 'Failed to apply coupon')
      throw err
    }
  }

  const clearCoupon = async () => {
    const token = getToken()
    if (!token) {
      throw createGuestCartUnsupportedError('Sign in to remove coupon codes.')
    }
    try {
      const data = await cartRemoveCoupon(token)
      const nextCart = data.cart ?? null
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
      dispatchCartChange(nextCart)
      return nextCart
    } catch (err) {
      setError(err.message ?? 'Failed to remove coupon')
      throw err
    }
  }

  return {
    cart,
    itemCount,
    loading,
    error,
    isLoggedIn,
    addPackage,
    updateItemQuantity,
    updateCartItemDetails,
    removeItem,
    updateCartDetails,
    applyCoupon,
    clearCoupon,
  }
}
