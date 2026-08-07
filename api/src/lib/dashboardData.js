import { strapiGet } from './strapi.js'
import { cacheGet, cacheSet, TTL } from './cache.js'
import { calculateBookingRefundPreview, getCancellationPolicyData } from './cancellationPolicy.js'
import { isCodPayment } from './sheeshaCheckout.js'
import { BOOKING_STATUS_LABELS } from './bookingStages.js'

const STRAPI_BASE = process.env.STRAPI_URL || 'http://localhost:1337'

const SAMPLE_STATUS_LABELS = {
  new: 'Requested',
  assigned: 'Assigned',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const CART_META_SEPARATOR = '||__ELEWEN_META__||'

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

function uniqueValues(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))]
}

function normalizeDynamicZoneItems(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}

function getNestedPackageSections(pkg) {
  return normalizeDynamicZoneItems(pkg?.packages)
}

function getNestedPackageElements(pkg) {
  return getNestedPackageSections(pkg).flatMap(section =>
    Array.isArray(section?.elements) ? section.elements : []
  )
}

function getNestedPackageInclusions(pkg) {
  return getNestedPackageSections(pkg).flatMap(section => {
    if (Array.isArray(section?.inclusions)) return section.inclusions
    if (Array.isArray(section?.inclustions)) return section.inclustions
    return []
  })
}

function getNestedPackageAddons(pkg) {
  return [
    ...getNestedPackageSections(pkg).flatMap(section => {
      if (Array.isArray(section?.addons)) return section.addons
      if (Array.isArray(section?.addons?.data)) return section.addons.data
      return []
    }),
    ...normalizeRelation(pkg?.reusable_addons),
  ]
}

function getPackageDetailInclusions(pkg) {
  return uniqueValues([
    ...getNestedPackageInclusions(pkg).map(item => item?.text),
    ...getNestedPackageElements(pkg).map(item => item?.title),
    ...getNestedPackageElements(pkg).map(item => item?.service?.name),
  ]).slice(0, 12)
}

function getPackageDetailAddons(pkg) {
  const seen = new Set()

  return getNestedPackageAddons(pkg)
    .map(item => ({
      id: item?.id != null ? String(item.id) : '',
      name: String(item?.name ?? item?.title ?? item?.text ?? '').trim(),
      description: String(item?.description ?? '').trim(),
      price: roundCurrency(item?.price),
      unit: String(item?.unit ?? '').trim(),
      max_quantity: Number(item?.max_quantity ?? 1),
      image:
        (typeof item?.image === 'string' && item.image ? toAbsoluteUrl(item.image) : null) ||
        getFirstMediaUrl(item?.image),
    }))
    .filter(item => {
      if (!item.name) return false
      const key = `${item.id}::${item.name.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
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
    detail_inclusions: getPackageDetailInclusions(pkg),
    detail_addons: getPackageDetailAddons(pkg),
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
    serviceCategories: normalizeRelation(vendor.vendor_services)
      .map(item => item?.service ?? item)
      .filter(Boolean)
      .map(service => ({
        id: String(service.id),
        name: service.name ?? '',
        slug: service.slug ?? '',
      })),
  }
}

async function fetchPackagesByIds(ids = []) {
  const uniqueIds = uniqueStrings(ids)
  if (uniqueIds.length === 0) return new Map()

  const cacheKey = `strapi:pkg:${[...uniqueIds].sort().join(',')}`
  const cached = await cacheGet(cacheKey)
  if (cached !== null) return new Map(Object.entries(cached))

  try {
    const query = [
      buildInFilterQuery(uniqueIds),
      'populate[0]=images',
      'populate[1]=service_categories',
      'populate[2]=events',
      'populate[3]=packages.elements.service',
      'populate[4]=packages.inclusions',
      'populate[5]=packages.inclustions',
      'populate[6]=packages.addons',
      'populate[7]=reusable_addons.image',
      `pagination[pageSize]=${Math.max(uniqueIds.length, 1)}`,
      'publicationState=preview',
    ].join('&')

    const result = await strapiGet(`/packages?${query}`)
    const map = new Map((result?.data ?? []).map(pkg => [String(pkg.id), mapPackagePreview(pkg)]))
    await cacheSet(cacheKey, Object.fromEntries(map), TTL.STRAPI)
    return map
  } catch {
    return new Map()
  }
}

async function fetchEventsByIds(ids = []) {
  const uniqueIds = uniqueStrings(ids)
  if (uniqueIds.length === 0) return new Map()

  const cacheKey = `strapi:evt:${[...uniqueIds].sort().join(',')}`
  const cached = await cacheGet(cacheKey)
  if (cached !== null) return new Map(Object.entries(cached))

  try {
    const query = [
      buildInFilterQuery(uniqueIds),
      'populate[0]=icon',
      `pagination[pageSize]=${Math.max(uniqueIds.length, 1)}`,
      'publicationState=preview',
    ].join('&')

    const result = await strapiGet(`/events?${query}`)
    const map = new Map(
      (result?.data ?? []).map(event => [String(event.id), mapEventPreview(event)])
    )
    await cacheSet(cacheKey, Object.fromEntries(map), TTL.STRAPI)
    return map
  } catch {
    return new Map()
  }
}

async function fetchAddressesByIds(ids = []) {
  const uniqueIds = uniqueStrings(ids)
  if (uniqueIds.length === 0) return new Map()

  const cacheKey = `strapi:addr:${[...uniqueIds].sort().join(',')}`
  const cached = await cacheGet(cacheKey)
  if (cached !== null) return new Map(Object.entries(cached))

  try {
    const query = [
      buildInFilterQuery(uniqueIds),
      `pagination[pageSize]=${Math.max(uniqueIds.length, 1)}`,
      'publicationState=preview',
    ].join('&')

    const result = await strapiGet(`/addresses?${query}`)
    const map = new Map(
      (result?.data ?? []).map(address => [String(address.id), mapAddressPreview(address)])
    )
    await cacheSet(cacheKey, Object.fromEntries(map), TTL.STRAPI)
    return map
  } catch {
    return new Map()
  }
}

async function fetchVendorsByIds(ids = []) {
  const uniqueIds = uniqueStrings(ids)
  if (uniqueIds.length === 0) return new Map()

  const cacheKey = `strapi:vnd:${[...uniqueIds].sort().join(',')}`
  const cached = await cacheGet(cacheKey)
  if (cached !== null) return new Map(Object.entries(cached))

  try {
    const query = [
      buildInFilterQuery(uniqueIds),
      `pagination[pageSize]=${Math.max(uniqueIds.length, 1)}`,
      'publicationState=preview',
    ].join('&')

    const result = await strapiGet(`/vendors?${query}`)
    const map = new Map(
      (result?.data ?? []).map(vendor => [String(vendor.id), mapVendorPreview(vendor)])
    )
    await cacheSet(cacheKey, Object.fromEntries(map), TTL.STRAPI)
    return map
  } catch {
    return new Map()
  }
}

function getLatestStatusLog(statusLogs = []) {
  if (!Array.isArray(statusLogs) || statusLogs.length === 0) return null

  return statusLogs.reduce((latest, current) => {
    if (!latest) return current
    return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
  }, null)
}

function getSelectedItemDisplay(title = '') {
  const rawTitle = String(title ?? '')
  const [displayTitle, metaPart] = rawTitle.split(CART_META_SEPARATOR)

  if (!metaPart) return displayTitle || rawTitle

  try {
    const parsed = JSON.parse(metaPart)
    const itemType = parsed?.itemType ?? 'package'
    const addonTitle = String(parsed?.addonTitle ?? '').trim()
    const selectedOptions = parsed?.selectedOptions

    if (itemType === 'addon') {
      const optionValues =
        selectedOptions && typeof selectedOptions === 'object'
          ? Object.values(selectedOptions).filter(Boolean)
          : []

      return optionValues.length
        ? `${addonTitle || displayTitle || rawTitle} (${optionValues.join(', ')})`
        : addonTitle || displayTitle || rawTitle
    }

    if (selectedOptions && typeof selectedOptions === 'object') {
      const values = Object.values(selectedOptions).filter(Boolean)
      if (values.length) return values.join(', ')
    }
  } catch {
    return displayTitle || rawTitle
  }

  return displayTitle || rawTitle
}

function getBookingSelectedItems(booking) {
  return (Array.isArray(booking?.items) ? booking.items : [])
    .map(item => getSelectedItemDisplay(item?.title))
    .map(value => String(value ?? '').trim())
    .filter(Boolean)
}

function buildSelectedItemsSummary(items = []) {
  const uniqueItems = [...new Set(items)]
  if (!uniqueItems.length) return ''
  if (uniqueItems.length <= 2) return uniqueItems.join(' · ')
  return `${uniqueItems.slice(0, 2).join(' · ')} +${uniqueItems.length - 2} more`
}

const INFO_COLLECTION_MARKER = '[INFO_COLLECTION]'

function cleanNoteValue(value = '') {
  const trimmed = String(value ?? '').trim()
  if (!trimmed || /^not provided$/i.test(trimmed)) return ''
  return trimmed
}

function extractNoteField(text, patterns = []) {
  for (const pattern of patterns) {
    const match = String(text ?? '').match(pattern)
    if (match?.[1]) {
      const value = cleanNoteValue(match[1])
      if (value) return value
    }
  }
  return ''
}

function emptyInfoCollectionMeta() {
  return {
    fullName: '',
    email: '',
    phone: '',
    eventDate: '',
    eventTime: '',
    addressLine1: '',
    addressLine2: '',
    addressFloor: '',
    eventAddress: '',
    pinCode: '',
    hasLift: '',
    guestCount: '',
    setupArrivalTime: '',
    eventDayContactName: '',
    eventDayContactPhone: '',
    parkingInstructions: '',
    specialRequest: '',
    selectedItemsText: '',
    checkoutMode: '',
    isInfoCollectionSubmission: false,
  }
}

export function parseInfoCollectionMetaFromText(text = '') {
  const source = String(text ?? '')
  if (!source.trim()) return emptyInfoCollectionMeta()

  const meta = emptyInfoCollectionMeta()
  meta.isInfoCollectionSubmission = source.includes(INFO_COLLECTION_MARKER)
  meta.fullName = extractNoteField(source, [/Contact name:\s*(.+)/i, /Full name:\s*(.+)/i])
  meta.email = extractNoteField(source, [/Email:\s*(.+)/i, /Email address:\s*(.+)/i])
  meta.phone = extractNoteField(source, [/Phone:\s*(.+)/i, /Phone number:\s*(.+)/i])
  meta.eventDate = extractNoteField(source, [/Event date:\s*(.+)/i, /Tasting date:\s*(.+)/i])
  meta.eventTime = extractNoteField(source, [/Event time:\s*(.+)/i, /Tasting time:\s*(.+)/i])
  meta.addressLine1 = extractNoteField(source, [/Event address line 1:\s*(.+)/i])
  meta.addressLine2 = extractNoteField(source, [/Event address line 2:\s*(.+)/i])
  meta.addressFloor = extractNoteField(source, [/Event location floor:\s*(.+)/i])
  meta.eventAddress =
    extractNoteField(source, [/(?:Event|Tasting) address:\s*(.+)/i, /Address:\s*(.+)/i]) ||
    [meta.addressLine1, meta.addressLine2, meta.addressFloor].filter(Boolean).join(', ')
  meta.pinCode = extractNoteField(source, [/PIN code:\s*(.+)/i])
  meta.hasLift = extractNoteField(source, [/Lift in building:\s*(.+)/i])
  meta.guestCount = extractNoteField(source, [/Guest count:\s*(.+)/i])
  meta.setupArrivalTime = extractNoteField(source, [
    /Earliest setup arrival time:\s*(.+)/i,
    /Setup arrival time:\s*(.+)/i,
  ])
  meta.eventDayContactName = extractNoteField(source, [/Event-day contact:\s*(.+)/i])
  meta.eventDayContactPhone = extractNoteField(source, [/Event-day contact mobile:\s*(.+)/i])
  meta.parkingInstructions = extractNoteField(source, [
    /Parking or loading instructions:\s*(.+)/i,
  ])
  meta.specialRequest = extractNoteField(source, [
    /Special instructions:\s*(.+)/i,
    /Special request:\s*(.+)/i,
  ])
  meta.selectedItemsText = extractNoteField(source, [/Selected items:\s*(.+)/i])
  const checkoutModeMatch = source.match(/Checkout mode:\s*(.+)/i)
  const tastingMarkerMatch =
    /(?:^|\n)\s*Tasting (?:date|time|address)\s*:/i.test(source) ||
    /(?:^|\n)\s*Checkout mode:\s*Sample tasting\s*$/im.test(source)
  meta.checkoutMode =
    checkoutModeMatch?.[1]?.trim().toLowerCase().replace(/\s+/g, '-') ??
    (tastingMarkerMatch ? 'sample-tasting' : '')

  return meta
}

export function buildInfoCollectionNote(form = {}) {
  const line = (label, value) => `${label}: ${cleanNoteValue(value) || 'Not provided'}`
  const addressSummary = [form.addressLine1, form.addressLine2, form.addressFloor, form.pinCode]
    .map(cleanNoteValue)
    .filter(Boolean)
    .join(', ')

  return [
    INFO_COLLECTION_MARKER,
    line('Contact name', form.fullName),
    line('Phone', form.phone),
    line('Email', form.email),
    line('Event date', form.eventDate),
    line('Event time', form.eventTime),
    line('Event address line 1', form.addressLine1),
    line('Event address line 2', form.addressLine2),
    line('Event location floor', form.addressFloor),
    line('Event address', addressSummary || form.eventAddress),
    line('PIN code', form.pinCode),
    line('Lift in building', form.hasLift),
    line('Guest count', form.guestCount),
    line('Earliest setup arrival time', form.setupArrivalTime),
    line('Event-day contact', form.eventDayContactName),
    line('Event-day contact mobile', form.eventDayContactPhone),
    line('Parking or loading instructions', form.parkingInstructions),
    line('Special instructions', form.specialRequest),
    line('Special request', form.specialRequest),
  ].join('\n')
}

function mergeInfoCollectionMeta(base = emptyInfoCollectionMeta(), next = {}) {
  const merged = { ...base }
  for (const key of Object.keys(emptyInfoCollectionMeta())) {
    if (key === 'isInfoCollectionSubmission') {
      merged[key] = Boolean(base[key] || next[key])
      continue
    }
    const value = cleanNoteValue(next[key])
    if (value) merged[key] = value
  }
  return merged
}

function getBookingMetaFromNotes(notes = []) {
  const allNotes = (Array.isArray(notes) ? notes : [])
    .filter(note => note && String(note?.note ?? '').trim())
    .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))

  // Prefer customer/checkout notes, but still read internal notes that look like checkout
  // snapshots (in case older writes used the default isInternal=true).
  const looksLikeCheckoutOrInfo = noteText =>
    /Contact name:|Event address line 1:|\[INFO_COLLECTION\]|Checkout mode:/i.test(noteText)

  const visibleNotes = allNotes.filter(note => {
    if (note.isInternal !== true) return true
    return looksLikeCheckoutOrInfo(String(note?.note ?? ''))
  })

  let meta = emptyInfoCollectionMeta()

  // Apply checkout / older notes first, then info-collection submissions last so they win.
  for (const note of visibleNotes) {
    if (String(note?.note ?? '').includes(INFO_COLLECTION_MARKER)) continue
    meta = mergeInfoCollectionMeta(meta, parseInfoCollectionMetaFromText(note?.note))
  }

  for (const note of visibleNotes) {
    if (!String(note?.note ?? '').includes(INFO_COLLECTION_MARKER)) continue
    meta = mergeInfoCollectionMeta(meta, parseInfoCollectionMetaFromText(note?.note))
  }

  return meta
}

export function isCateringPackage(packagePreview = null) {
  const categories = Array.isArray(packagePreview?.serviceCategories)
    ? packagePreview.serviceCategories
    : []
  return categories.some(category =>
    /catering/i.test(String(category?.name ?? category?.slug ?? ''))
  )
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
  const payments = Array.isArray(booking?.payments) ? booking.payments : []
  const successfulPayments = payments.filter(payment => payment.status === 'success')
  const hasCodPayment = payments.some(isCodPayment)

  const amountPaid = roundCurrency(
    successfulPayments.reduce((sum, payment) => sum + toNumber(payment.amount), 0)
  )
  const totalPrice = roundCurrency(booking?.totalPrice)
  // Hookah COD: no advance — remaining is full unpaid balance until collected.
  const advanceAmount = hasCodPayment ? 0 : roundCurrency(booking?.advanceAmount)
  const amountDue = roundCurrency(Math.max(totalPrice - amountPaid, 0))
  // Actual advance collected (capped at required advance). Fully paid bookings still show the advance portion.
  const advancePaidAmount = hasCodPayment
    ? 0
    : roundCurrency(Math.min(amountPaid, advanceAmount > 0 ? advanceAmount : 0))
  // Remaining always reflects money still owed after successful payments (₹0 when fully paid).
  const scheduledRemainingAmount = amountDue

  return {
    totalPrice,
    advanceAmount,
    advancePaidAmount,
    scheduledRemainingAmount,
    amountPaid,
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
    isCodBooking: hasCodPayment,
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

  const [packageMap, eventMap, addressMap, vendorMap, cancellationPolicy] = await Promise.all([
    fetchPackagesByIds(packageIds),
    fetchEventsByIds(eventIds),
    fetchAddressesByIds(addressIds),
    fetchVendorsByIds(vendorIds),
    getCancellationPolicyData(),
  ])

  return bookings.map(booking => {
    const packagePreview = packageMap.get(String(booking.packageId)) ?? null
    const fallbackEvent = packagePreview?.events?.[0] ?? null
    const eventPreview = eventMap.get(String(booking.eventId)) ?? fallbackEvent
    const addressPreview = addressMap.get(String(booking.eventAddressId)) ?? null
    const paymentSummary = getPaymentSummary(booking)
    const latestStatusLog = getLatestStatusLog(booking.statusLogs)
    const noteMeta = getBookingMetaFromNotes(booking.notes)
    const selectedItems = getBookingSelectedItems(booking)
    const selectedItemsSummary =
      buildSelectedItemsSummary(selectedItems) || noteMeta.selectedItemsText || ''
    const fallbackSubtitle = [eventPreview?.name, packagePreview?.serviceCategories?.[0]?.name]
      .filter(Boolean)
      .join(' · ')
    const detailSubtitle = fallbackSubtitle || selectedItemsSummary
    const checkoutMode = noteMeta.checkoutMode || ''
    const isSampleTastingBooking = checkoutMode === 'sample-tasting'
    const refundPreview = calculateBookingRefundPreview(booking, cancellationPolicy)

    return {
      ...booking,
      // Surface live payment-aware amounts so admin/customer UIs stay consistent.
      // advanceAmount = required advance; remainingAmount = actual amount still due.
      advanceAmount: paymentSummary.advanceAmount,
      remainingAmount: paymentSummary.amountDue,
      amountPaid: paymentSummary.amountPaid,
      advancePaidAmount: paymentSummary.advancePaidAmount,
      bookingCategory: getBookingCategory(booking),
      statusLabel: BOOKING_STATUS_LABELS[booking.status] ?? booking.status ?? 'Unknown',
      latestStatusLog,
      selectedItems,
      selectedItemsSummary,
      displaySubtitle: selectedItemsSummary || fallbackSubtitle,
      detailSubtitle,
      locationSummary: addressPreview?.summary ?? noteMeta.eventAddress ?? '',
      package: packagePreview,
      event: eventPreview,
      address: addressPreview,
      eventTime: booking?.eventTime || noteMeta.eventTime,
      bookedAt: booking?.createdAt ?? null,
      pinCode: noteMeta.pinCode || addressPreview?.pincode || '',
      specialRequest: noteMeta.specialRequest,
      checkoutMode,
      isSampleTastingBooking,
      isCateringBooking: isCateringPackage(packagePreview),
      infoCollection: {
        fullName: noteMeta.fullName,
        email: noteMeta.email,
        phone: noteMeta.phone,
        eventDate: noteMeta.eventDate,
        eventTime: booking?.eventTime || noteMeta.eventTime,
        addressLine1: noteMeta.addressLine1 || addressPreview?.line1 || '',
        addressLine2: noteMeta.addressLine2 || addressPreview?.line2 || '',
        addressFloor: noteMeta.addressFloor,
        eventAddress: addressPreview?.summary || noteMeta.eventAddress || '',
        pinCode: noteMeta.pinCode || addressPreview?.pincode || '',
        hasLift: noteMeta.hasLift,
        guestCount: noteMeta.guestCount || (booking?.guestCount ? String(booking.guestCount) : ''),
        setupArrivalTime: noteMeta.setupArrivalTime,
        eventDayContactName: noteMeta.eventDayContactName,
        eventDayContactPhone: noteMeta.eventDayContactPhone,
        parkingInstructions: noteMeta.parkingInstructions,
        specialRequest: noteMeta.specialRequest,
        submitted: noteMeta.isInfoCollectionSubmission || booking?.infoStatus === 'submitted' || booking?.infoStatus === 'verified',
      },
      refundPreview,
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
  return {
    primaryPhone: '9810937700',
    supportEmail: 'info@elewen.co.in',
    whatsappNumber: '9810937700',
    responseExpectationText: '',
  }
}
