import { useMemo } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { usePackages } from '../hooks/usePackages'

const CART_META_SEPARATOR = '||__ELEWEN_META__||'

function formatCurrency(value) {
  const amount = Number(value ?? 0)
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDisplayDate(value) {
  if (!value) return 'Select date'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Select date'

  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function normalizeServiceSlug(value = '') {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/-single$/, '')
    .replace(/-services?$/, '')
}

function parseCartItemTitle(value = '') {
  const rawTitle = String(value ?? '')
  const [displayTitle, metaPart] = rawTitle.split(CART_META_SEPARATOR)

  if (!metaPart) {
    return {
      displayTitle: displayTitle || rawTitle,
      selectedOptions: {},
    }
  }

  try {
    const parsed = JSON.parse(metaPart)
    return {
      displayTitle: displayTitle || rawTitle,
      selectedOptions:
        parsed?.selectedOptions && typeof parsed.selectedOptions === 'object'
          ? parsed.selectedOptions
          : {},
    }
  } catch {
    return {
      displayTitle: displayTitle || rawTitle,
      selectedOptions: {},
    }
  }
}

function getSelectedElements(item) {
  const selectedOptions = item?.selectedOptions ?? {}
  const selectedElements = Object.entries(selectedOptions)
    .map(([label, value]) => ({
      title: value,
      desc: label,
    }))
    .filter(element => element.title && element.desc)

  if (selectedElements.length) return selectedElements

  return (item?.packageData?.detail_inclusions ?? []).slice(0, 4).map(highlight => ({
    title: highlight,
    desc: 'Included with this package',
  }))
}

function getCartPackageHref(pkg, selectedOptions = {}, cartItemId = '') {
  const packageId = pkg?.documentId ?? pkg?.id
  const serviceSlug = normalizeServiceSlug(pkg?.service_slugs?.[0] ?? '')
  const params = new URLSearchParams()

  if (selectedOptions && Object.keys(selectedOptions).length) {
    params.set(
      'selectedOptions',
      JSON.stringify(Object.fromEntries(Object.entries(selectedOptions).filter(([, value]) => Boolean(value))))
    )
  }

  if (cartItemId) {
    params.set('cartItemId', String(cartItemId))
  }

  const queryString = params.toString()

  if (!packageId || !serviceSlug) return ''

  if (serviceSlug === 'decor') {
    const basePath = `/packages/decor-single/${packageId}`
    return queryString ? `${basePath}?${queryString}` : basePath
  }

  if (serviceSlug === 'sheesha') {
    const basePath = `/packages/sheesha-single/${packageId}`
    return queryString ? `${basePath}?${queryString}` : basePath
  }

  const basePath = `/packages/${serviceSlug}/${packageId}`
  return queryString ? `${basePath}?${queryString}` : basePath
}

export default function SinglePackageCheckout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { cart, loading, isLoggedIn } = useCart()
  const { data: packages = [] } = usePackages()
  const itemId = searchParams.get('itemId') ?? ''

  const packageLookup = useMemo(
    () => new Map(packages.map(pkg => [String(pkg.id), pkg])),
    [packages]
  )

  const item = useMemo(() => {
    const cartItem = (cart?.items ?? []).find(entry => entry.id === itemId)
    if (!cartItem) return null

    const parsedTitle = parseCartItemTitle(cartItem.title)
    return {
      ...cartItem,
      displayTitle: parsedTitle.displayTitle,
      selectedOptions: parsedTitle.selectedOptions,
      packageData: packageLookup.get(String(cartItem.packageId)) ?? null,
    }
  }, [cart?.items, itemId, packageLookup])

  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (!loading && !item) return <Navigate to="/cart" replace />
  if (!item) return null

  const elements = getSelectedElements(item)
  const packageTitle = item.packageData?.title || item.displayTitle || 'Package'
  const packageImage = item.packageData?.images?.[0] ?? ''
  const packageSubtitle = item.packageData?.service_slugs?.[0]
    ? item.packageData.service_slugs[0].replace(/-/g, ' ')
    : 'Selected package'
  const eventLocation = cart?.eventCity || 'Add city / area'
  const eventDate = formatDisplayDate(cart?.eventDate)
  const packageHref = getCartPackageHref(item.packageData, item.selectedOptions, item.id)
  const advancePayable = Number(item.totalPrice ?? 0) * 0.3
  const balanceDue = Number(item.totalPrice ?? 0) - advancePayable

  return (
    <div className="min-h-screen bg-white px-4 py-8 md:px-8 md:pt-24 lg:px-16">
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold text-[#1C1C1C] md:text-[36px]">Package Details</h1>
        <p className="mt-1 text-[12px] text-gray-500 md:text-[16px]">
          Review what&apos;s included in your selected package.
        </p>
      </div>

      <div className="flex flex-col gap-[clamp(24px,5vw,100px)] lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-[#95796066] p-4">
            <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl bg-[#957960]" />
            <div className="ml-2 h-20 w-20 overflow-hidden rounded-lg bg-gray-200">
              {packageImage ? (
                <img src={packageImage} alt={packageTitle} className="h-full w-full object-cover" />
              ) : null}
            </div>

            <div>
              <p className="text-sm text-gray-500">{packageSubtitle}</p>
              <h3 className="font-medium text-lg">{packageTitle}</h3>
              <p className="text-sm text-gray-500">
                {eventLocation} · {eventDate}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#95796066]">
            <div className="flex justify-between bg-[#F8F4ED] px-4 py-3">
              <h3 className="font-medium">Selected Elements</h3>
              <span className="text-sm text-gray-500">{elements.length} elements</span>
            </div>

            <div className="space-y-4 p-4">
              {elements.map(element => (
                <div
                  key={`${element.desc}-${element.title}`}
                  className="flex border-b border-[#00000033] pb-3 last:border-none last:pb-0"
                >
                  <div className="p-2">
                    <svg
                      width="6"
                      height="6"
                      viewBox="0 0 6 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="3" cy="3" r="3" fill="#D5D5D5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#2C2C2C]">{element.title}</p>
                    <p className="text-sm text-gray-500">{element.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#95796066]">
            <div className="bg-[#F8F4ED] px-4 py-3">
              <h3 className="font-medium">Event Details</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
              <div className="flex justify-between rounded-lg bg-[#F5F5F5] p-4">
                <div>
                  <p className="text-sm text-gray-500">City / Area</p>
                  <p className="font-medium">{eventLocation}</p>
                </div>
                <span className="text-sm text-[#957960]">Saved on cart</span>
              </div>

              <div className="flex justify-between rounded-lg bg-[#F3F3F3] p-4">
                <div>
                  <p className="text-sm text-gray-500">Event Date</p>
                  <p className="font-medium">{eventDate}</p>
                </div>
                <span className="text-sm text-[#957960]">Saved on cart</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="overflow-hidden rounded-xl border border-[#95796066]">
            <div className="bg-[#222815] px-4 py-3 text-white">
              <h3 className="font-medium">Price Summary</h3>
            </div>

            <div className="space-y-3 p-4 text-sm">
              <div className="flex justify-between font-medium">
                <span>Base Package — {packageTitle}</span>
                <span>{formatCurrency(item.unitPrice)}</span>
              </div>

              <hr className="my-4 border-[#0000001A]" />

              {elements.map(element => (
                <div key={element.title} className="flex justify-between text-gray-600">
                  <span>{element.title}</span>
                  <span>Included</span>
                </div>
              ))}

              <hr className="my-4 border-[#0000001A]" />

              <div className="flex justify-between rounded-lg bg-[#F8F4ED] px-4 py-3 font-medium">
                <span>Total Amount</span>
                <span>{formatCurrency(item.totalPrice)}</span>
              </div>

              <div className="flex justify-between rounded-lg bg-[#F1F1F1] px-4 py-3 font-medium">
                <span>Advance Payable (30%)</span>
                <span>{formatCurrency(advancePayable)}</span>
              </div>

              <p className="text-xs text-gray-500">
                Balance: {formatCurrency(balanceDue)} due on event day
              </p>
            </div>
          </div>

          <div className="mt-10 flex w-full flex-row gap-4">
            <button
              onClick={() => navigate('/cart')}
              className="rounded-full bg-gray-200 px-6 py-3 text-gray-700"
            >
              Back to Cart
            </button>

            {packageHref ? (
              <Link to={packageHref} className="rounded-full bg-[#2E3A1F] px-6 py-3 text-white">
                Edit Package
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
