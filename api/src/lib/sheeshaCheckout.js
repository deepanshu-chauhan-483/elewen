import { strapiGet } from './strapi.js'

const PACKAGE_POPULATE = {
  'populate[reusable_addons]': 'true',
  'populate[service_categories]': 'true',
  'populate[packages][on][package.decorpackages]': 'true',
  'populate[packages][on][package.sheeshapackage]': 'true',
  'populate[packages][on][package.cateringpackage]': 'true',
  'populate[packages][on][package.bartendingpackage]': 'true',
}

function normalizeSectionItems(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}

export function isCodPayment(payment) {
  if (!payment) return false
  return (
    payment.provider === 'manual' &&
    payment.paymentMethod === 'offline' &&
    payment.providerOrderId === 'COD'
  )
}

export function isCodPendingPayment(payment) {
  return isCodPayment(payment) && payment.status === 'pending'
}

export function isCodCollectedPayment(payment) {
  return isCodPayment(payment) && payment.status === 'success'
}

/** Prisma filter: booking visible in customer dashboard/lists. */
export const BOOKING_VISIBLE_PAYMENT_FILTER = {
  some: {
    OR: [
      { status: 'success' },
      {
        status: 'pending',
        provider: 'manual',
        paymentMethod: 'offline',
        providerOrderId: 'COD',
      },
    ],
  },
}

export async function resolvePackageById(packageId) {
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

export function inferServiceSlugsFromPackage(pkg) {
  const sections = normalizeSectionItems(pkg?.packages)
  const componentTypes = [
    ...new Set(sections.map(section => String(section?.__component ?? '').trim()).filter(Boolean)),
  ]

  const slugs = new Set()

  componentTypes.forEach(componentType => {
    if (componentType === 'package.sheeshapackage') slugs.add('sheesha')
    if (componentType === 'package.decorpackages') slugs.add('decor')
    if (componentType === 'package.bartendingpackage') slugs.add('bartending')
    if (componentType === 'package.cateringpackage') slugs.add('catering')
  })

  const categories = Array.isArray(pkg?.service_categories)
    ? pkg.service_categories
    : Array.isArray(pkg?.service_categories?.data)
      ? pkg.service_categories.data
      : []

  categories.forEach(category => {
    const slug = String(category?.slug ?? category?.attributes?.slug ?? '')
      .trim()
      .toLowerCase()
    if (slug.includes('sheesha') || slug.includes('hookah')) slugs.add('sheesha')
    if (slug.includes('decor')) slugs.add('decor')
    if (slug.includes('catering')) slugs.add('catering')
    if (slug.includes('bartending') || slug.includes('bar-tending')) slugs.add('bartending')
    if (slug.includes('furniture') || slug.includes('rental')) slugs.add('rental-furniture')
  })

  return [...slugs]
}

export function isSheeshaServiceSlug(slug = '') {
  const normalized = String(slug ?? '').trim().toLowerCase()
  return normalized === 'sheesha' || normalized === 'sheesha-services' || normalized === 'hookah'
}

export async function classifyCartItems(cartItems = []) {
  const items = Array.isArray(cartItems) ? cartItems : []
  if (!items.length) {
    return {
      isEmpty: true,
      isSheeshaOnly: false,
      hasSheesha: false,
      hasNonSheesha: false,
      isMixedSheeshaCart: false,
      serviceSlugs: [],
    }
  }

  const packageIds = [...new Set(items.map(item => String(item.packageId ?? '').trim()).filter(Boolean))]
  const packages = await Promise.all(packageIds.map(resolvePackageById))
  const packageById = new Map(
    packageIds.map((id, index) => [id, packages[index]]).filter(([, pkg]) => Boolean(pkg))
  )

  const serviceSlugs = new Set()

  items.forEach(item => {
    const pkg = packageById.get(String(item.packageId ?? '').trim())
    if (!pkg) return
    inferServiceSlugsFromPackage(pkg).forEach(slug => serviceSlugs.add(slug))
  })

  const slugs = [...serviceSlugs]
  const hasSheesha = slugs.some(isSheeshaServiceSlug)
  const nonSheeshaSlugs = slugs.filter(slug => !isSheeshaServiceSlug(slug))
  const hasNonSheesha = nonSheeshaSlugs.length > 0
  const isSheeshaOnly = hasSheesha && !hasNonSheesha && slugs.length > 0

  return {
    isEmpty: false,
    isSheeshaOnly,
    hasSheesha,
    hasNonSheesha,
    isMixedSheeshaCart: hasSheesha && hasNonSheesha,
    serviceSlugs: slugs,
  }
}

export async function bookingHasCodPendingPayment(bookingId) {
  const { default: prisma } = await import('./prisma.js')
  const payment = await prisma.payment.findFirst({
    where: {
      bookingId,
      status: 'pending',
      provider: 'manual',
      paymentMethod: 'offline',
      providerOrderId: 'COD',
    },
  })
  return Boolean(payment)
}

export async function assertSheeshaOnlyCart(cartItems = []) {
  const classification = await classifyCartItems(cartItems)

  if (classification.isEmpty) {
    const error = new Error('Cart is empty')
    error.status = 400
    throw error
  }

  if (classification.isMixedSheeshaCart) {
    const error = new Error(
      'Hookah needs a separate booking — it can’t be combined with other services in the same cart.'
    )
    error.status = 400
    throw error
  }

  if (!classification.isSheeshaOnly) {
    const error = new Error('This checkout path is only available for Hookah-only bookings.')
    error.status = 400
    throw error
  }

  return classification
}

export async function clearUserCart(userId) {
  const { default: prisma } = await import('./prisma.js')
  if (!userId) return

  const cart = await prisma.cart.findFirst({
    where: { userId: String(userId) },
    select: { id: true },
  })

  if (!cart) return

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      subtotal: 0,
      discountAmount: 0,
      total: 0,
      couponId: null,
      couponGrantId: null,
      eventDate: null,
      guestCount: null,
    },
  })
}
