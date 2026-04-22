import { useEffect, useState } from 'react'
import { cartAddItem, cartGet, cartRemoveItem, cartUpdate, cartUpdateItem } from '../lib/api'

const CART_EVENT = 'elewen-cart-change'

function getToken() {
  return localStorage.getItem('elewen_jwt')
}

function getItemCount(cart) {
  return (cart?.items ?? []).reduce((sum, item) => sum + Number(item?.quantity ?? 0), 0)
}

function getPackageCount(cart, packageId) {
  return (cart?.items ?? []).reduce((sum, item) => {
    if (String(item?.packageId) !== String(packageId)) return sum
    return sum + Number(item?.quantity ?? 0)
  }, 0)
}

export function dispatchCartChange(cart) {
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { cart } }))
}

export function useCart() {
  const [cart, setCart] = useState(null)
  const [itemCount, setItemCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

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
      setError('')
    }

    const syncCart = async () => {
      const token = getToken()
      if (!token) {
        clearCart()
        return
      }

      setLoading(true)
      try {
        const data = await cartGet(token)
        applyCart(data.cart ?? null)
      } catch (err) {
        if (cancelled) return
        console.error('[cart] sync failed', err)
        setError(err.message ?? 'Failed to load cart')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    const handleAuthChange = () => {
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

  const addPackage = async ({ packageId, quantity = 1 }) => {
    const token = getToken()
    if (!token) {
      const authError = new Error('AUTH_REQUIRED')
      authError.code = 'AUTH_REQUIRED'
      throw authError
    }

    console.log('[cart] addPackage request', { packageId, quantity })
    try {
      const data = await cartAddItem(token, { packageId, quantity })
      const nextCart = data.cart ?? null
      console.log('[cart] addPackage success', {
        packageId,
        quantity,
        itemCount: getItemCount(nextCart),
        packageCount: getPackageCount(nextCart, packageId),
        items: nextCart?.items ?? [],
      })
      setCart(nextCart)
      setItemCount(getItemCount(nextCart))
      setError('')
      dispatchCartChange(nextCart)
      return nextCart
    } catch (err) {
      console.error('[cart] addPackage failed', { packageId, quantity, err })
      setError(err.message ?? 'Failed to add package to cart')
      throw err
    }
  }

  const updateItemQuantity = async (itemId, quantity) => {
    const token = getToken()
    if (!token) {
      const authError = new Error('AUTH_REQUIRED')
      authError.code = 'AUTH_REQUIRED'
      throw authError
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
      console.error('[cart] updateItemQuantity failed', { itemId, quantity, err })
      setError(err.message ?? 'Failed to update cart item')
      throw err
    }
  }

  const removeItem = async itemId => {
    const token = getToken()
    if (!token) {
      const authError = new Error('AUTH_REQUIRED')
      authError.code = 'AUTH_REQUIRED'
      throw authError
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
      console.error('[cart] removeItem failed', { itemId, err })
      setError(err.message ?? 'Failed to remove cart item')
      throw err
    }
  }

  const updateCartDetails = async body => {
    const token = getToken()
    if (!token) {
      const authError = new Error('AUTH_REQUIRED')
      authError.code = 'AUTH_REQUIRED'
      throw authError
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
      console.error('[cart] updateCartDetails failed', { body, err })
      setError(err.message ?? 'Failed to update cart details')
      throw err
    }
  }

  return {
    cart,
    itemCount,
    loading,
    error,
    isLoggedIn: !!getToken(),
    addPackage,
    updateItemQuantity,
    removeItem,
    updateCartDetails,
  }
}
