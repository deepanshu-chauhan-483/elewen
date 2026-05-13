import { Link } from 'react-router-dom'
import { formatDashboardDate } from './dashboardUtils'

function getStatusMeta(status) {
  const normalized = String(status ?? '').toLowerCase()

  if (['confirmed', 'completed'].includes(normalized)) {
    return {
      borderClass: 'border-t-4 border-[#16A34A]',
      pillClass: 'bg-[#DDF7E5] text-[#12803D]',
    }
  }

  if (['execution', 'pre_event', 'assigned', 'delivered'].includes(normalized)) {
    return {
      borderClass: 'border-l-4 border-[#3B82F6]',
      pillClass: 'bg-[#DBEAFE] text-[#1D4ED8]',
    }
  }

  if (['cancelled', 'expired', 'resolved', 'closed'].includes(normalized)) {
    return {
      borderClass: 'border-t-4 border-[#9CA3AF]',
      pillClass: 'bg-[#E5E7EB] text-[#4B5563]',
    }
  }

  return {
    borderClass: 'border-l-4 border-[#C57A1E]',
    pillClass: 'bg-[#FCE7CF] text-[#B0640C]',
  }
}

export function StatusPill({ label, status }) {
  const meta = getStatusMeta(status)

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${meta.pillClass}`}>
      {label}
    </span>
  )
}

export function DashboardPageIntro({ title, subtitle, meta }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-serif text-[#2E2E2E]">{title}</h1>
        {meta ? (
          <span className="text-xs uppercase tracking-[0.18em] text-[#8F8F8F]">{meta}</span>
        ) : null}
      </div>
      {subtitle ? <p className="text-sm text-[#6B7280]">{subtitle}</p> : null}
    </div>
  )
}

function StateCard({ title, body, tone = 'default' }) {
  const toneClass =
    tone === 'error'
      ? 'border border-[#F1B7B7] bg-[#FFF3F3] text-[#8A1C1C]'
      : 'border border-[#E7E0DA] bg-[#F3F3F3] text-[#4B5563]'

  return (
    <div className={`rounded-3xl p-6 ${toneClass}`}>
      <h2 className="text-lg font-medium text-[#2E2E2E]">{title}</h2>
      <p className="mt-2 text-sm">{body}</p>
    </div>
  )
}

export function DashboardLoadingState({ title = 'Loading your dashboard data...' }) {
  return <StateCard title={title} body="Please wait while we pull the latest customer data." />
}

export function DashboardErrorState({ title = 'We could not load this section yet.', body }) {
  return (
    <StateCard
      title={title}
      body={body || 'Please refresh once, or sign in again if your session has expired.'}
      tone="error"
    />
  )
}

export function DashboardEmptyState({ title, body, actionLabel, actionTo = '/' }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#D6CDC3] bg-[#F7F5F2] p-8">
      <h2 className="text-lg font-medium text-[#2E2E2E]">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-[#6B7280]">{body}</p>
      {actionLabel ? (
        <Link
          to={actionTo}
          className="mt-5 inline-flex rounded-full bg-[#C6A15B] px-5 py-2.5 text-sm text-white transition hover:opacity-90"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}

export function DashboardSelectorList({
  items,
  selectedId,
  onSelect,
  getLabel,
  getSubLabel,
  className = '',
}) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {items.map(item => {
        const isActive = item.id === selectedId

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              isActive
                ? 'border-[#591902] bg-[#F4E7DE]'
                : 'border-[#E4DED8] bg-white hover:border-[#C6A15B]'
            }`}
          >
            <div className="text-sm font-medium text-[#2E2E2E]">{getLabel(item)}</div>
            {getSubLabel ? (
              <div className="mt-1 text-xs text-[#6B7280]">{getSubLabel(item)}</div>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function BookingSummaryCard({
  booking,
  rightContent,
  footerContent,
  actionLabel = 'View Details',
  actionTo,
}) {
  const meta = getStatusMeta(booking?.status)
  const title = booking?.package?.title || booking?.event?.name || 'Customer Booking'
  const subtitle = [booking?.event?.name, booking?.package?.serviceCategories?.[0]?.name]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className={`rounded-[28px] bg-[#F3F3F3] p-6 ${meta.borderClass}`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div>
            <h2 className="text-[30px] leading-none tracking-[-0.02em] text-[#111827] font-serif">
              {title}
            </h2>
            <p className="mt-3 text-lg text-[#667085]">{subtitle || 'Event package'}</p>
          </div>

          <StatusPill label={booking?.statusLabel || 'Status'} status={booking?.status} />

          <div className="flex flex-wrap items-center gap-5 pt-2 text-sm text-[#111827]">
            <span className="inline-flex items-center gap-2">
              <span className="text-base">📅</span>
              <span>{formatDashboardDate(booking?.eventDate)}</span>
            </span>
            {booking?.locationSummary ? (
              <span className="inline-flex items-center gap-2">
                <span className="text-base">📍</span>
                <span>{booking.locationSummary}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-[220px] flex-col items-start gap-3 text-left lg:items-end lg:text-right">
          {rightContent ? rightContent : null}

          {!rightContent && actionTo ? (
            <Link
              to={actionTo}
              className="inline-flex rounded-full bg-[#C6A15B] px-5 py-3 text-sm text-white transition hover:opacity-90"
            >
              {actionLabel} →
            </Link>
          ) : null}
        </div>
      </div>

      {footerContent ? (
        <div className="mt-6 border-t border-[#E4DED8] pt-5">{footerContent}</div>
      ) : null}
    </div>
  )
}

export function DetailGrid({ items }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map(item => (
        <div
          key={item.label}
          className="rounded-2xl bg-white p-4 shadow-[0_1px_0_rgba(17,24,39,0.03)]"
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">{item.label}</p>
          <p className="mt-2 text-sm text-[#2E2E2E]">{item.value || 'Not shared yet'}</p>
        </div>
      ))}
    </div>
  )
}

export function SectionCard({ title, subtitle, children, action }) {
  return (
    <section className="rounded-[28px] bg-[#F3F3F3] ">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-medium text-[#2E2E2E]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}

export function MessageBubble({ message, isOwnMessage }) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm ${
          isOwnMessage ? 'bg-[#591902] text-white' : 'bg-white text-[#2E2E2E]'
        }`}
      >
        {message?.messageText || message?.message}
      </div>
    </div>
  )
}
