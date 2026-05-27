import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePackageById } from '../hooks/usePackages'

function formatCurrency(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return ''
  return `₹${amount.toLocaleString('en-IN')}`
}

function AddonIllustration({ name = '' }) {
  const normalized = String(name).toLowerCase()

  if (normalized.includes('wine')) {
    return (
      <svg width="64" height="64" viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M15 5h12v6a6 6 0 1 1-12 0V5Z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M21 17v11M17 33h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }

  if (normalized.includes('cocktail') || normalized.includes('mocktail')) {
    return (
      <svg width="64" height="64" viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M11 10h20l-10 10-10-10Z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M21 20v10M16 33h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="m27 8 4-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }

  if (normalized.includes('whiskey') || normalized.includes('glass')) {
    return (
      <svg width="64" height="64" viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M12 10h18l-2 18H14l-2-18Z" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    )
  }

  if (normalized.includes('ingredient') || normalized.includes('bill')) {
    return (
      <svg width="64" height="64" viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M16 8h10l4 6v16H12V8h4Z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M26 8v6h6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M17 21h8M17 25h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }

  if (normalized.includes('bar')) {
    return (
      <svg width="64" height="64" viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M9 16h24v8H9v-8Z" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M12 24v8M30 24v8M16 12v4M21 10v6M26 12v4"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg width="64" height="64" viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <path
        d="M16 6h10l4 8v14a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V14l4-8Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M16 14h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function BackArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function BartendingAddonDetailPage() {
  const { packageId, addonId } = useParams()
  const navigate = useNavigate()
  const { data: pkg, isLoading } = usePackageById(packageId)

  const addon = useMemo(() => {
    if (!pkg) return null
    const addons = Array.isArray(pkg.detail_addons) ? pkg.detail_addons : []
    return addons.find(a => String(a.id) === String(addonId)) ?? null
  }, [pkg, addonId])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F4ED]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#957960] border-t-transparent" />
      </div>
    )
  }

  if (!addon) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8F4ED] px-6">
        <p className="text-[16px] text-[#591902]">Add-on details not found.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full bg-[#957960] px-6 py-2.5 text-sm text-white"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#E8DDD0] bg-[#F8F4ED] px-4 py-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#591902] shadow-sm"
          aria-label="Go back"
        >
          <BackArrow />
        </button>
        <div className="min-w-0">
          <p className="truncate text-[12px] text-[#9D7B58]">{pkg?.title ?? 'Bartending Package'}</p>
          <h1 className="truncate text-[16px] font-medium text-[#2D2D2D]">{addon.name}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-16 pt-6">
        {/* Illustration card */}
        <div className="flex h-[180px] items-center justify-center rounded-[16px] bg-white text-[#957960] shadow-sm">
          <AddonIllustration name={addon.name} />
        </div>

        {/* Name + price */}
        <div className="mt-5">
          <h2 className="text-[22px] font-medium leading-tight text-[#2D2D2D]">{addon.name}</h2>
          <p className="mt-2 text-[20px] font-semibold text-[#591902]">
            {formatCurrency(addon.price)}
          </p>
        </div>

        {/* Description */}
        {addon.description ? (
          <div className="mt-5 rounded-[12px] border border-[#E8DDD0] bg-white p-4">
            <p className="text-[13px] font-semibold text-[#2D2D2D]">About this add-on</p>
            <p className="mt-2 text-[13px] leading-[1.6] text-[#6B5B4D]">{addon.description}</p>
          </div>
        ) : null}

        {/* Unit info */}
        {addon.unit ? (
          <div className="mt-3 rounded-[12px] border border-[#E8DDD0] bg-white p-4">
            <p className="text-[13px] font-semibold text-[#2D2D2D]">Unit</p>
            <p className="mt-1 text-[13px] text-[#6B5B4D]">{addon.unit}</p>
          </div>
        ) : null}

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-8 flex w-full items-center justify-center rounded-full border border-[#957960] bg-white py-3 text-[14px] font-medium text-[#957960]"
        >
          Back to Package
        </button>
      </div>
    </div>
  )
}
