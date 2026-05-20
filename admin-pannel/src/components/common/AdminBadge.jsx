import { formatAdminBadgeLabel, getAdminBadgeClass } from '../../lib/adminBadges'

export default function AdminBadge({
  status,
  label,
  preset = 'soft',
  className = 'px-3 py-1 text-sm font-medium',
  fallbackClass,
}) {
  const badgeClass = getAdminBadgeClass(status, {
    preset,
    fallback: fallbackClass,
  })
  const text = label ?? formatAdminBadgeLabel(status)

  return (
    <span
      className={`inline-flex items-center rounded-full whitespace-nowrap ${className} ${badgeClass}`}
    >
      {text}
    </span>
  )
}
