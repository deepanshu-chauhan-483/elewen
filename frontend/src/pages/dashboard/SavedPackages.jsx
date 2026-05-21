import { Link } from 'react-router-dom'
import { useDashboardSearch } from '../../components/dashboard/useDashboardSearch'
import { DashboardEmptyState } from '../../components/dashboard/DashboardUI'
import { useWishlist } from '../../hooks/useWishlist'
import {
  formatDashboardCurrency,
  matchesDashboardSearch,
} from '../../components/dashboard/dashboardUtils'
import EmptyBooking from '../../components/dashboard/EmptyBooking'

function getPackageHref(item) {
  const serviceSlug = String(item?.serviceCategories?.[0]?.slug ?? '')
    .trim()
    .toLowerCase()
    .replace(/-single$/, '')
    .replace(/-services?$/, '')

  const packageId = item?.package?.documentId || item?.packageDocumentId || item?.packageId

  if (serviceSlug === 'decor') return `/packages/decor-single/${packageId}`
  if (serviceSlug === 'sheesha') return `/packages/sheesha-single/${packageId}`
  if (serviceSlug) return `/packages/${serviceSlug}/${packageId}`

  return '/package-listing'
}

// function HeartIcon() {
//   return (
//     <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
//       <path d="M8 13.9l-1-.9C3.1 9.3 1 7.5 1 5.2 1 3.3 2.5 2 4.3 2c1 0 2 .5 2.7 1.2C7.7 2.5 8.7 2 9.7 2 11.5 2 13 3.3 13 5.2c0 2.3-2.1 4.1-6 7.8l-1 .9z" />
//     </svg>
//   )
// }

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.33325 8.00065H12.6666M12.6666 8.00065L7.99992 3.33398M12.6666 8.00065L7.99992 12.6673"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[#EDE5DA] bg-white overflow-hidden animate-pulse">
      <div className="flex flex-col lg:flex-row">
        <div className="h-52 lg:h-auto lg:w-64 bg-[#EDE5DA] flex-shrink-0" />
        <div className="flex-1 p-6 space-y-4">
          <div className="h-4 bg-[#EDE5DA] rounded-full w-1/3" />
          <div className="h-3 bg-[#EDE5DA] rounded-full w-1/2" />
          <div className="flex gap-2 pt-2">
            <div className="h-3 bg-[#EDE5DA] rounded-full w-16" />
            <div className="h-3 bg-[#EDE5DA] rounded-full w-20" />
          </div>
          <div className="flex gap-3 pt-4">
            <div className="h-10 bg-[#EDE5DA] rounded-full w-36" />
            <div className="h-10 bg-[#EDE5DA] rounded-full w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PackageCard({ item, isPending, onRemove }) {
  const href = getPackageHref(item)

  return (
    <div className="group relative rounded-2xl border border-[#EDE5DA] bg-white overflow-hidden transition-all duration-300">
      <div className="flex flex-col lg:flex-row">
        {/* ── Image panel ── */}
        <div className="relative h-52 lg:h-auto lg:w-64 flex-shrink-0 overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title || 'Saved package'}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#E7DDCF] to-[#D4C4B0] flex items-center justify-center">
              <span className="text-sm text-[#8C4A22]/70 text-center px-4 leading-relaxed">
                {item.title || 'Saved package'}
              </span>
            </div>
          )}

          {/* Saved badge */}
          {/* <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-[#C6A15B] text-xs font-semibold px-2.5 py-1 rounded-full border border-[#C6A15B]/30">
            <HeartIcon />
            Saved
          </div> */}
        </div>

        {/* ── Content panel ── */}
        <div className="flex flex-1 flex-col justify-between p-5 lg:p-6">
          {/* Top: title, category, price */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Category tags */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {(item.serviceCategories || []).map(cat => (
                  <span
                    key={cat.id || cat.slug}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FBF7F3] border border-[#EDE5DA] text-[10px] uppercase tracking-widest text-[#CDB17E]"
                    style={{ fontFamily: 'Poppins' }}
                  >
                    {cat.name}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h3
                className="text-[17px] font-semibold text-[#2E1A0E] leading-snug tracking-tight"
                style={{ fontFamily: 'Poppins' }}
              >
                {item.title || 'Saved Package'}
              </h3>

              {/* Event suitability */}
              <p className="mt-1.5 text-sm text-[#9C8878] leading-relaxed">
                {item.events?.[0]?.name
                  ? `Best suited for ${item.events[0].name}.`
                  : 'Saved for later review.'}
              </p>
            </div>

            {/* Price block */}
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A89080] mb-1">
                Starting from
              </p>
              <p className="text-xl font-bold text-[#1C1C1C] leading-none">
                {formatDashboardCurrency(item.basePrice)}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-[#F4EEE8]" />

          {/* Bottom: CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={href}
              className="inline-flex items-center gap-2 bg-[#CDB17E] hover:bg-[#C6AB7F] text-[#F5E6CC] text-sm px-5 py-2.5 rounded-full transition-colors duration-200"
            >
              Resume Booking
              <ArrowIcon />
            </Link>

            <button
              type="button"
              disabled={isPending}
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 border border-[#EDE5DA] bg-[#FFFFFF] text-[#9C8878] hover:bg-[#FAF6F1] hover:border-[#E7D3BC] text-sm px-5 py-2.5 rounded-full transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Updating…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 2l10 10M12 2L2 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Remove
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SavedPackages() {
  const { wishlist = [], isLoading, toggleSavedPackage, pendingPackageId } = useWishlist()
  const { searchTerm } = useDashboardSearch()
  const filteredWishlist = wishlist.filter(item =>
    matchesDashboardSearch(searchTerm, [
      item?.title,
      item?.events?.[0]?.name,
      ...(item?.serviceCategories ?? []).map(category => category?.name),
    ])
  )

  if (!isLoading && wishlist.length === 0) {
    return (
      <EmptyBooking
        title="Nothing saved yet"
        body="Use the heart icon on package cards and your saved shortlist will appear here."
        actionLabel="Browse Packages"
        actionTo="/package-listing"
      />
    )
  }

  if (!isLoading && !filteredWishlist.length) {
    return (
      <DashboardEmptyState
        title="No saved packages match your search"
        body="Try searching by package name, event, or service category."
      />
    )
  }

  return (
    <div className="min-h-screen ">
      {/* ── Page header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1.5">
          <h1 className="text-2xl text-[#2E2E2E]">Saved Packages</h1>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#8C7B6B]">
            Pick up where you left off on packages you bookmarked for later.
          </p>
          {!isLoading && wishlist.length > 0 && (
            <span className="text-xs font-semibold text-[#C6A15B] bg-[#FBF7F3] border border-[#EDE5DA] px-3 py-1 rounded-full">
              {filteredWishlist.length} saved
            </span>
          )}
        </div>
      </div>

      {/* ── Loading skeletons ── */}
      {isLoading && (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* ── Package cards ── */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredWishlist.map(item => {
            const isPending = String(pendingPackageId) === String(item.packageId)
            return (
              <PackageCard
                key={item.id || item.packageId}
                item={item}
                isPending={isPending}
                onRemove={() => toggleSavedPackage({ packageId: item.packageId })}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
