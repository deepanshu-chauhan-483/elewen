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

export const BOOKING_TIMELINE_STEPS = [
  {
    key: 'inquiry',
    title: 'Booking request received',
    description:
      'Your Payment has been received and your booking request is being reviewed.',
  },
  {
    key: 'internal_review',
    title: 'Booking Confirmed',
    description: 'Your event is officially marked in our calendars.',
  },
  {
    key: 'information_collection',
    title: 'Information Collection',
    description:
      'We are collecting any booking details needed and customisation requests before planning begins. (if applicable)',
  },
  {
    key: 'planning_preparation',
    title: 'Pre-Event Planning',
    description: 'Your event preparations are underway.',
  },
  {
    key: 'pre_event_final_checks',
    title: 'Final payment',
    description: 'Please make the final payment to team Elewen before your event begins.',
  },
  {
    key: 'event_day_execution',
    title: 'Setup completed and styled',
    description: 'Your event is now in live execution with the on-ground team.',
  },
  {
    key: 'event_complete',
    title: 'Dismantling after the celebration',
    description: 'Wrap-up is complete. Thank you for trusting us on your special day.',
  },
  {
    key: 'post_event_follow_up',
    title: "Review us and join the Fam! (we'd love to hear from you 🤍)",
    description: 'Check your inbox! Our feedback form and a special surprise awaits you!',
  },
]

export const LEGACY_TIMELINE_TITLE_INDEX = new Map([
  ['Inquiry / Booking Placed', 0],
  ['Internal Review & Confirmation', 1],
  ['Planning & Preparation', 3],
  ['Pre-event Final Checks', 4],
  ['Event Day / Execution', 5],
  ['Event Complete', 6],
  ['Post Event Follow Up', 7],
])

export const STATUS_TO_TIMELINE_INDEX = {
  new: 0,
  confirmed: 1,
  info_collection: 2,
  planning: 3,
  pre_event: 4,
  execution: 5,
  post_event: 7,
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

export function getBookingStatusLabel(status = '') {
  const key = String(status ?? '').toLowerCase()
  return BOOKING_STATUS_LABELS[key] ?? key
}

export function getTimelineIndexForStatus(status) {
  if (status === 'completed') return 6
  return STATUS_TO_TIMELINE_INDEX[status]
}
