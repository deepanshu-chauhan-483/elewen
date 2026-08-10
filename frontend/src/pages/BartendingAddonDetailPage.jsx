import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../components/common/useToast'
import BartendingAddonMedia from '../components/bartending/BartendingAddonMedia'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useCart } from '../hooks/useCart'
import { usePackageById } from '../hooks/usePackages'
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

function PreviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M1.5 8C2.55 5.67 4.86 4 8 4s5.45 1.67 6.5 4c-1.05 2.33-3.36 4-6.5 4S2.55 10.33 1.5 8Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.9" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export default function BartendingAddonDetailPage() {
  const { packageId, addonId } = useParams()
  const navigate = useNavigate()
  const packageQuery = usePackageById(packageId)
  const { data: pkg } = packageQuery
  const isStrapiLoading = useStrapiPageLoading(packageQuery)
  const { addPackage } = useCart()
  const { showToast } = useToast()
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [addError, setAddError] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const addon = useMemo(() => {
    if (!pkg) return null
    const addons = Array.isArray(pkg.detail_addons) ? pkg.detail_addons : []
    return addons.find(a => String(a.id) === String(addonId)) ?? null
  }, [pkg, addonId])

  const handleAddToCart = async () => {
    const numericPackageId = Number(pkg?.id)
    if (!Number.isFinite(numericPackageId) || !addon) {
      setAddError('Could not add this add-on to cart. Please go back and try again.')
      return
    }

    setAddError('')
    setIsAddingToCart(true)
    try {
      await addPackage({
        packageId: numericPackageId,
        quantity: 1,
        addon,
      })
      showToast({ message: `${addon.name} added to cart.` })
    } catch (err) {
      console.error('[bartending-addon-detail] add to cart failed', err)
      setAddError('Could not add this add-on to cart. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

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
        <div className="relative flex justify-center">
          <BartendingAddonMedia
            name={addon.name}
            image={addon.image}
            size={64}
            className="flex h-[320px] w-[280px] items-center justify-center"
            imgClassName="block max-h-[320px] max-w-[280px] object-contain object-center"
          />
          {addon.image ? (
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="absolute right-6 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#7B330B] shadow-sm"
              aria-label={`Preview ${addon.name} image`}
              title="Preview"
            >
              <PreviewIcon />
            </button>
          ) : null}
        </div>

        <div className="mt-5">
          <h2 className="text-[22px] font-medium leading-tight text-[#2D2D2D]">{addon.name}</h2>
          <p className="mt-2 text-[20px] font-semibold text-[#591902]">
            {formatCurrency(addon.price)}
          </p>
        </div>

        {addon.description ? (
          <div className="mt-5 rounded-[12px] border border-[#E8DDD0] bg-white p-4">
            <p className="text-[13px] font-semibold text-[#2D2D2D]">About this add-on</p>
            <p className="mt-2 text-[13px] leading-[1.6] text-[#6B5B4D]">{addon.description}</p>
          </div>
        ) : null}

        {addon.unit ? (
          <div className="mt-3 rounded-[12px] border border-[#E8DDD0] bg-white p-4">
            <p className="text-[13px] font-semibold text-[#2D2D2D]">Unit</p>
            <p className="mt-1 text-[13px] text-[#6B5B4D]">{addon.unit}</p>
          </div>
        ) : null}

        {addError ? (
          <p className="mt-4 text-[12px] leading-[1.5] text-[#591902] opacity-80">{addError}</p>
        ) : null}

        <button
          type="button"
          disabled={isAddingToCart}
          onClick={handleAddToCart}
          className="mt-8 flex w-full items-center justify-center rounded-full bg-[#D4B173] py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#C5A365] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isAddingToCart ? 'Adding...' : 'Add to cart'}
        </button>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-3 flex w-full items-center justify-center rounded-full border border-[#957960] bg-white py-3 text-[14px] font-medium text-[#957960]"
        >
          Back to Package
        </button>
      </div>

      {isPreviewOpen && addon.image ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${addon.name} preview`}
          onClick={() => setIsPreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsPreviewOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
            aria-label="Close preview"
          >
            ×
          </button>
          <img
            src={addon.image}
            alt={addon.name}
            className="max-h-[90vh] max-w-full object-contain"
            onClick={event => event.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  )
}
