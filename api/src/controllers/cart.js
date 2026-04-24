import prisma from '../lib/prisma.js'
import { strapiGet, strapiServerGet } from '../lib/strapi.js'

const cartInclude = {
  items: { orderBy: { createdAt: 'asc' } },
}

const getCartWithItems = cartId =>
  prisma.cart.findUnique({
    where: { id: cartId },
    include: cartInclude,
  })

const CART_META_SEPARATOR = '||__ELEWEN_META__||'

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

// ─── Helper: recalculate cart totals ─────────────────────────────────────────
// couponIdOverride: pass null to explicitly remove coupon, a string to set one,
// or undefined to keep whatever couponId is already on the cart.
const recalcCart = async (cartId, couponIdOverride) => {
  const items = await prisma.cartItem.findMany({ where: { cartId } })
  const subtotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0)

  let couponId
  if (couponIdOverride !== undefined) {
    couponId = couponIdOverride
  } else {
    const cart = await prisma.cart.findUnique({ where: { id: cartId }, select: { couponId: true } })
    couponId = cart.couponId
  }

  let discountAmount = 0
  if (couponId) {
    try {
      const { data: coupons } = await strapiServerGet(`/api/coupons?filters[id][$eq]=${couponId}`)
      const coupon = coupons?.[0]
      if (coupon?.is_active) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = (subtotal * Number(coupon.discount_value)) / 100
        } else {
          discountAmount = Math.min(Number(coupon.discount_value), subtotal)
        }
      } else {
        couponId = null // coupon became inactive — detach
      }
    } catch {
      couponId = null // coupon not found — detach
    }
  }

  const total = Math.max(0, subtotal - discountAmount)
  await prisma.cart.update({
    where: { id: cartId },
    data: {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      total: total.toFixed(2),
      couponId,
    },
  })
}

// ─── GET /cart ─────────────────────────────────────────────────────────────────
export const getCart = async (req, res, next) => {
  try {
    const userId = String(req.user.id)

    let cart = await prisma.cart.findFirst({
      where: { userId },
      include: cartInclude,
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: cartInclude,
      })
    }

    await recalcCart(cart.id)
    cart = await getCartWithItems(cart.id)

    res.json({ cart })
  } catch (err) {
    next(err)
  }
}

// ─── POST /cart/items ──────────────────────────────────────────────────────────
export const addItem = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { packageId, quantity = 1, selectedOptions } = req.body

    if (!packageId) return res.status(400).json({ error: 'packageId is required' })
    if (quantity < 1) return res.status(400).json({ error: 'quantity must be at least 1' })

    // Fetch package from Strapi — use filter by id (Strapi v5 single entry needs documentId, filter by id works)
    const { data: pkgs } = await strapiGet('/packages', { 'filters[id][$eq]': packageId })
    const pkg = pkgs?.[0]
    if (!pkg) return res.status(404).json({ error: 'Package not found' })

    const unitPrice = Number(pkg.base_price)
    const title = pkg.title
    const selectionKey = buildSelectionKey(selectedOptions)
    const storedTitle = buildCartItemTitle(title, selectedOptions)

    // Get or create cart
    let cart = await prisma.cart.findFirst({ where: { userId } })
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } })
    }

    // If same package already in cart, increment quantity
    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        packageId: String(packageId),
        packageElementId: selectionKey,
        addonId: null,
      },
    })

    if (existing) {
      const newQty = existing.quantity + quantity
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty, totalPrice: (unitPrice * newQty).toFixed(2) },
      })
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          packageId: String(packageId),
          packageElementId: selectionKey,
          title: storedTitle,
          quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: (unitPrice * quantity).toFixed(2),
        },
      })
    }

    await recalcCart(cart.id)

    const updated = await getCartWithItems(cart.id)

    res.status(201).json({ cart: updated })
  } catch (err) {
    next(err)
  }
}

// ─── PUT /cart/items/:itemId ───────────────────────────────────────────────────
export const updateItem = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { itemId } = req.params
    const { quantity } = req.body

    if (!quantity || quantity < 1)
      return res.status(400).json({ error: 'quantity must be at least 1' })

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: { select: { userId: true, id: true } } },
    })

    if (!item) return res.status(404).json({ error: 'Cart item not found' })
    if (item.cart.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity,
        totalPrice: (Number(item.unitPrice) * quantity).toFixed(2),
      },
    })

    await recalcCart(item.cart.id)

    const cart = await getCartWithItems(item.cart.id)

    res.json({ cart })
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /cart/items/:itemId ────────────────────────────────────────────────
export const removeItem = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { itemId } = req.params

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: { select: { userId: true, id: true } } },
    })

    if (!item) return res.status(404).json({ error: 'Cart item not found' })
    if (item.cart.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const cartId = item.cart.id
    await prisma.cartItem.delete({ where: { id: itemId } })
    await recalcCart(cartId)

    const cart = await getCartWithItems(cartId)

    res.json({ cart })
  } catch (err) {
    next(err)
  }
}

// ─── PATCH /cart ───────────────────────────────────────────────────────────────
export const updateCart = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { eventDate, eventCity, guestCount } = req.body

    const cart = await prisma.cart.findFirst({ where: { userId } })
    if (!cart) return res.status(404).json({ error: 'Cart not found' })

    const updated = await prisma.cart.update({
      where: { id: cart.id },
      data: {
        ...(eventDate !== undefined && { eventDate: eventDate ? new Date(eventDate) : null }),
        ...(eventCity !== undefined && { eventCity }),
        ...(guestCount !== undefined && {
          guestCount: guestCount ? parseInt(guestCount, 10) : null,
        }),
      },
      include: cartInclude,
    })

    res.json({ cart: updated })
  } catch (err) {
    next(err)
  }
}

// ─── POST /cart/coupon ─────────────────────────────────────────────────────────
export const applyCoupon = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { code } = req.body

    if (!code) return res.status(400).json({ error: 'Coupon code is required' })

    const cart = await prisma.cart.findFirst({ where: { userId } })
    if (!cart) return res.status(404).json({ error: 'Cart not found' })

    // Find coupon in Strapi by code
    const { data: coupons } = await strapiServerGet(
      `/api/coupons?filters[code][$eq]=${encodeURIComponent(code.toUpperCase())}&filters[is_active][$eq]=true`
    )

    if (!coupons?.length) {
      return res.status(404).json({ error: 'Invalid or inactive coupon code' })
    }

    const coupon = coupons[0]
    const now = new Date()

    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return res.status(400).json({ error: 'This coupon is not yet active' })
    }
    if (coupon.valid_to && new Date(coupon.valid_to) < now) {
      return res.status(400).json({ error: 'This coupon has expired' })
    }
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return res.status(400).json({ error: 'This coupon has reached its usage limit' })
    }

    await prisma.cart.update({ where: { id: cart.id }, data: { couponId: String(coupon.id) } })
    await recalcCart(cart.id, String(coupon.id))

    const updated = await getCartWithItems(cart.id)

    res.json({
      cart: updated,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /cart/coupon ───────────────────────────────────────────────────────
export const removeCoupon = async (req, res, next) => {
  try {
    const userId = String(req.user.id)

    const cart = await prisma.cart.findFirst({ where: { userId } })
    if (!cart) return res.status(404).json({ error: 'Cart not found' })

    await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } })
    await recalcCart(cart.id, null)

    const updated = await getCartWithItems(cart.id)

    res.json({ cart: updated })
  } catch (err) {
    next(err)
  }
}
