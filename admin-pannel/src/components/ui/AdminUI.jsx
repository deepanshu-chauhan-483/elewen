import { formatCount, sentenceCase } from '../../lib/formatters'

const statusToneMap = {
  new: 'bg-[#FCE7CF] text-[#B0640C] border-[#F3D5B3]',
  confirmed: 'bg-[#DDF7E5] text-[#12803D] border-[#C8EED6]',
  info_collection: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#C8DCF9]',
  planning: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#C8DCF9]',
  pre_event: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#C8DCF9]',
  execution: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#C8DCF9]',
  post_event: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#C8DCF9]',
  completed: 'bg-[#DDF7E5] text-[#12803D] border-[#C8EED6]',
  cancelled: 'bg-[#E5E7EB] text-[#4B5563] border-[#D9DCE1]',
  assigned: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#C8DCF9]',
  delivered: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#C8DCF9]',
  pending: 'bg-[#FCE7CF] text-[#B0640C] border-[#F3D5B3]',
  success: 'bg-[#DDF7E5] text-[#12803D] border-[#C8EED6]',
  failed: 'bg-[#FFF3F3] text-[#8A1C1C] border-[#F1B7B7]',
  refunded: 'bg-[#E5E7EB] text-[#4B5563] border-[#D9DCE1]',
  open: 'bg-[#FCE7CF] text-[#B0640C] border-[#F3D5B3]',
  in_progress: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#C8DCF9]',
  resolved: 'bg-[#DDF7E5] text-[#12803D] border-[#C8EED6]',
  closed: 'bg-[#E5E7EB] text-[#4B5563] border-[#D9DCE1]',
  low: 'bg-[#E5E7EB] text-[#4B5563] border-[#D9DCE1]',
  medium: 'bg-[#FCE7CF] text-[#B0640C] border-[#F3D5B3]',
  high: 'bg-[#FCE7CF] text-[#B0640C] border-[#F3D5B3]',
  critical: 'bg-[#FFF3F3] text-[#8A1C1C] border-[#F1B7B7]',
  acknowledged: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#C8DCF9]',
  snoozed: 'bg-[#E5E7EB] text-[#4B5563] border-[#D9DCE1]',
}

export function PageIntro({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Operational Console</p>
        <h1 className="admin-serif mt-2 text-2xl text-[#2E2E2E] md:text-[30px]">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm text-[#6B7280]">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

export function MetricCard({ label, value, helper }) {
  return (
    <div className="rounded-[28px] bg-[#F3F3F3] p-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">{label}</p>
      <p className="mt-2 text-[30px] leading-none tracking-[-0.02em] text-[#111827] admin-serif">{value}</p>
      {helper ? <p className="mt-3 text-sm text-[#6B7280]">{helper}</p> : null}
    </div>
  )
}

export function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section
      className={`rounded-[28px] bg-[#F3F3F3] p-6 ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            {title ? <h2 className="text-xl font-medium text-[#2E2E2E]">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      )}
      <div className={title || subtitle || action ? 'mt-6' : ''}>{children}</div>
    </section>
  )
}

export function StatusBadge({ status, label }) {
  const key = String(status ?? '').toLowerCase()
  const tone = statusToneMap[key] ?? 'bg-stone-100 text-stone-800 border-stone-200'

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
      {label ?? sentenceCase(status)}
    </span>
  )
}

export function SearchField({ value, onChange, placeholder = 'Search' }) {
  return (
    <input
      type="search"
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-11 w-full rounded-full border border-[#E4DED8] bg-white px-4 text-sm text-[#2E2E2E] outline-none transition focus:border-[#C6A15B]"
    />
  )
}

export function SelectField({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={event => onChange(event.target.value)}
      className="min-h-11 rounded-2xl border border-[#E4DED8] bg-white px-4 text-sm text-[#2E2E2E] outline-none transition focus:border-[#C6A15B]"
    >
      {children}
    </select>
  )
}

export function InputField(props) {
  return (
    <input
      {...props}
      className={`min-h-11 rounded-2xl border border-[#E4DED8] bg-white px-4 text-sm text-[#2E2E2E] outline-none transition focus:border-[#C6A15B] ${
        props.className ?? ''
      }`}
    />
  )
}

export function TextAreaField(props) {
  return (
    <textarea
      {...props}
      className={`min-h-28 rounded-2xl border border-[#E4DED8] bg-white px-4 py-3 text-sm text-[#2E2E2E] outline-none transition focus:border-[#C6A15B] ${
        props.className ?? ''
      }`}
    />
  )
}

export function ActionButton({
  children,
  onClick,
  type = 'button',
  tone = 'primary',
  disabled = false,
  className = '',
}) {
  const toneClass =
    tone === 'ghost'
      ? 'bg-[#F3F3F3] text-[#262626] hover:bg-[#E8E8E8]'
      : tone === 'gold'
        ? 'bg-[#D4BA8E] text-[#FAFAFA] hover:bg-[#c7aa76]'
      : tone === 'danger'
        ? 'bg-[#9C3E34] text-white hover:bg-[#892F26]'
        : 'bg-[#591902] text-white hover:opacity-90'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-1 rounded-[8px] px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass} ${className}`}
    >
      {children}
    </button>
  )
}

export function EmptyState({ title, body }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#D6CDC3] bg-[#F7F5F2] px-5 py-8 text-center">
      <p className="text-lg font-medium text-[#2E2E2E]">{title}</p>
      <p className="mt-2 text-sm text-[#6B7280]">{body}</p>
    </div>
  )
}

export function LoadingState({ label = 'Loading admin data...' }) {
  return (
    <div className="rounded-3xl border border-[#E7E0DA] bg-[#F3F3F3] px-6 py-6 text-sm text-[#4B5563]">
      {label}
    </div>
  )
}

export function ErrorState({ label = 'This section could not be loaded yet.' }) {
  return (
    <div className="rounded-3xl border border-[#F1B7B7] bg-[#FFF3F3] px-6 py-6 text-sm text-[#8A1C1C]">
      {label}
    </div>
  )
}

export function FieldList({ items }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(item => (
        <div key={item.label} className="rounded-2xl bg-white p-4 shadow-[0_1px_0_rgba(17,24,39,0.03)]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">{item.label}</p>
          <p className="mt-2 text-sm text-[#2E2E2E]">{item.value || 'Not available'}</p>
        </div>
      ))}
    </div>
  )
}

export function ListCount({ label, count }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#E4DED8] bg-white px-3 py-1 text-xs text-[#6B7280]">
      <span>{label}</span>
      <span className="font-medium text-[#2E2E2E]">{formatCount(count)}</span>
    </div>
  )
}
