// Keep in sync with api/src/lib/bookingStages.js

export const BOOKING_STATUSES = [
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

export const BOOKING_STAGE_PROGRESSION = [
  'new',
  'confirmed',
  'info_collection',
  'planning',
  'pre_event',
  'execution',
  'post_event',
  'completed',
]

export const BOOKING_STATUS_LABELS = {
  new: 'Booking request received',
  confirmed: 'Booking Confirmed',
  info_collection: 'Information Collection',
  planning: 'Pre-Event Planning',
  pre_event: 'Final payment',
  execution: 'Setup completed and styled',
  completed: 'Dismantling after the celebration',
  post_event: "Review us and join the Fam! (we'd love to hear from you 🤍)",
  cancelled: 'Cancelled',
}

export const BOOKING_STAGE_GUIDANCE = {
  new: 'Review the booking, confirm it, and capture any immediate requirements.',
  confirmed: 'Collect missing customer information and move the booking into planning.',
  info_collection: 'Verify requirements, save internal notes, and prepare the planning handoff.',
  planning: 'Treat this stage as operational planning. Use booking details for assignments and prep.',
  pre_event: 'Run final checks for execution readiness, vendor assignment, and payment status.',
  execution: 'This booking is on event day. Monitor active execution and capture any updates.',
  post_event: 'Review post-event follow-ups, feedback, and completion readiness.',
  completed: 'Booking is complete. Use the booking workspace for final history and summaries.',
}

export const NEXT_STAGE_MAP = {
  new: 'confirmed',
  confirmed: 'info_collection',
  info_collection: 'planning',
  planning: 'pre_event',
  pre_event: 'execution',
  execution: 'post_event',
  post_event: 'completed',
}

export const TRACKER_STAGES = [
  { key: 'all', label: 'All Bookings' },
  ...BOOKING_STAGE_PROGRESSION.map(key => ({
    key,
    label: BOOKING_STATUS_LABELS[key],
  })),
  { key: 'cancelled', label: BOOKING_STATUS_LABELS.cancelled },
]

const MS_PER_DAY = 24 * 60 * 60 * 1000

function startOfDay(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

function getDaysSinceEvent(eventDate) {
  const eventDay = startOfDay(eventDate)
  const today = startOfDay(new Date())
  if (!eventDay || !today) return null
  return Math.floor((today.getTime() - eventDay.getTime()) / MS_PER_DAY)
}

export function getBookingStatusLabel(status = '') {
  const key = String(status ?? '').toLowerCase()
  return BOOKING_STATUS_LABELS[key] ?? key
}

export function resolveTrackerBucket(stageKey = 'all') {
  const normalizedStage = String(stageKey ?? 'all').toLowerCase()
  if (normalizedStage === 'completed') return 'completed'
  if (normalizedStage === 'cancelled') return 'all'
  if (normalizedStage === 'all') return 'all'
  if (normalizedStage === 'new') return 'all'
  return 'active'
}

export function canProgressToStage(currentStatus, newStatus, remainingAmount = 0, eventDate = null) {
  if (newStatus === 'cancelled') return { allowed: true }

  if (currentStatus === newStatus) {
    return { allowed: false, message: 'Already in this stage.' }
  }

  const currentIndex = BOOKING_STAGE_PROGRESSION.indexOf(currentStatus?.toLowerCase())
  const newIndex = BOOKING_STAGE_PROGRESSION.indexOf(newStatus?.toLowerCase())

  if (currentIndex === -1 || newIndex === -1) {
    return { allowed: false, message: 'Invalid stage transition.' }
  }

  if (newIndex < currentIndex) {
    return { allowed: false, message: 'Cannot move back to a previous stage.' }
  }

  if (newStatus === 'execution' && remainingAmount > 0) {
    return {
      allowed: false,
      message: `Cannot move to "${BOOKING_STATUS_LABELS.execution}". Remaining payment: ₹${remainingAmount.toLocaleString()}. Clear full payment first.`,
    }
  }

  const daysSinceEvent = getDaysSinceEvent(eventDate)
  if (['execution', 'post_event', 'completed'].includes(newStatus) && daysSinceEvent == null) {
    return {
      allowed: false,
      message:
        'Event date is required before using setup, review, or dismantling stages.',
    }
  }

  if (newStatus === 'execution' && daysSinceEvent !== 0) {
    return {
      allowed: false,
      message: 'Setup completed and styled is only available on the booking event date.',
    }
  }

  if (newStatus === 'post_event' && !(daysSinceEvent >= 1)) {
    return {
      allowed: false,
      message: 'Review stage becomes available after the event date has passed.',
    }
  }

  if (newStatus === 'completed' && !(daysSinceEvent >= 2)) {
    return {
      allowed: false,
      message: 'Dismantling stage becomes available two days after the event date.',
    }
  }

  return { allowed: true }
}
