export const ADMIN_BADGE_FALLBACK = 'bg-[#E5E7EB] text-[#4B5563]'

export const ADMIN_BADGE_PRESETS = {
  soft: {
    urgent: 'bg-[#FFF1F0] text-[#591902]',
    overdue: 'bg-[#FFF4E5] text-[#C07318]',
    pending: 'bg-[#EEF4FF] text-[#3061C6]',
    confirmed: 'bg-[#EAF8F1] text-[#238E64]',
    new: 'bg-[#EEF4FF] text-[#3061C6]',
    high: 'bg-[#FFF1F0] text-[#591902]',
    medium: 'bg-[#FFF4E5] text-[#C07318]',
    low: 'bg-[#F3F4F6] text-[#6B7280]',
    open: 'bg-[#EEF4FF] text-[#3061C6]',
    healthy: 'bg-[#EAF8F1] text-[#238E64]',
    warning: 'bg-[#FFF4E5] text-[#C07318]',
    error: 'bg-[#FFF1F0] text-[#591902]',
    in_progress: 'bg-[#FFF4E5] text-[#C07318]',
    success: 'bg-[#EAF8F1] text-[#238E64]',
    resolved: 'bg-[#EAF8F1] text-[#238E64]',
    closed: 'bg-[#F3F4F6] text-[#6B7280]',
    critical: 'bg-[#591902] text-white',
    acknowledged: 'bg-[#FFF4E5] text-[#C07318]',
    snoozed: 'bg-[#F3F4F6] text-[#6B7280]',
  },
  vivid: {
    new: 'bg-[#FCE7CF] text-[#C57A1E]',
    confirmed: 'bg-[#DDF7E5] text-[#16A34A]',
    info_collection: 'bg-[#DBEAFE] text-[#0383E4]',
    planning: 'bg-[#EDE9FE] text-[#6D28D9]',
    pre_event: 'bg-[#FCE7CF] text-[#C57A1E]',
    execution: 'bg-[#DDF7E5] text-[#16A34A]',
    post_event: 'bg-[#DBEAFE] text-[#0383E4]',
    completed: 'bg-[#EAF8F1] text-[#238E64]',
    cancelled: 'bg-[#FFF3F3] text-[#8A1C1C]',
    pending: 'bg-[#FCE7CF] text-[#C57A1E]',
    assigned: 'bg-[#DDF7E5] text-[#16A34A]',
    failed: 'bg-[#FFF3F3] text-[#8A1C1C]',
    paid: 'bg-[#DDF7E5] text-[#16A34A]',
    refunded: 'bg-[#E5E7EB] text-[#4B5563]',
    active: 'bg-[#DDF7E5] text-[#16A34A]',
    success: 'bg-[#DDF7E5] text-[#16A34A]',
    resolved: 'bg-[#DDF7E5] text-[#16A34A]',
    requested: 'bg-[#FCE7CF] text-[#C57A1E]',
    inactive: 'bg-[#E5E7EB] text-[#4B5563]',
    offline: 'bg-[#E5E7EB] text-[#4B5563]',
    portal: 'bg-[#DBEAFE] text-[#0383E4]',
    unassigned: 'bg-[#FCE7CF] text-[#C57A1E]',
    delivered: 'bg-[#EDE9FE] text-[#6D28D9]',
    approved: 'bg-[#DDF7E5] text-[#16A34A]',
    rejected: 'bg-[#FFF3F3] text-[#8A1C1C]',
    available: 'bg-[#DDF7E5] text-[#16A34A]',
    unavailable: 'bg-[#FFF3F3] text-[#8A1C1C]',
  },
}

export function normalizeAdminBadgeKey(value) {
  return (
    value
      ?.toLowerCase()
      ?.trim()
      ?.replace(/[\s-]+/g, '_') ?? ''
  )
}

export function formatAdminBadgeLabel(value) {
  const key = normalizeAdminBadgeKey(value)
  if (!key) return '-'
  return key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

export function getAdminBadgeClass(value, options = {}) {
  const { preset = 'soft', fallback = ADMIN_BADGE_FALLBACK } = options
  const key = normalizeAdminBadgeKey(value)
  const presetList = Array.isArray(preset)
    ? preset
    : String(preset)
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)

  for (const presetName of presetList) {
    const match = ADMIN_BADGE_PRESETS[presetName]?.[key]
    if (match) return match
  }

  return fallback
}

export function getAdminBadgeMeta(value, options = {}) {
  const key = normalizeAdminBadgeKey(value)
  return {
    key,
    className: getAdminBadgeClass(key, options),
  }
}
