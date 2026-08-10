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

export function getBookingStatusLabel(status = '') {
  const key = String(status ?? '').toLowerCase()
  return BOOKING_STATUS_LABELS[key] ?? key
}

export function resolveTrackerBucket(_stageKey = 'all') {
  // Status tracker must filter by booking.status only.
  // Mapping stages onto payment-aware buckets (active/today/…) hid confirmed
  // bookings that were not yet advance-paid, so the stage filter looked broken.
  return 'all'
}

/**
 * Admin stage transitions: forward-only (or cancel). No event-date gates —
 * admin may move to Review / Setup / Dismantling whenever needed.
 */
export function canProgressToStage(currentStatus, newStatus, remainingAmount = 0) {
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

  return { allowed: true }
}
