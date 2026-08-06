import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import RepeatCustomizationPrompt from '../components/common/RepeatCustomizationPrompt'
import { useToast } from '../components/common/useToast'
import CateringPackageDetails from '../components/package-details/CateringPackageDetails'
import CateringMenuChooseModal from '../components/package-details/CateringMenuChooseModal'
import SingleProductPageContent from '../components/package-details/SingleProductPageContent'
import { getServiceProductDetails } from '../data/serviceProductDetails'
import { useCancellationPolicy } from '../hooks/useCancellationPolicy'
import { useCateringGuestDiscounts } from '../hooks/useCateringGuestDiscounts'
import { useCateringMenu } from '../hooks/useCateringMenu'
import { CATERING_PACKAGE_MENU_ROWS } from '../lib/cateringPackageMenuRows'
import { resolveCateringCatalogSlug } from '../lib/packageFilters'
import { mapCateringMenuRow } from '../lib/cateringMenuSelection'
import { useCart } from '../hooks/useCart'
import useCustomization from '../hooks/useCustomization'
import { useCartToastMessage } from '../hooks/useMessagingContent'
import { usePackageReviews } from '../hooks/usePackageReviews'
import { usePackageById, usePackages } from '../hooks/usePackages'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'
import { getRelatedPackages } from '../lib/packageFilters'
import {
  formatCateringPrice,
  getCateringDetailSection,
  getCateringPricePerPerson,
  getCateringPriceRangeLabel,
} from '../lib/cateringPricing'
import { resolveCateringAddonLineTotal } from '../lib/cateringAddonPricing'
import { buildCateringCartLineTotal } from '../lib/cateringCartPricing'
import { resolveCateringGuestDiscount } from '../lib/cateringGuestDiscount'
import { applyPackageDiscount, resolvePackageSalePricing } from '../lib/packageDiscount'
import pkgImg1 from '../assets/images/IMG_3903.jpg'
import pkgImg2 from '../assets/images/IMG_7768.jpg'
import pkgImg3 from '../assets/images/IMG_0749.jpg'
import pkgImg4 from '../assets/images/IMG_0658.jpg'
import pkgImg5 from '../assets/images/IMG_3148.jpg'
import pkgImg6 from '../assets/images/IMG_7025.jpg'
import pkgImg7 from '../assets/images/IMG_8625.png'
import pkgImg8 from '../assets/images/IMG_9814.jpg'
import pkgImg9 from '../assets/images/6f6af066.jpg'

const PKG_LOCAL_IMAGES = [
  [pkgImg1, pkgImg2, pkgImg3],
  [pkgImg4, pkgImg5, pkgImg6],
  [pkgImg7, pkgImg8, pkgImg9],
  [pkgImg2, pkgImg4, pkgImg7],
  [pkgImg5, pkgImg1, pkgImg8],
]

const DEFAULT_GUEST_OPTIONS = ['30', '40', '50', '75', '100', '150']
const DEFAULT_VEG_OPTIONS = ['Veg', 'Non-Veg']

const FALLBACK_MENU_ROWS = [
  {
    title: 'Starters (Choose 2+2) or 4 veg',
    chooseHint: 'Choose 2+2 or 4 veg',
    categoryKey: 'starters',
    categoryKeyExtra: 'starters_non_veg',
    variant: 'choose',
    actionLabel: 'Choose',
    selectionKey: 'menu-fallback-starters',
    rules: { maxPick: 4, vegPick: 2, nonvegPick: 2, minPick: 4, allVegPick: 4, allowsAllVeg: true },
  },
  {
    title: 'Main Course (Choose 2+2) or 4 veg',
    chooseHint: 'Choose 2+2 or 4 veg',
    categoryKey: 'main_course_veg',
    categoryKeyExtra: 'main_course_non_veg',
    variant: 'choose',
    actionLabel: 'Choose',
    selectionKey: 'menu-fallback-main',
    rules: { maxPick: 4, vegPick: 2, nonvegPick: 2, minPick: 4, allVegPick: 4, allowsAllVeg: true },
  },
  {
    title: 'Breads (Choose 2)',
    chooseHint: 'Choose 2',
    categoryKey: 'rotis_and_rice',
    variant: 'choose',
    actionLabel: 'Choose',
    selectionKey: 'menu-fallback-breads',
    rules: { maxPick: 2, vegPick: 0, nonvegPick: 0, minPick: 2, allVegPick: 2, allowsAllVeg: false },
  },
  {
    title: 'Rice (Choose 1)',
    chooseHint: 'Choose 1',
    categoryKey: 'rice',
    variant: 'choose',
    actionLabel: 'Choose',
    selectionKey: 'menu-fallback-rice',
    rules: { maxPick: 1, vegPick: 0, nonvegPick: 0, minPick: 1, allVegPick: 1, allowsAllVeg: false },
  },
  {
    title: 'Dessert (Choose 1)',
    chooseHint: 'Choose 1',
    categoryKey: 'dessert',
    variant: 'choose',
    actionLabel: 'Choose',
    selectionKey: 'menu-fallback-dessert',
    rules: {
      maxPick: 1,
      vegPick: 0,
      nonvegPick: 0,
      minPick: 1,
      allVegPick: 1,
      allowsAllVeg: false,
    },
  },
]

const FALLBACK_ADDONS = [
  {
    id: 'live-station',
    name: 'Live Station',
    description:
      'Pasta, pizza, chaat, or other live counters. Exact range depends on the dishes you choose.',
    price: 200,
    max_price: 500,
  },
  { id: 'soup-station', name: 'Soup Station', price: 150, max_price: 300 },
  { id: 'dessert', name: 'Dessert', price: 120, max_price: 250 },
  { id: 'pre-plated', name: 'Pre-Plated Platter', price: 180, max_price: 350 },
  {
    id: 'serving-staff',
    name: 'Serving staff/chef/housekeeping',
    price: 800,
    max_price: 1200,
  },
  { id: 'cutlery', name: 'Cutlery', price: 40, max_price: 80 },
  { id: 'water-bottles', name: 'water bottles', price: 20, max_price: 35 },
  {
    id: 'grazing-table',
    name: 'Grazing Table',
    description: 'Styled grazing spread with cheeses, fruits, and bite-sized pairings.',
    price: 350,
    max_price: 700,
  },
  {
    id: 'hi-tea',
    name: 'Afternoon Hi-tea',
    description: 'Light afternoon service with snacks, tea, and coffee.',
    price: 250,
    max_price: 450,
  },
  {
    id: 'buffet-tables',
    name: '5 Buffet Tables with skirting and setup',
    price: 500,
    max_price: 900,
  },
]

function normalisePackageId(value = '') {
  return String(value).trim().toLowerCase()
}

function buildPackageId(pkg) {
  return normalisePackageId(pkg.documentId ?? pkg.id ?? pkg.title)
}

function normalizeSelectedOptions(selectedOptions = {}) {
  return Object.fromEntries(
    Object.entries(selectedOptions)
      .map(([key, value]) => [String(key ?? '').trim(), String(value ?? '').trim()])
      .filter(([key, value]) => key && value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
  )
}

function getSelectedOptionsFromSearchParams(searchParams) {
  const rawValue = searchParams.get('selectedOptions')
  if (!rawValue) return {}

  try {
    return normalizeSelectedOptions(JSON.parse(rawValue))
  } catch {
    return {}
  }
}

function getSelectedAddonIdsFromSearchParams(searchParams, addons = []) {
  const selectedOptions = getSelectedOptionsFromSearchParams(searchParams)
  const rawValue = selectedOptions['Add-ons'] ?? selectedOptions['Add ons'] ?? ''

  if (!rawValue) return []

  const selectedNames = String(rawValue)
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)

  return addons
    .filter(addon =>
      selectedNames.includes(
        String(addon?.name ?? '')
          .trim()
          .toLowerCase()
      )
    )
    .map(addon => String(addon.id ?? addon.name))
}

function mergeAccordionSections(baseSections, cancellationPolicy, fallbackCancellationSection) {
  const sections = Array.isArray(baseSections) ? [...baseSections] : []
  const fallbackCancellation =
    sections.find(section => section?.title === 'Cancellation Policy') ??
    fallbackCancellationSection ??
    null
  const withoutCancellation = sections.filter(section => section?.title !== 'Cancellation Policy')

  if (cancellationPolicy?.body) {
    withoutCancellation.push(cancellationPolicy)
  } else if (fallbackCancellation) {
    withoutCancellation.push(fallbackCancellation)
  }

  return withoutCancellation
}

function buildGuestOptions(pkg) {
  const pricingRules = Array.isArray(pkg?.detail_pricing_rules) ? pkg.detail_pricing_rules : []

  const guestRules = pricingRules
    .filter(rule => String(rule?.rule_type ?? '').toLowerCase() === 'guest_count')
    .map(rule => String(rule?.label ?? rule?.value ?? '').trim())
    .filter(Boolean)

  const options = guestRules.length ? guestRules : DEFAULT_GUEST_OPTIONS

  if (options.includes('40')) return options

  const numericOptions = options.filter(value => /^\d+$/.test(value)).map(Number)
  if (!numericOptions.length) return [...options, '40']

  return [...new Set([...numericOptions, 40])]
    .sort((left, right) => left - right)
    .map(String)
}

const ADDON_LIKE_MENU_TITLES = [
  'live station',
  'soup station',
  'serving staff',
  'cutlery',
  'water bottles',
  'grazing table',
  'afternoon hi-tea',
  'buffet',
]

/** Level-3 packages whose CMS menu_items were polluted with add-ons — always use seeded food rows. */
const FORCE_SEEDED_MENU_CATALOGS = new Set([
  'signature-hosting-package',
  'close-circle-catering-3',
])

function looksLikeAddonMenuRow(item = {}) {
  const title = String(item?.title ?? '')
    .trim()
    .toLowerCase()
  if (item?.category_key) return false
  return ADDON_LIKE_MENU_TITLES.some(fragment => title.includes(fragment))
}

function isUsableMenuItems(menuItems = []) {
  if (!Array.isArray(menuItems) || !menuItems.length) return false
  if (menuItems.every(looksLikeAddonMenuRow)) return false
  return menuItems.some(
    item =>
      item?.category_key ||
      /starter|main course|dessert|bread|rice|accompaniment|salad|raita|soup|pre-plated|pre plated/i.test(
        String(item?.title ?? '')
      )
  )
}

function resolveSeededMenuKey(pkg) {
  const slug = String(pkg?.slug ?? '').trim()
  const catalog = resolveCateringCatalogSlug(slug) || slug
  if (CATERING_PACKAGE_MENU_ROWS[catalog]) return catalog
  if (CATERING_PACKAGE_MENU_ROWS[slug]) return slug

  const titleKey = String(pkg?.title ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (titleKey.includes('signature-hosting-2')) return 'signature-hosting-2'
  if (titleKey.includes('signature-hosting')) return 'signature-hosting-package'
  if (
    titleKey.includes('chef') &&
    (titleKey.includes('choice') || titleKey.includes('selection'))
  ) {
    return 'close-circle-catering-3'
  }

  return catalog
}

function shouldForceSeededCateringMenu(pkg) {
  const menuKey = resolveSeededMenuKey(pkg)
  if (FORCE_SEEDED_MENU_CATALOGS.has(menuKey)) return true

  const titleKey = String(pkg?.title ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')

  if (titleKey.includes('signature-hosting') && !titleKey.includes('signature-hosting-2')) {
    return true
  }
  if (
    titleKey.includes('chef') &&
    (titleKey.includes('choice') || titleKey.includes('selection'))
  ) {
    return true
  }
  return false
}

function buildMenuRows(pkg) {
  const cateringSection = getCateringDetailSection(pkg)
  let menuItems = Array.isArray(cateringSection?.menu_items) ? cateringSection.menu_items : []

  const menuKey = resolveSeededMenuKey(pkg)
  const seededRows = CATERING_PACKAGE_MENU_ROWS[menuKey] ?? []

  // Signature Hosting + Chef's Choice/Selection: CMS mixed add-ons into menu_items.
  // Always use the seeded food menu so dish pickers work.
  if (shouldForceSeededCateringMenu(pkg) && seededRows.length) {
    menuItems = seededRows
  } else if (!isUsableMenuItems(menuItems)) {
    menuItems = seededRows
  }

  if (menuItems.length) {
    return [...menuItems]
      .sort((left, right) => Number(left?.sort_order ?? 0) - Number(right?.sort_order ?? 0))
      .map(mapCateringMenuRow)
  }

  const inclusions = Array.isArray(pkg?.detail_inclusions) ? pkg.detail_inclusions : []
  const elements = (Array.isArray(pkg?.detail_sections) ? pkg.detail_sections : []).flatMap(
    section => (Array.isArray(section?.elements) ? section.elements : [])
  )

  const dynamicRows = [
    ...inclusions.map((item, index) => {
      const title = String(item ?? '').trim()
      if (!title) return null

      const chooseMatch = title.match(/\(choose\s*(\d+)\)/i)
      if (chooseMatch) {
        return mapCateringMenuRow(
          {
            title,
            row_type: 'choose',
            choose_hint: title,
          },
          index
        )
      }

      if (/included/i.test(title)) {
        return {
          title,
          variant: 'included',
          actionLabel: 'Included',
          selectionKey: `inclusion-${index}`,
        }
      }

      return {
        title,
        variant: 'choose',
        actionLabel: 'Choose',
        selectionKey: `inclusion-${index}`,
      }
    }),
    ...elements.map((element, index) => {
      const title = String(element?.title ?? element?.description ?? '').trim()
      if (!title) return null

      return {
        title,
        subtitle: String(element?.description ?? '').trim() || undefined,
        variant: 'choose',
        actionLabel: 'Choose',
        selectionKey: `element-${index}`,
      }
    }),
  ].filter(Boolean)

  if (dynamicRows.length) return dynamicRows

  return FALLBACK_MENU_ROWS
}

function buildCateringSelectedOptions(customization) {
  const guestCount = String(customization?.data?.guestCount ?? '').trim()
  const vegPreference = String(customization?.data?.vegPreference ?? '').trim()
  const menuSelections = customization?.data?.menuSelections ?? {}
  const selectedAddons = Array.isArray(customization?.data?.selectedAddons)
    ? customization.data.selectedAddons
    : []

  return normalizeSelectedOptions({
    ...(guestCount ? { 'Guest count': guestCount } : {}),
    ...(vegPreference ? { Veg: vegPreference } : {}),
    ...Object.fromEntries(
      Object.entries(menuSelections)
        .map(([key, value]) => [key, String(value ?? '').trim()])
        .filter(([, value]) => value)
    ),
    ...(selectedAddons.length ? { 'Add-ons': selectedAddons.join(', ') } : {}),
  })
}

function buildSelectedAddonItems(addons, selectedAddonIds = []) {
  const selectedIdSet = new Set(selectedAddonIds.map(value => String(value)))

  return addons.filter(addon => selectedIdSet.has(String(addon.id ?? addon.name)))
}

export default function CateringSinglePackagePage() {
  const { packageId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const packagesQuery = usePackages()
  const packageQuery = usePackageById(packageId)
  const cancellationQuery = useCancellationPolicy()
  const cateringDiscountsQuery = useCateringGuestDiscounts()
  const cateringMenuQuery = useCateringMenu()

  const isStrapiLoading = useStrapiPageLoading(
    packagesQuery,
    packageQuery,
    cancellationQuery,
    cateringDiscountsQuery,
    cateringMenuQuery
  )

  const { data: packages = [] } = packagesQuery
  const { data: packageDetails } = packageQuery
  const { data: cancellationPolicy } = cancellationQuery
  const { data: cateringDiscountSettingsFromApi } = cateringDiscountsQuery
  const { data: menuByCategory = {} } = cateringMenuQuery
  const { addPackage, updateCartItemDetails } = useCart()
  const { showToast } = useToast()
  const { data: cartToastMessage = 'Package added to cart successfully.' } = useCartToastMessage()
  const cartItemId = searchParams.get('cartItemId') ?? ''
  const cateringDetails = getServiceProductDetails('catering')
  const {
    customizations,
    activeCustomization,
    activeIndex,
    showRepeatPrompt,
    handleAddToCart: markCustomizationAdded,
    handleIncrease,
    handleRepeat,
    handleNew,
    handleDecrease,
    setCustomizations,
  } = useCustomization({
    createInitialData: () => ({
      guestCount: DEFAULT_GUEST_OPTIONS[0],
      vegPreference: DEFAULT_VEG_OPTIONS[0],
      menuSelections: {},
      selectedAddons: [],
    }),
  })
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [addToCartMessage, setAddToCartMessage] = useState('')
  const [activeMenuRow, setActiveMenuRow] = useState(null)
  const [menuModalOpen, setMenuModalOpen] = useState(false)

  const packagesData = useMemo(
    () =>
      packages.map((pkg, index) => ({
        ...pkg,
        serviceSlug: 'catering',
        images: pkg.images?.length
          ? pkg.images
          : (PKG_LOCAL_IMAGES[index % PKG_LOCAL_IMAGES.length] ?? []),
      })),
    [packages]
  )

  const backHref = useMemo(() => {
    const next = new URLSearchParams(searchParams)
    return `/packages/catering${next.toString() ? `?${next.toString()}` : ''}`
  }, [searchParams])

  const pkg = useMemo(
    () =>
      packageDetails
        ? {
            ...packageDetails,
            serviceSlug: 'catering',
            images: packageDetails.images?.length
              ? packageDetails.images
              : (PKG_LOCAL_IMAGES[packageDetails._index % PKG_LOCAL_IMAGES.length] ??
                PKG_LOCAL_IMAGES[0]),
          }
        : packagesData.find(item => buildPackageId(item) === normalisePackageId(packageId)),
    [packageDetails, packageId, packagesData]
  )

  const relatedProducts = useMemo(
    () => (pkg ? getRelatedPackages(packagesData, pkg, { serviceSlug: 'catering' }) : []),
    [packagesData, pkg]
  )

  const { data: packageReviews = [] } = usePackageReviews({
    id: pkg?.id,
    documentId: pkg?.documentId,
    title: pkg?.title,
  })

  const guestOptions = useMemo(() => buildGuestOptions(pkg), [pkg])
  const menuRows = useMemo(() => buildMenuRows(pkg), [pkg])
  const cateringSection = useMemo(() => getCateringDetailSection(pkg), [pkg])
  const guestCount = String(activeCustomization?.data?.guestCount ?? guestOptions[0] ?? '30')
  const vegPreference = String(activeCustomization?.data?.vegPreference ?? DEFAULT_VEG_OPTIONS[0])

  const cateringDiscountSettings = useMemo(
    () => pkg?.catering_guest_discounts ?? cateringDiscountSettingsFromApi ?? null,
    [cateringDiscountSettingsFromApi, pkg?.catering_guest_discounts]
  )

  const unitPricePerPerson = useMemo(
    () => getCateringPricePerPerson(cateringSection, vegPreference, pkg?.base_price ?? 0),
    [cateringSection, pkg?.base_price, vegPreference]
  )

  const guestDiscountTier = useMemo(
    () => resolveCateringGuestDiscount(guestCount, cateringDiscountSettings),
    [cateringDiscountSettings, guestCount]
  )

  const discountPerPerson = Number(guestDiscountTier?.discount_per_person ?? 0)

  const effectiveUnitPrice = useMemo(() => {
    const afterPackageSale = applyPackageDiscount(unitPricePerPerson, pkg)
    return Math.max(0, afterPackageSale - discountPerPerson)
  }, [discountPerPerson, pkg, unitPricePerPerson])

  const packageSaleMeta = useMemo(
    () => resolvePackageSalePricing(pkg, unitPricePerPerson),
    [pkg, unitPricePerPerson]
  )

  const displayPrice = useMemo(() => {
    if (effectiveUnitPrice > 0) {
      return formatCateringPrice(effectiveUnitPrice)
    }
    return getCateringPriceRangeLabel(cateringSection, pkg?.base_price ?? 0) || pkg?.price || ''
  }, [cateringSection, effectiveUnitPrice, pkg?.base_price, pkg?.price])

  const packageOriginalPrice = useMemo(() => {
    if (!packageSaleMeta.hasDiscount || !(unitPricePerPerson > 0)) return ''
    const originalAfterGuest = Math.max(0, unitPricePerPerson - discountPerPerson)
    return originalAfterGuest > effectiveUnitPrice
      ? formatCateringPrice(originalAfterGuest)
      : packageSaleMeta.originalLabel
  }, [
    discountPerPerson,
    effectiveUnitPrice,
    packageSaleMeta.hasDiscount,
    packageSaleMeta.originalLabel,
    unitPricePerPerson,
  ])

  const packageDiscountBadge = packageSaleMeta.hasDiscount ? packageSaleMeta.badge : ''

  const addons = useMemo(() => {
    const sectionAddons = Array.isArray(cateringSection?.addons)
      ? cateringSection.addons.filter(Boolean)
      : []
    const cmsAddons = Array.isArray(pkg?.detail_addons) ? pkg.detail_addons.filter(Boolean) : []
    const merged = [...sectionAddons, ...cmsAddons]
    return merged.length ? merged : FALLBACK_ADDONS
  }, [cateringSection, pkg])

  const inclusions = useMemo(() => {
    const sectionInclusions = Array.isArray(cateringSection?.inclusions)
      ? cateringSection.inclusions.map(item => item?.text).filter(Boolean)
      : []
    if (sectionInclusions.length) return sectionInclusions

    const cmsInclusions = Array.isArray(pkg?.detail_inclusions) ? pkg.detail_inclusions : []
    if (cmsInclusions.length) return cmsInclusions
    return cateringDetails.whatsIncluded?.flatMap(group => group.items ?? []) ?? []
  }, [cateringDetails.whatsIncluded, cateringSection, pkg])

  const exclusions = useMemo(() => {
    const sectionExclusions = Array.isArray(cateringSection?.exclusions)
      ? cateringSection.exclusions.map(item => item?.text).filter(Boolean)
      : []
    if (sectionExclusions.length) return sectionExclusions

    const cmsExclusions = Array.isArray(pkg?.detail_exclusions) ? pkg.detail_exclusions : []
    return cmsExclusions.length ? cmsExclusions : []
  }, [cateringSection, pkg])

  useEffect(() => {
    const selectedOptionsFromSearch = getSelectedOptionsFromSearchParams(searchParams)
    const selectedAddonIds = getSelectedAddonIdsFromSearchParams(searchParams, addons)

    setCustomizations([
      {
        id: 1,
        data: {
          guestCount: selectedOptionsFromSearch['Guest count'] || guestOptions[0] || '30',
          vegPreference: selectedOptionsFromSearch.Veg || DEFAULT_VEG_OPTIONS[0],
          menuSelections: Object.fromEntries(
            Object.entries(selectedOptionsFromSearch).filter(
              ([key]) => !['Guest count', 'Veg', 'Add-ons', 'Add ons'].includes(key)
            )
          ),
          selectedAddons: buildSelectedAddonItems(addons, selectedAddonIds).map(
            addon => addon.name
          ),
        },
        isAddedToCart: false,
      },
    ])
    setAddToCartMessage('')
  }, [addons, guestOptions, packageId, searchParams, setCustomizations])

  if (isStrapiLoading) {
    return <CmsPageLoader />
  }

  if (!pkg) {
    return <Navigate to={backHref} replace />
  }

  // Use CMS images as-is (no pad/repeat to 5). Fallback local set only when CMS has none.
  const sourceImages = pkg.images?.length ? pkg.images : PKG_LOCAL_IMAGES[0]
  const mainImage = sourceImages[0]
  const sideImages = sourceImages.slice(1)

  const quantity = customizations.length
  const menuSelections = activeCustomization?.data?.menuSelections ?? {}
  const selectedAddonNames = Array.isArray(activeCustomization?.data?.selectedAddons)
    ? activeCustomization.data.selectedAddons
    : []
  const selectedAddonIds = addons
    .filter(addon => selectedAddonNames.includes(addon.name))
    .map(addon => String(addon.id ?? addon.name))

  const accordionSections = mergeAccordionSections(
    Array.isArray(pkg.detail_accordion_sections) && pkg.detail_accordion_sections.length
      ? pkg.detail_accordion_sections
      : [
          {
            title: 'What we need from you',
            body: 'Guest count, dietary preferences, venue access, and power/water availability should be confirmed before the event date.',
          },
          ...(cateringDetails.sections ?? []).filter(section =>
            ['The Nitty-Gritty', 'Policies'].includes(section.title)
          ),
        ],
    cancellationPolicy,
    cateringDetails.sections.find(section => section.title === 'Cancellation Policy')
  )

  const updateActiveCustomization = updater => {
    setCustomizations(prev =>
      prev.map((customization, customizationIndex) =>
        customizationIndex === activeIndex
          ? {
              ...customization,
              data: updater(customization?.data ?? {}),
              isAddedToCart: false,
            }
          : customization
      )
    )
  }

  const handleGuestCountChange = value => {
    setAddToCartMessage('')
    updateActiveCustomization(data => ({
      ...data,
      guestCount: value,
    }))
  }

  const handleVegChange = value => {
    setAddToCartMessage('')
    updateActiveCustomization(data => ({
      ...data,
      vegPreference: value,
      menuSelections: {},
    }))
  }

  const handleMenuRowAction = row => {
    if (row.variant === 'included') return

    setAddToCartMessage('')
    setActiveMenuRow(row)
    setMenuModalOpen(true)
  }

  const handleMenuSelectionConfirm = value => {
    if (!activeMenuRow) return

    const key = activeMenuRow.selectionKey ?? activeMenuRow.title
    updateActiveCustomization(data => ({
      ...data,
      menuSelections: {
        ...(data?.menuSelections ?? {}),
        [key]: value,
      },
    }))
    setMenuModalOpen(false)
    setActiveMenuRow(null)
  }

  const handleToggleAddon = addon => {
    const addonName = String(addon?.name ?? '').trim()
    if (!addonName) return

    setAddToCartMessage('')
    updateActiveCustomization(data => {
      const currentAddons = Array.isArray(data?.selectedAddons) ? data.selectedAddons : []
      const hasAddon = currentAddons.includes(addonName)

      return {
        ...data,
        selectedAddons: hasAddon
          ? currentAddons.filter(item => item !== addonName)
          : [...currentAddons, addonName],
      }
    })
  }

  const handleAddToCart = async () => {
    setAddToCartMessage('')

    const numericPackageId = Number(pkg?.id)
    if (!Number.isFinite(numericPackageId)) {
      setAddToCartMessage('This package is missing its cart ID. Please refresh and try again.')
      return
    }

    if (!cartItemId && activeCustomization?.isAddedToCart) {
      handleIncrease()
      return
    }

    setIsAddingToCart(true)

    try {
      const selectedOptions = buildCateringSelectedOptions(activeCustomization)
      const selectedAddons = buildSelectedAddonItems(addons, selectedAddonIds)
      const cateringLine = buildCateringCartLineTotal({
        packageData: pkg,
        selectedOptions,
        packageQuantity: quantity,
        discountSettings: cateringDiscountSettings,
      })
      const lineTotal = cateringLine?.lineTotal ?? effectiveUnitPrice
      const perPersonForCart = cateringLine?.perPersonNet ?? effectiveUnitPrice

      if (cartItemId) {
        await updateCartItemDetails({
          itemId: cartItemId,
          quantity,
          selectedOptions,
          unitPrice: perPersonForCart,
          lineTotal,
        })
        showToast({ message: cartToastMessage })
      } else {
        await addPackage({
          packageId: numericPackageId,
          quantity,
          selectedOptions,
          unitPrice: perPersonForCart,
          lineTotal,
        })
        const guestCountForAddons =
          cateringLine?.guestCount ??
          (Number(String(selectedOptions['Guest count'] ?? '').replace(/\D/g, '')) || 0)
        const addonSelectedOptions =
          guestCountForAddons > 0 ? { 'Guest count': String(guestCountForAddons) } : {}

        await Promise.all(
          selectedAddons.map(addon => {
            const addonLine = resolveCateringAddonLineTotal({
              addon,
              guestCount: guestCountForAddons,
              quantity: 1,
            })

            return addPackage({
              packageId: numericPackageId,
              quantity: 1,
              addon,
              selectedOptions: addonSelectedOptions,
              unitPrice: addonLine?.perPerson ?? Number(addon?.price ?? 0),
              lineTotal: addonLine?.lineTotal,
            })
          })
        )
        markCustomizationAdded()
        showToast({ message: cartToastMessage })
      }
    } catch (err) {
      console.error('[catering-package] add to cart failed', err)
      setAddToCartMessage('Could not add this package to cart. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const resolvedMenuRows = menuRows.map(row => {
    const key = row.selectionKey ?? row.title
    const selectedValue = menuSelections[key]

    if (row.variant === 'included') return row
    if (!selectedValue) return row

    return {
      ...row,
      subtitle: selectedValue,
      variant: 'edit',
      actionLabel: 'Edit',
    }
  })

  const activeMenuSelectionKey = activeMenuRow?.selectionKey ?? activeMenuRow?.title ?? ''
  const activeMenuInitialValue = menuSelections[activeMenuSelectionKey] ?? ''

  return (
    <>
      <CateringMenuChooseModal
        open={menuModalOpen}
        row={activeMenuRow}
        menuByCategory={menuByCategory}
        vegPreference={vegPreference}
        packageLevelSlug={pkg?.budget_level_slug || pkg?.level_slug || ''}
        initialSelection={activeMenuInitialValue}
        onClose={() => {
          setMenuModalOpen(false)
          setActiveMenuRow(null)
        }}
        onConfirm={handleMenuSelectionConfirm}
      />
      <SingleProductPageContent
        title={pkg.title || cateringDetails.heroBadge}
        price={displayPrice}
        originalPrice={packageOriginalPrice}
        discountBadge={packageDiscountBadge}
        intro=""
        addToCartLabel={isAddingToCart ? 'Adding...' : 'Add to cart'}
        disableAddToCart={isAddingToCart}
        isAddingToCart={isAddingToCart}
        onAddToCart={handleAddToCart}
        packageId={pkg?.id}
        customDetailsContent={
          <CateringPackageDetails
            title={pkg.title || cateringDetails.heroBadge}
            price={displayPrice}
            originalPrice={packageOriginalPrice}
            discountBadge={packageDiscountBadge}
            intro={pkg.description || cateringDetails.intro}
            guestOptions={guestOptions}
            vegOptions={DEFAULT_VEG_OPTIONS}
            selectedGuestCount={guestCount}
            selectedVeg={vegPreference}
            onGuestCountChange={handleGuestCountChange}
            onVegChange={handleVegChange}
            inclusions={inclusions}
            exclusions={exclusions}
            menuRows={resolvedMenuRows}
            onMenuRowAction={handleMenuRowAction}
            addons={addons}
            selectedAddonIds={selectedAddonIds}
            onToggleAddon={handleToggleAddon}
            quantity={quantity}
            onDecrement={handleDecrease}
            onIncrement={() => {
              setAddToCartMessage('')
              handleIncrease()
            }}
            promptContent={
              showRepeatPrompt ? (
                <RepeatCustomizationPrompt onRepeat={handleRepeat} onCreateNew={handleNew} />
              ) : null
            }
            addToCartLabel={isAddingToCart ? 'Adding...' : 'Add to cart'}
            addToCartMessage={addToCartMessage}
            disableAddToCart={isAddingToCart}
            onAddToCart={handleAddToCart}
            accordionSections={accordionSections}
          />
        }
        accordionSections={[]}
        mainImage={mainImage}
        sideImages={sideImages}
        relatedProducts={relatedProducts}
        testimonials={packageReviews}
      />
    </>
  )
}
