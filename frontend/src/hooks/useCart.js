import { useEffect, useState, useCallback, useRef } from 'react'
import {
  cartAddItem,
  cartApplyCoupon,
  cartGet,
  cartRemoveCoupon,
  cartRemoveItem,
  cartUpdate,
  cartUpdateItem,
  getValidStoredJwt,
  getStoredJwt,
} from '../lib/api'
import { createContext, createElement, useContext, useMemo } from 'react'

const CART_EVENT = 'elewen-cart-change'
const GUEST_CART_KEY = 'elewen_guest_cart'
const CART_META_SEPARATOR = '||__ELEWEN_META__||'
const CartContext = createContext(null)
let cartSyncPromise = null

function getToken() {
  return getStoredJwt()
}

// ─── FIXED: always resolves, never throws — a 401 refresh returns '' ──────────
async function getServerToken() {
  try {
    return (await getValidStoredJwt()) ?? ''
  } catch {
    return ''
  }
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

function buildCartItemTitle(title, selectedOptions, extraMeta = {}) {
  const normalized = normalizeSelectedOptions(selectedOptions)
  const meta = {
    ...extraMeta,
    ...(Object.keys(normalized).length ? { selectedOptions: normalized } : {}),
  }
  if (!Object.keys(meta).length) return title
  return `${title}${CART_META_SEPARATOR}${JSON.stringify(meta)}`
}

function parseSelectedOptionsFromCartItemTitle(title = '') {
  const rawTitle = String(title ?? '')
  const [, metaPart] = rawTitle.split(CART_META_SEPARATOR)
  if (!metaPart) return {}
  try {
    const parsed = JSON.parse(metaPart)
    return normalizeSelectedOptions(parsed?.selectedOptions)
  } catch {
    return {}
  }
}

function haveSameSelectedOptions(left, right) {
  return (
    JSON.stringify(normalizeSelectedOptions(left)) ===
    JSON.stringify(normalizeSelectedOptions(right))
  )
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
    couponCode: null,
  }
}

// ─── FIXED: preserve couponId / couponCode / discountAmount on every recalc ───
function withGuestCartTotals(cart) {
  const items = Array.isArray(cart?.items) ? cart.items : []
  const subtotal = items.reduce((sum, item) => sum + Number(item?.totalPrice ?? 0), 0)
  const discountAmount = Math.min(Number(cart?.discountAmount ?? 0), subtotal)
  const total = Math.max(0, subtotal - discountAmount)

  return {
    ...buildEmptyGuestCart(),
    ...cart,
    items,
    subtotal: subtotal.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    total: total.toFixed(2),
    couponId: cart?.couponId ?? null,
    couponCode: cart?.couponCode ?? null,
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

// ─── NEW: validate coupon via Strapi public API (no auth needed) ──────────────
// Field names match the backend cart.js controller exactly:
//   code, is_active, discount_type, discount_value,
//   max_uses, used_count, valid_from, valid_to
async function fetchAndValidateCoupon(code) {
  const base = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'
  const url = new URL('/api/coupons', base)
  url.searchParams.set('filters[code][$eq]', String(code).trim().toUpperCase())

  let payload
  try {
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error('Could not verify coupon. Please try again.')
    payload = await res.json()
  } catch {
    throw new Error('Could not verify coupon. Please try again.')
  }

  const raw = payload?.data?.[0]
  if (!raw) throw new Error('Invalid or expired coupon code.')

  // Strapi v4 nests fields under .attributes; v5 returns them flat
  const c = raw.attributes ?? raw

  if (!c.is_active) throw new Error('Invalid or expired coupon code.')

  const now = new Date()
  if (c.valid_from && new Date(c.valid_from) > now) {
    throw new Error('This coupon is not yet active.')
  }
  if (c.valid_to && new Date(c.valid_to) < now) {
    throw new Error('This coupon has expired.')
  }
  if (
    c.max_uses !== null &&
    c.max_uses !== undefined &&
    Number(c.used_count ?? 0) >= Number(c.max_uses)
  ) {
    throw new Error('This coupon has reached its usage limit.')
  }

  return {
    id: String(raw.id),
    code: String(c.code ?? code).toUpperCase(),
    discount_type: String(c.discount_type ?? 'fixed'), // 'fixed' | 'percentage'
    discount_value: Number(c.discount_value ?? 0),
    min_order_value: Number(c.min_order_value ?? 0),
  }
}

// ─── NEW: compute discount from coupon + subtotal ────────────────────────────
function computeDiscount(coupon, subtotal) {
  if (coupon.min_order_value > 0 && subtotal < coupon.min_order_value) {
    throw new Error(
      `Minimum order of Rs${coupon.min_order_value.toLocaleString('en-IN')} required for this coupon.`
    )
  }
  if (coupon.discount_type === 'percentage') {
    return Math.min((subtotal * coupon.discount_value) / 100, subtotal)
  }
  return Math.min(coupon.discount_value, subtotal)
}

async function fetchPackageSnapshot(packageId) {
  const base = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'
  const url = new URL('/api/packages', base)
  url.searchParams.set('filters[id][$eq]', String(packageId))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Package not found')

  const payload = await res.json()
  const pkg = payload?.data?.[0]
  if (!pkg) throw new Error('Package not found')

  const attrs = pkg.attributes ?? pkg
  return {
    id: pkg.id,
    title: attrs.title ?? 'Package',
    basePrice: Number(attrs.base_price ?? 0),
  }
}

async function migrateGuestCartToServer(token) {
  const guestCart = readGuestCart()
  if (!guestCart.items.length) return null

  for (const item of guestCart.items) {
    const rawTitle = String(item?.title ?? '')
    const [, metaPart] = rawTitle.split(CART_META_SEPARATOR)
    let parsedMeta = {}
    if (metaPart) {
      try {
        parsedMeta = JSON.parse(metaPart) ?? {}
      } catch {
        parsedMeta = {}
      }
    }

    await cartAddItem(token, {
      packageId: Number(item.packageId),
      quantity: Number(item.quantity ?? 1),
      selectedOptions: parsedMeta?.selectedOptions ?? undefined,
      addon:
        parsedMeta?.itemType === 'addon'
          ? {
              id: parsedMeta?.addonId,
              name: parsedMeta?.addonTitle,
              price: Number(item?.unitPrice ?? 0),
            }
          : undefined,
    })
  }

  const nextDetails = {}
  if (guestCart.eventDate) nextDetails.eventDate = guestCart.eventDate
  if (guestCart.eventCity) nextDetails.eventCity = guestCart.eventCity
  if (guestCart.guestCount != null) nextDetails.guestCount = Number(guestCart.guestCount)
  if (Object.keys(nextDetails).length) await cartUpdate(token, nextDetails)

  clearGuestCartStorage()
  return guestCart
}

function debounce(fn, ms) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    return new Promise((resolve, reject) => {
      timer = setTimeout(async () => {
        try {
          resolve(await fn.apply(this, args))
        } catch (err) {
          reject(err)
        }
      }, ms)
    })
  }
}

export function dispatchCartChange(cart) {
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { cart } }))
}

function useCartController() {
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
      const hasStoredToken = !!getToken()
      if (!hasStoredToken) {
        syncGuestCart()
        return
      }

      const token = await getServerToken() // never throws
      if (!token) {
        syncGuestCart()
        return
      }

      setIsLoggedIn(true)
      setLoading(true)
      try {
        const nextCart =
          cartSyncPromise ??
          (cartSyncPromise = (async () => {
            await migrateGuestCartToServer(token)
            const data = await cartGet(token)
            return data.cart ?? null
          })().finally(() => {
            cartSyncPromise = null
          }))
        applyCart(await nextCart)
      } catch (err) {
        if (cancelled) return
        if (err?.code === 'AUTH_REQUIRED') {
          syncGuestCart()
          return
        }
        console.error('[cart] sync failed', err)
        setError(err.message ?? 'Failed to load cart')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const handleAuthChange = () => {
      cartSyncPromise = null
      setIsLoggedIn(!!getToken())
      syncCart()
    }

    const handleCartChange = event => {
      const nextCart = event?.detail?.cart
      if (nextCart) {
        applyCart(nextCart)
        return
      }
      cartSyncPromise = null
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

  const addPackage = async ({ packageId, quantity = 1, selectedOptions, addon = null }) => {
    const token = await getServerToken()
    const addonId = addon?.id != null ? String(addon.id) : null
    const addonTitle = String(addon?.name ?? '').trim()
    const addonUnitPrice = Number(addon?.price ?? 0)
    const isAddon = Boolean(addonId && addonTitle)

    if (!token) {
      const snapshot = await fetchPackageSnapshot(packageId)
      const guestCart = readGuestCart()
      const selectionKey = isAddon ? null : buildSelectionKey(selectedOptions)
      const existing = guestCart.items.find(
        item =>
          String(item.packageId) === String(packageId) &&
          String(item.packageElementId ?? '') === String(selectionKey ?? '') &&
          String(item.addonId ?? '') === String(addonId ?? '')
      )
      const unitPrice = isAddon ? addonUnitPrice : snapshot.basePrice
      const itemTitle = isAddon
        ? buildCartItemTitle(addonTitle, selectedOptions, {
            itemType: 'addon',
            addonTitle,
            addonId,
            parentPackageId: String(packageId),
          })
        : buildCartItemTitle(snapshot.title, selectedOptions)

      let nextItems
      if (existing) {
        nextItems = guestCart.items.map(item => {
          if (item.id !== existing.id) return item
          const nextQuantity = Number(item.quantity ?? 0) + quantity
          return {
            ...item,
            quantity: nextQuantity,
            totalPrice: (unitPrice * nextQuantity).toFixed(2),
          }
        })
      } else {
        nextItems = guestCart.items.concat({
          id: createGuestCartItemId(),
          packageId: String(packageId),
          packageElementId: selectionKey,
          addonId,
          title: itemTitle,
          quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: (unitPrice * quantity).toFixed(2),
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
      const data = await cartAddItem(token, { packageId, quantity, selectedOptions, addon })
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
    const token = await getServerToken()

    if (!token) {
      const guestCart = readGuestCart()
      const item = guestCart.items.find(entry => entry.id === itemId)
      if (!item) throw new Error('Cart item not found')
      const nextItems = guestCart.items.map(entry =>
        entry.id === itemId
          ? { ...entry, quantity, totalPrice: (Number(entry.unitPrice ?? 0) * quantity).toFixed(2) }
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
    const token = await getServerToken()

    if (!token) {
      const guestCart = readGuestCart()
      const currentItem = guestCart.items.find(item => String(item.id) === String(itemId))
      if (!currentItem) throw new Error('Cart item not found')

      const currentQuantity = Math.max(1, Number(currentItem.quantity ?? 1))
      const nextItems =
        currentQuantity > 1
          ? guestCart.items.map(item =>
              String(item.id) === String(itemId)
                ? {
                    ...item,
                    quantity: currentQuantity - 1,
                    totalPrice: (Number(item.unitPrice ?? 0) * (currentQuantity - 1)).toFixed(2),
                  }
                : item
            )
          : guestCart.items.filter(item => String(item.id) !== String(itemId))

      const nextCart = writeGuestCart({
        ...guestCart,
        items: nextItems,
      })
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
      dispatchCartChange(nextCart)
      return nextCart
    }

    try {
      const currentItem = (cart?.items ?? []).find(item => String(item.id) === String(itemId))
      const currentQuantity = Math.max(1, Number(currentItem?.quantity ?? 1))
      const data =
        currentQuantity > 1
          ? await cartUpdateItem(token, itemId, { quantity: currentQuantity - 1 })
          : await cartRemoveItem(token, itemId)
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
    const token = await getServerToken()

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
    const token = await getServerToken()

    if (!token) {
      const guestCart = readGuestCart()
      const item = guestCart.items.find(entry => entry.id === String(itemId))
      if (!item) throw new Error('Cart item not found')

      const normalizedSelectedOptions = normalizeSelectedOptions(selectedOptions)
      const currentSelectedOptions = parseSelectedOptionsFromCartItemTitle(item.title)
      const currentQuantity = Math.max(1, Number(item.quantity ?? 1))
      const isChangingSelection = !haveSameSelectedOptions(
        currentSelectedOptions,
        normalizedSelectedOptions
      )

      if (isChangingSelection && currentQuantity > 1) {
        const snapshot = await fetchPackageSnapshot(item.packageId)
        const unitPrice = Number(item.unitPrice ?? snapshot.basePrice ?? 0)
        const nextSelectionKey = buildSelectionKey(normalizedSelectedOptions)
        const matchingEditedItem = guestCart.items.find(
          entry =>
            entry.id !== item.id &&
            String(entry.packageId) === String(item.packageId) &&
            String(entry.packageElementId ?? '') === String(nextSelectionKey ?? '')
        )
        const nextItems = guestCart.items.flatMap(entry => {
          if (entry.id === item.id) {
            return {
              ...entry,
              quantity: currentQuantity - 1,
              totalPrice: (unitPrice * (currentQuantity - 1)).toFixed(2),
            }
          }
          if (matchingEditedItem && entry.id === matchingEditedItem.id) {
            const mergedQuantity = Math.max(1, Number(entry.quantity ?? 1)) + 1
            return {
              ...entry,
              quantity: mergedQuantity,
              totalPrice: (Number(entry.unitPrice ?? unitPrice) * mergedQuantity).toFixed(2),
            }
          }
          return entry
        })

        if (!matchingEditedItem) {
          nextItems.push({
            id: createGuestCartItemId(),
            packageId: String(item.packageId),
            packageElementId: nextSelectionKey,
            addonId: item.addonId ?? null,
            title: buildCartItemTitle(
              String(item.title ?? '').split(CART_META_SEPARATOR)[0] || snapshot.title,
              normalizedSelectedOptions
            ),
            quantity: 1,
            unitPrice: unitPrice.toFixed(2),
            totalPrice: unitPrice.toFixed(2),
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
        const requestedQuantity = Number(quantity ?? item.quantity ?? 1)
        const nextQuantity =
          !isChangingSelection && currentQuantity > 1 && requestedQuantity === 1
            ? currentQuantity
            : requestedQuantity
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
      const currentItem = (cart?.items ?? []).find(entry => String(entry.id) === String(itemId))
      const currentQuantity = Math.max(1, Number(currentItem?.quantity ?? 1))
      const currentSelectedOptions = parseSelectedOptionsFromCartItemTitle(currentItem?.title ?? '')
      const normalizedSelectedOptions = normalizeSelectedOptions(selectedOptions)
      const isChangingSelection =
        currentItem && !haveSameSelectedOptions(currentSelectedOptions, normalizedSelectedOptions)

      if (currentItem && isChangingSelection && currentQuantity > 1) {
        await cartUpdateItem(token, itemId, { quantity: currentQuantity - 1 })
        const data = await cartAddItem(token, {
          packageId: Number(currentItem.packageId),
          quantity: 1,
          selectedOptions: normalizedSelectedOptions,
        })
        const nextCart = data.cart ?? null
        setCart(nextCart)
        setItemCount(getItemCount(nextCart))
        setError('')
        dispatchCartChange(nextCart)
        return nextCart
      }

      const requestedQuantity = Number(quantity ?? currentItem?.quantity ?? 1)
      const nextQuantity =
        currentItem && !isChangingSelection && currentQuantity > 1 && requestedQuantity === 1
          ? currentQuantity
          : requestedQuantity

      const data = await cartUpdate(token, { itemId, quantity: nextQuantity, selectedOptions })
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

  // ─── FIXED: no 401s ───────────────────────────────────────────────────────
  // Logged-in  → Express API  (unchanged, was always correct)
  // Guest      → Strapi public GET /api/coupons, apply discount locally
  const applyCoupon = useCallback(async code => {
    const token = await getServerToken() // never throws; '' if not logged in

    if (token) {
      // Logged-in path — same as before
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

    // Guest path — no network call to Express, no 401
    const coupon = await fetchAndValidateCoupon(code) // throws user-friendly Error on failure
    const guestCart = readGuestCart()
    const subtotal = guestCart.items.reduce((sum, item) => sum + Number(item?.totalPrice ?? 0), 0)
    const discountAmount = computeDiscount(coupon, subtotal) // throws if min order not met

    const nextCart = writeGuestCart({
      ...guestCart,
      couponId: coupon.id,
      couponCode: coupon.code,
      discountAmount: discountAmount.toFixed(2),
    })

    setCart(nextCart)
    setItemCount(getItemCount(nextCart))
    setError('')
    dispatchCartChange(nextCart)
    return { cart: nextCart }
  }, [])

  const debouncedApplyCoupon = useRef(debounce(applyCoupon, 500)).current

  // ─── FIXED: no 401s ───────────────────────────────────────────────────────
  const clearCoupon = async () => {
    const token = await getServerToken() // never throws

    if (token) {
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

    // Guest path — just strip coupon from localStorage
    const guestCart = readGuestCart()
    const nextCart = writeGuestCart({
      ...guestCart,
      couponId: null,
      couponCode: null,
      discountAmount: '0.00',
    })

    setCart(nextCart)
    setItemCount(getItemCount(nextCart))
    setError('')
    dispatchCartChange(nextCart)
    return nextCart
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
    debouncedApplyCoupon,
    clearCoupon,
  }
}

export function CartProvider({ children }) {
  const cartValue = useCartController()
  const value = useMemo(() => cartValue, [cartValue])

  return createElement(CartContext.Provider, { value }, children)
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return context
}
