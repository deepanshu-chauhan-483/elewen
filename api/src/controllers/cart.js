import prisma from '../lib/prisma.js'
import { strapiGet } from '../lib/strapi.js'
import {
  findGrantById,
  normalizeStrapiCoupon,
  resolveAppliedCoupon,
  resolveCouponByCode,
} from '../lib/coupons.js'
import {
  attachSelectedOptionsToCartItems,
  buildStoredCartItemTitle,
  getDisplayTitle,
  normalizeSelectedOptions,
} from '../lib/cartItemMeta.js'

const cartInclude = {
  items: { orderBy: { createdAt: 'asc' } },
}

const getCartWithItems = cartId =>
  prisma.cart.findUnique({
    where: { id: cartId },
    include: cartInclude,
  })

const getCouponSnapshot = async (couponId, couponGrantId) => {
  if (couponGrantId) {
    const grant = await findGrantById(couponGrantId)
    if (!grant) return null
    return {
      id: grant.grantId,
      code: grant.code,
      discount_type: grant.discount_type,
      discount_value: grant.discount_value,
      is_active: grant.status === 'active',
      terms_customer: grant.terms_customer,
      source: 'grant',
    }
  }

  if (!couponId) return null

  try {
    const { data: coupons } = await strapiGet('/coupons', {
      'filters[id][$eq]': couponId,
    })
    const coupon = normalizeStrapiCoupon(coupons?.[0])
    if (!coupon) return null

    return {
      id: String(coupon.id),
      code: coupon.code ?? '',
      discount_type: coupon.discount_type ?? '',
      discount_value: coupon.discount_value ?? 0,
      is_active: Boolean(coupon.is_active),
      terms_customer: coupon.terms_customer ?? '',
      source: 'strapi',
    }
  } catch {
    return null
  }
}

const attachCouponDetails = async cart => {
  if (!cart) return cart

  const coupon = await getCouponSnapshot(cart.couponId, cart.couponGrantId)

  return {
    ...cart,
    couponCode: coupon?.code ?? null,
    coupon: coupon
      ? {
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          terms_customer: coupon.terms_customer ?? '',
          source: coupon.source,
        }
      : null,
  }
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
  return buildStoredCartItemTitle(title, selectedOptions)
}

function parseGuestCountValue(value) {
  const count = parseInt(String(value ?? '').replace(/\D/g, ''), 10)
  return Number.isFinite(count) && count > 0 ? count : 0
}

function isCateringPackage(pkg) {
  const categories = normalizeSectionItems(pkg?.service_categories)
  if (
    categories.some(entry =>
      String(entry?.slug ?? '')
        .toLowerCase()
        .includes('catering')
    )
  ) {
    return true
  }

  const sections = normalizeSectionItems(pkg?.packages)
  return sections.some(section => section?.__component === 'package.cateringpackage')
}

function isCateringPerPersonAddon(addon) {
  if (!addon) return false
  const scope = String(addon?.addon_scope ?? '').toLowerCase()
  if (scope === 'catering') return true
  const unit = String(addon?.unit ?? '').toLowerCase()
  return unit.includes('pax') || unit.includes('person')
}

async function syncCateringAddonTotalsForPackage(cartId, packageId, guestCount) {
  const guests = parseGuestCountValue(guestCount)
  if (!guests) return

  const addonItems = await prisma.cartItem.findMany({
    where: {
      cartId,
      packageId: String(packageId),
      addonId: { not: null },
    },
  })

  for (const addonItem of addonItems) {
    const perPerson = Number(addonItem.unitPrice ?? 0)
    if (!perPerson) continue

    const quantity = Math.max(1, Number(addonItem.quantity ?? 1))
    const lineTotal = perPerson * guests * quantity
    const displayTitle = getDisplayTitle(addonItem.title)
    const normalized = normalizeSelectedOptions({
      'Guest count': String(guests),
    })

    await prisma.cartItem.update({
      where: { id: addonItem.id },
      data: {
        title: buildStoredCartItemTitle(displayTitle, normalized, {
          addonTitle: displayTitle,
          parentPackageId: packageId,
        }),
        selectedOptions: normalized,
        totalPrice: lineTotal.toFixed(2),
      },
    })
  }
}

function normalizeSectionItems(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}

function getPackageAddons(pkg) {
  const sections = normalizeSectionItems(pkg?.packages)

  return [
    ...sections.flatMap(section =>
      Array.isArray(section?.addons) ? section.addons : normalizeSectionItems(section?.addons)
    ),
    ...normalizeSectionItems(pkg?.reusable_addons),
  ]
}

const PACKAGE_POPULATE = {
  'populate[reusable_addons]': 'true',
  'populate[service_categories]': 'true',
  'populate[packages][on][package.decorpackages][populate][addons]': 'true',
  'populate[packages][on][package.sheeshapackage][populate][addons]': 'true',
  'populate[packages][on][package.cateringpackage]': 'true',
}

async function resolvePackageById(packageId) {
  const raw = String(packageId ?? '').trim()
  if (!raw) return null

  const { data: byId } = await strapiGet('/packages', {
    'filters[id][$eq]': raw,
    ...PACKAGE_POPULATE,
  })
  if (byId?.[0]) return byId[0]

  const { data: byDocumentId } = await strapiGet('/packages', {
    'filters[documentId][$eq]': raw,
    ...PACKAGE_POPULATE,
  })
  return byDocumentId?.[0] ?? null
}

// ─── Helper: recalculate cart totals ─────────────────────────────────────────
// couponOverride: { couponId, couponGrantId } or undefined to read from cart
const recalcCart = async (cartId, couponOverride) => {
  const items = await prisma.cartItem.findMany({ where: { cartId } })
  const subtotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0)

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    select: { couponId: true, couponGrantId: true, userId: true },
  })

  let couponId = cart?.couponId ?? null
  let couponGrantId = cart?.couponGrantId ?? null

  if (couponOverride !== undefined) {
    couponId = couponOverride.couponId ?? null
    couponGrantId = couponOverride.couponGrantId ?? null
  }

  let discountAmount = 0
  if (couponId || couponGrantId) {
    const result = await resolveAppliedCoupon({
      couponId,
      couponGrantId,
      userId: cart?.userId,
      subtotal,
    })

    if (result.valid) {
      discountAmount = result.discount
      couponId = result.couponId
      couponGrantId = result.couponGrantId
    } else {
      couponId = null
      couponGrantId = null
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
      couponGrantId,
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

    res.json({
      cart: attachSelectedOptionsToCartItems(await attachCouponDetails(cart)),
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /cart/items ──────────────────────────────────────────────────────────
export const addItem = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const {
      packageId,
      quantity = 1,
      selectedOptions,
      addonTitle = '',
      addon = null,
      unitPrice: customUnitPrice = null,
      totalPrice: customTotalPrice = null,
    } = req.body

    const pkg = await resolvePackageById(packageId)
    if (!pkg) return res.status(404).json({ error: 'Package not found' })

    const resolvedPackageId = String(pkg.id ?? packageId)

    const requestedAddonId = addon?.id != null ? String(addon.id) : ''
    const requestedAddonTitle = String(addon?.name ?? addonTitle ?? '').trim()
    const matchedAddon = getPackageAddons(pkg).find(entry => {
      const entryId = String(entry?.id ?? '')
      const entryName = String(entry?.name ?? entry?.title ?? '').trim()

      return (
        (requestedAddonId && entryId === requestedAddonId) ||
        (requestedAddonTitle && entryName.toLowerCase() === requestedAddonTitle.toLowerCase())
      )
    })
    const addonId = matchedAddon?.id != null ? String(matchedAddon.id) : ''
    const trimmedAddonTitle = String(
      matchedAddon?.name ?? matchedAddon?.title ?? requestedAddonTitle
    ).trim()
    const isAddon = Boolean(addonId && trimmedAddonTitle)

    const cateringPackage = isCateringPackage(pkg)
    const cateringAddon = isAddon && (isCateringPerPersonAddon(matchedAddon) || cateringPackage)

    // Use custom unit price if provided and valid, otherwise use addon price or base price
    let unitPrice
    if (isAddon) {
      const resolvedCustomPrice = Number(customUnitPrice ?? 0)
      unitPrice =
        Number.isFinite(resolvedCustomPrice) && resolvedCustomPrice > 0
          ? resolvedCustomPrice
          : Number(matchedAddon?.price ?? 0)
    } else {
      const resolvedCustomPrice = Number(customUnitPrice ?? 0)
      unitPrice =
        Number.isFinite(resolvedCustomPrice) && resolvedCustomPrice > 0
          ? resolvedCustomPrice
          : Number(pkg.base_price)
    }

    const title = pkg.title
    const normalizedOptions = normalizeSelectedOptions(selectedOptions)
    const selectionKey = isAddon ? null : buildSelectionKey(normalizedOptions)
    const storedTitle = isAddon
      ? buildStoredCartItemTitle(trimmedAddonTitle, normalizedOptions, {
          addonTitle: trimmedAddonTitle,
          parentPackageId: resolvedPackageId,
        })
      : buildStoredCartItemTitle(title, normalizedOptions)

    // Get or create cart
    let cart = await prisma.cart.findFirst({ where: { userId } })
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } })
    }

    // If same package already in cart, increment quantity
    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        packageId: resolvedPackageId,
        packageElementId: selectionKey,
        addonId: addonId || null,
      },
    })

    const resolvedCustomTotal = Number(customTotalPrice ?? 0)
    const guestCountForAddon = cateringAddon
      ? parseGuestCountValue(normalizedOptions['Guest count'] ?? normalizedOptions['Guest Count'])
      : 0

    const defaultLineTotal =
      cateringAddon && guestCountForAddon
        ? unitPrice * guestCountForAddon * quantity
        : unitPrice * quantity

    const itemTotal =
      Number.isFinite(resolvedCustomTotal) && resolvedCustomTotal > 0
        ? resolvedCustomTotal
        : defaultLineTotal

    if (existing) {
      const newQty = existing.quantity + quantity
      const mergedTotal =
        Number.isFinite(resolvedCustomTotal) && resolvedCustomTotal > 0
          ? resolvedCustomTotal
          : cateringAddon && guestCountForAddon
            ? unitPrice * guestCountForAddon * newQty
            : unitPrice * newQty

      await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: newQty,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: mergedTotal.toFixed(2),
          title: storedTitle,
          selectedOptions: normalizedOptions,
        },
      })
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          packageId: resolvedPackageId,
          packageElementId: selectionKey,
          addonId: addonId || null,
          title: storedTitle,
          selectedOptions: normalizedOptions,
          quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: itemTotal.toFixed(2),
        },
      })
    }

    await recalcCart(cart.id)

    const updated = await getCartWithItems(cart.id)

    res.status(201).json({
      cart: attachSelectedOptionsToCartItems(await attachCouponDetails(updated)),
    })
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

    res.json({
      cart: attachSelectedOptionsToCartItems(await attachCouponDetails(cart)),
    })
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

    res.json({
      cart: attachSelectedOptionsToCartItems(await attachCouponDetails(cart)),
    })
  } catch (err) {
    next(err)
  }
}

// ─── PATCH /cart ───────────────────────────────────────────────────────────────
export const updateCart = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const {
      eventDate,
      eventCity,
      guestCount,
      itemId,
      quantity,
      selectedOptions,
      unitPrice: customUnitPrice = null,
    } = req.body

    const cart = await prisma.cart.findFirst({ where: { userId } })
    if (!cart) return res.status(404).json({ error: 'Cart not found' })

    if (itemId !== undefined) {
      const item = await prisma.cartItem.findUnique({
        where: { id: String(itemId) },
        include: { cart: { select: { userId: true, id: true } } },
      })

      if (!item) return res.status(404).json({ error: 'Cart item not found' })
      if (item.cart.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

      const nextQuantity = quantity !== undefined ? Number(quantity) : Number(item.quantity)
      if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
        return res.status(400).json({ error: 'quantity must be at least 1' })
      }

      const normalizedSelectedOptions = normalizeSelectedOptions(selectedOptions)
      const nextSelectionKey = buildSelectionKey(normalizedSelectedOptions)
      const nextTitle = buildCartItemTitle(
        getDisplayTitle(item.title) || item.title,
        normalizedSelectedOptions
      )
      const resolvedCustomPrice = Number(customUnitPrice ?? 0)
      const resolvedCustomTotal = Number(req.body?.totalPrice ?? 0)
      const nextUnitPrice =
        Number.isFinite(resolvedCustomPrice) && resolvedCustomPrice > 0
          ? resolvedCustomPrice
          : Number(item.unitPrice)
      const nextLineTotal =
        Number.isFinite(resolvedCustomTotal) && resolvedCustomTotal > 0
          ? resolvedCustomTotal
          : nextUnitPrice * nextQuantity

      const duplicateItem = await prisma.cartItem.findFirst({
        where: {
          cartId: item.cart.id,
          packageId: item.packageId,
          packageElementId: nextSelectionKey,
          addonId: null,
          NOT: { id: item.id },
        },
      })

      if (duplicateItem) {
        const mergedQuantity = Number(duplicateItem.quantity) + nextQuantity

        await prisma.cartItem.update({
          where: { id: duplicateItem.id },
          data: {
            quantity: mergedQuantity,
            unitPrice: nextUnitPrice.toFixed(2),
            totalPrice: nextLineTotal.toFixed(2),
            title: nextTitle,
            selectedOptions: normalizedSelectedOptions,
          },
        })

        await prisma.cartItem.delete({ where: { id: item.id } })
      } else {
        await prisma.cartItem.update({
          where: { id: item.id },
          data: {
            title: nextTitle,
            packageElementId: nextSelectionKey,
            selectedOptions: normalizedSelectedOptions,
            quantity: nextQuantity,
            unitPrice: nextUnitPrice.toFixed(2),
            totalPrice: nextLineTotal.toFixed(2),
          },
        })
      }

      const guestsForSync = parseGuestCountValue(
        normalizedSelectedOptions['Guest count'] ?? normalizedSelectedOptions['Guest Count']
      )
      if (!item.addonId && guestsForSync > 0) {
        await syncCateringAddonTotalsForPackage(item.cart.id, item.packageId, guestsForSync)
      }

      await recalcCart(item.cart.id)

      const updatedCart = await getCartWithItems(item.cart.id)

      return res.json({
        cart: attachSelectedOptionsToCartItems(await attachCouponDetails(updatedCart)),
      })
    }

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

    res.json({
      cart: attachSelectedOptionsToCartItems(await attachCouponDetails(updated)),
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /cart/coupon ─────────────────────────────────────────────────────────
export const applyCoupon = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { code } = req.body

    const cart = await prisma.cart.findFirst({ where: { userId }, include: cartInclude })
    if (!cart) return res.status(404).json({ error: 'Cart not found' })

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.totalPrice), 0)
    const result = await resolveCouponByCode(code, { userId, subtotal })

    if (!result.valid) {
      return res.status(400).json({ error: result.error ?? 'Invalid or inactive coupon code' })
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        couponId: result.couponId,
        couponGrantId: result.couponGrantId,
      },
    })
    await recalcCart(cart.id)

    const updated = await getCartWithItems(cart.id)

    res.json({
      cart: attachSelectedOptionsToCartItems(await attachCouponDetails(updated)),
      coupon: {
        code: result.coupon.code,
        discount_type: result.coupon.discount_type,
        discount_value: result.coupon.discount_value,
        terms_customer: result.coupon.terms_customer ?? '',
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

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null, couponGrantId: null },
    })
    await recalcCart(cart.id, { couponId: null, couponGrantId: null })

    const updated = await getCartWithItems(cart.id)

    res.json({
      cart: attachSelectedOptionsToCartItems(await attachCouponDetails(updated)),
    })
  } catch (err) {
    next(err)
  }
}
