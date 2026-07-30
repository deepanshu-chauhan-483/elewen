import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePackageById } from '../hooks/usePackages'
import BartendingAddonMedia from '../components/bartending/BartendingAddonMedia'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'

function formatCurrency(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return ''
  return `₹${amount.toLocaleString('en-IN')}`
}

function BackArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M12.5 15L7.5 10L12.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function BartendingAddonDetailPage() {
  const { packageId, addonId } = useParams()
  const navigate = useNavigate()
  const packageQuery = usePackageById(packageId)
  const { data: pkg } = packageQuery
  const isStrapiLoading = useStrapiPageLoading(packageQuery)

  const addon = useMemo(() => {
    if (!pkg) return null
    const addons = Array.isArray(pkg.detail_addons) ? pkg.detail_addons : []
    return addons.find(a => String(a.id) === String(addonId)) ?? null
  }, [pkg, addonId])

  if (isStrapiLoading) {
    return <CmsPageLoader />
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
          <p className="truncate text-[12px] text-[#9D7B58]">
            {pkg?.title ?? 'Bartending Package'}
          </p>
          <h1 className="truncate text-[16px] font-medium text-[#2D2D2D]">{addon.name}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-16 pt-6">
        {/* Illustration card */}
        <div className="flex h-[180px] items-center justify-center overflow-hidden rounded-[16px] bg-white text-[#957960] shadow-sm">
          <BartendingAddonMedia
            name={addon.name}
            image={addon.image}
            size={64}
            className="h-full w-full"
            imgClassName="h-full w-full object-cover"
          />
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
