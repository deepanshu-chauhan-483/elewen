import prisma from './prisma.js'
import { notify, getUserEmail } from './notify.js'
import { sendEmail, templates } from './email.js'
import { enrichBookings } from './dashboardData.js'
import {
  appBaseUrl,
  customerBookingDetailsPath,
  customerBookingDetailsUrl,
  customerInfoCollectionPath,
  customerInfoCollectionUrl,
} from './customerUrls.js'
import { isCodPayment } from './sheeshaCheckout.js'

export const BOOKING_EMAIL_TYPES = {
  CONFIRMED: 'booking_confirmed_lifecycle',
  INFO_COLLECTION: 'booking_info_collection',
  PERSONALIZATION: 'booking_personalization',
  PRE_EVENT_2DAY: 'booking_pre_event_2day',
  POST_EVENT_FEEDBACK: 'booking_post_event_feedback',
}

const APP_URL = () => appBaseUrl()
const SUPPORT_PHONE = '9810937700'
const DEFAULT_FEEDBACK_COUPON_VALUE = Number(process.env.FEEDBACK_COUPON_VALUE || 500)

function toNumber(value) {
  if (value == null) return 0
  if (typeof value === 'object' && typeof value.toNumber === 'function') return value.toNumber()
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function formatInr(value) {
  return `₹${toNumber(value).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function formatEventDate(value) {
  if (!value) return 'To be confirmed'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'To be confirmed'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}

function formatShortId(bookingId = '') {
  return `#${String(bookingId).slice(0, 8).toUpperCase()}`
}

/** YYYY-MM-DD in Asia/Kolkata */
export function getIstDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function addDaysToDateKey(dateKey, days) {
  const [y, m, d] = String(dateKey).split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d))
  utc.setUTCDate(utc.getUTCDate() + days)
  return utc.toISOString().slice(0, 10)
}

async function hasSentEmail(bookingId, emailType) {
  const existing = await prisma.bookingEmailLog.findUnique({
    where: {
      bookingId_emailType: { bookingId, emailType },
    },
    select: { id: true },
  })
  return Boolean(existing)
}

async function markEmailSent(bookingId, emailType, subject, metadata = null) {
  try {
    await prisma.bookingEmailLog.create({
      data: {
        bookingId,
        emailType,
        subject,
        metadata: metadata ?? undefined,
      },
    })
    return true
  } catch (err) {
    // Unique constraint = already sent
    if (err?.code === 'P2002') return false
    throw err
  }
}

async function loadBookingForEmail(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      items: true,
      notes: { orderBy: { createdAt: 'desc' }, take: 20 },
      payments: { orderBy: { createdAt: 'desc' } },
      statusLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
  if (!booking) return null
  const [enriched] = await enrichBookings([booking])
  return enriched
}

export function buildBookingEmailContext(booking, extras = {}) {
  const paymentSummary = booking?.paymentSummary ?? {}
  const isCodBooking =
    Boolean(paymentSummary?.isCodBooking) ||
    (Array.isArray(booking?.payments) ? booking.payments.some(isCodPayment) : false)

  const totalAmount = toNumber(paymentSummary.totalPrice ?? booking?.totalPrice)
  const amountPaid = toNumber(paymentSummary.amountPaid)
  const remainingBalance = toNumber(
    paymentSummary.amountDue ?? Math.max(totalAmount - amountPaid, 0)
  )
  const advanceAmount = toNumber(paymentSummary.advanceAmount ?? booking?.advanceAmount)

  const packageTitle =
    booking?.package?.title ||
    booking?.items?.[0]?.title ||
    booking?.selectedItemsSummary ||
    'Selected package'

  const servicesBooked =
    (Array.isArray(booking?.package?.serviceCategories)
      ? booking.package.serviceCategories.map(c => c?.name).filter(Boolean)
      : []
    ).join(', ') ||
    booking?.detailSubtitle ||
    booking?.displaySubtitle ||
    'Event services'

  const venueName =
    booking?.locationSummary ||
    booking?.address?.summary ||
    booking?.address?.line1 ||
    'To be confirmed'

  const bookingPath = customerBookingDetailsPath(booking.id)
  const appUrl = APP_URL()

  return {
    bookingId: booking.id,
    bookingIdShort: formatShortId(booking.id),
    eventType: booking?.event?.name || 'Your event',
    eventDate: formatEventDate(booking?.eventDate),
    eventTime: booking?.eventTime || 'To be confirmed',
    venueName,
    servicesBooked,
    packageBooked: packageTitle,
    totalAmount: formatInr(totalAmount),
    amountPaid: formatInr(amountPaid),
    remainingBalance: formatInr(remainingBalance),
    advanceAmount: formatInr(advanceAmount),
    amountPaidRaw: amountPaid,
    remainingBalanceRaw: remainingBalance,
    totalAmountRaw: totalAmount,
    advanceAmountRaw: advanceAmount,
    isCodBooking,
    isFullyPaid: remainingBalance <= 0,
    updateDetailsUrl: `${appUrl}${bookingPath}`,
    paymentUrl: `${appUrl}${bookingPath}`,
    feedbackUrl: `${appUrl}${bookingPath}`,
    bookingUrl: `${appUrl}${bookingPath}`,
    supportPhone: SUPPORT_PHONE,
    couponValue: formatInr(extras.couponValue ?? DEFAULT_FEEDBACK_COUPON_VALUE),
    couponValueRaw: extras.couponValue ?? DEFAULT_FEEDBACK_COUPON_VALUE,
    serviceName: extras.serviceName || servicesBooked || 'decor',
    designImage1: extras.designImage1 || '',
    designImage2: extras.designImage2 || '',
    designImage3: extras.designImage3 || '',
    responseDeadline: extras.responseDeadline
      ? formatEventDate(extras.responseDeadline)
      : 'the shared deadline',
    personalizeUrl: extras.personalizeUrl || `${appUrl}${bookingPath}`,
  }
}

/**
 * Mail 1 eligibility (sent when admin sets status to confirmed):
 * - Non-Hookah: advance (>= advanceAmount) or full payment successful
 * - Hookah COD: no advance required — admin confirm alone is enough
 */
export function canSendConfirmedEmail(booking) {
  const paymentSummary = booking?.paymentSummary ?? {}
  const isCodBooking =
    Boolean(paymentSummary?.isCodBooking) ||
    (Array.isArray(booking?.payments) ? booking.payments.some(isCodPayment) : false)

  if (isCodBooking) return { ok: true, reason: 'hookah_cod' }

  const amountPaid = toNumber(paymentSummary.amountPaid)
  const advanceAmount = toNumber(paymentSummary.advanceAmount ?? booking?.advanceAmount)
  const totalPrice = toNumber(paymentSummary.totalPrice ?? booking?.totalPrice)

  if (amountPaid >= totalPrice && totalPrice > 0) {
    return { ok: true, reason: 'fully_paid' }
  }
  if (amountPaid >= advanceAmount && advanceAmount > 0) {
    return { ok: true, reason: 'advance_paid' }
  }
  if (paymentSummary.advancePaid) {
    return { ok: true, reason: 'advance_flag' }
  }

  return {
    ok: false,
    reason: 'advance_payment_required',
    message: 'Advance (or full) payment must be successful before sending confirmation email.',
  }
}

async function dispatchLifecycleEmail({
  booking,
  emailType,
  templateKey,
  subject,
  title,
  message,
  emailData,
  force = false,
  subjectOverride = null,
  htmlOverride = null,
  linkUrl = null,
}) {
  if (!booking?.id || !booking?.userId) {
    return { sent: false, reason: 'missing_booking' }
  }

  if (!force && (await hasSentEmail(booking.id, emailType))) {
    return { sent: false, reason: 'already_sent' }
  }

  const finalSubject =
    typeof subjectOverride === 'string' && subjectOverride.trim()
      ? subjectOverride.trim()
      : subject

  const hasHtmlOverride = typeof htmlOverride === 'string' && htmlOverride.trim()
  if (!hasHtmlOverride && !templates[templateKey]) {
    return { sent: false, reason: 'missing_template' }
  }

  const claimed = await markEmailSent(booking.id, emailType, finalSubject)
  if (!claimed && !force) {
    return { sent: false, reason: 'already_sent' }
  }

  const email = await getUserEmail(booking.userId)
  if (!email) {
    console.warn('[booking-email] No email for user', booking.userId)
    return { sent: false, reason: 'no_user_email' }
  }

  const html = hasHtmlOverride ? htmlOverride.trim() : templates[templateKey](emailData)
  await sendEmail(email, finalSubject, html)

  await notify(booking.userId, {
    type: 'booking_update',
    title,
    message,
    linkUrl: linkUrl || customerBookingDetailsPath(booking.id),
  }).catch(() => {})

  return { sent: true, emailType, subject: finalSubject }
}

const DEFAULT_PERSONALIZATION_SUBJECT = "Let's personalise your booking with Elewen"
const DEFAULT_PERSONALIZATION_HEADLINE = "Let's personalise your booking ✨"

const PERSONALIZATION_COPY_KEYS = [
  'headline',
  'introText',
  'customMessage',
  'chooseHeading',
  'chooseSubtext',
  'optionLabel1',
  'optionLabel2',
  'optionLabel3',
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

function pickPersonalizationCopy(source = {}) {
  const copy = {}
  for (const key of PERSONALIZATION_COPY_KEYS) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      copy[key] = value.trim()
    } else {
      copy[key] = null
    }
  }
  return copy
}

function buildPersonalizationContext(booking, options = {}) {
  const {
    serviceName,
    designImage1,
    designImage2,
    designImage3,
    responseDeadline,
  } = options
  const deadlineDate = responseDeadline ? new Date(responseDeadline) : null
  const ctx = buildBookingEmailContext(booking, {
    serviceName: String(serviceName || 'decor').trim() || 'decor',
    designImage1: designImage1 || null,
    designImage2: designImage2 || null,
    designImage3: designImage3 || null,
    responseDeadline:
      deadlineDate && !Number.isNaN(deadlineDate.getTime()) ? deadlineDate : null,
    personalizeUrl: customerBookingDetailsUrl(booking.id),
  })

  return {
    ...ctx,
    ...pickPersonalizationCopy(options),
  }
}

function personalizationCopyDefaults(serviceName = 'decor') {
  return {
    subject: DEFAULT_PERSONALIZATION_SUBJECT,
    headline: DEFAULT_PERSONALIZATION_HEADLINE,
    introText: `We're getting everything ready for your event, and it's now time to customise your ${serviceName}.`,
    customMessage: '',
    chooseHeading: 'Please choose your preferred design',
    chooseSubtext: '',
    optionLabel1: 'Design Option 1',
    optionLabel2: 'Design Option 2',
    optionLabel3: 'Design Option 3',
    replyPrompt: '',
    ctaLabel: 'Open My Booking',
    textSectionHeading: 'What would you like it to say?',
    textSectionBody: "Please share the exact text you'd like us to use. For example:",
    textExamples:
      "Welcome to Aarav's First Birthday\nHappy 25th Anniversary\nCongratulations, Riya & Arjun",
    anythingElseHeading: "Anything else you'd like us to know?",
    anythingElseBody:
      'If you have any special requests or instructions, you can add them while submitting your selections. We will review your request and check its feasibility.',
    deadlineText:
      'Please send us your selections by {{deadline}} so our team has enough time to prepare everything for your event.',
    noReplyText:
      "If we don't hear back by then, we'll proceed with the default option discussed during your booking.",
    signOff: 'Team Elewen\n9810937700',
  }
}

/** Preview Mail 2 — does not create records or send. */
export async function previewBookingPersonalizationEmail(
  bookingId,
  {
    serviceName,
    designImage1,
    designImage2,
    designImage3,
    responseDeadline,
    subject: subjectOverride = null,
    ...copyFields
  } = {}
) {
  const booking = await loadBookingForEmail(bookingId)
  if (!booking) return { ok: false, reason: 'not_found', message: 'Booking not found.' }
  if (booking.status === 'cancelled') {
    return { ok: false, reason: 'cancelled', message: 'Cannot preview email for a cancelled booking.' }
  }
  if (!templates.booking_personalization) {
    return { ok: false, reason: 'missing_template', message: 'Personalization email template is missing.' }
  }

  const ctx = buildPersonalizationContext(booking, {
    serviceName,
    designImage1,
    designImage2,
    designImage3,
    responseDeadline,
    ...copyFields,
  })
  const to = await getUserEmail(booking.userId)
  if (!to) {
    return { ok: false, reason: 'no_user_email', message: 'Customer has no email on file.' }
  }

  const defaults = personalizationCopyDefaults(ctx.serviceName)
  const subject =
    typeof subjectOverride === 'string' && subjectOverride.trim()
      ? subjectOverride.trim()
      : defaults.subject
  const html = templates.booking_personalization(ctx)

  const resolvedCopy = {}
  for (const key of PERSONALIZATION_COPY_KEYS) {
    resolvedCopy[key] = ctx[key] || defaults[key] || ''
  }

  return {
    ok: true,
    to,
    subject,
    html,
    serviceName: ctx.serviceName,
    ...resolvedCopy,
    defaults,
  }
}

/** Mail — when admin moves booking to Information Collection. */
export async function sendInfoCollectionEmail(bookingId, { force = false } = {}) {
  const booking = await loadBookingForEmail(bookingId)
  if (!booking) return { sent: false, reason: 'not_found' }
  if (booking.status === 'cancelled') return { sent: false, reason: 'cancelled' }

  const ctx = buildBookingEmailContext(booking)
  const advanceRequired = toNumber(ctx.advanceAmountRaw)
  const amountPaid = toNumber(ctx.amountPaidRaw)
  // If customer already paid advance (or more), show ₹0 due.
  const advanceDue = Math.max(advanceRequired - amountPaid, 0)

  return dispatchLifecycleEmail({
    booking,
    emailType: BOOKING_EMAIL_TYPES.INFO_COLLECTION,
    templateKey: 'booking_info_collection',
    subject: 'Fill your event details & complete advance — Elewen',
    title: 'Information Collection',
    message:
      advanceDue > 0
        ? 'Please fill your event information form, then complete the advance payment.'
        : 'Please fill your event information form. Your advance is already paid.',
    emailData: {
      bookingId: booking.id,
      eventDate: booking.eventDate,
      guestCount: booking.guestCount,
      totalPrice: ctx.totalAmountRaw,
      advanceDue,
      amountPaid,
      formUrl: customerInfoCollectionUrl(booking.id),
      paymentUrl: customerBookingDetailsUrl(booking.id),
    },
    linkUrl: customerInfoCollectionPath(booking.id),
    force,
  })
}

/** Mail 1 — when admin confirms booking (after advance paid, or Hookah COD). */
export async function sendBookingConfirmedEmail(bookingId, { force = false } = {}) {
  const booking = await loadBookingForEmail(bookingId)
  if (!booking) return { sent: false, reason: 'not_found' }

  const eligibility = canSendConfirmedEmail(booking)
  if (!eligibility.ok) {
    return { sent: false, reason: eligibility.reason, message: eligibility.message }
  }

  const ctx = buildBookingEmailContext(booking)
  const isHookah = ctx.isCodBooking

  return dispatchLifecycleEmail({
    booking,
    emailType: BOOKING_EMAIL_TYPES.CONFIRMED,
    templateKey: isHookah ? 'booking_hookah_confirmed_lifecycle' : 'booking_confirmed_lifecycle',
    subject: isHookah
      ? "It's Official! Your Celebration Just Got an Upgrade."
      : "You're all set! Here's what happens next 🎉",
    title: 'Booking Confirmed',
    message: 'Your booking with Elewen has been confirmed. Check your email for next steps.',
    emailData: isHookah
      ? {
          packageBooked: ctx.packageBooked,
          eventDate: ctx.eventDate,
          venueName: ctx.venueName,
          totalAmount: ctx.totalAmount,
          supportPhone: ctx.supportPhone,
          bookingUrl: ctx.bookingUrl,
        }
      : ctx,
    force,
  })
}

/** Hookah COD — sent when customer completes pay-on-delivery booking at checkout. */
export async function sendHookahBookingPlacedEmail(bookingId) {
  const booking = await loadBookingForEmail(bookingId)
  if (!booking) return { sent: false, reason: 'not_found' }

  const ctx = buildBookingEmailContext(booking)
  if (!ctx.isCodBooking) return { sent: false, reason: 'not_hookah_cod' }

  const emailType = 'booking_hookah_placed'
  if (await hasSentEmail(booking.id, emailType)) {
    return { sent: false, reason: 'already_sent' }
  }

  const subject = "It's Official! Your Celebration Just Got an Upgrade."
  const claimed = await markEmailSent(booking.id, emailType, subject)
  if (!claimed) return { sent: false, reason: 'already_sent' }

  const email = await getUserEmail(booking.userId)
  if (!email) {
    console.warn('[booking-email] No email for user', booking.userId)
    return { sent: false, reason: 'no_user_email' }
  }

  const html = templates.booking_hookah_placed({
    packageBooked: ctx.packageBooked,
    eventDate: ctx.eventDate,
    venueName: ctx.venueName,
    totalAmount: ctx.totalAmount,
    supportPhone: ctx.supportPhone,
    bookingUrl: ctx.bookingUrl,
  })
  await sendEmail(email, subject, html)

  await notify(booking.userId, {
    type: 'booking_update',
    title: 'Hookah booking received',
    message:
      'Your Hookah booking request was submitted. We will confirm it shortly. Amount is due on delivery.',
    linkUrl: customerBookingDetailsPath(booking.id),
  }).catch(() => {})

  return { sent: true, emailType, subject }
}

/** Mail 2 — admin manual personalization email. Supports SMTP or mailto (external mail app). */
export async function sendBookingPersonalizationEmail(
  bookingId,
  {
    serviceName,
    designImage1,
    designImage2,
    designImage3,
    responseDeadline,
    subject: subjectOverride = null,
    html: htmlOverride = null,
    channel = 'smtp',
    force = false,
    ...copyFields
  } = {}
) {
  const booking = await loadBookingForEmail(bookingId)
  if (!booking) return { sent: false, reason: 'not_found' }

  const deadlineDate = responseDeadline ? new Date(responseDeadline) : null
  const personalization = await prisma.bookingPersonalization.create({
    data: {
      bookingId,
      serviceName: String(serviceName || 'decor').trim() || 'decor',
      designImage1: designImage1 || null,
      designImage2: designImage2 || null,
      designImage3: designImage3 || null,
      responseDeadline:
        deadlineDate && !Number.isNaN(deadlineDate.getTime()) ? deadlineDate : null,
      status: 'sent',
      sentAt: new Date(),
    },
  })

  const ctx = buildPersonalizationContext(booking, {
    serviceName: personalization.serviceName,
    designImage1: personalization.designImage1,
    designImage2: personalization.designImage2,
    designImage3: personalization.designImage3,
    responseDeadline: personalization.responseDeadline,
    ...copyFields,
  })

  // Each admin send is logged separately so planners can re-send with new options.
  const emailType = `${BOOKING_EMAIL_TYPES.PERSONALIZATION}_${String(personalization.id).slice(0, 8)}`
  const finalSubject =
    typeof subjectOverride === 'string' && subjectOverride.trim()
      ? subjectOverride.trim()
      : DEFAULT_PERSONALIZATION_SUBJECT

  // Admin opens Outlook/Gmail via mailto (same pattern as Vendor Management).
  // Record the design options + notify in-app, but do not send via Elewen SMTP.
  if (String(channel).toLowerCase() === 'mailto') {
    await markEmailSent(booking.id, emailType, finalSubject, { channel: 'mailto' })
    await notify(booking.userId, {
      type: 'booking_update',
      title: "Let's personalise your booking",
      message: `Please choose your preferred design options for ${ctx.serviceName}.`,
      linkUrl: customerBookingDetailsPath(booking.id),
    }).catch(() => {})

    return {
      sent: true,
      channel: 'mailto',
      emailType,
      subject: finalSubject,
      personalizationId: personalization.id,
      to: await getUserEmail(booking.userId),
    }
  }

  const result = await dispatchLifecycleEmail({
    booking,
    emailType,
    templateKey: 'booking_personalization',
    subject: DEFAULT_PERSONALIZATION_SUBJECT,
    title: "Let's personalise your booking",
    message: `Please choose your preferred design options for ${ctx.serviceName}.`,
    emailData: ctx,
    force: true,
    subjectOverride: finalSubject,
    htmlOverride,
  })

  return { ...result, personalizationId: personalization.id, channel: 'smtp' }
}

/** Mail 3 — 2 days before event (cron). */
export async function sendPreEventReminderEmail(bookingId, { force = false } = {}) {
  const booking = await loadBookingForEmail(bookingId)
  if (!booking) return { sent: false, reason: 'not_found' }
  if (booking.status === 'cancelled') return { sent: false, reason: 'cancelled' }

  const ctx = buildBookingEmailContext(booking)
  return dispatchLifecycleEmail({
    booking,
    emailType: BOOKING_EMAIL_TYPES.PRE_EVENT_2DAY,
    templateKey: 'booking_pre_event_2day',
    subject: 'Just 2 days to go!',
    title: 'Just 2 days to go!',
    message: 'Your Elewen event is almost here. Check your email for the final update.',
    emailData: ctx,
    force,
  })
}

/** Mail 4 — day after event (cron) or post_event status. */
export async function sendPostEventFeedbackEmail(bookingId, { force = false } = {}) {
  const booking = await loadBookingForEmail(bookingId)
  if (!booking) return { sent: false, reason: 'not_found' }
  if (booking.status === 'cancelled') return { sent: false, reason: 'cancelled' }

  const ctx = buildBookingEmailContext(booking)
  return dispatchLifecycleEmail({
    booking,
    emailType: BOOKING_EMAIL_TYPES.POST_EVENT_FEEDBACK,
    templateKey: 'booking_post_event_feedback',
    subject: 'Tell us how we did & enjoy a little thank-you! 🎁',
    title: 'Thank you for celebrating with Elewen',
    message: 'Share feedback and unlock your Elewen gift coupon.',
    emailData: ctx,
    force,
  })
}

/**
 * Daily/hourly job:
 * - Mail 3 when eventDate = today+2 (IST)
 * - Mail 4 when eventDate = today-1 (IST)
 */
export async function runScheduledBookingEmails() {
  const todayKey = getIstDateKey()
  const inTwoDaysKey = addDaysToDateKey(todayKey, 2)
  const yesterdayKey = addDaysToDateKey(todayKey, -1)

  const activeStatuses = [
    'confirmed',
    'info_collection',
    'planning',
    'pre_event',
    'execution',
    'post_event',
    'completed',
  ]

  const [preEventCandidates, postEventCandidates] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: { in: activeStatuses.filter(s => s !== 'completed' && s !== 'post_event') },
        eventDate: {
          gte: new Date(`${inTwoDaysKey}T00:00:00.000Z`),
          lt: new Date(`${addDaysToDateKey(inTwoDaysKey, 1)}T00:00:00.000Z`),
        },
        emailLogs: { none: { emailType: BOOKING_EMAIL_TYPES.PRE_EVENT_2DAY } },
      },
      select: { id: true },
    }),
    prisma.booking.findMany({
      where: {
        status: { in: ['execution', 'post_event', 'completed', 'pre_event'] },
        eventDate: {
          gte: new Date(`${yesterdayKey}T00:00:00.000Z`),
          lt: new Date(`${addDaysToDateKey(yesterdayKey, 1)}T00:00:00.000Z`),
        },
        emailLogs: { none: { emailType: BOOKING_EMAIL_TYPES.POST_EVENT_FEEDBACK } },
      },
      select: { id: true },
    }),
  ])

  const results = { preEvent: [], postEvent: [], ranAt: new Date().toISOString(), todayKey }

  for (const row of preEventCandidates) {
    results.preEvent.push(await sendPreEventReminderEmail(row.id))
  }
  for (const row of postEventCandidates) {
    results.postEvent.push(await sendPostEventFeedbackEmail(row.id))
  }

  return results
}
