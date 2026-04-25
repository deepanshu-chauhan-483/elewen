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

function getToken() {
  return getStoredJwt()
}

function getItemCount(cart) {
  return (cart?.items ?? []).reduce((sum, item) => sum + Number(item?.quantity ?? 0), 0)
}

export function dispatchCartChange(cart) {
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { cart } }))
}

export function useCart() {
  const [cart, setCart] = useState(null)
  const [itemCount, setItemCount] = useState(0)
  // ✅ FIX 1: Start as true so CartPage shows "Loading..." immediately,
  //    not "Empty cart", while the first fetch is in flight.
  const [loading, setLoading] = useState(!!getToken())
  const [error, setError] = useState('')
  // ✅ FIX 2: Reactive isLoggedIn — not a one-time snapshot
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken())

  useEffect(() => {
    let cancelled = false
    let lastSyncTime = 0
    const SYNC_DEBOUNCE_MS = 500 // Prevent syncs within 500ms

    const applyCart = nextCart => {
      if (cancelled) return
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
    }

    const clearCart = () => {
      if (cancelled) return
      setCart(null)
      setItemCount(0)
      setLoading(false)
      setIsLoggedIn(false)
      setError('')
    }

    const syncCart = async () => {
      const token = getToken()
      if (!token) {
        clearCart()
        return
      }

      setIsLoggedIn(true)
      setLoading(true)
      try {
        const data = await cartGet(token)
        applyCart(data.cart ?? null)
      } catch (err) {
        if (cancelled) return
        if (err?.code === 'AUTH_REQUIRED') {
          clearCart()
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

    const debouncedSync = () => {
      const now = Date.now()
      if (now - lastSyncTime >= SYNC_DEBOUNCE_MS) {
        lastSyncTime = now
        syncCart()
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
      const authError = new Error('AUTH_REQUIRED')
      authError.code = 'AUTH_REQUIRED'
      throw authError
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
      const e = new Error('AUTH_REQUIRED')
      e.code = 'AUTH_REQUIRED'
      throw e
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
      const e = new Error('AUTH_REQUIRED')
      e.code = 'AUTH_REQUIRED'
      throw e
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
      const e = new Error('AUTH_REQUIRED')
      e.code = 'AUTH_REQUIRED'
      throw e
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

  const applyCoupon = async code => {
    const token = getToken()
    if (!token) {
      const e = new Error('AUTH_REQUIRED')
      e.code = 'AUTH_REQUIRED'
      throw e
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
      const e = new Error('AUTH_REQUIRED')
      e.code = 'AUTH_REQUIRED'
      throw e
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
    isLoggedIn, // ✅ now reactive state, not a snapshot
    addPackage,
    updateItemQuantity,
    removeItem,
    updateCartDetails,
    applyCoupon,
    clearCoupon,
  }
}
