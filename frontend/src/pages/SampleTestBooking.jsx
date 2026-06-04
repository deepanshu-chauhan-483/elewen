import { useCallback, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { usePackages } from '../hooks/usePackages'
import { getCateringDetailSection, getCateringPricePerPerson } from '../lib/cateringPricing'
import { normalizeServiceSlug } from '../lib/packageFilters'

const SAMPLE_TASTE_SERVICE_SLUGS = new Set(['catering', 'bartending'])
const CART_META_SEPARATOR = '||__ELEWEN_META__||'
const EXPRESS_DELIVERY_FEE = 300
const GST_RATE = 0.18
const DELIVERY_FEE = 80

function parseCartItemTitle(value = '') {
  const rawTitle = String(value ?? '')
  const [displayTitle, metaPart] = rawTitle.split(CART_META_SEPARATOR)

  if (!metaPart) {
    return { displayTitle: displayTitle || rawTitle, selectedOptions: {} }
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
    return { displayTitle: displayTitle || rawTitle, selectedOptions: {} }
  }
}

const blocksToText = blocks => {
  if (!blocks) return ''
  if (typeof blocks === 'string') return blocks
  if (!Array.isArray(blocks)) return ''

  return blocks
    .map(block => (block.children ?? []).map(child => child.text ?? '').join(''))
    .filter(Boolean)
    .join(' ')
}

function formatCurrency(value) {
  const amount = Number(value ?? 0)
  return `Rs${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

function formatSessionDate(value) {
  if (!value) return 'Date pending'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date pending'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getServiceLabel(pkg) {
  const slug = normalizeServiceSlug(pkg?.service_slugs?.[0] ?? '')
  if (!slug) return 'Package'
  return slug.replace(/\b\w/g, char => char.toUpperCase())
}

function getBartendingDetailSection(pkg) {
  return (pkg?.detail_sections ?? []).find(
    section => section?.__component === 'package.bartendingpackage'
  )
}

function getPackageUnitPrice(pkg, selectedOptions = {}) {
  const vegPreference = selectedOptions?.Veg ?? selectedOptions?.veg ?? ''
  const cateringSection = getCateringDetailSection(pkg)
  if (cateringSection) {
    return getCateringPricePerPerson(cateringSection, vegPreference, pkg?.base_price ?? 0)
  }

  return Number(pkg?.base_price ?? 0)
}

function getPackageDescription(pkg) {
  const cateringSection = getCateringDetailSection(pkg)
  const fromCatering =
    cateringSection?.level_description ||
    cateringSection?.service_style_notes ||
    cateringSection?.package_subtitle

  if (fromCatering) return String(fromCatering)

  const fromPackage = blocksToText(pkg?.description) || String(pkg?.description ?? '').trim()
  return fromPackage || 'Selected from your cart for tasting.'
}

function getMenuItemDescription(menuItem) {
  const details = String(menuItem?.details ?? '').trim()
  const chooseHint = String(menuItem?.choose_hint ?? '').trim()
  const rowType = String(menuItem?.row_type ?? 'choose').toLowerCase()

  if (details) return details
  if (chooseHint) return chooseHint
  if (rowType === 'included') return 'Included with your package menu'
  return 'Tasting portion from this menu selection'
}

function getTastingPortionPrice(unitPrice, portionCount) {
  const count = Math.max(1, portionCount)
  return Math.max(80, Math.round(Number(unitPrice ?? 0) / (count * 4)))
}

function findMenuSelectionValue(selectedOptions = {}, menuItem, index) {
  const title = String(menuItem?.title ?? '').trim()
  const candidateKeys = new Set([`menu-${index}-${title}`, title, `menu-info-${index}-${title}`])

  for (const [key, value] of Object.entries(selectedOptions)) {
    const normalizedKey = String(key ?? '').trim()
    if (!normalizedKey || candidateKeys.has(normalizedKey)) {
      return String(value ?? '').trim()
    }
    if (title && (normalizedKey.includes(title) || normalizedKey.startsWith('menu-'))) {
      return String(value ?? '').trim()
    }
  }

  return ''
}

function splitMenuSelectionDishes(value = '') {
  return String(value)
    .split(/,\s*/)
    .map(part => part.trim())
    .filter(part => part && part.toLowerCase() !== 'selected')
}

function getCateringMenuItemsForTasting(pkg, selectedOptions = {}) {
  const cateringSection = getCateringDetailSection(pkg)
  const menuItems = Array.isArray(cateringSection?.menu_items) ? cateringSection.menu_items : []
  if (!menuItems.length) return []

  const unitPrice = getPackageUnitPrice(pkg, selectedOptions)
  const sortedMenuItems = [...menuItems].sort(
    (left, right) => Number(left?.sort_order ?? 0) - Number(right?.sort_order ?? 0)
  )
  const selectableRows = sortedMenuItems.filter(
    item => String(item?.row_type ?? 'choose').toLowerCase() !== 'info'
  )

  const tastingRows = []

  selectableRows.forEach((menuItem, index) => {
    const title = String(menuItem?.title ?? '').trim()
    if (!title) return

    const cartSelection = findMenuSelectionValue(selectedOptions, menuItem, index)
    const dishes = splitMenuSelectionDishes(cartSelection)

    if (dishes.length > 0) {
      dishes.forEach((dish, dishIndex) => {
        tastingRows.push({
          id: `${pkg?.id ?? 'pkg'}-menu-${menuItem?.id ?? index}-dish-${dishIndex}`,
          name: dish,
          desc: `From ${title}`,
          price: getTastingPortionPrice(unitPrice, selectableRows.length * dishes.length),
          menuGroup: title,
        })
      })
      return
    }

    tastingRows.push({
      id: `${pkg?.id ?? 'pkg'}-menu-${menuItem?.id ?? index}`,
      name: title,
      desc: getMenuItemDescription(menuItem),
      price: getTastingPortionPrice(unitPrice, selectableRows.length),
      rowType: menuItem?.row_type,
      menuGroup: title,
    })
  })

  return tastingRows
}

function getBartendingFlavorItems(pkg, selectedOptions = {}) {
  const flavors = Array.isArray(pkg?.flavor_options) ? pkg.flavor_options : []
  const unitPrice = getPackageUnitPrice(pkg, selectedOptions)

  if (!flavors.length) return []

  return flavors
    .map((flavor, index) => {
      const name = String(flavor?.title ?? flavor?.name ?? '').trim()
      if (!name) return null

      return {
        id: `${pkg?.id ?? 'pkg'}-flavor-${index}`,
        name,
        desc: String(flavor?.description ?? '').trim() || 'Tasting portion',
        price: getTastingPortionPrice(unitPrice, flavors.length),
      }
    })
    .filter(Boolean)
}

function getInclusionsFromSection(section, pkg, selectedOptions) {
  const inclusions = Array.isArray(section?.inclusions) ? section.inclusions : []
  const unitPrice = getPackageUnitPrice(pkg, selectedOptions)

  return inclusions
    .map((inc, index) => {
      const name = String(inc?.text ?? inc?.title ?? inc?.name ?? '').trim()
      if (!name) return null

      return {
        id: `${pkg?.id ?? 'pkg'}-inc-${inc?.id ?? index}`,
        name,
        desc: 'Included in your selected package',
        price: getTastingPortionPrice(unitPrice, inclusions.length),
      }
    })
    .filter(Boolean)
}

function getPackageItems(pkg, selectedOptions = {}) {
  const cateringSection = getCateringDetailSection(pkg)
  if (cateringSection) {
    const menuTastingItems = getCateringMenuItemsForTasting(pkg, selectedOptions)
    if (menuTastingItems.length > 0) return menuTastingItems
  }

  const bartendingFlavors = getBartendingFlavorItems(pkg, selectedOptions)
  if (bartendingFlavors.length > 0) return bartendingFlavors

  const bartendingSection = getBartendingDetailSection(pkg)
  if (bartendingSection) {
    const bartendingItems = getInclusionsFromSection(bartendingSection, pkg, selectedOptions)
    if (bartendingItems.length > 0) return bartendingItems
  }

  const breakdownSource = Array.isArray(pkg?.detail_price_breakdown)
    ? pkg.detail_price_breakdown
    : []

  const breakdownItems = breakdownSource
    .map((entry, index) => {
      const label =
        entry?.label ??
        entry?.title ??
        entry?.name ??
        entry?.text ??
        entry?.description ??
        entry?.item ??
        ''

      const amountValue =
        entry?.amount ??
        entry?.price ??
        entry?.value ??
        entry?.cost ??
        entry?.total ??
        entry?.rate ??
        entry?.base_price

      const amount = Number(String(amountValue ?? '').replace(/[^0-9.-]+/g, ''))
      const unitPrice = getPackageUnitPrice(pkg, selectedOptions)

      return label
        ? {
            id: `${pkg?.id ?? 'pkg'}-breakdown-${index}`,
            name: label,
            desc: 'Menu selection',
            price:
              Number.isFinite(amount) && amount > 0
                ? amount
                : getTastingPortionPrice(unitPrice, breakdownSource.length || 1),
          }
        : null
    })
    .filter(Boolean)

  if (breakdownItems.length > 0) return breakdownItems

  const unitPrice = getPackageUnitPrice(pkg, selectedOptions)

  const inclusionTexts = (
    Array.isArray(pkg?.detail_inclusions) ? pkg.detail_inclusions : []
  ).filter(Boolean)

  return inclusionTexts.map((text, index) => ({
    id: `${pkg?.id ?? 'pkg'}-detail-inc-${index}`,
    name: String(text),
    desc: 'Menu selection',
    price: getTastingPortionPrice(unitPrice, inclusionTexts.length),
  }))
}

function getDefaultSelectedIds(items) {
  if (!items.length) return []
  if (items.length <= 4) return items.map(item => item.id)
  return items.slice(0, 4).map(item => item.id)
}

function mergeSelectionsForPackages(prev, tastingPackages) {
  const next = { ...prev }

  tastingPackages.forEach(pkg => {
    const validIds = new Set(pkg.items.map(item => item.id))
    const existing = next[pkg.id]

    if (!existing) {
      next[pkg.id] = {
        selectedIds: getDefaultSelectedIds(pkg.items),
        quantity: pkg.quantity,
      }
      return
    }

    next[pkg.id] = {
      selectedIds: existing.selectedIds.filter(id => validIds.has(id)),
      quantity: Math.max(1, Number(existing.quantity ?? pkg.quantity)),
    }

    if (!next[pkg.id].selectedIds.length && pkg.items.length) {
      next[pkg.id].selectedIds = getDefaultSelectedIds(pkg.items)
    }
  })

  Object.keys(next).forEach(key => {
    if (!tastingPackages.some(pkg => pkg.id === key)) {
      delete next[key]
    }
  })

  return next
}

function buildSelectedCountText(selectedCount, totalCount) {
  if (!totalCount) return '0 items selected'
  return `${selectedCount} of ${totalCount} items selected`
}

function getCartPackageHref(pkg, selectedOptions = {}, cartItemId = '') {
  const packageId = pkg?.documentId ?? pkg?.id
  const serviceSlug = normalizeServiceSlug(pkg?.service_slugs?.[0] ?? '')
  const params = new URLSearchParams()

  if (selectedOptions && Object.keys(selectedOptions).length) {
    params.set(
      'selectedOptions',
      JSON.stringify(
        Object.fromEntries(Object.entries(selectedOptions).filter(([, value]) => Boolean(value)))
      )
    )
  }

  if (cartItemId) {
    params.set('cartItemId', String(cartItemId))
  }

  const queryString = params.toString()

  if (!packageId || !serviceSlug) return '/cart'

  const slugPaths = {
    decor: `/packages/decor-single/${packageId}`,
    sheesha: `/packages/sheesha-single/${packageId}`,
    bartending: `/packages/bartending-single/${packageId}`,
    catering: `/packages/catering-single/${packageId}`,
  }

  const basePath = slugPaths[serviceSlug] ?? `/packages/${serviceSlug}/${packageId}`
  return queryString ? `${basePath}?${queryString}` : basePath
}

function buildTastingPackage({ item, pkg }) {
  const selectedOptions = item?.selectedOptions ?? {}
  const items = getPackageItems(pkg, selectedOptions)
  const quantity = Number(item?.quantity ?? 1)

  return {
    id: item.id,
    cartItemId: item.id,
    packageId: item.packageId ?? pkg?.id ?? '',
    documentId: pkg?.documentId ?? '',
    title: pkg?.title ?? item?.displayTitle ?? item?.title ?? 'Selected package',
    tag: getServiceLabel(pkg),
    desc: getPackageDescription(pkg),
    items,
    quantity,
    totalPrice: Number(item?.totalPrice ?? 0),
    unitPrice: getPackageUnitPrice(pkg, selectedOptions),
    selectedOptions,
    serviceSlug: normalizeServiceSlug(pkg?.service_slugs?.[0] ?? ''),
    packageData: pkg,
  }
}

function EditIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 2.50001H4.16667C3.72464 2.50001 3.30072 2.6756 2.98816 2.98816C2.67559 3.30072 2.5 3.72464 2.5 4.16667V15.8333C2.5 16.2754 2.67559 16.6993 2.98816 17.0118C3.30072 17.3244 3.72464 17.5 4.16667 17.5H15.8333C16.2754 17.5 16.6993 17.3244 17.0118 17.0118C17.3244 16.6993 17.5 16.2754 17.5 15.8333V10M15.3125 2.18751C15.644 1.85599 16.0937 1.66974 16.5625 1.66974C17.0313 1.66974 17.481 1.85599 17.8125 2.18751C18.144 2.51903 18.3303 2.96866 18.3303 3.43751C18.3303 3.90635 18.144 4.35598 17.8125 4.68751L10.3017 12.1992C10.1038 12.3969 9.85934 12.5416 9.59083 12.62L7.19667 13.32C7.12496 13.3409 7.04895 13.3422 6.97659 13.3236C6.90423 13.3051 6.83819 13.2675 6.78537 13.2146C6.73255 13.1618 6.69491 13.0958 6.67637 13.0234C6.65783 12.9511 6.65909 12.875 6.68 12.8033L7.38 10.4092C7.45877 10.1409 7.60378 9.89672 7.80167 9.69917L15.3125 2.18751Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.5 3V10C9.5 10.2652 9.39464 10.5196 9.20711 10.7071C9.01957 10.8946 8.76522 11 8.5 11H3.5C3.23478 11 2.98043 10.8946 2.79289 10.7071C2.60536 10.5196 2.5 10.2652 2.5 10V3M1.5 3H10.5M4 3V2C4 1.73478 4.10536 1.48043 4.29289 1.29289C4.48043 1.10536 4.73478 1 5 1H7C7.26522 1 7.51957 1.10536 7.70711 1.29289C7.89464 1.48043 8 1.73478 8 2V3"
        stroke="#FAFAFA"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function SampleTasteBooking() {
  const [selectedDelivery, setSelectedDelivery] = useState(true)
  const [selections, setSelections] = useState({})
  const navigate = useNavigate()
  const location = useLocation()
  const { cart, loading, removeItem } = useCart()
  const { data: packages = [] } = usePackages()

  const packageLookup = useMemo(
    () => new Map(packages.map(pkg => [String(pkg.id), pkg])),
    [packages]
  )

  const incomingSampleTasteItems = location.state?.sampleTasteItems
  const incomingItems = useMemo(
    () => (Array.isArray(incomingSampleTasteItems) ? incomingSampleTasteItems : []),
    [incomingSampleTasteItems]
  )

  const fallbackCartItems = useMemo(() => {
    const items = Array.isArray(cart?.items) ? cart.items : []

    return items
      .map(item => {
        const pkg = packageLookup.get(String(item.packageId)) ?? null
        const serviceSlug = normalizeServiceSlug(pkg?.service_slugs?.[0] ?? '')
        const parsedTitle = parseCartItemTitle(item.title)

        if (!SAMPLE_TASTE_SERVICE_SLUGS.has(serviceSlug)) return null

        return buildTastingPackage({
          item: {
            ...item,
            displayTitle: parsedTitle.displayTitle,
            selectedOptions: parsedTitle.selectedOptions,
          },
          pkg,
        })
      })
      .filter(Boolean)
  }, [cart, packageLookup])

  const tastingPackages = useMemo(() => {
    if (incomingItems.length > 0) {
      return incomingItems
        .map(item => {
          const pkg = item?.packageData ?? packageLookup.get(String(item.packageId)) ?? null
          const serviceSlug = normalizeServiceSlug(pkg?.service_slugs?.[0] ?? '')

          if (!SAMPLE_TASTE_SERVICE_SLUGS.has(serviceSlug)) return null

          return buildTastingPackage({ item, pkg })
        })
        .filter(Boolean)
    }

    return fallbackCartItems
  }, [fallbackCartItems, incomingItems, packageLookup])

  const tastingPackagesKey = useMemo(
    () => tastingPackages.map(pkg => pkg.id).join('\u0000'),
    [tastingPackages]
  )
  const [syncedTastingPackagesKey, setSyncedTastingPackagesKey] = useState(null)

  if (tastingPackagesKey !== syncedTastingPackagesKey) {
    setSyncedTastingPackagesKey(tastingPackagesKey)
    setSelections(prev => mergeSelectionsForPackages(prev, tastingPackages))
  }

  const toggleItemSelection = useCallback((packageId, itemId) => {
    setSelections(prev => {
      const current = prev[packageId] ?? { selectedIds: [], quantity: 1 }
      const selectedSet = new Set(current.selectedIds)
      if (selectedSet.has(itemId)) {
        selectedSet.delete(itemId)
      } else {
        selectedSet.add(itemId)
      }

      return {
        ...prev,
        [packageId]: {
          ...current,
          selectedIds: Array.from(selectedSet),
        },
      }
    })
  }, [])

  const updatePackageQuantity = useCallback((packageId, delta) => {
    setSelections(prev => {
      const current = prev[packageId] ?? { selectedIds: [], quantity: 1 }
      const nextQuantity = Math.max(1, Number(current.quantity ?? 1) + delta)

      return {
        ...prev,
        [packageId]: {
          ...current,
          quantity: nextQuantity,
        },
      }
    })
  }, [])

  const handleEditPackage = useCallback(
    pkg => {
      const href = getCartPackageHref(pkg.packageData ?? pkg, pkg.selectedOptions, pkg.cartItemId)
      navigate(href)
    },
    [navigate]
  )

  const handleRemovePackage = useCallback(
    async pkg => {
      if (!pkg?.cartItemId) return
      try {
        await removeItem(pkg.cartItemId)
      } catch (error) {
        console.error('[sample-taste] remove failed', error)
      }
    },
    [removeItem]
  )

  const summaryPackages = useMemo(
    () =>
      tastingPackages
        .map(pkg => {
          const selection = selections[pkg.id] ?? { selectedIds: [], quantity: pkg.quantity }
          const selectedIdSet = new Set(selection.selectedIds)
          const selectedItems = pkg.items.filter(item => selectedIdSet.has(item.id))

          return {
            ...pkg,
            selectionQuantity: Math.max(1, Number(selection.quantity ?? pkg.quantity)),
            selectedItems,
            selectedCount: selectedItems.length,
          }
        })
        .filter(pkg => pkg.selectedItems.length > 0),
    [selections, tastingPackages]
  )

  const summaryItemCount = summaryPackages.reduce((sum, pkg) => sum + pkg.selectedCount, 0)

  const subtotal = useMemo(
    () =>
      summaryPackages.reduce((sum, pkg) => {
        if (!pkg.selectedCount) return sum
        return sum + Number(pkg.totalPrice ?? 0)
      }, 0),
    [summaryPackages]
  )

  const gstAmount = Math.round(subtotal * GST_RATE)
  const deliveryFee = summaryPackages.length > 0 ? DELIVERY_FEE : 0
  const expressFee = selectedDelivery ? EXPRESS_DELIVERY_FEE : 0
  const totalAmount = subtotal + gstAmount + deliveryFee + expressFee

  const deliveryAddress = cart?.eventCity?.trim() || ''

  if (loading && incomingItems.length === 0) {
    return (
      <div className="bg-[#FAF9F7] min-h-screen px-4 md:px-8 lg:px-16 py-10 mt-10">
        <div className="rounded-2xl border border-[#95796066] bg-white p-8 text-center text-gray-500">
          Loading tasting packages...
        </div>
      </div>
    )
  }

  if (!tastingPackages.length) {
    return (
      <div className="bg-[#FAF9F7] min-h-screen px-4 md:px-8 lg:px-16 py-10 mt-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#95796066] bg-white p-8 text-center">
          <p className="text-[24px] font-semibold text-[#1C1C1C]">No tasting packages found</p>
          <p className="mt-2 text-gray-500">
            Add catering or bartending packages to your cart to use sample test booking.
          </p>
          <Link
            to="/cart"
            className="mx-auto mt-6 flex w-fit items-center rounded-full bg-[#D4BA8E] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#C6AB7F]"
          >
            Back to Cart
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#FAF9F7] min-h-screen px-4 md:px-8 lg:px-16 py-10 mt-10">
      <div className="mb-10">
        <h1 className="text-[clamp(18px,4vw,36px)] leading-tight text-[#2C2C2C]">
          Book Your Tasting Session
        </h1>
        <p className="text-gray-500 mt-2 text-[clamp(14px,1.2vw,18px)]">
          Try before you commit. Select what you had like to taste and we will deliver it to you.
        </p>
      </div>

      <div className="flex flex-col gap-[clamp(24px,5vw,100px)] md:flex-row">
        <div className="flex-1 space-y-6">
          <div className="flex flex-row border border-[#0383E4] bg-[#EAF5FF] rounded-xl px-4 py-3">
            <div className="flex items-start mr-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.9974 13.3334V10.0001M9.9974 6.66675H10.0057M18.3307 10.0001C18.3307 14.6025 14.5998 18.3334 9.9974 18.3334C5.39502 18.3334 1.66406 14.6025 1.66406 10.0001C1.66406 5.39771 5.39502 1.66675 9.9974 1.66675C14.5998 1.66675 18.3307 5.39771 18.3307 10.0001Z"
                  stroke="#0383E4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col ml-2">
              <p className="text-[#0383E4] text-[12px] font-medium">
                Items are tasting portions only - not full servings.
              </p>
              <p className="text-[#00477C] text-[11px] mt-1">
                Your feedback helps confirm your final event order.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="accent-[#2C2C2C]" />
              <span>Single Vendor</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-[#2C2C2C]" />
              <span>2 Different Vendors</span>
            </label>
          </div>

          <div className="space-y-5">
            {tastingPackages.map(pkg => {
              const selection = selections[pkg.id] ?? {
                selectedIds: getDefaultSelectedIds(pkg.items),
                quantity: pkg.quantity,
              }
              const selectedIdSet = new Set(selection.selectedIds)
              const rowQuantity = Math.max(1, Number(selection.quantity ?? pkg.quantity))

              return (
                <div
                  key={pkg.id}
                  className="border border-[#95796066] rounded-xl overflow-hidden bg-white"
                >
                  <div className="px-5 py-4 flex justify-between items-start border-b border-[#95796033]">
                    <div>
                      <h2
                        className="text-[18px] font-medium text-[#2C2C2C]"
                        style={{ fontFamily: "'Poppins'" }}
                      >
                        {pkg.title}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">{pkg.desc}</p>
                    </div>

                    <span className="bg-[#E7E0DA] text-[#591902] text-[12px] font-medium px-3 py-1 rounded-full shrink-0">
                      {pkg.tag}
                    </span>
                  </div>

                  <div
                    className="p-4 space-y-3 max-h-[240px] overflow-y-auto pr-1 hide-scrollbar mr-2"
                    data-lenis-prevent
                  >
                    {pkg.items.length > 0 ? (
                      pkg.items.map(item => {
                        const isSelected = selectedIdSet.has(item.id)

                        return (
                          <div
                            key={item.id}
                            className={`min-h-[44px] rounded-xl px-4 py-3 flex items-center justify-between gap-4 transition ${
                              isSelected ? 'bg-[#E7E7DF]' : 'bg-[#F5F5F0]'
                            }`}
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleItemSelection(pkg.id, item.id)}
                                className="mt-1 accent-[#2C2C2C] shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-[#2C2C2C] font-medium text-[12px] leading-5">
                                  {item.name}
                                </p>
                                <p className="text-gray-500 text-[11px] leading-4 mt-1">
                                  {item.desc}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <div className="flex items-center gap-3 bg-white rounded-full px-3 py-1">
                                <button
                                  type="button"
                                  className="text-lg leading-none disabled:opacity-40"
                                  disabled={rowQuantity <= 1}
                                  onClick={() => updatePackageQuantity(pkg.id, -1)}
                                >
                                  -
                                </button>
                                <span className="text-sm">{rowQuantity}</span>
                                <button
                                  type="button"
                                  className="text-lg leading-none"
                                  onClick={() => updatePackageQuantity(pkg.id, 1)}
                                >
                                  +
                                </button>
                              </div>
                              <p className="text-[#2C2C2C] font-medium">
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-gray-500 px-2 py-3">
                        No menu items listed for this package. Edit the package to configure your
                        menu and cart selection.
                      </p>
                    )}
                  </div>

                  <div className="px-5 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditPackage(pkg)}
                        className="w-8 h-8 rounded-full bg-[#E7E7E2] flex items-center justify-center text-sm text-black"
                        aria-label={`Edit ${pkg.title}`}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePackage(pkg)}
                        className="w-8 h-8 rounded-full bg-[#6B1D0C] text-white flex items-center justify-center text-sm"
                        aria-label={`Remove ${pkg.title}`}
                      >
                        <DeleteIcon />
                      </button>
                    </div>

                    <p className="text-sm text-gray-500">
                      {buildSelectedCountText(selectedIdSet.size, pkg.items.length)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="border border-[#95796066] rounded-xl p-5 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-[18px] font-medium text-[#2C2C2C]"
                style={{ fontFamily: "'Poppins'" }}
              >
                Delivery Details
              </h3>
              <span className="text-sm text-gray-500">Standard Est: 3-4 days</span>
            </div>

            <div className="border-b border-[#2D2D2D] pb-3 flex items-center gap-2">
              <span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.3307 6.66658C13.3307 9.99525 9.63806 13.4619 8.39806 14.5326C8.28254 14.6194 8.14193 14.6664 7.9974 14.6664C7.85286 14.6664 7.71225 14.6194 7.59673 14.5326C6.35673 13.4619 2.66406 9.99525 2.66406 6.66658C2.66406 5.2521 3.22597 3.89554 4.22616 2.89535C5.22635 1.89516 6.58291 1.33325 7.9974 1.33325C9.41188 1.33325 10.7684 1.89516 11.7686 2.89535C12.7688 3.89554 13.3307 5.2521 13.3307 6.66658Z"
                    stroke="#1C1C1C"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.9974 8.66658C9.10196 8.66658 9.9974 7.77115 9.9974 6.66658C9.9974 5.56202 9.10196 4.66658 7.9974 4.66658C6.89283 4.66658 5.9974 5.56202 5.9974 6.66658C5.9974 7.77115 6.89283 8.66658 7.9974 8.66658Z"
                    stroke="#1C1C1C"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                type="text"
                readOnly
                value={deliveryAddress}
                placeholder="Enter delivery address in cart"
                className="w-full outline-none bg-transparent text-[#2C2C2C]"
              />
            </div>

            <div className="mt-4 bg-[#FEE6D3] border border-[#F39A2D] rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex flex-row gap-x-4">
                <div className="flex items-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.33618 11.6667C3.17848 11.6673 3.02387 11.623 2.8903 11.5392C2.75674 11.4554 2.6497 11.3354 2.58163 11.1931C2.51356 11.0509 2.48725 10.8922 2.50576 10.7356C2.52426 10.579 2.58683 10.4309 2.68618 10.3084L10.9362 1.80839C10.9981 1.73696 11.0824 1.68868 11.1753 1.6715C11.2683 1.65431 11.3643 1.66923 11.4476 1.71381C11.531 1.75838 11.5967 1.82997 11.634 1.91681C11.6712 2.00365 11.6779 2.10059 11.6528 2.19172L10.0528 7.20839C10.0057 7.33466 9.98982 7.47049 10.0067 7.60423C10.0235 7.73797 10.0726 7.86562 10.1496 7.97624C10.2266 8.08686 10.3293 8.17715 10.4489 8.23935C10.5685 8.30156 10.7014 8.33383 10.8362 8.33339H16.6695C16.8272 8.33285 16.9818 8.37707 17.1154 8.46091C17.2489 8.54474 17.356 8.66476 17.4241 8.80701C17.4921 8.94926 17.5184 9.1079 17.4999 9.26451C17.4814 9.42111 17.4189 9.56926 17.3195 9.69172L9.06951 18.1917C9.00762 18.2632 8.92329 18.3114 8.83036 18.3286C8.73742 18.3458 8.6414 18.3309 8.55807 18.2863C8.47473 18.2417 8.40902 18.1701 8.37173 18.0833C8.33444 17.9965 8.32778 17.8995 8.35284 17.8084L9.95284 12.7917C10 12.6655 10.0159 12.5296 9.99902 12.3959C9.98217 12.2621 9.93313 12.1345 9.8561 12.0239C9.77907 11.9132 9.67636 11.823 9.55678 11.7608C9.43719 11.6985 9.3043 11.6663 9.16951 11.6667H3.33618Z"
                      fill="#FFAA32"
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[#E48E03] text-[12px]" style={{ fontFamily: "'Poppins'" }}>
                    Get it faster - Express Delivery
                  </h4>
                  <p className="text-[#E48E03] text-[11px] mt-1">
                    Delivery in 2 days for {formatCurrency(EXPRESS_DELIVERY_FEE)} extra
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDelivery(!selectedDelivery)}
                className={`w-12 h-7 rounded-full flex items-center px-1 transition ${
                  selectedDelivery ? 'bg-[#E48E03] justify-end' : 'bg-gray-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>Standard: {formatCurrency(0)} included</span>
              <span>Express: +{formatCurrency(EXPRESS_DELIVERY_FEE)}</span>
            </div>
          </div>

          <div className="border border-[#95796066] rounded-xl overflow-hidden bg-white">
            <div className="bg-[#242C14] text-white px-5 py-3 flex items-center justify-between">
              <h3 className="font-medium" style={{ fontFamily: "'Poppins'" }}>
                Tasting Summary
              </h3>
              <span className="text-sm">{summaryItemCount} items selected</span>
            </div>

            <div className="p-5 space-y-5">
              {summaryPackages.length > 0 ? (
                summaryPackages.map((pkg, index) => (
                  <div key={pkg.id}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-[#2C2C2C]">{pkg.title}</p>
                        <span className="bg-[#E7E0DA] text-[#591902] text-[12px] px-2 py-1 rounded-full">
                          {pkg.tag}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {pkg.selectedItems.map(item => (
                        <div key={item.id} className="flex justify-between gap-4">
                          <span className="text-gray-600">{item.name}</span>
                          <span>{formatCurrency(item.price)}</span>
                        </div>
                      ))}
                    </div>

                    {index < summaryPackages.length - 1 ? (
                      <hr className="my-4 border-[#0000001A]" />
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  Select at least one menu item from your packages to see the tasting summary.
                </p>
              )}

              <hr className="my-4 border-[#0000001A]" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal ({summaryItemCount} items)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">GST (18%)</span>
                  <span>{formatCurrency(gstAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Express Delivery</span>
                  <span className="text-[#E48E03]">+{formatCurrency(expressFee)}</span>
                </div>
              </div>

              <div className="bg-[#F8F4ED] rounded-lg px-4 py-3 flex justify-between items-center font-medium">
                <span>Total Amount</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="border border-[#95796066] rounded-xl p-5 bg-white">
            <div className="bg-[#E6F8D9] rounded-lg py-3 text-center text-sm mb-4">
              🔒 Secure & Verified Platform
            </div>
            <button
              type="button"
              disabled={summaryItemCount === 0}
              onClick={() =>
                navigate('/checkout?mode=sample-tasting', {
                  state: {
                    checkoutMode: 'sample-tasting',
                    sampleSessionDetails: {
                      dateLabel: formatSessionDate(cart?.eventDate),
                      timeLabel: 'Time pending',
                      address: deliveryAddress || 'Address pending',
                    },
                    sampleTastePackageIds: summaryPackages
                      .map(pkg => String(pkg.packageId ?? '').trim())
                      .filter(Boolean),
                    sampleTasteSelections: summaryPackages.map(pkg => ({
                      cartItemId: pkg.cartItemId,
                      packageId: pkg.packageId,
                      quantity: pkg.selectionQuantity,
                      selectedItemIds: pkg.selectedItems.map(item => item.id),
                      selectedItemNames: pkg.selectedItems.map(item => item.name),
                      expressDelivery: selectedDelivery,
                    })),
                  },
                })
              }
              className="mx-auto mt-4 flex w-full items-center justify-between rounded-full bg-[#D4BA8E] py-1.5 pl-6 pr-1.5 transition-colors hover:bg-[#C6AB7F] group disabled:cursor-not-allowed disabled:bg-[#CFCBC5]"
            >
              <span className="mr-5 text-[15px] font-medium text-white">Proceed to Checkout</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                <svg
                  className="h-[20px] w-[20px] text-[#D4BA8E] transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.82812 5.83398H14.1615M14.1615 5.83398V14.1673M14.1615 5.83398L5.82812 14.1673"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>

            <div className="text-center text-sm text-gray-500 mt-4">
              Have an account? <span className="text-[#D2B27A]">Sign in to continue</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
