import { strapiGet } from './strapi.js'

const STRAPI_BASE = process.env.STRAPI_URL || 'http://localhost:1337'

const BOOKING_STATUS_LABELS = {
  new: 'In Progress',
  confirmed: 'Confirmed',
  info_collection: 'Info Collection',
  planning: 'Planning',
  pre_event: 'Pre Event',
  execution: 'Execution',
  post_event: 'Post Event',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const SAMPLE_STATUS_LABELS = {
  new: 'Requested',
  assigned: 'Assigned',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function uniqueStrings(values = []) {
  return [...new Set(values.map(value => String(value ?? '').trim()).filter(Boolean))]
}

function buildInFilterQuery(ids = []) {
  return uniqueStrings(ids)
    .map((id, index) => `filters[id][$in][${index}]=${encodeURIComponent(id)}`)
    .join('&')
}

function toAbsoluteUrl(value) {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `${STRAPI_BASE}${value}`
}

function normalizeRelation(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value.data)) return value.data
  if (value.data) return [value.data]
  return [value]
}

function getFirstMediaUrl(value) {
  const item = normalizeRelation(value)[0]
  if (!item) return null

  return toAbsoluteUrl(
    item.formats?.large?.url ??
      item.formats?.medium?.url ??
      item.formats?.small?.url ??
      item.formats?.thumbnail?.url ??
      item.url ??
      null
  )
}

export function toNumber(value) {
  if (value == null) return 0
  if (typeof value?.toNumber === 'function') return value.toNumber()

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function roundCurrency(value) {
  return Number(toNumber(value).toFixed(2))
}

export function mapEventPreview(event) {
  if (!event) return null

  return {
    id: String(event.id),
    documentId: event.documentId ?? '',
    name: event.name ?? '',
    slug: event.slug ?? '',
    tagline: event.tagline ?? '',
    iconUrl: getFirstMediaUrl(event.icon),
  }
}

export function mapPackagePreview(pkg) {
  if (!pkg) return null

  return {
    id: String(pkg.id),
    documentId: pkg.documentId ?? '',
    title: pkg.title ?? '',
    slug: pkg.slug ?? '',
    basePrice: roundCurrency(pkg.base_price),
    imageUrl: getFirstMediaUrl(pkg.images),
    serviceCategories: normalizeRelation(pkg.service_categories).map(category => ({
      id: String(category.id),
      name: category.name ?? '',
      slug: category.slug ?? '',
    })),
    events: normalizeRelation(pkg.events).map(mapEventPreview).filter(Boolean),
  }
}

export function mapAddressPreview(address) {
  if (!address) return null

  const summary = [address.line1, address.line2, address.city, address.state]
    .filter(Boolean)
    .join(', ')

  return {
    id: String(address.id),
    documentId: address.documentId ?? '',
    line1: address.line1 ?? '',
    line2: address.line2 ?? '',
    city: address.city ?? '',
    state: address.state ?? '',
    pincode: address.pincode ?? '',
    country: address.country ?? 'India',
    summary,
  }
}

export function mapVendorPreview(vendor) {
  if (!vendor) return null

  return {
    id: String(vendor.id),
    documentId: vendor.documentId ?? '',
    companyName: vendor.company_name ?? '',
    contactPerson: vendor.contact_person ?? '',
    email: vendor.email ?? '',
    phone: vendor.phone ?? '',
    locationCity: vendor.location_city ?? '',
    serviceArea: vendor.service_area ?? '',
    experienceYears: vendor.experience_years ?? null,
    minimumPrice: roundCurrency(vendor.minimum_price),
  }
}

async function fetchPackagesByIds(ids = []) {
  const uniqueIds = uniqueStrings(ids)
  if (uniqueIds.length === 0) return new Map()

  const query = [
    buildInFilterQuery(uniqueIds),
    'populate[0]=images',
    'populate[1]=service_categories',
    'populate[2]=events',
    `pagination[pageSize]=${Math.max(uniqueIds.length, 1)}`,
    'publicationState=preview',
  ].join('&')

  const result = await strapiGet(`/packages?${query}`)
  return new Map((result?.data ?? []).map(pkg => [String(pkg.id), mapPackagePreview(pkg)]))
}

async function fetchEventsByIds(ids = []) {
  const uniqueIds = uniqueStrings(ids)
  if (uniqueIds.length === 0) return new Map()

  const query = [
    buildInFilterQuery(uniqueIds),
    'populate[0]=icon',
    `pagination[pageSize]=${Math.max(uniqueIds.length, 1)}`,
    'publicationState=preview',
  ].join('&')

  const result = await strapiGet(`/events?${query}`)
  return new Map((result?.data ?? []).map(event => [String(event.id), mapEventPreview(event)]))
}

async function fetchAddressesByIds(ids = []) {
  const uniqueIds = uniqueStrings(ids)
  if (uniqueIds.length === 0) return new Map()

  const query = [
    buildInFilterQuery(uniqueIds),
    `pagination[pageSize]=${Math.max(uniqueIds.length, 1)}`,
    'publicationState=preview',
  ].join('&')

  const result = await strapiGet(`/addresses?${query}`)
  return new Map((result?.data ?? []).map(address => [String(address.id), mapAddressPreview(address)]))
}

async function fetchVendorsByIds(ids = []) {
  const uniqueIds = uniqueStrings(ids)
  if (uniqueIds.length === 0) return new Map()

  const query = [
    buildInFilterQuery(uniqueIds),
    `pagination[pageSize]=${Math.max(uniqueIds.length, 1)}`,
    'publicationState=preview',
  ].join('&')

  const result = await strapiGet(`/vendors?${query}`)
  return new Map((result?.data ?? []).map(vendor => [String(vendor.id), mapVendorPreview(vendor)]))
}

function getLatestStatusLog(statusLogs = []) {
  if (!Array.isArray(statusLogs) || statusLogs.length === 0) return null

  return statusLogs.reduce((latest, current) => {
    if (!latest) return current
    return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
  }, null)
}

export function getBookingCategory(booking) {
  const status = String(booking?.status ?? '')
  if (status === 'completed' || status === 'cancelled') return 'previous'

  if (booking?.eventDate) {
    const eventDate = new Date(booking.eventDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (!Number.isNaN(eventDate.getTime()) && eventDate < today) {
      return 'previous'
    }
  }

  return 'active'
}

export function filterBookingsByType(bookings = [], type = 'all') {
  if (!type || type === 'all') return bookings
  return bookings.filter(booking => getBookingCategory(booking) === type)
}

function getPaymentSummary(booking) {
  const successfulPayments = Array.isArray(booking?.payments)
    ? booking.payments.filter(payment => payment.status === 'success')
    : []

  const amountPaid = successfulPayments.reduce((sum, payment) => sum + toNumber(payment.amount), 0)
  const totalPrice = roundCurrency(booking?.totalPrice)
  const advanceAmount = roundCurrency(booking?.advanceAmount)
  const scheduledRemainingAmount = roundCurrency(booking?.remainingAmount)
  const amountDue = roundCurrency(Math.max(totalPrice - amountPaid, 0))

  return {
    totalPrice,
    advanceAmount,
    scheduledRemainingAmount,
    amountPaid: roundCurrency(amountPaid),
    amountDue,
    advancePaid: successfulPayments.some(
      payment => payment.paymentType === 'advance' || payment.paymentType === 'full'
    ),
    remainingPaid:
      amountDue <= 0 ||
      successfulPayments.some(
        payment => payment.paymentType === 'remaining' || payment.paymentType === 'full'
      ),
    paymentCount: successfulPayments.length,
  }
}

export async function enrichBookings(bookings = []) {
  const packageIds = bookings.map(booking => booking.packageId)
  const eventIds = bookings.map(booking => booking.eventId)
  const addressIds = bookings.map(booking => booking.eventAddressId)
  const vendorIds = bookings.flatMap(booking =>
    Array.isArray(booking.vendorAssignments)
      ? booking.vendorAssignments.map(assignment => assignment.vendorId)
      : []
  )

  const [packageMap, eventMap, addressMap, vendorMap] = await Promise.all([
    fetchPackagesByIds(packageIds),
    fetchEventsByIds(eventIds),
    fetchAddressesByIds(addressIds),
    fetchVendorsByIds(vendorIds),
  ])

  return bookings.map(booking => {
    const packagePreview = packageMap.get(String(booking.packageId)) ?? null
    const fallbackEvent = packagePreview?.events?.[0] ?? null
    const eventPreview = eventMap.get(String(booking.eventId)) ?? fallbackEvent
    const addressPreview = addressMap.get(String(booking.eventAddressId)) ?? null
    const paymentSummary = getPaymentSummary(booking)
    const latestStatusLog = getLatestStatusLog(booking.statusLogs)

    return {
      ...booking,
      bookingCategory: getBookingCategory(booking),
      statusLabel: BOOKING_STATUS_LABELS[booking.status] ?? booking.status ?? 'Unknown',
      latestStatusLog,
      locationSummary: addressPreview?.summary ?? '',
      package: packagePreview,
      event: eventPreview,
      address: addressPreview,
      paymentSummary,
      vendorAssignments: Array.isArray(booking.vendorAssignments)
        ? booking.vendorAssignments.map(assignment => ({
            ...assignment,
            vendor: vendorMap.get(String(assignment.vendorId)) ?? null,
          }))
        : [],
    }
  })
}

function getDaysUntil(dateValue) {
  if (!dateValue) return null

  const target = new Date(dateValue)
  if (Number.isNaN(target.getTime())) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)

  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export async function enrichSampleTastes(samples = []) {
  const packageIds = samples.map(sample => sample.packageId)
  const eventIds = samples.map(sample => sample.eventId)
  const vendorIds = samples.flatMap(sample =>
    Array.isArray(sample.vendors) ? sample.vendors.map(vendor => vendor.vendorId) : []
  )

  const [packageMap, eventMap, vendorMap] = await Promise.all([
    fetchPackagesByIds(packageIds),
    fetchEventsByIds(eventIds),
    fetchVendorsByIds(vendorIds),
  ])

  return samples.map(sample => {
    const packagePreview = packageMap.get(String(sample.packageId)) ?? null
    const fallbackEvent = packagePreview?.events?.[0] ?? null
    const eventPreview = eventMap.get(String(sample.eventId)) ?? fallbackEvent
    const daysUntilExpiry = getDaysUntil(sample.expiryDate)

    return {
      ...sample,
      statusLabel: SAMPLE_STATUS_LABELS[sample.status] ?? sample.status ?? 'Unknown',
      package: packagePreview,
      event: eventPreview,
      daysUntilExpiry,
      isExpired: typeof daysUntilExpiry === 'number' ? daysUntilExpiry < 0 : false,
      vendors: Array.isArray(sample.vendors)
        ? sample.vendors.map(vendor => ({
            ...vendor,
            vendor: vendorMap.get(String(vendor.vendorId)) ?? null,
          }))
        : [],
    }
  })
}

export async function enrichSavedPackages(items = []) {
  const packageMap = await fetchPackagesByIds(items.map(item => item.packageId))

  return items.map(item => {
    const packagePreview = packageMap.get(String(item.packageId)) ?? null
    const fallbackPackage = item.package ?? null

    return {
      ...item,
      package: packagePreview ?? fallbackPackage,
      title: packagePreview?.title ?? item.title ?? '',
      slug: packagePreview?.slug ?? item.slug ?? '',
      imageUrl: packagePreview?.imageUrl ?? item.imageUrl ?? null,
      basePrice: packagePreview?.basePrice ?? roundCurrency(item.basePrice),
      serviceCategories: packagePreview?.serviceCategories ?? item.serviceCategories ?? [],
      events: packagePreview?.events ?? item.events ?? [],
    }
  })
}

export async function fetchDashboardHelpContent() {
  const result = await strapiGet('/global-setting', { publicationState: 'preview' })
  const data = result?.data ?? result ?? {}

  return {
    primaryPhone: data.primary_phone ?? '',
    supportEmail: data.support_email ?? '',
    supportAvailabilityText: data.support_availability_text ?? '',
    whatsappNumber: data.whatsapp_number ?? '',
    responseExpectationText: data.response_expectation_text ?? '',
  }
}
