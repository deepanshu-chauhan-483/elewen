import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma.js'
import { notify } from '../lib/notify.js'
import {
  enrichBookings,
  enrichSampleTastes,
  getBookingCategory,
  mapVendorPreview,
  toNumber,
} from '../lib/dashboardData.js'
import { strapiServerGet, strapiServerPost, strapiServerPut } from '../lib/strapi.js'

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

const SAMPLE_STATUSES = ['new', 'assigned', 'delivered', 'completed']
const ALERT_STATUSES = ['new', 'acknowledged', 'resolved', 'snoozed']
const ALERT_SEVERITIES = ['low', 'medium', 'high', 'critical']
const SUPPORT_STATUSES = ['open', 'in_progress', 'resolved', 'closed']
const SUPPORT_PRIORITIES = ['low', 'medium', 'high']

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeText(value) {
  return String(value ?? '').trim()
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

  try {
    const query = [
      `filters[title][$containsi]=${encodeURIComponent(term)}`,
      'publicationState=preview',
      'pagination[page]=1',
      'pagination[pageSize]=50',
    ].join('&')
    const response = await strapiServerGet(`/api/packages?${query}`)
    return (response?.data ?? []).map(pkg => String(pkg.id))
  } catch {
    return []
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
    coupons: coupons.map(coupon => ({
      id: String(coupon.id),
      documentId: coupon.document_id ?? null,
      code: coupon.code ?? '',
      discount_type: coupon.discount_type ?? 'percentage',
      discount_value: Number(coupon.discount_value ?? 0),
      max_uses: coupon.max_uses ?? null,
      used_count: coupon.used_count ?? 0,
      valid_from: coupon.valid_from ?? null,
      valid_to: coupon.valid_to ?? null,
      is_active: Boolean(coupon.is_active),
    })),
    total: Number(countRow?.total ?? 0),
    page,
    pages: Math.max(1, Math.ceil(Number(countRow?.total ?? 0) / limit)),
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

  return {
    id: String(settings.id),
    documentId: settings.document_id ?? null,
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
    registrationData: vendor.registration_data ?? null,
    documentsCount: 0,
    portfolioCount: 0,
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

async function fetchCouponById(id) {
  const response = await strapiServerGet(
    `/api/coupons?filters[id][$eq]=${encodeURIComponent(String(id))}&publicationState=preview&pagination[pageSize]=1`
  )
  return response?.data?.[0] ?? null
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
        registrationData: vendor.registration_data ?? null,
        documentsCount: Array.isArray(vendor.vendor_documents) ? vendor.vendor_documents.length : 0,
        portfolioCount: Array.isArray(vendor.vendor_portfolios)
          ? vendor.vendor_portfolios.length
          : 0,
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
    const page = toPositiveInt(req.query.page, 1)
    const limit = Math.min(toPositiveInt(req.query.limit, 12), 50)
    const skip = (page - 1) * limit

    const userIds = await searchUserIds(search)
    const packageIds = await searchPackageIds(search)
    const bookingBucketFilter = buildBookingBucketFilter(bucket)
    const where = {
      ...bookingBucketFilter,
      ...(status && BOOKING_STATUSES.includes(status) ? { status } : {}),
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        ...(userIds.length ? [{ userId: { in: userIds } }] : []),
        ...(packageIds.length ? [{ packageId: { in: packageIds } }] : []),
      ]
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          items: true,
          notes: true,
          statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
          payments: { orderBy: { createdAt: 'desc' } },
          vendorAssignments: true,
          cancellation: true,
        },
        orderBy: [{ eventDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ])

    const enrichedBookings = await enrichBookingsWithCustomer(bookings)
    const metrics = {
      total,
      active: enrichedBookings.filter(booking => getBookingCategory(booking) === 'active').length,
      previous: enrichedBookings.filter(booking => getBookingCategory(booking) === 'previous')
        .length,
    }

    res.json({
      bookings: enrichedBookings,
      metrics,
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

    if (status === 'execution') {
      const totalPaid = booking.payments
        .filter(payment => payment.status === 'success')
        .reduce((sum, payment) => sum + toNumber(payment.amount), 0)

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

    const userIds = await searchUserIds(search)
    const packageIds = await searchPackageIds(search)
    const where = {}

    if (status && SAMPLE_STATUSES.includes(status)) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        ...(userIds.length ? [{ userId: { in: userIds } }] : []),
        ...(packageIds.length ? [{ packageId: { in: packageIds } }] : []),
      ]
    }

    const [samples, total] = await Promise.all([
      prisma.sampleTasteBooking.findMany({
        where,
        include: {
          vendors: true,
        },
        orderBy: [{ bookingDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.sampleTasteBooking.count({ where }),
    ])

    const enrichedSamples = await enrichSamplesWithCustomer(samples)

    res.json({
      samples: enrichedSamples,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
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
    const result = await fetchVendorDirectory({
      page: 1,
      limit: 100,
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

    res.json({
      workspace: {
        summary: {
          total: result.vendors.length,
          pendingRequests: pendingRequests.length,
          assignedVendors: assignedVendors.length,
          unassignedVendors: unassignedVendors.length,
          availableNow: result.vendors.filter(vendor => vendor.isAvailable).length,
        },
        pendingRequests,
        assignedVendors,
        unassignedVendors,
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
    const [
      payments,
      refunds,
      payouts,
      activeBookings,
      postEventBookings,
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
      safeStrapiServerGet('/api/global-setting?publicationState=preview', { data: null }),
      safeStrapiServerGet(
        '/api/coupons?publicationState=preview&pagination[page]=1&pagination[pageSize]=10&sort[0]=createdAt:desc',
        { data: [] }
      ),
    ])

    const [enrichedActiveBookings, enrichedPostEventBookings, vendors] = await Promise.all([
      enrichBookingsWithCustomer(activeBookings),
      enrichBookingsWithCustomer(postEventBookings),
      fetchVendorsByIds(payouts.map(payout => payout.vendorId)),
    ])

    const allBookingIds = uniqueStrings([
      ...payments.map(payment => payment.bookingId),
      ...payouts.map(payout => payout.bookingId),
      ...enrichedActiveBookings.map(booking => booking.id),
      ...enrichedPostEventBookings.map(booking => booking.id),
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
          activeBookings: activeBookingPayments,
          postEventPending,
          failedPayments,
          completedPayments,
        },
        vendorPayments: {
          pending: pendingVendorPayments,
          paid: paidVendorPayments,
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
    const bookingIds = search
      ? (
          await prisma.booking.findMany({
            where: {
              OR: [
                { id: { contains: search, mode: 'insensitive' } },
                ...(userIds.length ? [{ userId: { in: userIds } }] : []),
              ],
            },
            select: { id: true },
          })
        ).map(booking => booking.id)
      : []

    const where = {
      ...(status ? { status } : {}),
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
    const where = status ? { status } : {}

    const payouts = await prisma.vendorPayout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

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

      return res.json({
        coupons: (response?.data ?? []).map(coupon => ({
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
        total: response?.meta?.pagination?.total ?? 0,
        page: response?.meta?.pagination?.page ?? page,
        pages: response?.meta?.pagination?.pageCount ?? 1,
      })
    } catch {
      const result = await fetchCouponsFromDatabase({ search, page, limit })
      return res.json(result)
    }
  } catch (err) {
    next(err)
  }
}

export async function createAdminCoupon(req, res, next) {
  try {
    const code = normalizeText(req.body.code).toUpperCase()
    const discountType = normalizeText(req.body.discount_type || 'percentage').toLowerCase()
    const discountValue = Number(req.body.discount_value)

    if (!code || !Number.isFinite(discountValue)) {
      return res.status(400).json({ error: 'code and discount_value are required' })
    }

    const created = await strapiServerPost('/api/coupons', {
      data: {
        code,
        discount_type: discountType,
        discount_value: discountValue,
        max_uses: req.body.max_uses ?? null,
        valid_from: req.body.valid_from ?? null,
        valid_to: req.body.valid_to ?? null,
        is_active: req.body.is_active !== false,
      },
    })

    res.status(201).json({ coupon: created?.data ?? null })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminCoupon(req, res, next) {
  try {
    const coupon = await fetchCouponById(req.params.id)
    if (!coupon?.documentId) {
      return res.status(404).json({ error: 'Coupon not found' })
    }

    const payload = {}

    if (req.body.code !== undefined) payload.code = normalizeText(req.body.code).toUpperCase()
    if (req.body.discount_type !== undefined)
      payload.discount_type = normalizeText(req.body.discount_type).toLowerCase()
    if (req.body.discount_value !== undefined)
      payload.discount_value = Number(req.body.discount_value)
    if (req.body.max_uses !== undefined) payload.max_uses = req.body.max_uses
    if (req.body.valid_from !== undefined) payload.valid_from = req.body.valid_from
    if (req.body.valid_to !== undefined) payload.valid_to = req.body.valid_to
    if (req.body.is_active !== undefined) payload.is_active = Boolean(req.body.is_active)

    const updated = await strapiServerPut(`/api/coupons/${coupon.documentId}`, {
      data: payload,
    })

    res.json({ coupon: updated?.data ?? null })
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

    if (req.body.primary_phone !== undefined) payload.primary_phone = req.body.primary_phone
    if (req.body.support_email !== undefined) payload.support_email = req.body.support_email
    if (req.body.support_availability_text !== undefined)
      payload.support_availability_text = req.body.support_availability_text
    if (req.body.advance_payment_percentage !== undefined)
      payload.advance_payment_percentage = req.body.advance_payment_percentage
    if (req.body.whatsapp_number !== undefined) payload.whatsapp_number = req.body.whatsapp_number
    if (req.body.response_expectation_text !== undefined)
      payload.response_expectation_text = req.body.response_expectation_text

    const updated = await strapiServerPut('/api/global-setting', {
      data: payload,
    })

    res.json({ settings: updated?.data ?? updated ?? null })
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
    const search = normalizeText(req.query.search)
    const page = toPositiveInt(req.query.page, 1)
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 50)
    const skip = (page - 1) * limit

    const where = {
      ...(status && ALERT_STATUSES.includes(status) ? { status } : {}),
      ...(severity && ALERT_SEVERITIES.includes(severity) ? { severity } : {}),
      ...(search
        ? {
            OR: [
              { message: { contains: search, mode: 'insensitive' } },
              { alertType: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [alerts, total, resolvedUsers, criticalCount, unresolvedCount] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
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
          ...(status && ALERT_STATUSES.includes(status) ? { status } : {}),
          severity: 'critical',
        },
      }),
      prisma.alert.count({
        where: {
          status: { not: 'resolved' },
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
