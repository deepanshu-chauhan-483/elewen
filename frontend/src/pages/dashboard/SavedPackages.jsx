import { Link } from 'react-router-dom'
import {
  DashboardEmptyState,
  DashboardPageIntro,
  SectionCard,
} from '../../components/dashboard/DashboardUI'
import { useWishlist } from '../../hooks/useWishlist'
import { formatDashboardCurrency } from '../../components/dashboard/dashboardUtils'

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

export default function SavedPackages() {
  const { wishlist = [], isLoading, toggleSavedPackage, pendingPackageId } = useWishlist()

  return (
    <div className="space-y-6 hide-scrollbar py-6">
      <DashboardPageIntro
        title="Saved Packages"
        subtitle="Pick up where you left off on packages you bookmarked for later."
        meta={`${wishlist.length} saved`}
      />

      {isLoading ? (
        <SectionCard
          title="Loading saved packages"
          subtitle="Fetching your latest wishlist picks."
        />
      ) : null}

      {!isLoading && wishlist.length === 0 ? (
        <DashboardEmptyState
          title="Nothing saved yet"
          body="Use the heart icon on package cards and your saved shortlist will appear here."
          actionLabel="Browse Packages"
          actionTo="/package-listing"
        />
      ) : null}

      {wishlist.map(item => {
        const isPending = String(pendingPackageId) === String(item.packageId)

        return (
          <SectionCard
            key={item.id || item.packageId}
            title={item.title || 'Saved Package'}
            subtitle={item.serviceCategories?.[0]?.name || 'Package shortlist'}
            action={
              <div className="text-right">
                <p className="text-sm text-[#8F8F8F]">Starting from</p>
                <p className="mt-1 text-base text-[#2E2E2E]">
                  {formatDashboardCurrency(item.basePrice)}
                </p>
              </div>
            }
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title || 'Saved package'}
                  className="h-44 w-full rounded-3xl object-cover lg:w-72"
                />
              ) : (
                <div className="flex h-44 w-full items-center justify-center rounded-3xl bg-[#E7DDCF] text-sm text-[#8C4A22] lg:w-72">
                  {item.title || 'Saved package'}
                </div>
              )}

              <div className="flex-1 space-y-3">
                <p className="text-sm text-[#6B7280]">
                  {item.events?.[0]?.name
                    ? `Best suited for ${item.events[0].name}.`
                    : 'Saved for later review.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(item.serviceCategories || []).map(category => (
                    <span
                      key={category.id || category.slug}
                      className="rounded-full bg-white px-3 py-1 text-xs text-[#591902]"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    to={getPackageHref(item)}
                    className="rounded-full bg-[#C6A15B] px-5 py-3 text-sm text-white transition hover:opacity-90"
                  >
                    Resume Package →
                  </Link>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => toggleSavedPackage({ packageId: item.packageId })}
                    className="rounded-full border border-[#D2C9BF] px-5 py-3 text-sm text-[#591902] transition hover:border-[#591902] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? 'Updating...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>
        )
      })}
    </div>
  )
}
