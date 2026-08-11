import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import prisma from '../lib/prisma.js'
import { notify, notifyRefund } from '../lib/notify.js'
import {
  buildCancellationRefundEntries,
  persistCancellationRefunds,
  roundRefundCurrency,
} from '../lib/cancellationRefunds.js'
import { createOperationalAlert } from '../lib/alerts.js'
import { invalidateDashboardCache } from './dashboard.js'
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
  strapiServerUpload,
  strapiUpload,
} from '../lib/strapi.js'
import { cacheDelPattern } from '../lib/cache.js'
import { isCodPayment, isCodPendingPayment } from '../lib/sheeshaCheckout.js'
import { buildUniqueGrantCode, mapGrantForCustomer } from '../lib/coupons.js'
import { findCustomerByEmail } from '../lib/userLookup.js'
import {
  addDaysToDateKey,
  getIstDateKey,
  previewBookingPersonalizationEmail,
  sendBookingConfirmedEmail,
  sendBookingPersonalizationEmail,
  sendFinalPaymentEmail,
  sendInfoCollectionEmail,
  sendPostEventFeedbackEmail,
} from '../lib/bookingEmailService.js'
import {
  BOOKING_STAGE_PROGRESSION as STAGE_PROGRESSION,
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
} from '../lib/bookingStages.js'
import { ensureBookingTimeline } from './booking.js'

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
  const searchValue = normalizeSearchValue(search).replace(/^#/, '')
  if (!searchValue) return true

  const bookingId = normalizeSearchValue(booking?.id).replace(/^#/, '')
  const compactId = bookingId.replace(/-/g, '')
  const compactSearch = searchValue.replace(/-/g, '')
  if (bookingId && (bookingId.includes(searchValue) || compactId.includes(compactSearch))) {
    return true
  }

  const haystack = [
    booking?.customer?.name,
    booking?.customerName,
    booking?.infoCollection?.fullName,
    booking?.customer?.email,
    booking?.infoCollection?.email,
    booking?.customer?.phone,
    booking?.infoCollection?.phone,
    booking?.package?.title,
    booking?.event?.name,
    booking?.displaySubtitle,
    booking?.detailSubtitle,
    booking?.selectedItemsSummary,
  ]
    .filter(Boolean)
    .join(' ')

  return textMatchesSearch(haystack, searchValue)
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

/** Convert YYYY-MM-DD to UTC midnight Date for Prisma @db.Date filters. */
function dateKeyToUtcMidnight(dateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`)
}

/** IST calendar-day bounds for timestamp fields (createdAt). Asia/Kolkata is UTC+5:30 year-round. */
function getIstDayBounds(dateKey = getIstDateKey()) {
  const nextKey = addDaysToDateKey(dateKey, 1)
  return {
    gte: new Date(`${dateKey}T00:00:00.000+05:30`),
    lt: new Date(`${nextKey}T00:00:00.000+05:30`),
  }
}

/** Start of the rolling 7-day IST window used for unseen Today backlog. */
function getUnseenTodayCreatedSince() {
  return getIstDayBounds(addDaysToDateKey(getIstDateKey(), -6)).gte
}

function isCreatedOnIstDay(booking, dateKey = getIstDateKey()) {
  const createdAt = booking?.createdAt ? new Date(booking.createdAt) : null
  if (!createdAt || Number.isNaN(createdAt.getTime())) return false
  const bounds = getIstDayBounds(dateKey)
  return createdAt >= bounds.gte && createdAt < bounds.lt
}

function isCreatedWithinUnseenTodayWindow(booking) {
  const createdAt = booking?.createdAt ? new Date(booking.createdAt) : null
  if (!createdAt || Number.isNaN(createdAt.getTime())) return false
  return createdAt >= getUnseenTodayCreatedSince()
}

function getCancellationSortTime(booking) {
  const cancelAt = booking?.cancellation?.createdAt
    ? new Date(booking.cancellation.createdAt).getTime()
    : NaN
  if (Number.isFinite(cancelAt)) return cancelAt

  const cancelLog = (Array.isArray(booking?.statusLogs) ? booking.statusLogs : []).find(
    log => String(log?.newStatus ?? '').toLowerCase() === 'cancelled'
  )
  const logAt = cancelLog?.createdAt ? new Date(cancelLog.createdAt).getTime() : NaN
  if (Number.isFinite(logAt)) return logAt

  const updatedAt = booking?.updatedAt ? new Date(booking.updatedAt).getTime() : NaN
  if (Number.isFinite(updatedAt)) return updatedAt

  const createdAt = booking?.createdAt ? new Date(booking.createdAt).getTime() : 0
  return Number.isFinite(createdAt) ? createdAt : 0
}

function sortBookingsByCancellationTimeDesc(bookings = []) {
  return [...bookings].sort((left, right) => getCancellationSortTime(right) - getCancellationSortTime(left))
}

function getDateRange(bucket = 'all') {
  // Use Asia/Kolkata calendar days so eventDate DATE filters match India.
  const todayKey = getIstDateKey()
  const endOfUpcomingKey = addDaysToDateKey(todayKey, 15)

  if (bucket === 'upcoming') {
    // Match Overview "Upcoming Events": next 15 days including today.
    return {
      gte: dateKeyToUtcMidnight(todayKey),
      lte: dateKeyToUtcMidnight(endOfUpcomingKey),
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

  // Prefer customer_profiles name (Google/signup) over up_users — never use email as name.
  const rows = await prisma.$queryRaw`
    SELECT DISTINCT ON (u.id)
      u.id::text AS id,
      u.email,
      u.phone,
      COALESCE(
        NULLIF(TRIM(CONCAT_WS(' ', cp.first_name, cp.last_name)), ''),
        NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), '')
      ) AS full_name,
      COALESCE(NULLIF(TRIM(cp.first_name), ''), NULLIF(TRIM(u.first_name), '')) AS first_name,
      COALESCE(NULLIF(TRIM(cp.last_name), ''), NULLIF(TRIM(u.last_name), '')) AS last_name
    FROM public.up_users u
    LEFT JOIN public.customer_profiles_user_lnk lnk
      ON lnk.user_id = u.id
    LEFT JOIN public.customer_profiles cp
      ON cp.id = lnk.customer_profile_id
    WHERE u.id IN (${Prisma.join(parsedIds)})
    ORDER BY u.id, cp.id DESC NULLS LAST
  `

  return new Map(
    rows.map(row => {
      const firstName = normalizeText(row.first_name)
      const lastName = normalizeText(row.last_name)
      const fullName = normalizeText(row.full_name) || [firstName, lastName].filter(Boolean).join(' ')

      return [
        String(row.id),
        {
          id: String(row.id),
          email: row.email ?? '',
          first_name: firstName || null,
          last_name: lastName || null,
          phone: row.phone ?? null,
          name: fullName || null,
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
      COALESCE(c.banner_shared, false) AS banner_shared,
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
    banner_shared: Boolean(coupon.banner_shared),
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
      COALESCE(c.banner_shared, false) AS banner_shared,
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
  const nextBannerShared =
    payload.banner_shared !== undefined ? Boolean(payload.banner_shared) : Boolean(current.banner_shared)

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
      banner_shared = ${nextBannerShared},
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
      COALESCE(banner_shared, false) AS banner_shared,
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
  if (bucket === 'live' || bucket === 'active') {
    return {
      status: {
        notIn: ['completed', 'cancelled'],
      },
    }
  }

  if (bucket === 'incomplete') {
    return {
      status: {
        notIn: ['completed', 'cancelled'],
      },
    }
  }

  if (bucket === 'cancelled') {
    return {
      status: 'cancelled',
    }
  }

  if (bucket === 'completed') {
    return {
      status: 'completed',
    }
  }

  if (bucket === 'new') {
    return {
      status: 'new',
    }
  }

  if (bucket === 'upcoming') {
    const dateRange = getDateRange('upcoming')
    return {
      eventDate: dateRange,
      status: {
        notIn: ['completed', 'cancelled'],
      },
    }
  }

  // Today's bookings = placed today, or still-unseen within the last 7 IST days.
  // Cancelled bookings leave Today and appear under Cancelled.
  if (bucket === 'today') {
    return {
      status: { notIn: ['cancelled'] },
      OR: [
        { createdAt: getIstDayBounds() },
        {
          adminNewSeenAt: null,
          createdAt: { gte: getUnseenTodayCreatedSince() },
        },
      ],
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

function getSuccessfulPaidAmount(booking) {
  return (Array.isArray(booking?.payments) ? booking.payments : [])
    .filter(payment => String(payment?.status ?? '').toLowerCase() === 'success')
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0)
}

function bookingHasHookahCod(booking) {
  return (Array.isArray(booking?.payments) ? booking.payments : []).some(isCodPayment)
}

function isAdvanceSatisfied(booking) {
  // Hookah COD bookings are allowed with ₹0 online payment.
  if (bookingHasHookahCod(booking)) return true

  const paid = getSuccessfulPaidAmount(booking)
  const advanceAmount = toNumber(booking?.advanceAmount)
  if (advanceAmount <= 0) {
    return paid > 0 || String(booking?.status ?? '').toLowerCase() !== 'new'
  }
  return paid + 1e-9 >= advanceAmount
}

function isTodayUnseen(booking) {
  const status = String(booking?.status ?? '').toLowerCase()
  if (status === 'cancelled' || status === 'completed') return false
  if (booking?.adminNewSeenAt) return false
  if (!isAdvanceSatisfied(booking)) return false
  return isCreatedWithinUnseenTodayWindow(booking)
}

/** Prior-day backlog only — today's placed bookings stay unhighlighted. */
function isTodayBacklogUnseen(booking) {
  return isTodayUnseen(booking) && !isCreatedOnIstDay(booking)
}

function isCancelUnseen(booking) {
  return String(booking?.status ?? '').toLowerCase() === 'cancelled' && !booking?.adminCancelSeenAt
}

function bookingMatchesCancelledList(booking, cancelledBy = '') {
  const status = String(booking?.status ?? '').toLowerCase()
  if (status !== 'cancelled') return false
  const paid = getSuccessfulPaidAmount(booking)
  const advanceAmount = toNumber(booking?.advanceAmount)
  const source = getCancellationSource(booking)
  const normalizedCancelledBy = String(cancelledBy ?? '')
    .trim()
    .toLowerCase()
  if (normalizedCancelledBy === 'client' || normalizedCancelledBy === 'admin') {
    if (source !== normalizedCancelledBy) return false
  }
  if (advanceAmount > 0 && paid + 1e-9 < advanceAmount) {
    return source === 'admin'
  }
  return true
}

function getCancellationSource(booking) {
  const requestedBy = String(booking?.cancellation?.requestedBy ?? '').trim()
  const customerId = String(booking?.userId ?? '').trim()
  if (requestedBy && customerId && requestedBy === customerId) return 'client'

  const cancelNote = String(
    (Array.isArray(booking?.statusLogs) ? booking.statusLogs : []).find(
      log => String(log?.newStatus ?? '').toLowerCase() === 'cancelled'
    )?.note ?? ''
  ).toLowerCase()

  if (cancelNote.includes('cancelled by customer')) return 'client'
  if (requestedBy) return 'admin'
  return 'admin'
}

function isEventWithinNextFifteenDays(booking) {
  if (!booking?.eventDate) return false
  const eventDate = new Date(booking.eventDate)
  if (Number.isNaN(eventDate.getTime())) return false

  const todayKey = getIstDateKey()
  const endOfUpcomingKey = addDaysToDateKey(todayKey, 15)
  const startOfToday = dateKeyToUtcMidnight(todayKey)
  const endOfUpcoming = dateKeyToUtcMidnight(endOfUpcomingKey)

  return eventDate >= startOfToday && eventDate <= endOfUpcoming
}

function bookingMatchesOperationalBucket(booking, bucket = 'all', cancelledBy = '') {
  const status = String(booking?.status ?? '').toLowerCase()
  const paid = getSuccessfulPaidAmount(booking)
  const totalPrice = toNumber(booking?.totalPrice)
  const advanceAmount = toNumber(booking?.advanceAmount)
  const normalizedCancelledBy = String(cancelledBy ?? '')
    .trim()
    .toLowerCase()

  // Today = created today + advance paid, or still-unseen within 7 IST days + advance paid.
  // Cancelled never stay in Today.
  if (bucket === 'today') {
    if (status === 'cancelled' || !isAdvanceSatisfied(booking)) return false
    if (isCreatedOnIstDay(booking)) return true
    return isTodayUnseen(booking)
  }

  if (bucket === 'live' || bucket === 'active') {
    return !['completed', 'cancelled'].includes(status) && isAdvanceSatisfied(booking)
  }

  // Upcoming = next 15 days + advance paid (Hookah COD allowed via isAdvanceSatisfied).
  // Unpaid-advance bookings stay in Incomplete only.
  if (bucket === 'upcoming') {
    return (
      !['completed', 'cancelled'].includes(status) &&
      isAdvanceSatisfied(booking) &&
      isEventWithinNextFifteenDays(booking)
    )
  }

  if (bucket === 'incomplete') {
    return !['completed', 'cancelled'].includes(status) && !isAdvanceSatisfied(booking)
  }

  if (bucket === 'cancelled') {
    if (status !== 'cancelled') return false
    const source = getCancellationSource(booking)
    if (normalizedCancelledBy === 'client' || normalizedCancelledBy === 'admin') {
      if (source !== normalizedCancelledBy) return false
    }
    // Unpaid client cancels stay out of Cancelled; admin cancels always appear here.
    if (advanceAmount > 0 && paid + 1e-9 < advanceAmount) {
      return source === 'admin'
    }
    return true
  }

  if (bucket === 'completed') {
    return status === 'completed' && paid + 1e-9 >= totalPrice
  }

  return true
}

const PAYMENT_AWARE_BUCKETS = new Set([
  'today',
  'live',
  'active',
  'upcoming',
  'incomplete',
  'cancelled',
  'completed',
])

function withCancellationSource(booking) {
  if (String(booking?.status ?? '').toLowerCase() !== 'cancelled') {
    return { ...booking, cancelledBy: null }
  }
  return { ...booking, cancelledBy: getCancellationSource(booking) }
}

function withAdminUnseenFlags(booking, bucket = '') {
  const withSource = withCancellationSource(booking)
  const normalizedBucket = String(bucket ?? '')
    .trim()
    .toLowerCase()
  if (normalizedBucket === 'cancelled') {
    return { ...withSource, unseen: isCancelUnseen(withSource) }
  }
  if (normalizedBucket === 'today') {
    return {
      ...withSource,
      // Highlight only unopened prior-day backlog, not bookings placed today.
      unseen: isTodayBacklogUnseen(withSource),
    }
  }
  return { ...withSource, unseen: false }
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

async function safeStrapiServerGet(path, fallback = null, options = {}) {
  try {
    return await strapiServerGet(path, options)
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

function looksLikeEmail(value) {
  return /@/.test(String(value ?? '').trim())
}

function resolveCustomerDisplayName(booking) {
  const fromProfile = [booking?.customer?.first_name, booking?.customer?.last_name]
    .map(part => String(part ?? '').trim())
    .filter(Boolean)
    .join(' ')
  const candidates = [
    booking?.infoCollection?.fullName,
    fromProfile,
    booking?.customerName,
    booking?.customer?.name,
  ]

  for (const candidate of candidates) {
    const text = String(candidate ?? '').trim()
    if (!text) continue
    if (looksLikeEmail(text)) continue
    if (/^customer$/i.test(text)) continue
    if (/^user\s+\d+$/i.test(text)) continue
    return text
  }

  return 'Customer'
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
  const advancePaidAmount = Number(
    toNumber(booking?.advancePaidAmount ?? booking?.paymentSummary?.advancePaidAmount).toFixed(2)
  )
  const latestManualPaymentLog = bookingPayments
    .flatMap(payment => (Array.isArray(payment?.logs) ? payment.logs : []))
    .filter(log => String(log?.metadata?.source ?? '') === 'admin_manual_payment')
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0]

  // Live balance from successful payments only — do not Math.max with a stale
  // booking.remainingAmount column (Cashfree remaining would still look unpaid).
  const outstandingAmount = Number(Math.max(totalPrice - successfulAmount, 0).toFixed(2))

  return {
    ...booking,
    paidAmount: Number(successfulAmount.toFixed(2)),
    advancePaidAmount,
    totalPrice: Number(totalPrice.toFixed(2)),
    outstandingAmount,
    remainingAmount: outstandingAmount,
    failedPaymentsCount,
    pendingPaymentsCount,
    latestPayment,
    customerName: resolveCustomerDisplayName(booking),
    customerPhone: booking?.customer?.phone || booking?.infoCollection?.phone || '',
    latestManualPaymentNote: latestManualPaymentLog
      ? {
          note: String(
            latestManualPaymentLog?.metadata?.note ||
              latestManualPaymentLog?.metadata?.channelLabel ||
              ''
          ),
          channel: String(latestManualPaymentLog?.metadata?.channel || ''),
          createdAt: latestManualPaymentLog.createdAt,
        }
      : null,
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
  const totalPrice = toNumber(booking?.totalPrice)
  const advancePaidAmount = Number(
    toNumber(booking?.advancePaidAmount ?? booking?.paymentSummary?.advancePaidAmount).toFixed(2)
  )

  return {
    ...booking,
    paidAmount: Number(successfulAmount.toFixed(2)),
    advancePaidAmount,
    totalPrice: Number(totalPrice.toFixed(2)),
    outstandingAmount: 0,
    latestRefund,
    refunds,
    requestedRefundAmount: Number(requestedRefundAmount.toFixed(2)),
    refundDueAmount: Number(
      toNumber(latestRefund?.amount ?? booking?.refundPreview?.refundableAmount ?? 0).toFixed(2)
    ),
    customerName: resolveCustomerDisplayName(booking),
    customerPhone: booking?.customer?.phone || booking?.infoCollection?.phone || '',
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
    response = await strapiServerGet(`/api/vendors?${query.join('&')}`, { skipCache: true })
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
    const todayKey = getIstDateKey()
    const todayCreatedRange = getIstDayBounds(todayKey)
    const startOfToday = dateKeyToUtcMidnight(todayKey)
    const nextFifteenDays = dateKeyToUtcMidnight(addDaysToDateKey(todayKey, 15))

    const [
      totalBookings,
      liveCandidates,
      newBookingsCount,
      completedCandidates,
      todayCandidates,
      todayBacklogCandidates,
      upcomingCandidates,
      pendingSampleCount,
      openTicketsCount,
      unresolvedAlertsCount,
      allPayments,
      pendingPayouts,
      recentBookings,
      upcomingBookings,
      cancelledBookingsRaw,
      alerts,
      vendorsResponse,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.findMany({
        where: {
          status: {
            notIn: ['completed', 'cancelled'],
          },
        },
        select: {
          status: true,
          advanceAmount: true,
          totalPrice: true,
          userId: true,
          payments: {
            select: {
              status: true,
              amount: true,
              provider: true,
              paymentMethod: true,
              providerOrderId: true,
            },
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: 'new',
        },
      }),
      prisma.booking.findMany({
        where: {
          status: 'completed',
        },
        select: {
          status: true,
          advanceAmount: true,
          totalPrice: true,
          payments: {
            select: {
              status: true,
              amount: true,
              provider: true,
              paymentMethod: true,
              providerOrderId: true,
            },
          },
        },
      }),
      prisma.booking.findMany({
        where: {
          createdAt: todayCreatedRange,
          status: { notIn: ['cancelled'] },
        },
        select: {
          status: true,
          createdAt: true,
          adminNewSeenAt: true,
          advanceAmount: true,
          totalPrice: true,
          payments: {
            select: {
              status: true,
              amount: true,
              provider: true,
              paymentMethod: true,
              providerOrderId: true,
            },
          },
        },
      }),
      prisma.booking.findMany({
        where: buildBookingBucketFilter('today'),
        select: {
          status: true,
          createdAt: true,
          adminNewSeenAt: true,
          advanceAmount: true,
          totalPrice: true,
          payments: {
            select: {
              status: true,
              amount: true,
              provider: true,
              paymentMethod: true,
              providerOrderId: true,
            },
          },
        },
      }),
      prisma.booking.findMany({
        where: {
          eventDate: {
            gte: startOfToday,
            lte: nextFifteenDays,
          },
          status: {
            notIn: ['completed', 'cancelled'],
          },
        },
        select: {
          status: true,
          eventDate: true,
          advanceAmount: true,
          totalPrice: true,
          payments: {
            select: {
              status: true,
              amount: true,
              provider: true,
              paymentMethod: true,
              providerOrderId: true,
            },
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
            lte: nextFifteenDays,
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
        take: 40,
      }),
      prisma.booking.findMany({
        where: {
          status: 'cancelled',
        },
        include: {
          items: true,
          notes: true,
          statusLogs: { orderBy: { createdAt: 'desc' }, take: 2 },
          payments: { orderBy: { createdAt: 'desc' } },
          vendorAssignments: true,
          cancellation: true,
        },
        orderBy: { updatedAt: 'desc' },
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
        { data: [], meta: { pagination: { total: 0 } } },
        { skipCache: true }
      ),
    ])

    const activeBookingsCount = liveCandidates.filter(booking =>
      bookingMatchesOperationalBucket(booking, 'live')
    ).length
    const todayBookingsCount = todayCandidates.filter(booking =>
      bookingMatchesOperationalBucket(booking, 'today')
    ).length
    const todayUnseenCount = todayBacklogCandidates
      .filter(booking => bookingMatchesOperationalBucket(booking, 'today'))
      .filter(booking => isTodayBacklogUnseen(booking)).length
    const upcomingEventsCount = upcomingCandidates.filter(booking =>
      bookingMatchesOperationalBucket(booking, 'upcoming')
    ).length
    const completedBookingsCount = completedCandidates.filter(booking =>
      bookingMatchesOperationalBucket(booking, 'completed')
    ).length
    const cancelledBookingsCount = cancelledBookingsRaw.filter(booking =>
      bookingMatchesOperationalBucket(booking, 'cancelled')
    ).length
    const cancelledUnseenCount = cancelledBookingsRaw
      .filter(booking => bookingMatchesOperationalBucket(booking, 'cancelled'))
      .filter(booking => isCancelUnseen(booking)).length

    const paymentSummary = buildPaymentSummaryFromPayments(allPayments)
    const pendingVendorAmount = pendingPayouts.reduce(
      (sum, payout) => sum + toNumber(payout.amount),
      0
    )
    const [recent, upcomingEnriched, cancelledEnriched, allAlertUsers] = await Promise.all([
      enrichBookingsWithCustomer(recentBookings),
      enrichBookingsWithCustomer(upcomingBookings),
      enrichBookingsWithCustomer(cancelledBookingsRaw),
      fetchUsersByIds(alerts.map(alert => alert.resolvedBy).filter(Boolean)),
    ])
    const upcoming = upcomingEnriched
      .filter(booking => bookingMatchesOperationalBucket(booking, 'upcoming'))
      .slice(0, 8)
    const customerCancelledBookings = cancelledEnriched
      .filter(booking => bookingMatchesOperationalBucket(booking, 'cancelled', 'client'))
      .slice(0, 8)
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
        value: `${todayBookingsCount} bookings placed today`,
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
          cancelledBookingsCount,
          todayBookingsCount,
          todayUnseenCount,
          cancelledUnseenCount,
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
        customerCancelledBookings,
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
    const cancelledBy = normalizeText(req.query.cancelledBy).toLowerCase()
    const search = normalizeText(req.query.search)
    const sortBy = normalizeText(req.query.sortBy || 'latest').toLowerCase()
    const page = toPositiveInt(req.query.page, 1)
    const limit = Math.min(toPositiveInt(req.query.limit, 12), 50)
    const skip = (page - 1) * limit
    const needsPaymentAwareFilter = PAYMENT_AWARE_BUCKETS.has(bucket)

    const bookingBucketFilter = buildBookingBucketFilter(bucket)
    const hasStatusFilter = status && BOOKING_STATUSES.includes(status)
    const baseWhere = {
      ...bookingBucketFilter,
      ...(hasStatusFilter ? { status } : {}),
    }

    const orderByClause =
      bucket === 'cancelled'
        ? [{ cancellation: { createdAt: 'desc' } }, { updatedAt: 'desc' }, { createdAt: 'desc' }]
        : bucket === 'all' && sortBy === 'latest'
          ? // Recent activity first so a 10-day-old booking cancelled today still rises.
            [{ updatedAt: 'desc' }, { createdAt: 'desc' }]
        : sortBy === 'latest'
          ? [{ createdAt: 'desc' }]
          : [{ eventDate: 'asc' }, { createdAt: 'desc' }]

    const bookingInclude = {
      items: true,
      notes: true,
      statusLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
      payments: { orderBy: { createdAt: 'desc' } },
      vendorAssignments: true,
      cancellation: true,
    }

    let enrichedBookings = []
    let total = 0
    let unseenCount = 0
    let statusCounts = BOOKING_STATUSES.reduce((acc, key) => {
      acc[key] = 0
      return acc
    }, {})
    let metrics = { total: 0, active: 0, previous: 0 }

    if (search || needsPaymentAwareFilter) {
      const bookings = await prisma.booking.findMany({
        where: search ? bookingBucketFilter : baseWhere,
        include: bookingInclude,
        orderBy: orderByClause,
      })
      const enrichedCandidates = await enrichBookingsWithCustomer(bookings)
      let matchingBookings = enrichedCandidates
        .filter(booking => (search ? bookingMatchesSearch(booking, search) : true))
        .filter(booking =>
          needsPaymentAwareFilter
            ? bookingMatchesOperationalBucket(booking, bucket, cancelledBy)
            : true
        )
      if (bucket === 'cancelled') {
        matchingBookings = sortBookingsByCancellationTimeDesc(matchingBookings)
      }
      const visibleBookings = hasStatusFilter
        ? matchingBookings.filter(booking => booking.status === status)
        : matchingBookings

      total = visibleBookings.length
      if (bucket === 'today') {
        unseenCount = visibleBookings.filter(booking => isTodayBacklogUnseen(booking)).length
      } else if (bucket === 'cancelled') {
        unseenCount = visibleBookings.filter(booking => isCancelUnseen(booking)).length
      } else {
        unseenCount = 0
      }
      enrichedBookings = visibleBookings
        .slice(skip, skip + limit)
        .map(booking => withAdminUnseenFlags(booking, bucket))
      statusCounts = matchingBookings.reduce((acc, booking) => {
        if (booking?.status && BOOKING_STATUSES.includes(booking.status)) {
          acc[booking.status] += 1
        }
        return acc
      }, statusCounts)
      metrics = {
        total,
        active: matchingBookings.filter(booking => getBookingCategory(booking) === 'active').length,
        previous: matchingBookings.filter(booking => getBookingCategory(booking) === 'previous')
          .length,
      }
    } else {
      const [bookings, count, statusCountRows, metricsBookings] = await Promise.all([
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
        prisma.booking.findMany({
          where: baseWhere,
          select: { status: true, eventDate: true },
        }),
      ])

      enrichedBookings = (await enrichBookingsWithCustomer(bookings)).map(booking =>
        withAdminUnseenFlags(booking, bucket)
      )
      total = count
      statusCountRows.forEach(row => {
        if (row?.status && BOOKING_STATUSES.includes(row.status)) {
          statusCounts[row.status] = Number(row._count?._all ?? 0)
        }
      })
      metrics = {
        total,
        active: metricsBookings.filter(booking => getBookingCategory(booking) === 'active').length,
        previous: metricsBookings.filter(booking => getBookingCategory(booking) === 'previous')
          .length,
      }
    }

    res.json({
      bookings: enrichedBookings,
      metrics,
      statusCounts,
      unseenCount,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
    })
  } catch (err) {
    next(err)
  }
}

export async function getAdminBookingUnseenCounts(req, res, next) {
  try {
    const [todayCandidates, cancelledCandidates] = await Promise.all([
      prisma.booking.findMany({
        where: buildBookingBucketFilter('today'),
        include: {
          payments: { orderBy: { createdAt: 'desc' } },
          cancellation: true,
          statusLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      }),
      prisma.booking.findMany({
        where: buildBookingBucketFilter('cancelled'),
        include: {
          payments: { orderBy: { createdAt: 'desc' } },
          cancellation: true,
          statusLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      }),
    ])

    const today = todayCandidates
      .filter(booking => bookingMatchesOperationalBucket(booking, 'today'))
      .filter(booking => isTodayBacklogUnseen(booking)).length

    const cancelled = cancelledCandidates
      .filter(booking => bookingMatchesCancelledList(booking))
      .filter(booking => isCancelUnseen(booking)).length

    res.json({ today, cancelled })
  } catch (err) {
    next(err)
  }
}

export async function ackAdminBookingSeen(req, res, next) {
  try {
    const bookingId = req.params.id
    const kind = normalizeText(req.body?.kind).toLowerCase()
    if (kind !== 'new' && kind !== 'cancelled') {
      return res.status(400).json({ error: 'kind must be "new" or "cancelled"' })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        adminNewSeenAt: true,
        adminCancelSeenAt: true,
      },
    })
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const now = new Date()
    const data =
      kind === 'cancelled'
        ? booking.adminCancelSeenAt
          ? {}
          : { adminCancelSeenAt: now }
        : booking.adminNewSeenAt
          ? {}
          : { adminNewSeenAt: now }

    const updated =
      Object.keys(data).length > 0
        ? await prisma.booking.update({
            where: { id: bookingId },
            data,
            select: {
              id: true,
              status: true,
              adminNewSeenAt: true,
              adminCancelSeenAt: true,
            },
          })
        : booking

    res.json({
      ok: true,
      booking: updated,
      unseen:
        kind === 'cancelled' ? isCancelUnseen(updated) : !updated.adminNewSeenAt,
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
        personalizations: { orderBy: { createdAt: 'desc' } },
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

    res.json({ booking: withCancellationSource(enrichedBooking) })
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
        payments: {
          include: {
            refunds: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        cancellation: true,
      },
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (status === 'cancelled' && booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' })
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

    const cancelReason = note || 'Cancelled by admin'
    const isAdminCancelling = status === 'cancelled'
    const refundEntries = isAdminCancelling
      ? buildCancellationRefundEntries({
          bookingId,
          payments: booking.payments,
          // Admin cancel: refund the full amount the customer has already paid.
          refundableAmount: totalPaid,
          reason: `${cancelReason} — full refund of paid amount`,
        })
      : []

    const updatedBooking = await prisma.$transaction(async tx => {
      const nextBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status },
      })

      const statusLog = await tx.bookingStatusLog.create({
        data: {
          bookingId,
          previousStatus: booking.status,
          newStatus: status,
          changedBy: adminId,
          note: note || null,
        },
      })

      if (isAdminCancelling && !booking.cancellation) {
        await tx.cancellation.create({
          data: {
            bookingId,
            requestedBy: adminId,
            reason: cancelReason,
            policyAcknowledged: true,
            status: 'approved',
          },
        })
      }

      if (isAdminCancelling) {
        await createOperationalAlert(tx, {
          alertType: 'booking_cancelled',
          severity: refundEntries.length > 0 ? 'medium' : 'low',
          message:
            refundEntries.length > 0
              ? `Booking #${String(bookingId).slice(0, 8).toUpperCase()} was cancelled by admin and has ${refundEntries.length} refund request${refundEntries.length === 1 ? '' : 's'} pending.`
              : `Booking #${String(bookingId).slice(0, 8).toUpperCase()} was cancelled by admin.`,
          metadata: {
            bookingId,
            reason: cancelReason,
            refundsCreated: refundEntries.length,
            source: 'admin_cancellation',
          },
          relatedEntityType: 'booking',
          relatedEntityId: bookingId,
        })

        await persistCancellationRefunds(tx, {
          refundEntries,
          performedBy: adminId,
          source: 'admin_cancellation',
          refundWindow: null,
          bookingId,
        })
      }

      await ensureBookingTimeline(tx, {
        ...nextBooking,
        statusLogs: [statusLog],
      })

      return nextBooking
    })

    // Dedicated lifecycle emails for confirmed / info-collection / pre-event (final payment).
    if (status !== 'confirmed' && status !== 'info_collection' && status !== 'pre_event') {
      notify(booking.userId, {
        type: 'booking_update',
        title: isAdminCancelling
          ? 'Booking Cancelled'
          : `Booking updated to ${BOOKING_STATUS_LABELS[status] ?? status.replaceAll('_', ' ')}`,
        message: isAdminCancelling
          ? refundEntries.length > 0
            ? 'Your booking was cancelled by Elewen and the refund request is ready for processing.'
            : note || 'Your booking was cancelled by Elewen.'
          : note ||
            `Your booking status is now ${BOOKING_STATUS_LABELS[status] ?? status.replaceAll('_', ' ')}.`,
        linkUrl: `/dashboard/bookings/${bookingId}`,
        ...(isAdminCancelling
          ? {
              emailTemplate: 'booking_cancelled',
              emailData: { bookingId, reason: cancelReason },
            }
          : {}),
      }).catch(() => {})
    }

    if (isAdminCancelling && refundEntries.length > 0) {
      const totalRefund = refundEntries.reduce(
        (sum, entry) => sum + roundRefundCurrency(entry.amount),
        0
      )
      notifyRefund(booking.userId, {
        kind: 'requested',
        bookingId,
        amount: totalRefund,
        reason: cancelReason,
      }).catch(() => {})
    }

    if (isAdminCancelling) {
      invalidateDashboardCache(booking.userId).catch(() => {})
    }

    if (status === 'confirmed' && booking.status !== 'confirmed') {
      sendBookingConfirmedEmail(bookingId)
        .then(result => {
          if (!result?.sent) {
            console.warn('[booking-email] confirmed email not sent:', bookingId, result)
          }
        })
        .catch(err => console.error('[booking-email] confirmed failed', bookingId, err?.message))

      // Send info-collection form link on confirm so the customer can fill without
      // admin moving the booking into the Information Collection stage.
      sendInfoCollectionEmail(bookingId)
        .then(result => {
          if (!result?.sent) {
            console.warn('[booking-email] info-collection email not sent:', bookingId, result)
          }
        })
        .catch(err =>
          console.error('[booking-email] info-collection failed', bookingId, err?.message)
        )
    }

    if (status === 'info_collection' && booking.status !== 'info_collection') {
      sendInfoCollectionEmail(bookingId)
        .then(result => {
          if (!result?.sent) {
            console.warn('[booking-email] info-collection email not sent:', bookingId, result)
          }
        })
        .catch(err =>
          console.error('[booking-email] info-collection failed', bookingId, err?.message)
        )
    }

    if (status === 'pre_event' && booking.status !== 'pre_event') {
      sendFinalPaymentEmail(bookingId)
        .then(result => {
          if (!result?.sent) {
            console.warn('[booking-email] final-payment email not sent:', bookingId, result)
          }
        })
        .catch(err =>
          console.error('[booking-email] final-payment failed', bookingId, err?.message)
        )
    }

    if (
      (status === 'post_event' || status === 'completed') &&
      booking.status !== status
    ) {
      sendPostEventFeedbackEmail(bookingId)
        .then(result => {
          if (!result?.sent && result?.reason !== 'already_sent') {
            console.warn('[booking-email] post-event email not sent:', bookingId, result)
          }
        })
        .catch(err => console.error('[booking-email] post-event failed', bookingId, err?.message))
    }

    res.json({
      booking: updatedBooking,
      refundsCreated: refundEntries.length,
    })
  } catch (err) {
    next(err)
  }
}

const MAX_EMAIL_HTML_CHARS = 200_000
const MAX_PLAIN_COPY_CHARS = 5_000
const MAX_DESIGN_UPLOAD_BYTES = 8 * 1024 * 1024
const MAX_PERSONALIZATION_IMAGES = 12
const MAX_PERSONALIZATION_ATTACHMENTS = 10
const PERSONALIZATION_COPY_FIELDS = [
  'headline',
  'introText',
  'customMessage',
  'chooseHeading',
  'chooseSubtext',
  'replyPrompt',
  'ctaLabel',
  'textSectionHeading',
  'textSectionBody',
  'textExamples',
  'anythingElseHeading',
  'anythingElseBody',
  'deadlineText',
  'noReplyText',
  'signOff',
]

const ALLOWED_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'text/plain',
])

function normalizePersonalizationImages(body = {}) {
  const fromArray = Array.isArray(body.designImages)
    ? body.designImages.map(value => normalizeText(value)).filter(Boolean)
    : []
  if (fromArray.length) return [...new Set(fromArray)].slice(0, MAX_PERSONALIZATION_IMAGES)

  return [body.designImage1, body.designImage2, body.designImage3]
    .map(value => normalizeText(value))
    .filter(Boolean)
    .slice(0, MAX_PERSONALIZATION_IMAGES)
}

function normalizePersonalizationAttachments(body = {}) {
  if (!Array.isArray(body.attachments)) return []
  return body.attachments
    .map(item => ({
      name: normalizeText(item?.name) || 'Attachment',
      url: normalizeText(item?.url),
      type: normalizeText(item?.type),
    }))
    .filter(item => item.url)
    .slice(0, MAX_PERSONALIZATION_ATTACHMENTS)
}

function readPersonalizationPayload(body = {}) {
  const readPlain = (value, max = MAX_PLAIN_COPY_CHARS) => {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    if (!trimmed) return null
    return trimmed.slice(0, max)
  }

  const copy = {}
  for (const key of PERSONALIZATION_COPY_FIELDS) {
    copy[key] = readPlain(
      body[key],
      key === 'headline' || key === 'ctaLabel' ? 200 : MAX_PLAIN_COPY_CHARS
    )
  }

  const designImages = normalizePersonalizationImages(body)

  return {
    serviceName: normalizeText(body.serviceName) || 'decor',
    designImages,
    designImage1: designImages[0] || '',
    designImage2: designImages[1] || '',
    designImage3: designImages[2] || '',
    attachments: normalizePersonalizationAttachments(body),
    responseDeadline: normalizeText(body.responseDeadline),
    subject: readPlain(body.subject, 200),
    ...copy,
    html: typeof body.html === 'string' && body.html.trim() ? body.html.trim() : null,
    channel: normalizeText(body.channel)?.toLowerCase() === 'mailto' ? 'mailto' : 'smtp',
    force: Boolean(body.force),
  }
}

function parseBase64Upload(file) {
  if (!file || typeof file !== 'object') return null

  const name = normalizeText(file.name) || 'upload.bin'
  const type = normalizeText(file.type) || 'application/octet-stream'
  const dataUrl = normalizeText(file.dataUrl)
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/)
  if (!matches) return null

  const [, mimeType, base64Payload] = matches
  const buffer = Buffer.from(base64Payload, 'base64')
  if (!buffer.length) return null

  return {
    name,
    type: mimeType || type,
    size: Number(file.size) || buffer.length,
    buffer,
  }
}

export async function uploadAdminDesignImage(req, res, next) {
  try {
    const parsed = parseBase64Upload(req.body?.file)
    if (!parsed) {
      return res.status(400).json({ error: 'Upload a valid file.' })
    }

    const mime = String(parsed.type || '').toLowerCase()
    const isImage = mime.startsWith('image/')
    const isAllowedAttachment = ALLOWED_ATTACHMENT_TYPES.has(mime)
    if (!isImage && !isAllowedAttachment) {
      return res.status(400).json({
        error: 'Allowed: images, PDF, Word, Excel, ZIP, or plain text.',
      })
    }

    if (parsed.size > MAX_DESIGN_UPLOAD_BYTES) {
      return res.status(400).json({ error: 'File must be 8MB or smaller.' })
    }

    const formData = new FormData()
    const blob = new Blob([parsed.buffer], { type: parsed.type })
    formData.append('files', blob, parsed.name)

    let uploaded
    try {
      uploaded = await strapiServerUpload('/api/upload', formData)
    } catch (err) {
      if (!shouldFallbackToPublicStrapi(err)) throw err
      uploaded = await strapiUpload('/api/upload', formData)
    }

    const media = Array.isArray(uploaded) ? uploaded[0] : uploaded
    const url = getMediaUrl(media)
    if (!url) {
      return res.status(502).json({ error: 'File uploaded but no public URL was returned.' })
    }

    res.json({
      ok: true,
      url,
      id: media?.id ?? null,
      name: media?.name ?? parsed.name,
      type: parsed.type,
      kind: isImage ? 'image' : 'attachment',
    })
  } catch (err) {
    next(err)
  }
}

export async function previewAdminBookingPersonalizationEmail(req, res, next) {
  try {
    const bookingId = req.params.id
    const payload = readPersonalizationPayload(req.body)

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true },
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot preview personalization email for a cancelled booking.' })
    }

    if (!payload.designImages.length && !payload.attachments.length) {
      return res.status(400).json({
        error: 'Add at least one design image or attachment before previewing the personalization email.',
      })
    }

    const result = await previewBookingPersonalizationEmail(bookingId, payload)

    if (!result?.ok) {
      return res.status(400).json({
        error: result?.message || 'Could not preview personalization email.',
        reason: result?.reason,
      })
    }

    res.json({
      ok: true,
      to: result.to,
      subject: result.subject,
      html: result.html,
      serviceName: result.serviceName,
      designImages: result.designImages,
      attachments: result.attachments,
      headline: result.headline,
      introText: result.introText,
      customMessage: result.customMessage,
      chooseHeading: result.chooseHeading,
      chooseSubtext: result.chooseSubtext,
      replyPrompt: result.replyPrompt,
      ctaLabel: result.ctaLabel,
      textSectionHeading: result.textSectionHeading,
      textSectionBody: result.textSectionBody,
      textExamples: result.textExamples,
      anythingElseHeading: result.anythingElseHeading,
      anythingElseBody: result.anythingElseBody,
      deadlineText: result.deadlineText,
      noReplyText: result.noReplyText,
      signOff: result.signOff,
      defaults: result.defaults,
    })
  } catch (err) {
    next(err)
  }
}

export async function sendAdminBookingPersonalizationEmail(req, res, next) {
  try {
    const bookingId = req.params.id
    const payload = readPersonalizationPayload(req.body)

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true },
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot send personalization email for a cancelled booking.' })
    }

    if (!payload.designImages.length && !payload.attachments.length) {
      return res.status(400).json({
        error: 'Add at least one design image or attachment before sending the personalization email.',
      })
    }

    if (payload.html && payload.html.length > MAX_EMAIL_HTML_CHARS) {
      return res.status(400).json({
        error: `Email HTML is too long (max ${MAX_EMAIL_HTML_CHARS.toLocaleString()} characters).`,
      })
    }

    const result = await sendBookingPersonalizationEmail(bookingId, payload)

    if (!result?.sent) {
      return res.status(400).json({
        error: result?.message || 'Could not send personalization email.',
        reason: result?.reason,
      })
    }

    res.json({
      ok: true,
      personalizationId: result.personalizationId,
      subject: result.subject,
      channel: result.channel || 'smtp',
    })
  } catch (err) {
    next(err)
  }
}

const MANUAL_PAYMENT_CHANNELS = {
  card: { paymentMethod: 'card', provider: 'manual', label: 'Card' },
  upi: { paymentMethod: 'upi', provider: 'manual', label: 'UPI' },
  netbanking: { paymentMethod: 'netbanking', provider: 'manual', label: 'Netbanking' },
  cashfree: { paymentMethod: 'upi', provider: 'cashfree', label: 'Cashfree' },
  cash: { paymentMethod: 'offline', provider: 'manual', label: 'Cash' },
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

/**
 * Record remaining/final payment collected offline (UPI, cash, Cashfree, etc.).
 * Does not change booking stage — admin-only note stays internal.
 */
export async function recordAdminManualPayment(req, res, next) {
  try {
    const bookingId = req.params.id
    const adminId = String(req.user.id)
    const channel = normalizeText(req.body.channel || req.body.method).toLowerCase()
    const note = normalizeText(req.body.note)
    const action = normalizeText(req.body.action || 'final_payment_received').toLowerCase()

    if (action !== 'final_payment_received') {
      return res.status(400).json({ error: 'Unsupported payment action.' })
    }

    const channelConfig = MANUAL_PAYMENT_CHANNELS[channel]
    if (!channelConfig) {
      return res.status(400).json({
        error: `channel must be one of: ${Object.keys(MANUAL_PAYMENT_CHANNELS).join(', ')}`,
      })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true },
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot record payment on a cancelled booking.' })
    }

    const totalPaid = (booking.payments ?? [])
      .filter(payment => payment.status === 'success')
      .reduce((sum, payment) => sum + toNumber(payment.amount), 0)
    const outstandingAmount = Number(
      Math.max(toNumber(booking.totalPrice) - totalPaid, 0).toFixed(2)
    )

    if (outstandingAmount <= 0) {
      return res.status(400).json({ error: 'No remaining amount to collect for this booking.' })
    }

    const paymentType = totalPaid <= 0 ? 'full' : 'remaining'
    const internalNoteText = [
      `Final payment received via ${channelConfig.label}`,
      note || null,
    ]
      .filter(Boolean)
      .join(' — ')

    const createdPayment = await prisma.$transaction(async tx => {
      const payment = await tx.payment.create({
        data: {
          bookingId,
          paymentType,
          amount: outstandingAmount.toFixed(2),
          status: 'success',
          provider: channelConfig.provider,
          paymentMethod: channelConfig.paymentMethod,
        },
      })

      await tx.paymentLog.create({
        data: {
          paymentId: payment.id,
          action: 'manual_remaining_recorded',
          performedBy: adminId,
          metadata: {
            source: 'admin_manual_payment',
            channel,
            channelLabel: channelConfig.label,
            note: note || null,
            amount: outstandingAmount,
            bookingStatusUnchanged: true,
          },
        },
      })

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          remainingAmount: '0.00',
        },
      })

      // Internal-only — never shown on customer booking stage timeline.
      await tx.bookingNote.create({
        data: {
          bookingId,
          adminId,
          note: internalNoteText,
          isInternal: true,
        },
      })

      return payment
    })

    notify(booking.userId, {
      type: 'payment_update',
      title: 'Payment received',
      message: 'Your remaining payment has been recorded. Thank you!',
      linkUrl: `/dashboard/bookings/${bookingId}`,
    }).catch(() => {})

    await cacheDelPattern(`dashboard:summary:${booking.userId}`)
    invalidateDashboardCache(booking.userId).catch(() => {})

    res.status(201).json({
      payment: createdPayment,
      outstandingAmount: 0,
      recordedAmount: outstandingAmount,
      bookingStatus: booking.status,
    })
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

      await cacheDelPattern('strapi:GET:/api/vendors*')

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

      await cacheDelPattern('strapi:GET:/api/vendors*')
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
        booking: {
          include: {
            items: true,
            notes: true,
            statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
            vendorAssignments: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { readStatus: true, attachments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enrichedBookings = await enrichBookingsWithCustomer(
      threads.map(thread => thread.booking).filter(Boolean)
    )
    const bookingMap = new Map(
      enrichedBookings.map(booking => [String(booking.id), booking])
    )

    const visibleThreads = threads.filter(thread => {
      if (!search) return true
      const booking = bookingMap.get(String(thread.bookingId))
      const haystack = [
        thread.bookingId,
        booking?.customer?.name,
        booking?.infoCollection?.fullName,
        booking?.customer?.email,
        booking?.package?.title,
        booking?.event?.name,
        booking?.displaySubtitle,
        booking?.detailSubtitle,
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
        bookingSummary: bookingMap.get(String(thread.bookingId)) ?? null,
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
    const customerTab = normalizeText(req.query.customerTab || 'today').toLowerCase()
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
        take: 500,
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
        take: 200,
      }),
      prisma.vendorPayout.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
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
          payments: {
            include: {
              logs: { orderBy: { createdAt: 'desc' }, take: 5 },
            },
            orderBy: { createdAt: 'desc' },
          },
          vendorAssignments: true,
        },
        orderBy: [{ createdAt: 'desc' }, { eventDate: 'asc' }],
        take: 100,
      }),
      prisma.booking.findMany({
        where: {
          status: 'post_event',
        },
        include: {
          items: true,
          notes: true,
          statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
          payments: {
            include: {
              logs: { orderBy: { createdAt: 'desc' }, take: 5 },
            },
            orderBy: { createdAt: 'desc' },
          },
          vendorAssignments: true,
        },
        orderBy: [{ createdAt: 'desc' }, { eventDate: 'asc' }],
        take: 100,
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
        orderBy: [{ cancellation: { createdAt: 'desc' } }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
        take: 100,
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

    const todayBounds = getIstDayBounds()
    const isCreatedToday = value => {
      const time = new Date(value).getTime()
      if (Number.isNaN(time)) return false
      return time >= todayBounds.gte.getTime() && time < todayBounds.lt.getTime()
    }

    const activeBookingPayments = enrichedActiveBookings
      .map(buildBookingPaymentSnapshot)
      .filter(booking => isActiveBookingStatus(booking.status))
    const postEventPending = enrichedPostEventBookings
      .map(buildBookingPaymentSnapshot)
      .filter(booking => booking.outstandingAmount > 0)
    const cancelledRefunds = sortBookingsByCancellationTimeDesc(enrichedCancelledBookings).map(
      buildCancelledBookingRefundSnapshot
    )
    const withPaymentBookingSummary = payment => {
      const booking = bookingMap.get(String(payment.bookingId))
      return {
        ...payment,
        bookingSummary: booking ? buildBookingPaymentSnapshot(booking) : null,
      }
    }
    const failedPayments = payments
      .filter(payment => payment.status === 'failed')
      .map(withPaymentBookingSummary)
    const completedPayments = payments
      .filter(payment => ['success', 'refunded'].includes(payment.status))
      .map(withPaymentBookingSummary)
    // All customer payment attempts created today (IST) — success, pending, failed, refunded.
    const todayPayments = payments.filter(payment => isCreatedToday(payment.createdAt)).map(withPaymentBookingSummary)
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
      today: todayPayments,
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
      customerLists[customerTab] ?? customerLists.today,
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
          todayPaymentsCount: todayPayments.length,
          advancePaymentPercentage: Number(
            settingsResponse?.data?.advance_payment_percentage ?? 30
          ),
        },
        customerPayments: {
          todayPayments: customerTab === 'today' ? currentCustomer.items : [],
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
          banner_shared: Boolean(coupon.banner_shared),
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
    if (req.body.is_active !== undefined) {
      payload.is_active = Boolean(req.body.is_active)
      // Hide from homepage carousel when the coupon itself is turned off
      if (!payload.is_active) payload.banner_shared = false
    }
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
    if (req.body.banner_shared !== undefined) payload.banner_shared = Boolean(req.body.banner_shared)

    if (payload.banner_shared === true) {
      const willBeActive =
        payload.is_active !== undefined ? Boolean(payload.is_active) : Boolean(coupon.is_active)
      if (!willBeActive) {
        return res
          .status(400)
          .json({ error: 'Enable the coupon before sharing it on the homepage banner.' })
      }
    }

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
        // Ensure homepage banner flag is on the shared Postgres row even if Strapi
        // schema has not been restarted yet after adding banner_shared.
        if (payload.banner_shared !== undefined) {
          await updateCouponInDatabase(req.params.id, {
            banner_shared: payload.banner_shared,
          }).catch(() => null)
        }
        await cacheDelPattern('strapi:GET:/api/coupons*')
        return res.json({
          coupon: updated?.data
            ? { ...mapCouponRecord(updated.data), banner_shared: payload.banner_shared ?? Boolean(updated.data.banner_shared) }
            : null,
        })
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

const CONSULTATION_LEAD_STATUSES = ['new', 'contacted', 'converted', 'closed']

function mapConsultationLead(raw) {
  if (!raw) return null
  const row = raw.attributes ?? raw
  const custom =
    row.custom_fields && typeof row.custom_fields === 'object' && !Array.isArray(row.custom_fields)
      ? row.custom_fields
      : {}

  return {
    id: String(raw.id ?? row.id ?? ''),
    documentId: raw.documentId ?? row.documentId ?? row.document_id ?? null,
    lead_type: row.lead_type ?? 'consultation',
    full_name: row.full_name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    event_type: row.event_type ?? '',
    event_date: row.event_date ?? null,
    city: row.city ?? '',
    budget_range: row.budget_range ?? '',
    vision_notes: row.vision_notes ?? '',
    interested_package_id: row.interested_package_id ?? custom.interested_package_id ?? null,
    interested_package_title:
      row.interested_package_title ?? custom.interested_package_title ?? '',
    interested_package_slug: row.interested_package_slug ?? custom.interested_package_slug ?? '',
    interest_source: row.interest_source ?? custom.interest_source ?? '',
    planner_lead_status: row.planner_lead_status ?? 'new',
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  }
}

async function fetchConsultationsFromDatabase({
  search = '',
  status = '',
  page = 1,
  limit = 20,
} = {}) {
  const offset = Math.max(page - 1, 0) * limit
  const trimmedSearch = normalizeText(search)
  const searchPattern = `%${trimmedSearch}%`
  const statusFilter = CONSULTATION_LEAD_STATUSES.includes(status) ? status : ''

  const rows = await prisma.$queryRaw`
    SELECT
      pl.id,
      pl.document_id,
      pl.lead_type,
      pl.full_name,
      pl.email,
      pl.phone,
      pl.event_type,
      pl.event_date,
      pl.city,
      pl.budget_range,
      pl.vision_notes,
      pl.custom_fields,
      pl.planner_lead_status,
      pl.created_at,
      pl.updated_at
    FROM public.planner_leads pl
    WHERE pl.lead_type = 'consultation'
      AND (
        ${statusFilter} = ''
        OR COALESCE(pl.planner_lead_status, 'new') = ${statusFilter}
      )
      AND (
        ${trimmedSearch} = ''
        OR COALESCE(pl.full_name, '') ILIKE ${searchPattern}
        OR COALESCE(pl.email, '') ILIKE ${searchPattern}
        OR COALESCE(pl.phone, '') ILIKE ${searchPattern}
        OR COALESCE(pl.custom_fields::text, '') ILIKE ${searchPattern}
      )
    ORDER BY pl.created_at DESC NULLS LAST, pl.id DESC
    OFFSET ${offset}
    LIMIT ${limit}
  `

  const [countRow] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS total
    FROM public.planner_leads pl
    WHERE pl.lead_type = 'consultation'
      AND (
        ${statusFilter} = ''
        OR COALESCE(pl.planner_lead_status, 'new') = ${statusFilter}
      )
      AND (
        ${trimmedSearch} = ''
        OR COALESCE(pl.full_name, '') ILIKE ${searchPattern}
        OR COALESCE(pl.email, '') ILIKE ${searchPattern}
        OR COALESCE(pl.phone, '') ILIKE ${searchPattern}
        OR COALESCE(pl.custom_fields::text, '') ILIKE ${searchPattern}
      )
  `

  const total = Number(countRow?.total ?? 0)
  return {
    consultations: (rows ?? []).map(mapConsultationLead),
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    total,
  }
}

export async function listAdminConsultations(req, res, next) {
  try {
    const search = normalizeText(req.query.search)
    const status = normalizeText(req.query.status).toLowerCase()
    const page = toPositiveInt(req.query.page, 1)
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 50)

    const query = [
      'publicationState=preview',
      `pagination[page]=${page}`,
      `pagination[pageSize]=${limit}`,
      'sort[0]=createdAt:desc',
      'filters[lead_type][$eq]=consultation',
    ]

    if (status && CONSULTATION_LEAD_STATUSES.includes(status)) {
      query.push(`filters[planner_lead_status][$eq]=${encodeURIComponent(status)}`)
    }

    if (search) {
      const encoded = encodeURIComponent(search)
      query.push(`filters[$or][0][full_name][$containsi]=${encoded}`)
      query.push(`filters[$or][1][email][$containsi]=${encoded}`)
      query.push(`filters[$or][2][phone][$containsi]=${encoded}`)
      query.push(`filters[$or][3][interested_package_title][$containsi]=${encoded}`)
    }

    try {
      const response = await strapiServerGet(`/api/planner-leads?${query.join('&')}`)
      return res.json({
        consultations: (response?.data ?? []).map(mapConsultationLead),
        page: response?.meta?.pagination?.page ?? page,
        pages: response?.meta?.pagination?.pageCount ?? 1,
        total: response?.meta?.pagination?.total ?? 0,
      })
    } catch {
      const result = await fetchConsultationsFromDatabase({ search, status, page, limit })
      return res.json(result)
    }
  } catch (err) {
    next(err)
  }
}

export async function updateAdminConsultation(req, res, next) {
  try {
    const id = String(req.params.id ?? '').trim()
    if (!id) return res.status(400).json({ error: 'Consultation id is required' })

    const status = normalizeText(req.body.planner_lead_status ?? req.body.status).toLowerCase()
    if (!CONSULTATION_LEAD_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `planner_lead_status must be one of: ${CONSULTATION_LEAD_STATUSES.join(', ')}`,
      })
    }

    const isNumericId = /^\d+$/.test(id)
    const numericId = isNumericId ? Number.parseInt(id, 10) : null
    let documentId = id

    try {
      if (isNumericId) {
        const found = await strapiServerGet(
          `/api/planner-leads?filters[id][$eq]=${encodeURIComponent(id)}&publicationState=preview&pagination[pageSize]=1`
        )
        documentId = found?.data?.[0]?.documentId ?? documentId
      }

      const updated = await strapiServerPut(`/api/planner-leads/${documentId}`, {
        data: { planner_lead_status: status },
      })
      return res.json({ consultation: mapConsultationLead(updated?.data ?? updated) })
    } catch {
      // Prefer document_id match so updates still work when the client sends a
      // Strapi documentId and Strapi PUT is unavailable (token/draft/network).
      const sentinelId = numericId ?? -1
      const [updated] = await prisma.$queryRaw`
        UPDATE public.planner_leads
        SET planner_lead_status = ${status}, updated_at = NOW()
        WHERE lead_type = 'consultation'
          AND (
            document_id = ${id}
            OR id = ${sentinelId}
          )
        RETURNING
          id,
          document_id,
          lead_type,
          full_name,
          email,
          phone,
          event_type,
          event_date,
          city,
          budget_range,
          vision_notes,
          custom_fields,
          planner_lead_status,
          created_at,
          updated_at
      `

      if (!updated) return res.status(404).json({ error: 'Consultation not found' })
      return res.json({ consultation: mapConsultationLead(updated) })
    }
  } catch (err) {
    next(err)
  }
}

