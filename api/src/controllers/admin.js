import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import prisma from '../lib/prisma.js'
import { notify } from '../lib/notify.js'
import { sendEmail, templates } from '../lib/email.js'
import {
  enrichBookings,
  enrichSampleTastes,
  getBookingCategory,
  mapVendorPreview,
  toNumber,
} from '../lib/dashboardData.js'
import {
  strapiGet,
  strapiServerDelete,
  strapiServerGet,
  strapiServerPost,
  strapiServerPut,
} from '../lib/strapi.js'
import { cacheDelPattern } from '../lib/cache.js'
import { isCodPendingPayment } from '../lib/sheeshaCheckout.js'
import { buildUniqueGrantCode, mapGrantForCustomer } from '../lib/coupons.js'
import { findCustomerByEmail } from '../lib/userLookup.js'

const BOOKING_STATUSES = [
  'new',
  'confirmed',
  'info_collection',
  'planning',
  'pre_event',
  'execution',
  'post_event',
  'completed',
  'cancelled',
]

// Stage progression order - must follow this sequence
const STAGE_PROGRESSION = [
  'new',
  'confirmed',
  'info_collection',
  'planning',
  'pre_event',
  'execution',
  'post_event',
  'completed',
]

// Validate stage progression
function validateStageProgression(currentStatus, newStatus, remainingAmount = 0) {
  // Special case: can always go to cancelled
  if (newStatus === 'cancelled') return { valid: true }

  // Can't change to same status
  if (currentStatus === newStatus) {
    return { valid: false, message: 'Already in this stage.' }
  }

  const currentIndex = STAGE_PROGRESSION.indexOf(currentStatus?.toLowerCase())
  const newIndex = STAGE_PROGRESSION.indexOf(newStatus?.toLowerCase())

  // If either status is not in progression order
  if (currentIndex === -1 || newIndex === -1) {
    return { valid: false, message: 'Invalid stage transition.' }
  }

  // Can't go backward
  if (newIndex < currentIndex) {
    return {
      valid: false,
      message: `Cannot move back to "${newStatus.replaceAll('_', ' ')}". Stages must progress forward.`,
    }
  }

  // Execution stage requires full payment
  if (newStatus === 'execution' && remainingAmount > 0) {
    return {
      valid: false,
      message: `Cannot move to "Execution" stage. Remaining payment: ₹${remainingAmount.toLocaleString()}. Clear full payment first.`,
    }
  }

  return { valid: true }
}

const SAMPLE_STATUSES = ['new', 'assigned', 'delivered', 'completed']
const ALERT_STATUSES = ['new', 'acknowledged', 'resolved', 'snoozed']
const ALERT_SEVERITIES = ['low', 'medium', 'high', 'critical']
const SUPPORT_STATUSES = ['open', 'in_progress', 'resolved', 'closed']
const SUPPORT_PRIORITIES = ['low', 'medium', 'high']
const COUPON_DISCOUNT_TYPES = ['percentage', 'flat']
const STRAPI_BASE = process.env.STRAPI_URL || 'http://localhost:1337'

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeText(value) {
  return String(value ?? '').trim()
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value)
  return normalized || null
}

function normalizeNullableNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value ?? '').trim()
  )
}

function buildEntitySearchOr(search, extraFilters = []) {
  if (!search) return []

  return [...(isUuid(search) ? [{ id: { equals: search } }] : []), ...extraFilters]
}

function normalizeSearchValue(value) {
  return normalizeText(value).toLowerCase()
}

function textMatchesSearch(value, searchValue) {
  return normalizeSearchValue(value).includes(searchValue)
}

function bookingMatchesSearch(booking, search) {
  const searchValue = normalizeSearchValue(search)
  if (!searchValue) return true

  return textMatchesSearch(booking?.package?.title, searchValue)
}

function sampleMatchesSearch(sample, search) {
  const searchValue = normalizeSearchValue(search)
  if (!searchValue) return true

  return textMatchesSearch(sample?.customer?.name, searchValue)
}

function uniqueStrings(values = []) {
  return [...new Set(values.map(value => String(value ?? '').trim()).filter(Boolean))]
}

function isStrapiCredentialError(err) {
  if (err?.status !== 401 && err?.status !== 403) return false

  const message = String(err?.message ?? '').toLowerCase()
  return (
    !message ||
    message.includes('forbidden') ||
    message.includes('missing or invalid credentials') ||
    message.includes('unauthorized')
  )
}

function roundCurrency(value) {
  return Number(toNumber(value).toFixed(2))
}

function toAbsoluteAssetUrl(value) {
  if (!value) return null
  if (/^https?:\/\//i.test(String(value))) return String(value)
  return `${STRAPI_BASE}${value}`
}

function getFirstMediaEntry(value) {
  if (!value) return null
  if (Array.isArray(value)) return value[0] ?? null
  if (Array.isArray(value?.data)) return value.data[0] ?? null
  if (value?.data) return value.data
  return value
}

function getMediaUrl(value) {
  const media = getFirstMediaEntry(value)
  return toAbsoluteAssetUrl(
    media?.formats?.large?.url ??
      media?.formats?.medium?.url ??
      media?.formats?.small?.url ??
      media?.formats?.thumbnail?.url ??
      media?.url ??
      null
  )
}

function getMediaName(value) {
  const media = getFirstMediaEntry(value)
  return media?.name ?? null
}

function mapVendorDocumentPreview(document) {
  if (!document) return null

  return {
    id: String(document.id),
    documentType: document.document_type ?? 'document',
    verified: Boolean(document.verified),
    fileName: getMediaName(document.file),
    fileUrl: getMediaUrl(document.file),
  }
}

function mapVendorPortfolioPreview(portfolio) {
  if (!portfolio) return null

  return {
    id: String(portfolio.id),
    title: portfolio.title ?? '',
    description: portfolio.description ?? '',
    imageName: getMediaName(portfolio.image),
    imageUrl: getMediaUrl(portfolio.image),
  }
}

function buildInFilterQuery(ids = []) {
  return uniqueStrings(ids)
    .map((id, index) => `filters[id][$in][${index}]=${encodeURIComponent(id)}`)
    .join('&')
}

function getDateRange(bucket = 'all') {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const startOfTomorrow = new Date(startOfToday)
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)

  if (bucket === 'today') {
    return {
      gte: startOfToday,
      lt: startOfTomorrow,
    }
  }

  if (bucket === 'upcoming') {
    return {
      gte: startOfTomorrow,
    }
  }

  return null
}

async function fetchUsersByIds(ids = []) {
  const parsedIds = uniqueStrings(ids)
    .map(value => Number.parseInt(value, 10))
    .filter(Number.isFinite)

  if (!parsedIds.length) {
    return new Map()
  }

  const rows = await prisma.$queryRaw`
    SELECT
      u.id::text AS id,
      u.email,
      u.first_name,
      u.last_name,
      u.phone
    FROM public.up_users u
    WHERE u.id IN (${Prisma.join(parsedIds)})
  `

  return new Map(
    rows.map(row => {
      const firstName = normalizeText(row.first_name)
      const lastName = normalizeText(row.last_name)
      const fullName = [firstName, lastName].filter(Boolean).join(' ')

      return [
        String(row.id),
        {
          id: String(row.id),
          email: row.email ?? '',
          first_name: firstName || null,
          last_name: lastName || null,
          phone: row.phone ?? null,
          name: fullName || row.email || `User ${row.id}`,
        },
      ]
    })
  )
}

async function searchUserIds(searchTerm) {
  const term = normalizeText(searchTerm)
  if (!term) return []

  const pattern = `%${term}%`
  const rows = await prisma.$queryRaw`
    SELECT u.id::text AS id
    FROM public.up_users u
    WHERE
      u.email ILIKE ${pattern}
      OR COALESCE(u.first_name, '') ILIKE ${pattern}
      OR COALESCE(u.last_name, '') ILIKE ${pattern}
      OR CONCAT_WS(' ', COALESCE(u.first_name, ''), COALESCE(u.last_name, '')) ILIKE ${pattern}
      OR COALESCE(u.phone, '') ILIKE ${pattern}
    LIMIT 50
  `

  return rows.map(row => String(row.id))
}

async function searchPackageIds(searchTerm) {
  const term = normalizeText(searchTerm)
  if (!term) return []

  const query = [
    `filters[$or][0][title][$containsi]=${encodeURIComponent(term)}`,
    `filters[$or][1][slug][$containsi]=${encodeURIComponent(term)}`,
    'publicationState=preview',
    'pagination[page]=1',
    'pagination[pageSize]=100',
  ].join('&')

  try {
    const response = await strapiGet(`/packages?${query}`)
    return (response?.data ?? []).map(pkg => String(pkg.id))
  } catch {
    try {
      const response = await strapiServerGet(`/api/packages?${query}`)
      return (response?.data ?? []).map(pkg => String(pkg.id))
    } catch {
      return []
    }
  }
}

async function fetchVendorsByIds(ids = []) {
  const uniqueIds = uniqueStrings(ids)
  if (!uniqueIds.length) return new Map()

  const query = [
    buildInFilterQuery(uniqueIds),
    'publicationState=preview',
    `pagination[pageSize]=${Math.max(uniqueIds.length, 1)}`,
  ].join('&')

  try {
    const response = await strapiServerGet(`/api/vendors?${query}`)
    return new Map(
      (response?.data ?? []).map(vendor => [String(vendor.id), mapVendorPreview(vendor)])
    )
  } catch {
    const parsedIds = uniqueIds.map(value => Number.parseInt(value, 10)).filter(Number.isFinite)
    if (!parsedIds.length) return new Map()

    const rows = await prisma.$queryRaw`
      SELECT
        v.id,
        v.document_id,
        v.company_name,
        v.contact_person,
        v.email,
        v.phone,
        v.location_city,
        v.service_area,
        v.experience_years,
        v.minimum_price,
        v.registration_data
      FROM public.vendors v
      WHERE v.id IN (${Prisma.join(parsedIds)})
    `

    return new Map(
      rows.map(vendor => [
        String(vendor.id),
        {
          id: String(vendor.id),
          documentId: vendor.document_id ?? '',
          companyName: vendor.company_name ?? '',
          contactPerson: vendor.contact_person ?? '',
          email: vendor.email ?? '',
          phone: vendor.phone ?? '',
          locationCity: vendor.location_city ?? '',
          serviceArea: vendor.service_area ?? '',
          experienceYears: vendor.experience_years ?? null,
          minimumPrice: roundCurrency(vendor.minimum_price),
          serviceCategories: Array.isArray(vendor.registration_data?.service_category)
            ? vendor.registration_data.service_category.map(name => ({
                id: String(name),
                name: String(name ?? ''),
                slug: '',
              }))
            : [],
        },
      ])
    )
  }
}

async function fetchCouponsFromDatabase({ search = '', page = 1, limit = 12 } = {}) {
  const trimmedSearch = normalizeText(search)
  const offset = Math.max(page - 1, 0) * limit
  const searchPattern = `%${trimmedSearch}%`

  const coupons = await prisma.$queryRaw`
    SELECT
      c.id,
      c.document_id,
      c.code,
      c.discount_type,
      c.discount_value,
      c.max_uses,
      c.used_count,
      c.valid_from,
      c.valid_to,
      c.is_active,
      c.created_at
    FROM public.coupons c
    WHERE (
      ${trimmedSearch} = ''
      OR COALESCE(c.code, '') ILIKE ${searchPattern}
    )
    ORDER BY c.created_at DESC, c.id DESC
    OFFSET ${offset}
    LIMIT ${limit}
  `

  const [countRow] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS total
    FROM public.coupons c
    WHERE (
      ${trimmedSearch} = ''
      OR COALESCE(c.code, '') ILIKE ${searchPattern}
    )
  `

  return {
    coupons: coupons.map(mapCouponRecord),
    total: Number(countRow?.total ?? 0),
    page,
    pages: Math.max(1, Math.ceil(Number(countRow?.total ?? 0) / limit)),
  }
}

function mapCouponRecord(coupon) {
  return {
    id: String(coupon.id),
    documentId: coupon.document_id ?? coupon.documentId ?? null,
    code: coupon.code ?? '',
    title: coupon.title ?? '',
    coupon_kind: coupon.coupon_kind ?? 'public',
    discount_type: coupon.discount_type ?? 'percentage',
    discount_value: Number(coupon.discount_value ?? 0),
    min_order_value: Number(coupon.min_order_value ?? 0),
    max_order_value: coupon.max_order_value != null ? Number(coupon.max_order_value) : null,
    max_discount_amount:
      coupon.max_discount_amount != null ? Number(coupon.max_discount_amount) : null,
    first_order_only: Boolean(coupon.first_order_only),
    service_filter: coupon.service_filter ?? 'all',
    terms_customer: coupon.terms_customer ?? '',
    admin_notes: coupon.admin_notes ?? '',
    is_user_specific: Boolean(coupon.is_user_specific),
    is_shareable: coupon.is_shareable !== false,
    max_uses: coupon.max_uses ?? null,
    used_count: coupon.used_count ?? 0,
    valid_from: coupon.valid_from ?? null,
    valid_to: coupon.valid_to ?? null,
    is_active: Boolean(coupon.is_active),
  }
}

async function fetchAdminSettingsFromDatabase() {
  const [settings] = await prisma.$queryRaw`
    SELECT
      gs.id,
      gs.document_id,
      gs.primary_phone,
      gs.support_email,
      gs.support_availability_text,
      gs.advance_payment_percentage,
      gs.whatsapp_number,
      gs.response_expectation_text,
      gs.created_at,
      gs.updated_at,
      gs.published_at
    FROM public.global_settings gs
    ORDER BY gs.updated_at DESC NULLS LAST, gs.id DESC
    LIMIT 1
  `

  if (!settings) return null

  return mapSettingsRecord(settings)
}

function mapSettingsRecord(settings) {
  return {
    id: String(settings.id),
    documentId: settings.document_id ?? settings.documentId ?? null,
    primary_phone: settings.primary_phone ?? '',
    support_email: settings.support_email ?? '',
    support_availability_text: settings.support_availability_text ?? '',
    advance_payment_percentage: settings.advance_payment_percentage ?? null,
    whatsapp_number: settings.whatsapp_number ?? '',
    response_expectation_text: settings.response_expectation_text ?? '',
    createdAt: settings.created_at ?? null,
    updatedAt: settings.updated_at ?? null,
    publishedAt: settings.published_at ?? null,
  }
}

async function fetchCouponByIdFromDatabase(id) {
  const numericId = Number.parseInt(String(id ?? ''), 10)
  if (!Number.isFinite(numericId)) return null

  const [coupon] = await prisma.$queryRaw`
    SELECT
      c.id,
      c.document_id,
      c.code,
      c.discount_type,
      c.discount_value,
      c.max_uses,
      c.used_count,
      c.valid_from,
      c.valid_to,
      c.is_active,
      c.created_at
    FROM public.coupons c
    WHERE c.id = ${numericId}
    LIMIT 1
  `

  return coupon ? mapCouponRecord(coupon) : null
}

async function createCouponInDatabase(data) {
  const documentId = randomUUID()
  const [created] = await prisma.$queryRaw`
    INSERT INTO public.coupons (
      document_id,
      code,
      discount_type,
      discount_value,
      max_uses,
      used_count,
      valid_from,
      valid_to,
      is_active,
      created_at,
      updated_at,
      published_at
    )
    VALUES (
      ${documentId},
      ${data.code},
      ${data.discount_type},
      ${data.discount_value},
      ${data.max_uses},
      ${data.used_count ?? 0},
      ${data.valid_from}::date,
      ${data.valid_to}::date,
      ${data.is_active},
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING
      id,
      document_id,
      code,
      discount_type,
      discount_value,
      max_uses,
      used_count,
      valid_from,
      valid_to,
      is_active,
      created_at
  `

  return mapCouponRecord(created)
}

async function updateCouponInDatabase(id, payload) {
  const current = await fetchCouponByIdFromDatabase(id)
  if (!current) return null
  const documentId = current.documentId ?? randomUUID()

  const [updated] = await prisma.$queryRaw`
    UPDATE public.coupons
    SET
      document_id = COALESCE(document_id, ${documentId}),
      code = ${payload.code ?? current.code},
      discount_type = ${payload.discount_type ?? current.discount_type},
      discount_value = ${payload.discount_value ?? current.discount_value},
      max_uses = ${payload.max_uses ?? current.max_uses},
      used_count = ${payload.used_count ?? current.used_count},
      valid_from = ${payload.valid_from ?? current.valid_from}::date,
      valid_to = ${payload.valid_to ?? current.valid_to}::date,
      is_active = ${payload.is_active ?? current.is_active},
      updated_at = NOW(),
      published_at = COALESCE(published_at, NOW())
    WHERE id = ${Number.parseInt(String(id), 10)}
    RETURNING
      id,
      document_id,
      code,
      discount_type,
      discount_value,
      max_uses,
      used_count,
      valid_from,
      valid_to,
      is_active,
      created_at
  `

  return updated ? mapCouponRecord(updated) : null
}

async function upsertAdminSettingsInDatabase(payload) {
  const current = await fetchAdminSettingsFromDatabase()

  if (!current) {
    const documentId = randomUUID()
    const [created] = await prisma.$queryRaw`
      INSERT INTO public.global_settings (
        document_id,
        primary_phone,
        support_email,
        support_availability_text,
        advance_payment_percentage,
        whatsapp_number,
        response_expectation_text,
        created_at,
        updated_at,
        published_at
      )
      VALUES (
        ${documentId},
        ${payload.primary_phone ?? ''},
        ${payload.support_email ?? ''},
        ${payload.support_availability_text ?? ''},
        ${payload.advance_payment_percentage},
        ${payload.whatsapp_number ?? ''},
        ${payload.response_expectation_text ?? ''},
        NOW(),
        NOW(),
        NOW()
      )
      RETURNING
        id,
        document_id,
        primary_phone,
        support_email,
        support_availability_text,
        advance_payment_percentage,
        whatsapp_number,
        response_expectation_text,
        created_at,
        updated_at,
        published_at
    `

    return mapSettingsRecord(created)
  }

  const documentId = current.documentId ?? randomUUID()
  await prisma.$queryRaw`
    UPDATE public.global_settings
    SET
      document_id = COALESCE(document_id, ${documentId}),
      primary_phone = ${payload.primary_phone ?? current.primary_phone},
      support_email = ${payload.support_email ?? current.support_email},
      support_availability_text = ${payload.support_availability_text ?? current.support_availability_text},
      advance_payment_percentage = ${payload.advance_payment_percentage ?? current.advance_payment_percentage},
      whatsapp_number = ${payload.whatsapp_number ?? current.whatsapp_number},
      response_expectation_text = ${payload.response_expectation_text ?? current.response_expectation_text},
      updated_at = NOW(),
      published_at = COALESCE(published_at, NOW())
    WHERE TRUE
  `

  return fetchAdminSettingsFromDatabase()
}

function mapVendorDirectoryRow(vendor) {
  const registrationServices = Array.isArray(vendor.registration_data?.service_category)
    ? vendor.registration_data.service_category
    : []

  return {
    id: String(vendor.id),
    documentId: vendor.document_id ?? null,
    companyName: vendor.company_name ?? '',
    contactPerson: vendor.contact_person ?? '',
    email: vendor.email ?? '',
    phone: vendor.phone ?? '',
    locationCity: vendor.location_city ?? '',
    serviceArea: vendor.service_area ?? '',
    experienceYears: vendor.experience_years ?? null,
    minimumPrice: roundCurrency(vendor.minimum_price),
    serviceCategories: registrationServices.map(name => ({
      id: String(name),
      name: String(name ?? ''),
      slug: '',
    })),
    vendorStatus: vendor.vendor_status ?? 'pending',
    isAvailable: Boolean(vendor.is_available),
    teamSize: vendor.team_size ?? null,
    leadTimeDays: vendor.lead_time_days ?? null,
    createdAt: vendor.created_at ?? null,
    updatedAt: vendor.updated_at ?? null,
    registrationData: vendor.registration_data ?? null,
    documentsCount: 0,
    portfolioCount: 0,
    vendorDocuments: [],
    vendorPortfolios: [],
  }
}

async function fetchVendorDirectoryFromDatabase({
  search = '',
  status = '',
  availability = '',
  page = 1,
  limit = 12,
} = {}) {
  const trimmedSearch = normalizeText(search)
  const offset = Math.max(page - 1, 0) * limit
  const searchPattern = `%${trimmedSearch}%`

  const rows = await prisma.$queryRaw`
    SELECT
      v.id,
      v.document_id,
      v.company_name,
      v.contact_person,
      v.email,
      v.phone,
      v.location_city,
      v.service_area,
      v.experience_years,
      v.team_size,
      v.minimum_price,
      v.lead_time_days,
      v.vendor_status,
      v.is_available,
      v.registration_data,
      v.created_at,
      v.updated_at
    FROM public.vendors v
    WHERE
      (${status} = '' OR lower(COALESCE(v.vendor_status, '')) = ${status})
      AND (
        ${availability} = ''
        OR (${availability} = 'available' AND COALESCE(v.is_available, false) = true)
        OR (${availability} = 'unavailable' AND COALESCE(v.is_available, false) = false)
      )
      AND (
        ${trimmedSearch} = ''
        OR COALESCE(v.company_name, '') ILIKE ${searchPattern}
        OR COALESCE(v.contact_person, '') ILIKE ${searchPattern}
        OR COALESCE(v.email, '') ILIKE ${searchPattern}
        OR COALESCE(v.phone, '') ILIKE ${searchPattern}
        OR COALESCE(v.location_city, '') ILIKE ${searchPattern}
      )
    ORDER BY v.created_at DESC, v.id DESC
    OFFSET ${offset}
    LIMIT ${limit}
  `

  const [countRow] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS total
    FROM public.vendors v
    WHERE
      (${status} = '' OR lower(COALESCE(v.vendor_status, '')) = ${status})
      AND (
        ${availability} = ''
        OR (${availability} = 'available' AND COALESCE(v.is_available, false) = true)
        OR (${availability} = 'unavailable' AND COALESCE(v.is_available, false) = false)
      )
      AND (
        ${trimmedSearch} = ''
        OR COALESCE(v.company_name, '') ILIKE ${searchPattern}
        OR COALESCE(v.contact_person, '') ILIKE ${searchPattern}
        OR COALESCE(v.email, '') ILIKE ${searchPattern}
        OR COALESCE(v.phone, '') ILIKE ${searchPattern}
        OR COALESCE(v.location_city, '') ILIKE ${searchPattern}
      )
  `

  const vendorIds = rows.map(vendor => String(vendor.id))
  const [assignments, payouts, bankInfo] = await Promise.all([
    vendorIds.length
      ? prisma.vendorAssignment.findMany({
          where: { vendorId: { in: vendorIds } },
        })
      : [],
    vendorIds.length
      ? prisma.vendorPayout.findMany({
          where: { vendorId: { in: vendorIds } },
        })
      : [],
    vendorIds.length
      ? prisma.vendorBankInfo.findMany({
          where: { vendorId: { in: vendorIds } },
        })
      : [],
  ])

  const bankInfoMap = new Map(bankInfo.map(item => [String(item.vendorId), item]))
  const assignmentsByVendor = assignments.reduce((map, assignment) => {
    const key = String(assignment.vendorId)
    const next = map.get(key) ?? []
    next.push(assignment)
    map.set(key, next)
    return map
  }, new Map())
  const payoutsByVendor = payouts.reduce((map, payout) => {
    const key = String(payout.vendorId)
    const next = map.get(key) ?? []
    next.push(payout)
    map.set(key, next)
    return map
  }, new Map())

  const vendors = rows.map(vendor => {
    const vendorId = String(vendor.id)
    const vendorAssignments = assignmentsByVendor.get(vendorId) ?? []
    const vendorPayouts = payoutsByVendor.get(vendorId) ?? []

    return {
      ...mapVendorDirectoryRow(vendor),
      activeAssignmentsCount: vendorAssignments.filter(assignment =>
        ['assigned', 'confirmed'].includes(assignment.status)
      ).length,
      completedAssignmentsCount: vendorAssignments.filter(
        assignment => assignment.status === 'completed'
      ).length,
      pendingPayoutAmount: Number(
        vendorPayouts
          .filter(payout => payout.status === 'pending')
          .reduce((sum, payout) => sum + toNumber(payout.amount), 0)
          .toFixed(2)
      ),
      bankInfo: bankInfoMap.get(vendorId) ?? null,
    }
  })

  return {
    vendors,
    pagination: {
      total: Number(countRow?.total ?? vendors.length),
      page,
      pageCount: Math.max(1, Math.ceil(Number(countRow?.total ?? vendors.length) / limit)),
    },
  }
}

async function enrichBookingsWithCustomer(bookings = []) {
  const [enrichedBookings, userMap] = await Promise.all([
    enrichBookings(bookings),
    fetchUsersByIds(bookings.map(booking => booking.userId)),
  ])

  return enrichedBookings.map(booking => ({
    ...booking,
    customer: userMap.get(String(booking.userId)) ?? null,
  }))
}

async function enrichSamplesWithCustomer(samples = []) {
  const [enrichedSamples, userMap] = await Promise.all([
    enrichSampleTastes(samples),
    fetchUsersByIds(samples.map(sample => sample.userId)),
  ])

  return enrichedSamples.map(sample => ({
    ...sample,
    customer: userMap.get(String(sample.userId)) ?? null,
  }))
}

function buildBookingBucketFilter(bucket = 'all') {
  if (bucket === 'active') {
    return {
      status: {
        notIn: ['completed', 'cancelled'],
      },
    }
  }

  if (bucket === 'completed') {
    return {
      status: {
        in: ['completed', 'cancelled'],
      },
    }
  }

  if (bucket === 'new') {
    return {
      status: 'new',
    }
  }

  const dateRange = getDateRange(bucket)
  if (dateRange) {
    return {
      eventDate: dateRange,
    }
  }

  return {}
}

function buildPaymentSummaryFromPayments(payments = []) {
  const summary = payments.reduce(
    (acc, payment) => {
      const amount = toNumber(payment.amount)

      if (payment.status === 'success') acc.collectedAmount += amount
      if (payment.status === 'pending') acc.pendingAmount += amount
      if (payment.status === 'failed') acc.failedCount += 1
      if (payment.status === 'refunded') acc.refundedAmount += amount

      return acc
    },
    {
      collectedAmount: 0,
      pendingAmount: 0,
      refundedAmount: 0,
      failedCount: 0,
    }
  )

  return {
    collectedAmount: Number(summary.collectedAmount.toFixed(2)),
    pendingAmount: Number(summary.pendingAmount.toFixed(2)),
    refundedAmount: Number(summary.refundedAmount.toFixed(2)),
    failedCount: summary.failedCount,
  }
}

async function safeStrapiServerGet(path, fallback = null) {
  try {
    return await strapiServerGet(path)
  } catch {
    return fallback
  }
}

function getDaysSince(dateValue) {
  if (!dateValue) return 0

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 0

  const diffMs = Date.now() - date.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function isActiveBookingStatus(status) {
  return !['completed', 'cancelled'].includes(String(status ?? '').toLowerCase())
}

function buildBookingPaymentSnapshot(booking) {
  const bookingPayments = Array.isArray(booking?.payments) ? booking.payments : []
  const successfulAmount = bookingPayments
    .filter(payment => payment.status === 'success')
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0)
  const failedPaymentsCount = bookingPayments.filter(payment => payment.status === 'failed').length
  const pendingPaymentsCount = bookingPayments.filter(
    payment => payment.status === 'pending'
  ).length
  const latestPayment = bookingPayments[0] ?? null
  const totalPrice = toNumber(booking?.totalPrice)
  const scheduledRemainingAmount = toNumber(booking?.remainingAmount)
  const outstandingAmount = Number(
    Math.max(totalPrice - successfulAmount, scheduledRemainingAmount, 0).toFixed(2)
  )

  return {
    ...booking,
    paidAmount: Number(successfulAmount.toFixed(2)),
    outstandingAmount,
    failedPaymentsCount,
    pendingPaymentsCount,
    latestPayment,
  }
}

function buildCancelledBookingRefundSnapshot(booking) {
  const bookingPayments = Array.isArray(booking?.payments) ? booking.payments : []
  const successfulAmount = bookingPayments
    .filter(payment => payment.status === 'success')
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0)
  const refunds = bookingPayments
    .flatMap(payment => (Array.isArray(payment?.refunds) ? payment.refunds : []))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
  const latestRefund = refunds[0] ?? null
  const requestedRefundAmount = refunds.reduce((sum, refund) => sum + toNumber(refund.amount), 0)

  return {
    ...booking,
    paidAmount: Number(successfulAmount.toFixed(2)),
    outstandingAmount: 0,
    latestRefund,
    refunds,
    requestedRefundAmount: Number(requestedRefundAmount.toFixed(2)),
    refundDueAmount: Number(
      toNumber(latestRefund?.amount ?? booking?.refundPreview?.refundableAmount ?? 0).toFixed(2)
    ),
  }
}

async function fetchCouponById(id) {
  try {
    const response = await strapiServerGet(
      `/api/coupons?filters[id][$eq]=${encodeURIComponent(String(id))}&publicationState=preview&pagination[pageSize]=1`
    )
    return response?.data?.[0] ?? null
  } catch {
    return fetchCouponByIdFromDatabase(id)
  }
}

async function fetchVendorDirectory({
  search = '',
  status = '',
  availability = '',
  page = 1,
  limit = 12,
} = {}) {
  const query = [
    'publicationState=preview',
    `pagination[page]=${page}`,
    `pagination[pageSize]=${limit}`,
    'populate[0]=vendor_documents',
    'populate[1]=vendor_portfolios',
    'populate[2]=vendor_services.service',
  ]

  const trimmedSearch = normalizeText(search)
  if (trimmedSearch) {
    query.push(`filters[$or][0][company_name][$containsi]=${encodeURIComponent(trimmedSearch)}`)
    query.push(`filters[$or][1][contact_person][$containsi]=${encodeURIComponent(trimmedSearch)}`)
    query.push(`filters[$or][2][email][$containsi]=${encodeURIComponent(trimmedSearch)}`)
    query.push(`filters[$or][3][phone][$containsi]=${encodeURIComponent(trimmedSearch)}`)
    query.push(`filters[$or][4][location_city][$containsi]=${encodeURIComponent(trimmedSearch)}`)
  }

  if (status) {
    query.push(`filters[vendor_status][$eq]=${encodeURIComponent(status)}`)
  }

  if (availability === 'available') {
    query.push('filters[is_available][$eq]=true')
  }

  if (availability === 'unavailable') {
    query.push('filters[is_available][$eq]=false')
  }

  let response
  let vendors

  try {
    response = await strapiServerGet(`/api/vendors?${query.join('&')}`)
    vendors = response?.data ?? []
  } catch {
    return fetchVendorDirectoryFromDatabase({
      search,
      status,
      availability,
      page,
      limit,
    })
  }

  const vendorIds = vendors.map(vendor => String(vendor.id))

  const [assignments, payouts, bankInfo] = await Promise.all([
    vendorIds.length
      ? prisma.vendorAssignment.findMany({
          where: { vendorId: { in: vendorIds } },
        })
      : [],
    vendorIds.length
      ? prisma.vendorPayout.findMany({
          where: { vendorId: { in: vendorIds } },
        })
      : [],
    vendorIds.length
      ? prisma.vendorBankInfo.findMany({
          where: { vendorId: { in: vendorIds } },
        })
      : [],
  ])

  const bankInfoMap = new Map(bankInfo.map(item => [String(item.vendorId), item]))
  const assignmentsByVendor = assignments.reduce((map, assignment) => {
    const key = String(assignment.vendorId)
    const next = map.get(key) ?? []
    next.push(assignment)
    map.set(key, next)
    return map
  }, new Map())
  const payoutsByVendor = payouts.reduce((map, payout) => {
    const key = String(payout.vendorId)
    const next = map.get(key) ?? []
    next.push(payout)
    map.set(key, next)
    return map
  }, new Map())

  return {
    vendors: vendors.map(vendor => {
      const vendorId = String(vendor.id)
      const vendorAssignments = assignmentsByVendor.get(vendorId) ?? []
      const vendorPayouts = payoutsByVendor.get(vendorId) ?? []

      return {
        ...mapVendorPreview(vendor),
        documentId: vendor.documentId ?? null,
        vendorStatus: vendor.vendor_status ?? 'pending',
        isAvailable: Boolean(vendor.is_available),
        teamSize: vendor.team_size ?? null,
        leadTimeDays: vendor.lead_time_days ?? null,
        createdAt: vendor.createdAt ?? null,
        updatedAt: vendor.updatedAt ?? null,
        registrationData: vendor.registration_data ?? null,
        documentsCount: Array.isArray(vendor.vendor_documents) ? vendor.vendor_documents.length : 0,
        portfolioCount: Array.isArray(vendor.vendor_portfolios)
          ? vendor.vendor_portfolios.length
          : 0,
        vendorDocuments: (Array.isArray(vendor.vendor_documents) ? vendor.vendor_documents : [])
          .map(mapVendorDocumentPreview)
          .filter(Boolean),
        vendorPortfolios: (Array.isArray(vendor.vendor_portfolios) ? vendor.vendor_portfolios : [])
          .map(mapVendorPortfolioPreview)
          .filter(Boolean),
        activeAssignmentsCount: vendorAssignments.filter(assignment =>
          ['assigned', 'confirmed'].includes(assignment.status)
        ).length,
        completedAssignmentsCount: vendorAssignments.filter(
          assignment => assignment.status === 'completed'
        ).length,
        pendingPayoutAmount: Number(
          vendorPayouts
            .filter(payout => payout.status === 'pending')
            .reduce((sum, payout) => sum + toNumber(payout.amount), 0)
            .toFixed(2)
        ),
        bankInfo: bankInfoMap.get(vendorId) ?? null,
      }
    }),
    pagination: response?.meta?.pagination ?? {
      page,
      pageSize: limit,
      pageCount: 1,
      total: vendors.length,
    },
  }
}

export async function getAdminSession(req, res, next) {
  try {
    res.json({
      session: {
        user: req.adminAccess?.user ?? null,
        admin: {
          enabled: true,
          accessReason: req.adminAccess?.reason ?? 'ADMIN_ACCESS_GRANTED',
          noAuthMode: req.adminAccess?.reason === 'ADMIN_PANEL_NO_AUTH',
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getAdminOverview(req, res, next) {
  try {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const startOfTomorrow = new Date(startOfToday)
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)

    const nextFifteenDays = new Date(startOfToday)
    nextFifteenDays.setDate(nextFifteenDays.getDate() + 15)

    const [
      totalBookings,
      activeBookingsCount,
      newBookingsCount,
      completedBookingsCount,
      todayBookingsCount,
      upcomingEventsCount,
      pendingSampleCount,
      openTicketsCount,
      unresolvedAlertsCount,
      allPayments,
      pendingPayouts,
      recentBookings,
      upcomingBookings,
      alerts,
      vendorsResponse,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          status: {
            notIn: ['completed', 'cancelled'],
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: 'new',
        },
      }),
      prisma.booking.count({
        where: {
          status: {
            in: ['completed', 'cancelled'],
          },
        },
      }),
      prisma.booking.count({
        where: {
          eventDate: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },
      }),
      prisma.booking.count({
        where: {
          eventDate: {
            gte: startOfToday,
            lte: nextFifteenDays,
          },
          status: {
            notIn: ['completed', 'cancelled'],
          },
        },
      }),
      prisma.sampleTasteBooking.count({
        where: {
          status: {
            in: ['new', 'assigned'],
          },
        },
      }),
      prisma.supportTicket.count({
        where: {
          status: {
            in: ['open', 'in_progress'],
          },
        },
      }),
      prisma.alert.count({
        where: {
          status: {
            not: 'resolved',
          },
        },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vendorPayout.findMany({
        where: { status: 'pending' },
      }),
      prisma.booking.findMany({
        include: {
          items: true,
          notes: true,
          statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
          payments: { orderBy: { createdAt: 'desc' } },
          vendorAssignments: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.booking.findMany({
        where: {
          eventDate: {
            gte: startOfToday,
          },
          status: {
            notIn: ['completed', 'cancelled'],
          },
        },
        include: {
          items: true,
          notes: true,
          statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
          payments: { orderBy: { createdAt: 'desc' } },
          vendorAssignments: true,
        },
        orderBy: { eventDate: 'asc' },
        take: 8,
      }),
      prisma.alert.findMany({
        where: {
          status: {
            not: 'resolved',
          },
        },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        take: 8,
      }),
      safeStrapiServerGet(
        '/api/vendors?filters[vendor_status][$eq]=pending&publicationState=preview&pagination[page]=1&pagination[pageSize]=5',
        { data: [], meta: { pagination: { total: 0 } } }
      ),
    ])

    const paymentSummary = buildPaymentSummaryFromPayments(allPayments)
    const pendingVendorAmount = pendingPayouts.reduce(
      (sum, payout) => sum + toNumber(payout.amount),
      0
    )
    const [recent, upcoming, allAlertUsers] = await Promise.all([
      enrichBookingsWithCustomer(recentBookings),
      enrichBookingsWithCustomer(upcomingBookings),
      fetchUsersByIds(alerts.map(alert => alert.resolvedBy).filter(Boolean)),
    ])
    const unassignedUpcomingCount = upcoming.filter(
      booking => (booking.vendorAssignments?.length ?? 0) === 0
    ).length
    const overdueAlerts = alerts.filter(alert => getDaysSince(alert.createdAt) >= 7)
    const pendingActions = [
      {
        id: 'bookings-needing-attention',
        title: `${newBookingsCount} new bookings need confirmation`,
        detail: `${upcomingEventsCount} live events are scheduled within the next 15 days`,
        status: newBookingsCount > 0 ? 'pending' : 'resolved',
      },
      {
        id: 'vendor-pending',
        title: `${vendorsResponse?.meta?.pagination?.total ?? 0} vendor requests are pending approval`,
        detail: `${unassignedUpcomingCount} upcoming bookings are still missing vendor assignment`,
        status:
          (vendorsResponse?.meta?.pagination?.total ?? 0) > 0 || unassignedUpcomingCount > 0
            ? 'pending'
            : 'resolved',
      },
      {
        id: 'sample-taste',
        title: `${pendingSampleCount} sample taste requests are waiting for assignment or delivery`,
        detail: 'Track new tasting bookings before they lapse into manual follow-up',
        status: pendingSampleCount > 0 ? 'in_progress' : 'resolved',
      },
      {
        id: 'support-queue',
        title: `${openTicketsCount} support tickets are still open`,
        detail: `${unresolvedAlertsCount} unresolved alerts are active across the operation desk`,
        status: openTicketsCount > 0 || unresolvedAlertsCount > 0 ? 'critical' : 'resolved',
      },
    ]
    const systemHealth = [
      {
        label: 'Platform status',
        value: unresolvedAlertsCount > 5 ? 'Degraded' : 'Normal',
        status: unresolvedAlertsCount > 5 ? 'failed' : 'success',
        detail: `${unresolvedAlertsCount} unresolved alerts currently affect the operation desk`,
      },
      {
        label: 'Payment gateway',
        value: paymentSummary.failedCount > 0 ? 'Needs review' : 'Healthy',
        status: paymentSummary.failedCount > 0 ? 'pending' : 'success',
        detail: `${paymentSummary.failedCount} failed customer payments need follow-up`,
      },
      {
        label: 'Notification service',
        value: openTicketsCount > 0 ? 'Customer queue active' : 'Clear',
        status: openTicketsCount > 0 ? 'in_progress' : 'resolved',
        detail: `${openTicketsCount} live support conversations are still in flight`,
      },
      {
        label: 'Bookings per day',
        value: `${todayBookingsCount} events today`,
        status: todayBookingsCount > 0 ? 'confirmed' : 'resolved',
        detail: `${activeBookingsCount} bookings remain active across production`,
      },
    ]

    res.json({
      overview: {
        metrics: {
          totalBookings,
          activeBookingsCount,
          newBookingsCount,
          completedBookingsCount,
          todayBookingsCount,
          upcomingEventsCount,
          pendingSampleCount,
          openTicketsCount,
          unresolvedAlertsCount,
          pendingVendorApprovalsCount: vendorsResponse?.meta?.pagination?.total ?? 0,
          collectedAmount: paymentSummary.collectedAmount,
          pendingPaymentAmount: paymentSummary.pendingAmount,
          failedPaymentsCount: paymentSummary.failedCount,
          pendingVendorPayoutAmount: Number(pendingVendorAmount.toFixed(2)),
          unassignedUpcomingCount,
        },
        pendingActions,
        systemHealth,
        recentBookings: recent,
        upcomingBookings: upcoming,
        vendorApprovals: (vendorsResponse?.data ?? []).map(vendor => ({
          id: String(vendor.id),
          documentId: vendor.documentId ?? null,
          companyName: vendor.company_name ?? '',
          contactPerson: vendor.contact_person ?? '',
          locationCity: vendor.location_city ?? '',
          vendorStatus: vendor.vendor_status ?? 'pending',
          isAvailable: Boolean(vendor.is_available),
        })),
        alerts: alerts.map(alert => ({
          ...alert,
          resolvedByUser: alert.resolvedBy
            ? (allAlertUsers.get(String(alert.resolvedBy)) ?? null)
            : null,
        })),
        overdueAlerts: overdueAlerts.map(alert => ({
          ...alert,
          resolvedByUser: alert.resolvedBy
            ? (allAlertUsers.get(String(alert.resolvedBy)) ?? null)
            : null,
        })),
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function listAdminBookings(req, res, next) {
  try {
    const bucket = normalizeText(req.query.bucket || 'all').toLowerCase()
    const status = normalizeText(req.query.status).toLowerCase()
    const search = normalizeText(req.query.search)
    const sortBy = normalizeText(req.query.sortBy || 'event_date').toLowerCase()
    const page = toPositiveInt(req.query.page, 1)
    const limit = Math.min(toPositiveInt(req.query.limit, 12), 50)
    const skip = (page - 1) * limit

    const bookingBucketFilter = buildBookingBucketFilter(bucket)
    const hasStatusFilter = status && BOOKING_STATUSES.includes(status)
    const baseWhere = {
      ...bookingBucketFilter,
      ...(hasStatusFilter ? { status } : {}),
    }

    const orderByClause =
      sortBy === 'latest' ? [{ createdAt: 'desc' }] : [{ eventDate: 'asc' }, { createdAt: 'desc' }]

    const bookingInclude = {
      items: true,
      notes: true,
      statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
      payments: { orderBy: { createdAt: 'desc' } },
      vendorAssignments: true,
      cancellation: true,
    }

    let enrichedBookings = []
    let total = 0
    let statusCounts = BOOKING_STATUSES.reduce((acc, key) => {
      acc[key] = 0
      return acc
    }, {})
    let metrics = { total: 0, active: 0, previous: 0 }

    if (search) {
      const bookings = await prisma.booking.findMany({
        where: bookingBucketFilter,
        include: bookingInclude,
        orderBy: orderByClause,
      })
      const enrichedCandidates = await enrichBookingsWithCustomer(bookings)
      const matchingBookings = enrichedCandidates.filter(booking =>
        bookingMatchesSearch(booking, search)
      )
      const visibleBookings = hasStatusFilter
        ? matchingBookings.filter(booking => booking.status === status)
        : matchingBookings

      total = visibleBookings.length
      enrichedBookings = visibleBookings.slice(skip, skip + limit)
      statusCounts = matchingBookings.reduce((acc, booking) => {
        if (booking?.status && BOOKING_STATUSES.includes(booking.status)) {
          acc[booking.status] += 1
        }
        return acc
      }, statusCounts)
      metrics = {
        total,
        active: visibleBookings.filter(booking => getBookingCategory(booking) === 'active').length,
        previous: visibleBookings.filter(booking => getBookingCategory(booking) === 'previous')
          .length,
      }
    } else {
      const [bookings, count, statusCountRows] = await Promise.all([
        prisma.booking.findMany({
          where: baseWhere,
          include: bookingInclude,
          orderBy: orderByClause,
          skip,
          take: limit,
        }),
        prisma.booking.count({ where: baseWhere }),
        prisma.booking.groupBy({
          by: ['status'],
          where: bookingBucketFilter,
          _count: { _all: true },
        }),
      ])

      enrichedBookings = await enrichBookingsWithCustomer(bookings)
      total = count
      statusCountRows.forEach(row => {
        if (row?.status && BOOKING_STATUSES.includes(row.status)) {
          statusCounts[row.status] = Number(row._count?._all ?? 0)
        }
      })
      metrics = {
        total,
        active: enrichedBookings.filter(booking => getBookingCategory(booking) === 'active').length,
        previous: enrichedBookings.filter(booking => getBookingCategory(booking) === 'previous')
          .length,
      }
    }

    res.json({
      bookings: enrichedBookings,
      metrics,
      statusCounts,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
    })
  } catch (err) {
    next(err)
  }
}

export async function getAdminBooking(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        notes: { orderBy: { createdAt: 'desc' } },
        statusLogs: { orderBy: { createdAt: 'asc' } },
        timeline: { orderBy: { createdAt: 'asc' } },
        vendorAssignments: { orderBy: { assignedAt: 'desc' } },
        payments: { include: { refunds: true }, orderBy: { createdAt: 'desc' } },
        cancellation: true,
        files: { orderBy: { createdAt: 'desc' } },
        messageThread: {
          include: {
            messages: {
              include: { attachments: true, readStatus: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        supportTickets: {
          include: {
            messages: { orderBy: { createdAt: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const [enrichedBooking] = await enrichBookingsWithCustomer([booking])

    res.json({ booking: enrichedBooking })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminBookingStatus(req, res, next) {
  try {
    const bookingId = req.params.id
    const status = normalizeText(req.body.status).toLowerCase()
    const note = normalizeText(req.body.note)
    const adminId = String(req.user.id)

    if (!BOOKING_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of: ${BOOKING_STATUSES.join(', ')}` })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: true,
        cancellation: true,
      },
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    // Calculate remaining amount
    const totalPaid = booking.payments
      .filter(payment => payment.status === 'success')
      .reduce((sum, payment) => sum + toNumber(payment.amount), 0)
    const remainingAmount = toNumber(booking.totalPrice) - totalPaid

    // Validate stage progression
    const validation = validateStageProgression(booking.status, status, remainingAmount)
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message, code: 'INVALID_STAGE_PROGRESSION' })
    }

    // Legacy validation for execution stage (kept for backward compatibility)
    if (status === 'execution') {
      if (totalPaid < toNumber(booking.totalPrice)) {
        return res.status(400).json({
          error: 'Remaining payment must be completed before moving to execution.',
          code: 'PAYMENT_PENDING',
        })
      }
    }

    const updatedBooking = await prisma.$transaction(async tx => {
      const nextBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status },
      })

      await tx.bookingStatusLog.create({
        data: {
          bookingId,
          previousStatus: booking.status,
          newStatus: status,
          changedBy: adminId,
          note: note || null,
        },
      })

      if (status === 'cancelled' && !booking.cancellation) {
        await tx.cancellation.create({
          data: {
            bookingId,
            requestedBy: adminId,
            reason: note || 'Cancelled by admin',
            policyAcknowledged: true,
            status: 'approved',
          },
        })
      }

      return nextBooking
    })

    notify(booking.userId, {
      type: 'booking_update',
      title: `Booking updated to ${status.replaceAll('_', ' ')}`,
      message: note || `Your booking status is now ${status.replaceAll('_', ' ')}.`,
      linkUrl: `/dashboard/bookings/${bookingId}`,
    }).catch(() => {})

    res.json({ booking: updatedBooking })
  } catch (err) {
    next(err)
  }
}

export async function collectAdminBookingCod(req, res, next) {
  try {
    const bookingId = req.params.id
    const adminId = String(req.user.id)

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true },
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const codPayment = (booking.payments ?? []).find(isCodPendingPayment)
    if (!codPayment) {
      return res.status(400).json({ error: 'No pending Hookah COD payment found for this booking.' })
    }

    const updatedPayment = await prisma.$transaction(async tx => {
      const payment = await tx.payment.update({
        where: { id: codPayment.id },
        data: { status: 'success' },
      })

      await tx.paymentLog.create({
        data: {
          paymentId: codPayment.id,
          action: 'verified',
          performedBy: adminId,
          metadata: {
            cod: true,
            collectedOnDelivery: true,
          },
        },
      })

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          advanceAmount: '0.00',
          remainingAmount: '0.00',
        },
      })

      return payment
    })

    notify(booking.userId, {
      type: 'payment_update',
      title: 'Payment received',
      message: 'Your Hookah delivery payment has been recorded. Thank you!',
      linkUrl: `/dashboard/bookings/${bookingId}`,
    }).catch(() => {})

    await cacheDelPattern(`dashboard:summary:${booking.userId}`)

    res.json({ booking, payment: updatedPayment })
  } catch (err) {
    next(err)
  }
}

export async function addAdminBookingNote(req, res, next) {
  try {
    const bookingId = req.params.id
    const note = normalizeText(req.body.note)
    const adminId = String(req.user.id)

    if (!note) {
      return res.status(400).json({ error: 'note is required' })
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const createdNote = await prisma.bookingNote.create({
      data: {
        bookingId,
        adminId,
        note,
        isInternal: true,
      },
    })

    res.status(201).json({ note: createdNote })
  } catch (err) {
    next(err)
  }
}

export async function listAdminSampleTastes(req, res, next) {
  try {
    const status = normalizeText(req.query.status).toLowerCase()
    const search = normalizeText(req.query.search)
    const page = toPositiveInt(req.query.page, 1)
    const limit = Math.min(toPositiveInt(req.query.limit, 12), 50)
    const skip = (page - 1) * limit

    const hasStatusFilter = status && SAMPLE_STATUSES.includes(status)
    const baseWhere = hasStatusFilter ? { status } : {}
    const sampleInclude = {
      vendors: true,
    }

    let enrichedSamples = []
    let total = 0
    let statusCounts = SAMPLE_STATUSES.reduce((acc, key) => {
      acc[key] = 0
      return acc
    }, {})

    if (search) {
      const samples = await prisma.sampleTasteBooking.findMany({
        where: {},
        include: sampleInclude,
        orderBy: [{ bookingDate: 'asc' }, { createdAt: 'desc' }],
      })
      const enrichedCandidates = await enrichSamplesWithCustomer(samples)
      const matchingSamples = enrichedCandidates.filter(sample =>
        sampleMatchesSearch(sample, search)
      )
      const visibleSamples = hasStatusFilter
        ? matchingSamples.filter(sample => sample.status === status)
        : matchingSamples

      total = visibleSamples.length
      enrichedSamples = visibleSamples.slice(skip, skip + limit)
      statusCounts = matchingSamples.reduce((acc, sample) => {
        if (sample?.status && SAMPLE_STATUSES.includes(sample.status)) {
          acc[sample.status] += 1
        }
        return acc
      }, statusCounts)
    } else {
      const [samples, count, statusCountRows] = await Promise.all([
        prisma.sampleTasteBooking.findMany({
          where: baseWhere,
          include: sampleInclude,
          orderBy: [{ bookingDate: 'asc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
        }),
        prisma.sampleTasteBooking.count({ where: baseWhere }),
        prisma.sampleTasteBooking.groupBy({
          by: ['status'],
          where: {},
          _count: { _all: true },
        }),
      ])

      enrichedSamples = await enrichSamplesWithCustomer(samples)
      total = count
      statusCountRows.forEach(row => {
        if (row?.status && SAMPLE_STATUSES.includes(row.status)) {
          statusCounts[row.status] = Number(row._count?._all ?? 0)
        }
      })
    }

    res.json({
      samples: enrichedSamples,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
      statusCounts,
      metrics: {
        total,
        awaitingAssignment: enrichedSamples.filter(sample => sample.status === 'new').length,
        scheduledDeliveries: enrichedSamples.filter(sample => sample.status === 'assigned').length,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminSampleTasteStatus(req, res, next) {
  try {
    const sampleId = req.params.id
    const status = normalizeText(req.body.status).toLowerCase()
    const vendorId = normalizeText(req.body.vendorId)
    const menuItems = req.body.menuItems ?? null
    const deliveryDate = req.body.deliveryDate ? new Date(req.body.deliveryDate) : null

    if (!SAMPLE_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${SAMPLE_STATUSES.join(', ')}` })
    }

    const sample = await prisma.sampleTasteBooking.findUnique({
      where: { id: sampleId },
      include: { vendors: true },
    })

    if (!sample) {
      return res.status(404).json({ error: 'Sample taste booking not found' })
    }

    if (status === 'assigned' && !vendorId) {
      return res.status(400).json({ error: 'vendorId is required when assigning a vendor' })
    }

    const updated = await prisma.$transaction(async tx => {
      if (status === 'assigned' && vendorId) {
        const existingAssignment = sample.vendors.find(
          vendor => String(vendor.vendorId) === vendorId
        )

        if (!existingAssignment) {
          await tx.sampleTasteVendor.create({
            data: {
              sampleBookingId: sampleId,
              vendorId,
              menuItems,
            },
          })
        }
      }

      return tx.sampleTasteBooking.update({
        where: { id: sampleId },
        data: {
          status,
          ...(deliveryDate && status === 'delivered' ? { deliveryDate } : {}),
        },
        include: { vendors: true },
      })
    })

    res.json({ sample: updated })
  } catch (err) {
    next(err)
  }
}

export async function recordAdminSampleTasteDecision(req, res, next) {
  try {
    const sampleId = req.params.id
    const decision = normalizeText(req.body.decision).toLowerCase()
    const decisionNotes = normalizeText(req.body.decisionNotes)
    const feedbackText = normalizeText(req.body.feedbackText)
    const vendorId = normalizeText(req.body.vendorId)
    const rating =
      req.body.rating === null || req.body.rating === undefined ? null : Number(req.body.rating)
    const vendorRatings = Array.isArray(req.body.vendorRatings) ? req.body.vendorRatings : []

    if (!['convert_full', 'save', 'cancel', 'expired'].includes(decision)) {
      return res.status(400).json({
        error: 'decision must be one of: convert_full, save, cancel, expired',
      })
    }

    const sample = await prisma.sampleTasteBooking.findUnique({
      where: { id: sampleId },
      include: { vendors: true },
    })

    if (!sample) {
      return res.status(404).json({ error: 'Sample taste booking not found' })
    }

    if (!['delivered', 'completed'].includes(String(sample.status ?? '').toLowerCase())) {
      return res.status(400).json({
        error: 'Decision can only be recorded for delivered or completed sample taste bookings',
      })
    }

    const normalizedVendorRatings = vendorRatings
      .map(entry => ({
        vendorId: String(entry?.vendorId ?? '').trim(),
        rating: entry?.rating === null || entry?.rating === undefined ? null : Number(entry.rating),
      }))
      .filter(
        entry =>
          entry.vendorId && Number.isInteger(entry.rating) && entry.rating >= 1 && entry.rating <= 5
      )

    const updated = await prisma.$transaction(async tx => {
      if (normalizedVendorRatings.length) {
        await Promise.all(
          normalizedVendorRatings.map(async entry => {
            const matchedVendor = sample.vendors.find(v => String(v.vendorId) === entry.vendorId)
            if (!matchedVendor) return

            await tx.sampleTasteVendor.update({
              where: { id: matchedVendor.id },
              data: { rating: entry.rating },
            })
          })
        )
      }

      if (vendorId && (rating || feedbackText)) {
        const matchedVendor = sample.vendors.find(v => String(v.vendorId) === String(vendorId))
        if (matchedVendor) {
          await tx.sampleTasteVendor.update({
            where: { id: matchedVendor.id },
            data: {
              rating: Number.isInteger(rating) ? rating : undefined,
              feedbackText: feedbackText || undefined,
            },
          })
        }
      } else if (feedbackText && sample.vendors.length === 1) {
        await tx.sampleTasteVendor.update({
          where: { id: sample.vendors[0].id },
          data: { feedbackText },
        })
      }

      return tx.sampleTasteBooking.update({
        where: { id: sample.id },
        data: {
          decision,
          decisionNotes: decisionNotes || null,
          status: 'completed',
          feedbackSubmitted: Boolean(normalizedVendorRatings.length || rating || feedbackText),
        },
        include: { vendors: true },
      })
    })

    res.json({ sample: updated })
  } catch (err) {
    next(err)
  }
}

export async function listAdminVendors(req, res, next) {
  try {
    const page = toPositiveInt(req.query.page, 1)
    const limit = Math.min(toPositiveInt(req.query.limit, 12), 50)
    const search = normalizeText(req.query.search)
    const status = normalizeText(req.query.status).toLowerCase()
    const availability = normalizeText(req.query.availability).toLowerCase()

    const result = await fetchVendorDirectory({
      page,
      limit,
      search,
      status,
      availability,
    })

    res.json({
      vendors: result.vendors,
      total: result.pagination.total,
      page: result.pagination.page,
      pages: result.pagination.pageCount,
    })
  } catch (err) {
    next(err)
  }
}

export async function getAdminVendorWorkspace(req, res, next) {
  try {
    const tab = normalizeText(req.query.tab || 'pending').toLowerCase()
    const search = normalizeText(req.query.search)
    const category = normalizeText(req.query.category).toLowerCase()
    const location = normalizeText(req.query.location).toLowerCase()
    const availability = normalizeText(req.query.availability).toLowerCase()
    const page = toPositiveInt(req.query.page, 1)
    const limit = Math.min(toPositiveInt(req.query.limit, 10), 50)
    const result = await fetchVendorDirectory({
      search,
      availability,
      page: 1,
      limit: 1000,
    })

    const pendingRequests = result.vendors
      .filter(
        vendor =>
          vendor.vendorStatus === 'pending' && Number(vendor.activeAssignmentsCount ?? 0) === 0
      )
      .sort((left, right) => right.documentsCount - left.documentsCount)
    const assignedVendors = result.vendors
      .filter(vendor => Number(vendor.activeAssignmentsCount ?? 0) > 0)
      .sort(
        (left, right) =>
          Number(right.activeAssignmentsCount ?? 0) - Number(left.activeAssignmentsCount ?? 0)
      )
    const unassignedVendors = result.vendors
      .filter(
        vendor =>
          vendor.vendorStatus === 'approved' && Number(vendor.activeAssignmentsCount ?? 0) === 0
      )
      .sort((left, right) => Number(right.isAvailable) - Number(left.isAvailable))
    const applyExtraFilters = vendors =>
      vendors.filter(vendor => {
        if (
          category &&
          !(vendor.serviceCategories ?? []).some(service =>
            String(service?.name ?? '')
              .toLowerCase()
              .includes(category)
          )
        ) {
          return false
        }
        if (
          location &&
          !String(vendor.locationCity ?? '')
            .toLowerCase()
            .includes(location)
        ) {
          return false
        }
        return true
      })
    const filteredGroups = {
      pending: applyExtraFilters(pendingRequests),
      assigned: applyExtraFilters(assignedVendors),
      unassigned: applyExtraFilters(unassignedVendors),
    }
    const activeList = filteredGroups[tab] ?? filteredGroups.pending
    const total = activeList.length
    const pages = Math.max(1, Math.ceil(total / limit))
    const start = (page - 1) * limit
    const paginatedList = activeList.slice(start, start + limit)

    res.json({
      workspace: {
        summary: {
          total: result.vendors.length,
          pendingRequests: pendingRequests.length,
          assignedVendors: assignedVendors.length,
          unassignedVendors: unassignedVendors.length,
          availableNow: result.vendors.filter(vendor => vendor.isAvailable).length,
        },
        activeList: paginatedList,
        page,
        pages,
        total,
        tab,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminVendor(req, res, next) {
  try {
    const vendorId = req.params.id
    const payload = {}
    const vendorStatus = normalizeText(req.body.vendor_status).toLowerCase()

    if (vendorStatus) {
      payload.vendor_status = vendorStatus
    }

    if (typeof req.body.is_available === 'boolean') {
      payload.is_available = req.body.is_available
    }

    if (req.body.minimum_price !== undefined) {
      payload.minimum_price = req.body.minimum_price
    }

    if (req.body.lead_time_days !== undefined) {
      payload.lead_time_days = req.body.lead_time_days
    }

    if (!Object.keys(payload).length) {
      return res.status(400).json({ error: 'At least one vendor field must be provided' })
    }

    try {
      const vendor = await strapiServerGet(
        `/api/vendors?filters[id][$eq]=${encodeURIComponent(vendorId)}&publicationState=preview&pagination[pageSize]=1`
      )
      const currentVendor = vendor?.data?.[0] ?? null

      if (!currentVendor?.documentId) {
        return res.status(404).json({ error: 'Vendor not found' })
      }

      const updated = await strapiServerPut(`/api/vendors/${currentVendor.documentId}`, {
        data: payload,
      })

      return res.json({
        vendor: {
          ...mapVendorPreview(updated?.data ?? currentVendor),
          vendorStatus: updated?.data?.vendor_status ?? currentVendor.vendor_status ?? 'pending',
          isAvailable: Boolean(updated?.data?.is_available ?? currentVendor.is_available),
        },
      })
    } catch (err) {
      if (!isStrapiCredentialError(err)) {
        throw err
      }

      const parsedVendorId = Number.parseInt(String(vendorId), 10)
      if (!Number.isFinite(parsedVendorId)) {
        return res.status(404).json({ error: 'Vendor not found' })
      }

      const [updatedRow] = await prisma.$queryRaw`
        UPDATE public.vendors
        SET
          vendor_status = CASE
            WHEN ${payload.vendor_status !== undefined} THEN ${payload.vendor_status}
            ELSE vendor_status
          END,
          is_available = CASE
            WHEN ${payload.is_available !== undefined} THEN ${payload.is_available}
            ELSE is_available
          END,
          minimum_price = CASE
            WHEN ${payload.minimum_price !== undefined} THEN ${payload.minimum_price}
            ELSE minimum_price
          END,
          lead_time_days = CASE
            WHEN ${payload.lead_time_days !== undefined} THEN ${payload.lead_time_days}
            ELSE lead_time_days
          END,
          updated_at = NOW()
        WHERE id = ${parsedVendorId}
        RETURNING
          id,
          document_id,
          company_name,
          contact_person,
          email,
          phone,
          location_city,
          service_area,
          experience_years,
          team_size,
          minimum_price,
          lead_time_days,
          vendor_status,
          is_available,
          registration_data
      `

      if (!updatedRow) {
        return res.status(404).json({ error: 'Vendor not found' })
      }

      res.json({ vendor: mapVendorDirectoryRow(updatedRow) })
    }
  } catch (err) {
    next(err)
  }
}

export async function listAdminVendorAssignments(req, res, next) {
  try {
    const where = {
      ...(req.query.bookingId ? { bookingId: String(req.query.bookingId) } : {}),
      ...(req.query.vendorId ? { vendorId: String(req.query.vendorId) } : {}),
    }

    const assignments = await prisma.vendorAssignment.findMany({
      where,
      orderBy: { assignedAt: 'desc' },
    })

    const [vendors, bookings] = await Promise.all([
      fetchVendorsByIds(assignments.map(assignment => assignment.vendorId)),
      prisma.booking.findMany({
        where: {
          id: {
            in: uniqueStrings(assignments.map(assignment => assignment.bookingId)),
          },
        },
        include: {
          items: true,
          notes: true,
          statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
          payments: { orderBy: { createdAt: 'desc' } },
          vendorAssignments: true,
        },
      }),
    ])

    const enrichedBookings = await enrichBookingsWithCustomer(bookings)
    const bookingMap = new Map(enrichedBookings.map(booking => [booking.id, booking]))

    res.json({
      assignments: assignments.map(assignment => ({
        ...assignment,
        vendor: vendors.get(String(assignment.vendorId)) ?? null,
        booking: bookingMap.get(String(assignment.bookingId)) ?? null,
      })),
    })
  } catch (err) {
    next(err)
  }
}

export async function listAdminMessageThreads(req, res, next) {
  try {
    const search = normalizeText(req.query.search)

    const threads = await prisma.messageThread.findMany({
      include: {
        booking: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { readStatus: true, attachments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enrichedBookings = await enrichBookingsWithCustomer(
      threads.map(thread => ({
        ...thread.booking,
        items: [],
        notes: [],
        statusLogs: [],
        payments: [],
        vendorAssignments: [],
      }))
    )
    const bookingMap = new Map(enrichedBookings.map(booking => [booking.id, booking]))

    const visibleThreads = threads.filter(thread => {
      if (!search) return true
      const booking = bookingMap.get(thread.bookingId)
      const haystack = [
        thread.bookingId,
        booking?.customer?.name,
        booking?.customer?.email,
        booking?.package?.title,
        booking?.event?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(search.toLowerCase())
    })

    const unreadCounts = await Promise.all(
      visibleThreads.map(thread =>
        prisma.message.count({
          where: {
            threadId: thread.id,
            senderId: { not: String(req.user.id) },
            readStatus: {
              none: { userId: String(req.user.id) },
            },
          },
        })
      )
    )

    const mappedThreads = visibleThreads
      .map((thread, index) => ({
        ...thread,
        bookingSummary: bookingMap.get(thread.bookingId) ?? null,
        latestMessage: thread.messages[0] ?? null,
        unreadCount: unreadCounts[index] ?? 0,
      }))
      .sort((left, right) => {
        const leftTime = new Date(left.latestMessage?.createdAt ?? left.createdAt).getTime()
        const rightTime = new Date(right.latestMessage?.createdAt ?? right.createdAt).getTime()
        return rightTime - leftTime
      })

    res.json({ threads: mappedThreads })
  } catch (err) {
    next(err)
  }
}

export async function getAdminMessageThread(req, res, next) {
  try {
    const bookingId = req.params.bookingId
    const adminUserId = String(req.user.id)

    const thread = await prisma.messageThread.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            items: true,
            notes: true,
            statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
            payments: { orderBy: { createdAt: 'desc' } },
            vendorAssignments: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true, readStatus: true },
        },
      },
    })

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    const unreadIds = thread.messages
      .filter(message => message.senderId !== adminUserId)
      .filter(message => !message.readStatus.some(readStatus => readStatus.userId === adminUserId))
      .map(message => message.id)

    if (unreadIds.length) {
      await prisma.messageReadStatus.createMany({
        data: unreadIds.map(messageId => ({
          messageId,
          userId: adminUserId,
        })),
        skipDuplicates: true,
      })
    }

    const [enrichedBooking, users] = await Promise.all([
      enrichBookingsWithCustomer([thread.booking]),
      fetchUsersByIds([thread.booking.userId, ...thread.messages.map(message => message.senderId)]),
    ])

    res.json({
      thread: {
        ...thread,
        bookingSummary: enrichedBooking[0] ?? null,
        messages: thread.messages.map(message => ({
          ...message,
          sender: users.get(String(message.senderId)) ?? null,
        })),
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function sendAdminMessage(req, res, next) {
  try {
    const threadId = normalizeText(req.body.threadId)
    const messageText = normalizeText(req.body.messageText)
    const messageType = normalizeText(req.body.messageType || 'text').toLowerCase()
    const attachments = Array.isArray(req.body.attachments) ? req.body.attachments : []
    const adminUserId = String(req.user.id)

    if (!threadId) {
      return res.status(400).json({ error: 'threadId is required' })
    }

    if (!messageText && attachments.length === 0) {
      return res.status(400).json({ error: 'messageText or attachments are required' })
    }

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: { booking: true },
    })

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    if (['completed', 'cancelled'].includes(String(thread.booking?.status ?? '').toLowerCase())) {
      return res.status(400).json({ error: 'Completed or cancelled bookings are read-only' })
    }

    const finalType = ['text', 'system', 'status_update'].includes(messageType)
      ? messageType
      : 'text'

    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: adminUserId,
        messageText: messageText || null,
        messageType: finalType,
        attachments: attachments.length
          ? {
              create: attachments.map(attachment => ({
                fileUrl: attachment.fileUrl,
                fileType: attachment.fileType ?? null,
              })),
            }
          : undefined,
        readStatus: {
          create: {
            userId: adminUserId,
          },
        },
      },
      include: {
        attachments: true,
        readStatus: true,
      },
    })

    notify(thread.booking.userId, {
      type: 'message',
      title: 'New admin message',
      message: messageText || 'You have received a new update from the Elewen team.',
      linkUrl: `/dashboard/messages?bookingId=${thread.bookingId}`,
    }).catch(() => {})

    res.status(201).json({ message })
  } catch (err) {
    next(err)
  }
}

export async function getAdminPaymentSummary(req, res, next) {
  try {
    const [payments, refunds, payouts, bookings, settingsResponse] = await Promise.all([
      prisma.payment.findMany(),
      prisma.refund.findMany(),
      prisma.vendorPayout.findMany(),
      prisma.booking.findMany({
        where: {
          status: {
            notIn: ['completed', 'cancelled'],
          },
        },
      }),
      safeStrapiServerGet('/api/global-setting?publicationState=preview', { data: null }),
    ])

    const paymentSummary = buildPaymentSummaryFromPayments(payments)
    const refundsPendingCount = refunds.filter(refund =>
      ['requested', 'processing'].includes(refund.status)
    ).length
    const vendorPayoutPendingAmount = payouts
      .filter(payout => payout.status === 'pending')
      .reduce((sum, payout) => sum + toNumber(payout.amount), 0)
    const totalOutstanding = bookings.reduce(
      (sum, booking) => sum + toNumber(booking.remainingAmount),
      0
    )

    res.json({
      summary: {
        ...paymentSummary,
        refundsPendingCount,
        vendorPayoutPendingAmount: Number(vendorPayoutPendingAmount.toFixed(2)),
        totalOutstanding: Number(totalOutstanding.toFixed(2)),
        advancePaymentPercentage: Number(settingsResponse?.data?.advance_payment_percentage ?? 30),
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getAdminPaymentWorkspace(req, res, next) {
  try {
    const limit = Math.min(toPositiveInt(req.query.limit, 10), 50)
    const customerTab = normalizeText(req.query.customerTab || 'active').toLowerCase()
    const customerPage = toPositiveInt(req.query.customerPage, 1)
    const vendorTab = normalizeText(req.query.vendorTab || 'pending').toLowerCase()
    const vendorPage = toPositiveInt(req.query.vendorPage, 1)
    const [
      payments,
      refunds,
      payouts,
      activeBookings,
      postEventBookings,
      cancelledBookings,
      settingsResponse,
      couponsResponse,
    ] = await Promise.all([
      prisma.payment.findMany({
        include: {
          refunds: true,
          booking: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.refund.findMany({
        include: {
          payment: {
            include: {
              booking: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vendorPayout.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.findMany({
        where: {
          status: {
            notIn: ['completed', 'cancelled'],
          },
        },
        include: {
          items: true,
          notes: true,
          statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
          payments: { orderBy: { createdAt: 'desc' } },
          vendorAssignments: true,
        },
        orderBy: [{ eventDate: 'asc' }, { createdAt: 'desc' }],
        take: 20,
      }),
      prisma.booking.findMany({
        where: {
          status: 'post_event',
        },
        include: {
          items: true,
          notes: true,
          statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
          payments: { orderBy: { createdAt: 'desc' } },
          vendorAssignments: true,
        },
        orderBy: [{ eventDate: 'asc' }, { createdAt: 'desc' }],
        take: 20,
      }),
      prisma.booking.findMany({
        where: {
          status: 'cancelled',
        },
        include: {
          items: true,
          notes: true,
          cancellation: true,
          statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
          payments: {
            include: {
              refunds: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          vendorAssignments: true,
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 20,
      }),
      safeStrapiServerGet('/api/global-setting?publicationState=preview', { data: null }),
      safeStrapiServerGet(
        '/api/coupons?publicationState=preview&pagination[page]=1&pagination[pageSize]=10&sort[0]=createdAt:desc',
        { data: [] }
      ),
    ])

    const [enrichedActiveBookings, enrichedPostEventBookings, enrichedCancelledBookings, vendors] =
      await Promise.all([
        enrichBookingsWithCustomer(activeBookings),
        enrichBookingsWithCustomer(postEventBookings),
        enrichBookingsWithCustomer(cancelledBookings),
        fetchVendorsByIds(payouts.map(payout => payout.vendorId)),
      ])

    const allBookingIds = uniqueStrings([
      ...payments.map(payment => payment.bookingId),
      ...payouts.map(payout => payout.bookingId),
      ...enrichedActiveBookings.map(booking => booking.id),
      ...enrichedPostEventBookings.map(booking => booking.id),
      ...enrichedCancelledBookings.map(booking => booking.id),
    ])

    const payoutBookings = allBookingIds.length
      ? await prisma.booking.findMany({
          where: {
            id: {
              in: allBookingIds,
            },
          },
          include: {
            items: true,
            notes: true,
            statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
            payments: { orderBy: { createdAt: 'desc' } },
            vendorAssignments: true,
          },
        })
      : []

    const enrichedWorkspaceBookings = await enrichBookingsWithCustomer(payoutBookings)
    const bookingMap = new Map(enrichedWorkspaceBookings.map(booking => [booking.id, booking]))
    const paymentSummary = buildPaymentSummaryFromPayments(payments)
    const refundsPendingCount = refunds.filter(refund =>
      ['requested', 'processing'].includes(refund.status)
    ).length
    const vendorPayoutPendingAmount = payouts
      .filter(payout => payout.status === 'pending')
      .reduce((sum, payout) => sum + toNumber(payout.amount), 0)
    const totalOutstanding = enrichedActiveBookings.reduce(
      (sum, booking) => sum + toNumber(booking.remainingAmount),
      0
    )

    const activeBookingPayments = enrichedActiveBookings
      .map(buildBookingPaymentSnapshot)
      .filter(booking => isActiveBookingStatus(booking.status))
    const postEventPending = enrichedPostEventBookings
      .map(buildBookingPaymentSnapshot)
      .filter(booking => booking.outstandingAmount > 0)
    const cancelledRefunds = enrichedCancelledBookings.map(buildCancelledBookingRefundSnapshot)
    const failedPayments = payments
      .filter(payment => payment.status === 'failed')
      .map(payment => ({
        ...payment,
        bookingSummary: bookingMap.get(String(payment.bookingId)) ?? null,
      }))
    const completedPayments = payments
      .filter(payment => ['success', 'refunded'].includes(payment.status))
      .map(payment => ({
        ...payment,
        bookingSummary: bookingMap.get(String(payment.bookingId)) ?? null,
      }))
    const pendingVendorPayments = payouts
      .filter(payout => payout.status === 'pending')
      .map(payout => ({
        ...payout,
        vendor: vendors.get(String(payout.vendorId)) ?? null,
        bookingSummary: bookingMap.get(String(payout.bookingId)) ?? null,
      }))
    const paidVendorPayments = payouts
      .filter(payout => payout.status === 'paid')
      .map(payout => ({
        ...payout,
        vendor: vendors.get(String(payout.vendorId)) ?? null,
        bookingSummary: bookingMap.get(String(payout.bookingId)) ?? null,
      }))
    const paginateList = (items, page) => {
      const total = items.length
      const pages = Math.max(1, Math.ceil(total / limit))
      const safePage = Math.min(page, pages)
      const start = (safePage - 1) * limit

      return {
        items: items.slice(start, start + limit),
        page: safePage,
        pages,
        total,
      }
    }
    const customerLists = {
      active: activeBookingPayments,
      post_event: postEventPending,
      cancelled: cancelledRefunds,
      failed: failedPayments,
      completed: completedPayments,
    }
    const vendorLists = {
      pending: pendingVendorPayments,
      paid: paidVendorPayments,
    }
    const currentCustomer = paginateList(
      customerLists[customerTab] ?? customerLists.active,
      customerPage
    )
    const currentVendor = paginateList(vendorLists[vendorTab] ?? vendorLists.pending, vendorPage)

    res.json({
      workspace: {
        summary: {
          ...paymentSummary,
          refundsPendingCount,
          vendorPayoutPendingAmount: Number(vendorPayoutPendingAmount.toFixed(2)),
          totalOutstanding: Number(totalOutstanding.toFixed(2)),
          advancePaymentPercentage: Number(
            settingsResponse?.data?.advance_payment_percentage ?? 30
          ),
        },
        customerPayments: {
          activeBookings: customerTab === 'active' ? currentCustomer.items : [],
          postEventPending: customerTab === 'post_event' ? currentCustomer.items : [],
          cancelledBookings: customerTab === 'cancelled' ? currentCustomer.items : [],
          failedPayments: customerTab === 'failed' ? currentCustomer.items : [],
          completedPayments: customerTab === 'completed' ? currentCustomer.items : [],
          tab: customerTab,
          page: currentCustomer.page,
          pages: currentCustomer.pages,
          total: currentCustomer.total,
        },
        vendorPayments: {
          pending: vendorTab === 'pending' ? currentVendor.items : [],
          paid: vendorTab === 'paid' ? currentVendor.items : [],
          tab: vendorTab,
          page: currentVendor.page,
          pages: currentVendor.pages,
          total: currentVendor.total,
        },
        coupons: (couponsResponse?.data ?? []).map(coupon => ({
          id: String(coupon.id),
          documentId: coupon.documentId ?? null,
          code: coupon.code ?? '',
          discount_type: coupon.discount_type ?? 'percentage',
          discount_value: Number(coupon.discount_value ?? 0),
          max_uses: coupon.max_uses ?? null,
          used_count: coupon.used_count ?? 0,
          valid_from: coupon.valid_from ?? null,
          valid_to: coupon.valid_to ?? null,
          is_active: Boolean(coupon.is_active),
        })),
        settings: settingsResponse?.data ?? null,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function listAdminPayments(req, res, next) {
  try {
    const status = normalizeText(req.query.status).toLowerCase()
    const paymentType = normalizeText(req.query.paymentType).toLowerCase()
    const search = normalizeText(req.query.search)
    const page = toPositiveInt(req.query.page, 1)
    const limit = Math.min(toPositiveInt(req.query.limit, 12), 50)
    const skip = (page - 1) * limit

    const userIds = await searchUserIds(search)
    const bookingSearchFilters = buildEntitySearchOr(search, [
      ...(userIds.length ? [{ userId: { in: userIds } }] : []),
    ])
    const bookingIds =
      search && bookingSearchFilters.length
        ? (
            await prisma.booking.findMany({
              where: {
                OR: bookingSearchFilters,
              },
              select: { id: true },
            })
          ).map(booking => booking.id)
        : []

    const where = {
      ...(status === 'completed'
        ? { status: { in: ['success', 'refunded'] } }
        : status
          ? { status }
          : {}),
      ...(paymentType ? { paymentType } : {}),
      ...(search && bookingIds.length ? { bookingId: { in: bookingIds } } : {}),
    }

    const [payments, total, allMatchingPayments] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          refunds: true,
          booking: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
      prisma.payment.findMany({ where }),
    ])

    const enrichedBookings = await enrichBookingsWithCustomer(
      payments.map(payment => ({
        ...payment.booking,
        items: [],
        notes: [],
        statusLogs: [],
        payments: [],
        vendorAssignments: [],
      }))
    )
    const bookingMap = new Map(enrichedBookings.map(booking => [booking.id, booking]))

    res.json({
      payments: payments.map(payment => ({
        ...payment,
        bookingSummary: bookingMap.get(String(payment.bookingId)) ?? null,
      })),
      summary: buildPaymentSummaryFromPayments(allMatchingPayments),
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
    })
  } catch (err) {
    next(err)
  }
}

export async function listAdminRefunds(req, res, next) {
  try {
    const status = normalizeText(req.query.status).toLowerCase()
    const where = status ? { status } : {}

    const refunds = await prisma.refund.findMany({
      where,
      include: {
        payment: {
          include: {
            booking: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enrichedBookings = await enrichBookingsWithCustomer(
      refunds
        .map(refund => refund.payment?.booking)
        .filter(Boolean)
        .map(booking => ({
          ...booking,
          items: [],
          notes: [],
          statusLogs: [],
          payments: [],
          vendorAssignments: [],
        }))
    )
    const bookingMap = new Map(enrichedBookings.map(booking => [booking.id, booking]))

    res.json({
      refunds: refunds.map(refund => ({
        ...refund,
        bookingSummary: refund.bookingId
          ? (bookingMap.get(String(refund.bookingId)) ?? null)
          : null,
      })),
    })
  } catch (err) {
    next(err)
  }
}

export async function listAdminVendorPayouts(req, res, next) {
  try {
    const status = normalizeText(req.query.status).toLowerCase()
    const page = toPositiveInt(req.query.page, 1)
    const limit = Math.min(toPositiveInt(req.query.limit, 10), 50)
    const skip = (page - 1) * limit
    const where = status ? { status } : {}

    const [payouts, total] = await Promise.all([
      prisma.vendorPayout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.vendorPayout.count({ where }),
    ])

    const [vendors, bookings] = await Promise.all([
      fetchVendorsByIds(payouts.map(payout => payout.vendorId)),
      prisma.booking.findMany({
        where: {
          id: {
            in: uniqueStrings(payouts.map(payout => payout.bookingId)),
          },
        },
        include: {
          items: true,
          notes: true,
          statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
          payments: { orderBy: { createdAt: 'desc' } },
          vendorAssignments: true,
        },
      }),
    ])

    const enrichedBookings = await enrichBookingsWithCustomer(bookings)
    const bookingMap = new Map(enrichedBookings.map(booking => [booking.id, booking]))

    res.json({
      payouts: payouts.map(payout => ({
        ...payout,
        vendor: vendors.get(String(payout.vendorId)) ?? null,
        bookingSummary: bookingMap.get(String(payout.bookingId)) ?? null,
      })),
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
    })
  } catch (err) {
    next(err)
  }
}

export async function listAdminCoupons(req, res, next) {
  try {
    const search = normalizeText(req.query.search)
    const page = toPositiveInt(req.query.page, 1)
    const limit = Math.min(toPositiveInt(req.query.limit, 12), 50)

    const query = [
      'publicationState=preview',
      `pagination[page]=${page}`,
      `pagination[pageSize]=${limit}`,
      'sort[0]=createdAt:desc',
    ]

    if (search) {
      query.push(`filters[code][$containsi]=${encodeURIComponent(search)}`)
    }

    try {
      const response = await strapiServerGet(`/api/coupons?${query.join('&')}`)
      const seenCodes = new Set()
      return res.json({
        coupons: (response?.data ?? [])
          .map(coupon => mapCouponRecord(coupon))
          .filter(c => {
            const key = String(c.code).toUpperCase()
            if (!key || seenCodes.has(key)) return false
            seenCodes.add(key)
            return true
          }),
        total: response?.meta?.pagination?.total ?? 0,
        page: response?.meta?.pagination?.page ?? page,
        pages: response?.meta?.pagination?.pageCount ?? 1,
      })
    } catch {
      const result = await fetchCouponsFromDatabase({ search, page, limit })
      const seenCodes = new Set()
      result.coupons = result.coupons.filter(c => {
        const key = String(c.code ?? '').toUpperCase()
        if (!key || seenCodes.has(key)) return false
        seenCodes.add(key)
        return true
      })
      return res.json(result)
    }
  } catch (err) {
    next(err)
  }
}

function buildCouponPayload(body = {}) {
  return {
    title: normalizeNullableText(body.title),
    coupon_kind: normalizeNullableText(body.coupon_kind || 'public'),
    terms_customer: normalizeNullableText(body.terms_customer),
    admin_notes: normalizeNullableText(body.admin_notes),
    min_order_value: normalizeNullableNumber(body.min_order_value) ?? 0,
    max_order_value: normalizeNullableNumber(body.max_order_value),
    max_discount_amount: normalizeNullableNumber(body.max_discount_amount),
    first_order_only: Boolean(body.first_order_only),
    service_filter: normalizeNullableText(body.service_filter || 'all'),
    is_user_specific: Boolean(body.is_user_specific),
    is_shareable: body.is_shareable !== false,
  }
}

export async function createAdminCoupon(req, res, next) {
  try {
    const code = normalizeText(req.body.code).toUpperCase()
    const discountType = normalizeText(req.body.discount_type || 'percentage').toLowerCase()
    const discountValue = Number(req.body.discount_value)
    const maxUses = normalizeNullableNumber(req.body.max_uses)
    const usedCount = normalizeNullableNumber(req.body.used_count)

    if (!code || !Number.isFinite(discountValue)) {
      return res.status(400).json({ error: 'code and discount_value are required' })
    }
    if (!COUPON_DISCOUNT_TYPES.includes(discountType)) {
      return res
        .status(400)
        .json({ error: `discount_type must be one of: ${COUPON_DISCOUNT_TYPES.join(', ')}` })
    }

    const createPayload = {
      code,
      discount_type: discountType,
      discount_value: discountValue,
      max_uses: maxUses,
      used_count: usedCount ?? 0,
      valid_from: normalizeNullableText(req.body.valid_from),
      valid_to: normalizeNullableText(req.body.valid_to),
      is_active: req.body.is_active !== false,
      ...buildCouponPayload(req.body),
    }

    try {
      const created = await strapiServerPost('/api/coupons', {
        data: createPayload,
      })
      await cacheDelPattern('strapi:GET:/api/coupons*')
      return res.status(201).json({ coupon: created?.data ?? null })
    } catch {
      const created = await createCouponInDatabase(createPayload)
      return res.status(201).json({ coupon: created })
    }
  } catch (err) {
    next(err)
  }
}

export async function updateAdminCoupon(req, res, next) {
  try {
    const coupon = await fetchCouponById(req.params.id)
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' })
    }

    const payload = {}

    if (req.body.code !== undefined) payload.code = normalizeText(req.body.code).toUpperCase()
    if (req.body.discount_type !== undefined)
      payload.discount_type = normalizeText(req.body.discount_type).toLowerCase()
    if (req.body.discount_value !== undefined)
      payload.discount_value = Number(req.body.discount_value)
    if (req.body.max_uses !== undefined)
      payload.max_uses = normalizeNullableNumber(req.body.max_uses)
    if (req.body.used_count !== undefined)
      payload.used_count = normalizeNullableNumber(req.body.used_count) ?? 0
    if (req.body.valid_from !== undefined)
      payload.valid_from = normalizeNullableText(req.body.valid_from)
    if (req.body.valid_to !== undefined) payload.valid_to = normalizeNullableText(req.body.valid_to)
    if (req.body.is_active !== undefined) payload.is_active = Boolean(req.body.is_active)
    if (req.body.title !== undefined) payload.title = normalizeNullableText(req.body.title)
    if (req.body.coupon_kind !== undefined)
      payload.coupon_kind = normalizeNullableText(req.body.coupon_kind)
    if (req.body.terms_customer !== undefined)
      payload.terms_customer = normalizeNullableText(req.body.terms_customer)
    if (req.body.admin_notes !== undefined)
      payload.admin_notes = normalizeNullableText(req.body.admin_notes)
    if (req.body.min_order_value !== undefined)
      payload.min_order_value = normalizeNullableNumber(req.body.min_order_value) ?? 0
    if (req.body.max_order_value !== undefined)
      payload.max_order_value = normalizeNullableNumber(req.body.max_order_value)
    if (req.body.max_discount_amount !== undefined)
      payload.max_discount_amount = normalizeNullableNumber(req.body.max_discount_amount)
    if (req.body.first_order_only !== undefined)
      payload.first_order_only = Boolean(req.body.first_order_only)
    if (req.body.service_filter !== undefined)
      payload.service_filter = normalizeNullableText(req.body.service_filter)
    if (req.body.is_user_specific !== undefined)
      payload.is_user_specific = Boolean(req.body.is_user_specific)
    if (req.body.is_shareable !== undefined) payload.is_shareable = Boolean(req.body.is_shareable)

    if (
      payload.discount_type !== undefined &&
      !COUPON_DISCOUNT_TYPES.includes(payload.discount_type)
    ) {
      return res
        .status(400)
        .json({ error: `discount_type must be one of: ${COUPON_DISCOUNT_TYPES.join(', ')}` })
    }

    if (coupon.documentId) {
      try {
        const updated = await strapiServerPut(`/api/coupons/${coupon.documentId}`, {
          data: payload,
        })
        await cacheDelPattern('strapi:GET:/api/coupons*')
        return res.json({ coupon: updated?.data ?? null })
      } catch {
        const updated = await updateCouponInDatabase(req.params.id, payload)
        if (!updated) {
          return res.status(404).json({ error: 'Coupon not found' })
        }
        return res.json({ coupon: updated })
      }
    }

    const updated = await updateCouponInDatabase(req.params.id, payload)
    if (!updated) {
      return res.status(404).json({ error: 'Coupon not found' })
    }
    return res.json({ coupon: updated })
  } catch (err) {
    next(err)
  }
}

export async function deleteAdminCoupon(req, res, next) {
  try {
    const coupon = await fetchCouponById(req.params.id)
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' })
    }

    if (coupon.documentId) {
      try {
        await strapiServerDelete(`/api/coupons/${coupon.documentId}`)
        await cacheDelPattern('strapi:GET:/api/coupons*')
        return res.json({ success: true })
      } catch {
        await prisma.$queryRaw`DELETE FROM public.coupons WHERE id = ${Number.parseInt(String(req.params.id), 10)}`
        await cacheDelPattern('strapi:GET:/api/coupons*')
        return res.json({ success: true })
      }
    }

    await prisma.$queryRaw`DELETE FROM public.coupons WHERE id = ${Number.parseInt(String(req.params.id), 10)}`
    await cacheDelPattern('strapi:GET:/api/coupons*')
    return res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function shareAdminCoupon(req, res, next) {
  try {
    const coupon = await fetchCouponById(req.params.id)
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' })
    }

    if (!coupon.is_active) {
      return res.status(400).json({ error: 'Coupon is inactive. Enable it before sharing.' })
    }

    const email = normalizeText(req.body.email).toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid customer email is required.' })
    }

    const user = await findCustomerByEmail(email)
    if (!user?.id) {
      return res.status(400).json({
        error: 'No customer account found for this email. Ask them to register first.',
      })
    }

    const userId = String(user.id)
    const adminId = String(req.user.id)
    const code = await buildUniqueGrantCode('ELE')
    const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : new Date()
    const validTo = coupon.valid_to
      ? new Date(coupon.valid_to)
      : new Date(validFrom.getTime() + 60 * 24 * 60 * 60 * 1000)

    const grant = await prisma.userCouponGrant.create({
      data: {
        userId,
        assignedByAdminId: adminId,
        templateKey: `admin_share_${coupon.id}`,
        code,
        title: coupon.title || `Personal offer — ${coupon.code}`,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order_value: coupon.min_order_value ?? 0,
        max_order_value: coupon.max_order_value ?? null,
        max_discount_amount: coupon.max_discount_amount ?? null,
        terms_customer:
          coupon.terms_customer ||
          'This coupon is assigned to your account only and can be used once.',
        first_order_only: Boolean(coupon.first_order_only),
        service_filter: coupon.service_filter ?? 'all',
        is_shareable: false,
        valid_from: validFrom,
        valid_to: validTo,
        status: 'active',
        sent_at: validFrom,
      },
    })

    const appUrl = String(process.env.APP_URL || 'https://elewen.in').replace(/\/$/, '')
    const loginUrl = `${appUrl}/login?redirect=${encodeURIComponent('/cart')}`

    const discountLabel =
      coupon.discount_type === 'percentage'
        ? `${coupon.discount_value}% off`
        : `Rs ${Number(coupon.discount_value).toLocaleString('en-IN')} off`

    const validToLabel = validTo.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const terms = grant.terms_customer ?? ''
    const subject = `Your Elewen coupon: ${code}`

    if (templates.coupon_share) {
      const html = templates.coupon_share({
        code,
        discountLabel,
        terms,
        validTo: validToLabel,
        loginUrl,
      })
      await sendEmail(email, subject, html)
    }

    await notify(userId, {
      type: 'system',
      title: 'You received a discount coupon',
      message: `Use code ${code} for ${discountLabel} on your next order. This code is for your account only.`,
      linkUrl: '/dashboard/profile#my-coupons',
    })

    return res.json({
      success: true,
      email,
      couponCode: code,
      grant: mapGrantForCustomer(grant),
      loginUrl,
      notifiedInApp: true,
    })
  } catch (err) {
    next(err)
  }
}

export async function getAdminSettings(req, res, next) {
  try {
    try {
      const settings = await strapiServerGet('/api/global-setting?publicationState=preview')
      return res.json({ settings: settings?.data ?? settings ?? null })
    } catch {
      const settings = await fetchAdminSettingsFromDatabase()
      return res.json({ settings })
    }
  } catch (err) {
    next(err)
  }
}

export async function updateAdminSettings(req, res, next) {
  try {
    const payload = {}

    if (req.body.primary_phone !== undefined)
      payload.primary_phone = normalizeText(req.body.primary_phone)
    if (req.body.support_email !== undefined)
      payload.support_email = normalizeText(req.body.support_email)
    if (req.body.support_availability_text !== undefined)
      payload.support_availability_text = normalizeText(req.body.support_availability_text)
    if (req.body.advance_payment_percentage !== undefined)
      payload.advance_payment_percentage = normalizeNullableNumber(
        req.body.advance_payment_percentage
      )
    if (req.body.whatsapp_number !== undefined)
      payload.whatsapp_number = normalizeText(req.body.whatsapp_number)
    if (req.body.response_expectation_text !== undefined)
      payload.response_expectation_text = normalizeText(req.body.response_expectation_text)

    try {
      const updated = await strapiServerPut('/api/global-setting', {
        data: payload,
      })
      await cacheDelPattern('strapi:GET:/api/global-setting*')
      return res.json({ settings: updated?.data ?? updated ?? null })
    } catch {
      const updated = await upsertAdminSettingsInDatabase(payload)
      return res.json({ settings: updated })
    }
  } catch (err) {
    next(err)
  }
}

export async function listAdminSupportTickets(req, res, next) {
  try {
    const status = normalizeText(req.query.status).toLowerCase()
    const priority = normalizeText(req.query.priority).toLowerCase()
    const search = normalizeText(req.query.search)
    const page = toPositiveInt(req.query.page, 1)
    const limit = Math.min(toPositiveInt(req.query.limit, 12), 50)
    const skip = (page - 1) * limit

    const userIds = await searchUserIds(search)
    const where = {
      ...(status && SUPPORT_STATUSES.includes(status) ? { status } : {}),
      ...(priority && SUPPORT_PRIORITIES.includes(priority) ? { priority } : {}),
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        ...(userIds.length ? [{ userId: { in: userIds } }] : []),
      ]
    }

    const [tickets, total, users] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          messages: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
      fetchUsersByIds(
        (
          await prisma.supportTicket.findMany({
            where,
            select: { userId: true },
            skip,
            take: limit,
          })
        ).map(ticket => ticket.userId)
      ),
    ])

    res.json({
      tickets: tickets.map(ticket => ({
        ...ticket,
        customer: users.get(String(ticket.userId)) ?? null,
        latestMessage: ticket.messages[0] ?? null,
      })),
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
      metrics: {
        open: tickets.filter(ticket => ticket.status === 'open').length,
        inProgress: tickets.filter(ticket => ticket.status === 'in_progress').length,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getAdminSupportTicket(req, res, next) {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    const users = await fetchUsersByIds([
      ticket.userId,
      ...ticket.messages.map(message => message.senderId),
    ])

    res.json({
      ticket: {
        ...ticket,
        customer: users.get(String(ticket.userId)) ?? null,
        messages: ticket.messages.map(message => ({
          ...message,
          sender: users.get(String(message.senderId)) ?? null,
        })),
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminSupportTicket(req, res, next) {
  try {
    const ticketId = req.params.id
    const status = normalizeText(req.body.status).toLowerCase()
    const priority = normalizeText(req.body.priority).toLowerCase()

    if (status && !SUPPORT_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of: ${SUPPORT_STATUSES.join(', ')}` })
    }

    if (priority && !SUPPORT_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        error: `priority must be one of: ${SUPPORT_PRIORITIES.join(', ')}`,
      })
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })

    res.json({ ticket: updated })
  } catch (err) {
    next(err)
  }
}

export async function addAdminSupportMessage(req, res, next) {
  try {
    const ticketId = req.params.id
    const message = normalizeText(req.body.message)
    const attachmentUrl = normalizeText(req.body.attachmentUrl)
    const isInternalNote = req.body.isInternalNote === true
    const adminUserId = String(req.user.id)

    if (!message) {
      return res.status(400).json({ error: 'message is required' })
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    })

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ error: 'Closed tickets are read-only' })
    }

    const supportMessage = await prisma.supportMessage.create({
      data: {
        ticketId,
        senderId: adminUserId,
        message,
        isInternalNote,
        attachmentUrl: attachmentUrl || null,
      },
    })

    if (!isInternalNote && ['open', 'resolved'].includes(ticket.status)) {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'in_progress' },
      })
    }

    if (!isInternalNote) {
      notify(ticket.userId, {
        type: 'support',
        title: 'Support team replied',
        message,
        linkUrl: `/dashboard/support?ticketId=${ticketId}`,
      }).catch(() => {})
    }

    res.status(201).json({ message: supportMessage })
  } catch (err) {
    next(err)
  }
}

export async function listAdminAlerts(req, res, next) {
  try {
    const status = normalizeText(req.query.status).toLowerCase()
    const severity = normalizeText(req.query.severity).toLowerCase()
    const alertType = normalizeText(req.query.alertType)
    const search = normalizeText(req.query.search)
    const sortBy = normalizeText(req.query.sortBy || 'latest').toLowerCase()
    const page = toPositiveInt(req.query.page, 1)
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 50)
    const skip = (page - 1) * limit

    const baseWhere = {
      ...(alertType ? { alertType } : {}),
      ...(search
        ? {
            OR: [
              { message: { contains: search, mode: 'insensitive' } },
              { alertType: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const where = {
      ...baseWhere,
      ...(status && ALERT_STATUSES.includes(status) ? { status } : {}),
      ...(severity && ALERT_SEVERITIES.includes(severity) ? { severity } : {}),
    }
    const orderBy = sortBy === 'oldest' ? [{ createdAt: 'asc' }] : [{ createdAt: 'desc' }]

    const [
      alerts,
      total,
      resolvedUsers,
      criticalCount,
      unresolvedCount,
      highPriorityCount,
      pendingAttentionCount,
      informationalCount,
    ] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.alert.count({ where }),
      fetchUsersByIds(
        (
          await prisma.alert.findMany({
            where,
            select: { resolvedBy: true },
            skip,
            take: limit,
          })
        )
          .map(alert => alert.resolvedBy)
          .filter(Boolean)
      ),
      prisma.alert.count({
        where: {
          ...baseWhere,
          severity: 'critical',
        },
      }),
      prisma.alert.count({
        where: {
          ...baseWhere,
          status: { not: 'resolved' },
        },
      }),
      prisma.alert.count({
        where: {
          ...baseWhere,
          status: { not: 'resolved' },
          severity: { in: ['high', 'critical'] },
        },
      }),
      prisma.alert.count({
        where: {
          ...baseWhere,
          status: { not: 'resolved' },
          severity: 'medium',
        },
      }),
      prisma.alert.count({
        where: {
          ...baseWhere,
          OR: [{ severity: 'low' }, { status: 'resolved' }],
        },
      }),
    ])

    res.json({
      alerts: alerts.map(alert => ({
        ...alert,
        resolvedByUser: alert.resolvedBy
          ? (resolvedUsers.get(String(alert.resolvedBy)) ?? null)
          : null,
      })),
      summary: {
        total,
        critical: criticalCount,
        unresolved: unresolvedCount,
        highPriority: highPriorityCount,
        pendingAttention: pendingAttentionCount,
        informational: informationalCount,
      },
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
    })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminAlert(req, res, next) {
  try {
    const alertId = req.params.id
    const status = normalizeText(req.body.status).toLowerCase()
    const adminId = String(req.user.id)

    if (!ALERT_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${ALERT_STATUSES.join(', ')}` })
    }

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status,
        resolvedBy: status === 'resolved' ? adminId : null,
        resolvedAt: status === 'resolved' ? new Date() : null,
      },
    })

    res.json({ alert: updated })
  } catch (err) {
    next(err)
  }
}
