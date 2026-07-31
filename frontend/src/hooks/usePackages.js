import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import { PACKAGES_FALLBACK } from '../data/packages'
import { normalizeServiceSlug } from '../lib/packageFilters'
import { preloadImages } from '../utils/preloadAssets'
import {
  getCateringDetailSection,
  getCateringPriceRangeLabel,
  inferLevelSlugFromCateringLevel,
} from '../lib/cateringPricing'
import { resolveSheeshaSizeLabel } from '../lib/sheeshaPackageMeta'
import { resolvePackageSalePricing } from '../lib/packageDiscount'

const blocksToText = blocks => {
  if (!blocks) return ''
  if (typeof blocks === 'string') return blocks
  if (!Array.isArray(blocks)) return ''

  return blocks
    .map(block => (block.children ?? []).map(child => child.text ?? '').join(''))
    .filter(Boolean)
    .join(' ')
}

function normaliseMediaArray(media) {
  if (!media) return []
  if (Array.isArray(media)) return media
  if (Array.isArray(media?.data)) return media.data
  return []
}

function normaliseRelationArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}

function toAbsoluteStrapiUrl(url) {
  if (!url || typeof url !== 'string') return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const base = import.meta.env.VITE_STRAPI_URL ?? '/cms'
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost'
  const normalizedBase =
    base.startsWith('http://') || base.startsWith('https://')
      ? base
      : `${origin}${base.startsWith('/') ? '' : '/'}${base}`

  return `${normalizedBase}${url.startsWith('/') ? '' : '/'}${url}`
}

function uniqueValues(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))]
}

function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getBudgetLevelSlug(level) {
  const label = String(level?.label ?? level?.name ?? '').trim()

  if (/^level\s+\d+$/i.test(label)) {
    return slugify(label)
  }

  return String(level?.slug ?? '').trim() || slugify(label)
}

function resolvePackageLevelSlug(pkg, detailSections, primaryBudgetLevel) {
  const serviceSlugs = normaliseRelationArray(pkg?.service_categories).map(service =>
    normalizeServiceSlug(service?.slug)
  )
  const isCatering = serviceSlugs.includes('catering')
  const isBartending = serviceSlugs.includes('bartending')

  // Catering Level 1/2/3 = Strapi budget_level only (client edits budget_level in CMS).
  if (isCatering) {
    const fromBudgetLevel = getBudgetLevelSlug(primaryBudgetLevel)
    if (fromBudgetLevel) return fromBudgetLevel
    return ''
  }

  for (const section of detailSections) {
    if (section?.__component !== 'package.cateringpackage') continue
    const fromCateringLevel = inferLevelSlugFromCateringLevel(section?.catering_level)
    if (fromCateringLevel) return fromCateringLevel
  }

  const fromBudgetLevel = getBudgetLevelSlug(primaryBudgetLevel)
  if (fromBudgetLevel) return fromBudgetLevel

  if (!isBartending) {
    const slugMatch = String(pkg?.slug ?? '').match(/-(\d+)$/)
    if (slugMatch) return `level-${slugMatch[1]}`
  }

  return ''
}

function resolveCateringLevelKey(detailSections = []) {
  for (const section of detailSections) {
    if (section?.__component !== 'package.cateringpackage') continue
    const key = String(section?.catering_level ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
    if (key) return key
  }
  return ''
}

function resolveBartenderType(detailSections = []) {
  for (const section of detailSections) {
    if (section?.__component !== 'package.bartendingpackage') continue
    const value = String(section?.bartender_type ?? '').trim()
    if (value) return value
  }
  return ''
}

/** Bartending listing: title + bartender_type + price all from Strapi (no hardcoded names). */
function resolveBartendingListingPresentation(pkg, detailSections = []) {
  const bartenderType = resolveBartenderType(detailSections)
  const basePrice = Number(pkg?.base_price ?? 0) || 0
  const price = formatPackagePrice({ ...pkg, base_price: basePrice })

  return {
    title: pkg?.title,
    bartender_type: bartenderType || pkg?.title || '',
    base_price: basePrice,
    price,
  }
}

function resolveStrapiImageUrl(image) {
  if (!image) return ''
  if (typeof image === 'string') return toAbsoluteStrapiUrl(image)

  const rawUrl =
    image.formats?.large?.url ??
    image.formats?.medium?.url ??
    image.formats?.small?.url ??
    image.url ??
    ''

  return toAbsoluteStrapiUrl(rawUrl)
}

function mapMediaToUrls(media) {
  return normaliseMediaArray(media).map(resolveStrapiImageUrl).filter(Boolean)
}

function filenameLabelFromUrl(url = '') {
  const raw = String(url ?? '')
    .split('?')[0]
    .split('#')[0]
    .split('/')
    .pop()

  if (!raw) return ''

  return raw
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Keep media labels (name/alt/caption) for decor inclusion click → image matching. */
function mapMediaToAssets(media) {
  return normaliseMediaArray(media)
    .map(image => {
      const url = resolveStrapiImageUrl(image)
      if (!url) return null

      if (typeof image === 'string') {
        const label = filenameLabelFromUrl(url)
        return label ? { url, label } : { url, label: '' }
      }

      const label =
        String(image?.name ?? '').trim() ||
        String(image?.alternativeText ?? '').trim() ||
        String(image?.caption ?? '').trim() ||
        filenameLabelFromUrl(url) ||
        filenameLabelFromUrl(image?.url)

      return { url, label }
    })
    .filter(Boolean)
}

function buildListingCoverImages(pkg, detailSections = []) {
  const packageImages = mapMediaToUrls(pkg?.images)
  if (packageImages.length) return packageImages

  return buildPackageImageUrls(pkg, detailSections)
}

function normaliseDynamicZoneItems(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}

function getNestedPackageSections(pkg) {
  return normaliseDynamicZoneItems(pkg.packages)
}

function getNestedPackageElements(pkg) {
  return getNestedPackageSections(pkg).flatMap(section =>
    Array.isArray(section?.elements) ? section.elements : []
  )
}

function getNestedPackageInclusions(pkg) {
  return getNestedPackageSections(pkg).flatMap(section => {
    if (Array.isArray(section?.inclusions)) return section.inclusions
    if (Array.isArray(section?.inclustions)) return section.inclustions
    return []
  })
}

function getNestedPackageAddons(pkg) {
  return [
    ...getNestedPackageSections(pkg).flatMap(section =>
      Array.isArray(section?.addons) ? section.addons : []
    ),
    ...normaliseRelationArray(pkg?.reusable_addons),
  ]
}

function getNestedPackageExclusions(pkg) {
  return getNestedPackageSections(pkg).flatMap(section =>
    Array.isArray(section?.exclusions) ? section.exclusions : []
  )
}

function getNestedPackagePriceBreakdowns(pkg) {
  return getNestedPackageSections(pkg).flatMap(section =>
    Array.isArray(section?.price_breakdown) ? section.price_breakdown : []
  )
}

function getNestedPackagePricingRules(pkg) {
  return getNestedPackageSections(pkg).flatMap(section =>
    Array.isArray(section?.pricing_rules) ? section.pricing_rules : []
  )
}

function getSheeshaDetailSection(pkg) {
  return getNestedPackageSections(pkg).find(
    section => section?.__component === 'package.sheeshapackage'
  )
}

function getNestedPackageFlavors(pkg) {
  return getNestedPackageSections(pkg).flatMap(section =>
    Array.isArray(section?.flavor)
      ? section.flavor
      : Array.isArray(section?.flavors)
        ? section.flavors
        : []
  )
}

function getNestedPackagePolicies(pkg) {
  return getNestedPackageSections(pkg)
    .map(section => section?.policy)
    .filter(Boolean)
}

function getNestedPackageBudgetLevels(pkg) {
  return getNestedPackageSections(pkg)
    .map(section => section?.budget_level)
    .filter(Boolean)
}

/** Canonical theme slugs for filtering — relation slug, name, or theme_name. */
function getPackageThemeSlugs(pkg) {
  return uniqueValues(
    getNestedPackageSections(pkg)
      .flatMap(section => {
        const theme = section?.theme
        return [
          theme?.slug,
          theme?.name,
          theme?.label,
          section?.theme_name,
          section?.theme_slug,
          typeof theme === 'string' ? theme : '',
        ]
      })
      .map(value => (value ? slugify(value) : ''))
      .filter(Boolean)
  )
}

function inferServiceSlugsFromSections(pkg) {
  const componentTypes = uniqueValues(
    getNestedPackageSections(pkg).map(section => String(section?.__component ?? '').trim())
  )

  return componentTypes.flatMap(componentType => {
    if (componentType === 'package.sheeshapackage') return ['sheesha']
    if (componentType === 'package.decorpackages') return ['decor']
    if (componentType === 'package.bartendingpackage') return ['bartending']
    if (componentType === 'package.cateringpackage') return ['catering']
    return []
  })
}

function resolvePrimaryServiceSlug(serviceSlugs = []) {
  const normalized = serviceSlugs.map(normalizeServiceSlug).filter(Boolean)
  const preferred = ['rental-furniture', 'catering', 'bartending', 'sheesha', 'decor']
  for (const slug of preferred) {
    if (normalized.includes(slug)) return slug
  }
  return normalized[0] || ''
}

function isListingChipText(text) {
  const value = String(text ?? '').trim()
  if (!value) return false
  if (value.length > 100) return false
  if (/^choose\s*\d+/i.test(value)) return false
  if (/\bOR\b/.test(value) && value.length > 40) return false
  return true
}

function buildPackageIncludes(pkg) {
  // Prefer short fixed inclusion lines for cards — skip choice rows and when: bullets
  // so listing chips match Bubbles-style pills instead of raw "Choose 1 … OR …" dumps.
  const cardChips = getNestedPackageInclusions(pkg)
    .filter(item => item && !item.is_choice_group)
    .filter(item => !String(item.group_title ?? '').toLowerCase().startsWith('when:'))
    .map(item => String(item.text ?? '').trim())
    .filter(isListingChipText)

  const fromInclusions = uniqueValues(cardChips)
  if (fromInclusions.length > 0) return fromInclusions.slice(0, 4)

  const fallback = buildDetailHighlights(pkg).filter(isListingChipText)
  if (fallback.length > 0) return fallback.slice(0, 4)

  return []
}

function formatPackagePrice(pkg) {
  const sale = resolvePackageSalePricing(pkg)
  if (sale.saleLabel) return sale.saleLabel

  if (typeof pkg?.price === 'string' && pkg.price.trim()) {
    return pkg.price.trim()
  }

  return ''
}

function buildPriceCoverText(section) {
  const lines = (Array.isArray(section?.price_covers) ? section.price_covers : [])
    .map(item => item?.text ?? item?.title ?? item?.label ?? '')
    .map(text => String(text ?? '').trim())
    .filter(Boolean)

  if (!lines.length) return ''

  const checklist = []
  const notes = []

  lines.forEach(line => {
    if (/^no hidden service fees\.?$/i.test(line)) {
      notes.push(line.endsWith('.') ? line : `${line}.`)
      return
    }

    checklist.push(line.startsWith('✓') ? line : `✓ ${line}`)
  })

  return [...checklist, ...notes].join('\n')
}

function buildPolicyText(policy) {
  if (!policy) return ''
  if (typeof policy?.summary_text === 'string' && policy.summary_text.trim())
    return policy.summary_text
  if (typeof policy?.content === 'string' && policy.content.trim()) return policy.content
  return ''
}

function clarifyPriceMayVaryCopy(body) {
  const text = String(body ?? '').trim()
  if (!text) return text

  if (/prices may vary/i.test(text) && /while you choose/i.test(text)) return text

  return text.replace(
    /prices may vary accordingly\.?/gi,
    'prices may vary accordingly and are shown while you choose your options.'
  )
}

function buildAccordionSections(pkg) {
  const sections = getNestedPackageSections(pkg)
  const policies = getNestedPackagePolicies(pkg)
  const firstPolicy = policies[0]

  return sections
    .flatMap(section => [
      section?.nitty_gritty
        ? { title: 'The Nitty-Gritty', body: clarifyPriceMayVaryCopy(section.nitty_gritty) }
        : null,
      buildPriceCoverText(section)
        ? { title: 'The price you see covers it all', body: buildPriceCoverText(section) }
        : null,
      section?.setup_needs ? { title: 'Setup needs', body: section.setup_needs } : null,
      section?.client_requirements
        ? { title: 'What we need from you', body: section.client_requirements }
        : null,
      section?.ideal_for ? { title: 'Ideal for', body: section.ideal_for } : null,
      section?.best_placed_at ? { title: 'Best placed at', body: section.best_placed_at } : null,
      section?.why_we_love_it ? { title: 'Why we love it', body: section.why_we_love_it } : null,
      buildPolicyText(section?.policy)
        ? { title: 'Policies', body: buildPolicyText(section.policy) }
        : null,
    ])
    .concat(
      buildPolicyText(firstPolicy) && !sections.some(section => section?.policy)
        ? [{ title: 'Policies', body: buildPolicyText(firstPolicy) }]
        : []
    )
    .filter(Boolean)
}

function buildDetailHighlights(pkg) {
  return uniqueValues([
    ...getNestedPackageInclusions(pkg).map(item => item?.text),
    ...getNestedPackageElements(pkg).map(item => item?.title),
    ...getNestedPackageAddons(pkg).map(item => item?.name),
  ]).slice(0, 12)
}

function buildFlavorOptions(pkg) {
  return uniqueValues(
    getNestedPackageFlavors(pkg).flatMap(flavor => [flavor?.Name, flavor?.name])
  ).map(name => {
    const flavor =
      getNestedPackageFlavors(pkg).find(item => item?.Name === name || item?.name === name) ?? {}

    return {
      title: name,
      description: flavor?.description ?? '',
    }
  })
}

function buildTextList(items, keys = ['text', 'title', 'name', 'label']) {
  return uniqueValues(
    (Array.isArray(items) ? items : [])
      .flatMap(item => keys.map(key => item?.[key]))
      .filter(Boolean)
  )
}

function buildAddonList(items = []) {
  const seen = new Set()

  return (Array.isArray(items) ? items : [])
    .filter(item => item && item.visibility !== false)
    .map(item => ({
      id: item?.id != null ? String(item.id) : '',
      name: String(item?.name ?? item?.title ?? item?.text ?? '').trim(),
      description: String(item?.description ?? '').trim(),
      price: Number(item?.price ?? 0),
      max_price: Number(item?.max_price ?? item?.price_max ?? 0) || undefined,
      unit: String(item?.unit ?? '').trim(),
      max_quantity: Number(item?.max_quantity ?? 1),
      visibility: item?.visibility !== false,
      image:
        (typeof item?.image === 'string' ? toAbsoluteStrapiUrl(item.image) : '') ||
        resolveStrapiImageUrl(item?.image) ||
        resolveStrapiImageUrl(Array.isArray(item?.image) ? item.image[0] : item?.image?.data),
    }))
    .filter(item => {
      if (!item.name) return false
      const key = `${item.id}::${item.name.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function buildPricingRuleList(items = []) {
  const seen = new Set()

  return (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .map((item, index) => {
      const label = String(
        item?.value ?? item?.title ?? item?.name ?? item?.label ?? item?.hours_range ?? ''
      ).trim()
      const modifierType = String(item?.modifier_type ?? '')
        .trim()
        .toLowerCase()
      const modifierValue = Number(item?.modifier_value ?? 0)
      const ruleType = String(item?.rule_type ?? '')
        .trim()
        .toLowerCase()

      return {
        id: item?.id != null ? String(item.id) : `${label || 'pricing-rule'}-${index}`,
        label,
        value: label,
        title: label,
        rule_type: ruleType,
        modifier_type: modifierType,
        modifier_value: Number.isFinite(modifierValue) ? modifierValue : 0,
      }
    })
    .filter(item => {
      if (!item.label) return false
      const key = `${item.id}::${item.label.toLowerCase()}::${item.modifier_value}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function getSectionInclusionImages(section) {
  const inclusions = Array.isArray(section?.inclusions)
    ? section.inclusions
    : Array.isArray(section?.inclustions)
      ? section.inclustions
      : []

  return inclusions
    .flatMap(item => normaliseMediaArray(item?.images))
    .map(image => {
      if (typeof image === 'string') return toAbsoluteStrapiUrl(image)
      return toAbsoluteStrapiUrl(image?.url)
    })
    .filter(Boolean)
}

function getSectionBackdropImages(section) {
  return normaliseMediaArray(section?.backdrop_images)
    .map(image => {
      if (typeof image === 'string') return toAbsoluteStrapiUrl(image)
      return toAbsoluteStrapiUrl(image?.url)
    })
    .filter(Boolean)
}

function getSectionElementImages(section) {
  return (Array.isArray(section?.elements) ? section.elements : [])
    .flatMap(element => normaliseMediaArray(element?.images))
    .map(image => {
      if (typeof image === 'string') return toAbsoluteStrapiUrl(image)
      return toAbsoluteStrapiUrl(image?.url)
    })
    .filter(Boolean)
}

function buildPackageImageUrls(pkg, detailSections = []) {
  const packageImages = mapMediaToUrls(pkg?.images)

  return uniqueValues([
    ...packageImages,
    ...detailSections.flatMap(getSectionInclusionImages),
    ...detailSections.flatMap(getSectionBackdropImages),
    ...detailSections.flatMap(getSectionElementImages),
  ])
}

function normalizePackage(pkg, index = 0, options = {}) {
  const listing = options.listing === true
  const detailSections = getNestedPackageSections(pkg)
  const serviceCategories = normaliseRelationArray(pkg.service_categories)
  const budgetLevels = getNestedPackageBudgetLevels(pkg)
  const primaryBudgetLevel = budgetLevels[0] ?? null
  const packageIncludes = buildPackageIncludes(pkg)
  const categoryServiceSlugs = uniqueValues(
    serviceCategories.flatMap(service => [
      service?.slug,
      normalizeServiceSlug(service?.slug),
      service?.parent_category?.slug,
      normalizeServiceSlug(service?.parent_category?.slug),
      service?.name,
      normalizeServiceSlug(service?.name),
    ])
  )
  const hasFurnitureCategory = categoryServiceSlugs.some(
    slug => normalizeServiceSlug(slug) === 'rental-furniture'
  )
  const inferredServiceSlugs = inferServiceSlugsFromSections(pkg).filter(
    slug => !(hasFurnitureCategory && normalizeServiceSlug(slug) === 'decor')
  )
  const serviceSlugs = uniqueValues([...categoryServiceSlugs, ...inferredServiceSlugs])
  const serviceIds = uniqueValues(
    serviceCategories.flatMap(service => [service?.id, service?.parent_category?.id]).map(String)
  )

  const bartendingPresentation = serviceSlugs.includes('bartending')
    ? resolveBartendingListingPresentation(pkg, detailSections)
    : null

  const cateringSection = serviceSlugs.includes('catering')
    ? getCateringDetailSection({ detail_sections: detailSections })
    : null

  const cateringListingPrice = cateringSection
    ? getCateringPriceRangeLabel(cateringSection, pkg.base_price)
    : ''

  const numericBaseForSale =
    Number(cateringSection?.price_per_person_veg ?? 0) ||
    Number(cateringSection?.price_per_person_non_veg ?? 0) ||
    bartendingPresentation?.base_price ||
    (Number(pkg.base_price ?? pkg.starting_price ?? pkg.price_from ?? 0) || 0)

  const salePricing = resolvePackageSalePricing(pkg, numericBaseForSale)
  const formattedSalePrice =
    bartendingPresentation?.price ||
    cateringListingPrice ||
    salePricing.saleLabel ||
    formatPackagePrice({
      ...pkg,
      base_price: numericBaseForSale,
    })

  const primaryServiceSlug = resolvePrimaryServiceSlug(serviceSlugs)
  const sheeshaSection = primaryServiceSlug === 'sheesha' ? getSheeshaDetailSection(pkg) : null
  const sheeshaSizeLabel =
    primaryServiceSlug === 'sheesha'
      ? resolveSheeshaSizeLabel({
          ...pkg,
          sheesha_size: sheeshaSection?.size,
          detail_sections: detailSections,
        })
      : ''

  const sharedFields = {
    id: pkg.id,
    documentId: pkg.documentId,
    slug: String(pkg.slug ?? '').trim(),
    title: bartendingPresentation?.title || pkg.title,
    category: (() => {
      if (primaryServiceSlug === 'sheesha') {
        return (
          serviceCategories.find(service => normalizeServiceSlug(service?.slug) === 'sheesha')
            ?.name || 'Sheesha'
        )
      }
      if (primaryServiceSlug === 'catering') {
        return (
          serviceCategories.find(service => normalizeServiceSlug(service?.slug) === 'catering')
            ?.name || 'Catering'
        )
      }
      if (primaryServiceSlug === 'bartending') {
        return (
          serviceCategories.find(service => normalizeServiceSlug(service?.slug) === 'bartending')
            ?.name || 'Bartending'
        )
      }
      if (primaryServiceSlug === 'rental-furniture') {
        return (
          serviceCategories.find(
            service => normalizeServiceSlug(service?.slug) === 'rental-furniture'
          )?.name || 'Furniture'
        )
      }

      return (
        pkg.category ??
        normaliseRelationArray(pkg.events)[0]?.name ??
        normaliseRelationArray(pkg.events)[0]?.parent_event?.name ??
        ''
      )
    })(),
    description: blocksToText(pkg.description),
    price: formattedSalePrice,
    compare_at_price:
      !bartendingPresentation?.price && !cateringListingPrice && salePricing.hasDiscount
        ? salePricing.originalLabel
        : '',
    discount_badge:
      !bartendingPresentation?.price && !cateringListingPrice && salePricing.hasDiscount
        ? salePricing.badge
        : '',
    discount_active: salePricing.hasDiscount,
    discount_type: pkg.discount_type ?? 'percentage',
    discount_value: Number(pkg.discount_value ?? 0) || 0,
    discount_valid_from: pkg.discount_valid_from ?? null,
    discount_valid_to: pkg.discount_valid_to ?? null,
    base_price: numericBaseForSale,
    includes: packageIncludes,
    tags: packageIncludes,
    event_slugs: normaliseRelationArray(pkg.events)
      .map(event => event?.slug)
      .filter(Boolean),
    event_ids: normaliseRelationArray(pkg.events)
      .map(event => String(event?.id))
      .filter(Boolean),
    category_slugs: normaliseRelationArray(pkg.events)
      .map(event => event?.parent_event?.slug)
      .filter(Boolean),
    category_ids: normaliseRelationArray(pkg.events)
      .map(event => String(event?.parent_event?.id))
      .filter(Boolean),
    service_slugs: serviceSlugs,
    service_ids: serviceIds,
    theme_slugs: getPackageThemeSlugs(pkg),
    catering_level: resolveCateringLevelKey(detailSections),
    bartender_type: bartendingPresentation?.bartender_type || resolveBartenderType(detailSections),
    level_slug: resolvePackageLevelSlug(pkg, detailSections, primaryBudgetLevel),
    level_id: primaryBudgetLevel?.id != null ? String(primaryBudgetLevel.id) : '',
    ...(sheeshaSizeLabel ? { sheesha_size_label: sheeshaSizeLabel } : {}),
    images: listing
      ? buildListingCoverImages(pkg, detailSections)
      : buildPackageImageUrls(pkg, detailSections),
    _index: index,
  }

  if (listing) {
    return sharedFields
  }

  return {
    ...sharedFields,
    image_assets: mapMediaToAssets(pkg?.images),
    detail_sections: detailSections,
    detail_inclusions: buildDetailHighlights(pkg),
    detail_addons: buildAddonList(getNestedPackageAddons(pkg)),
    detail_exclusions: buildTextList(getNestedPackageExclusions(pkg)),
    detail_price_breakdown: getNestedPackagePriceBreakdowns(pkg),
    detail_pricing_rules: buildPricingRuleList(getNestedPackagePricingRules(pkg)),
    detail_accordion_sections: buildAccordionSections(pkg),
    flavor_options: buildFlavorOptions(pkg),
    catering_guest_discounts: pkg.catering_guest_discounts ?? null,
  }
}

function getPackageListingPopulateParams() {
  return {
    'populate[images]': 'true',
    'populate[events][populate][0]': 'parent_event',
    'populate[service_categories][populate][0]': 'parent_category',
    'populate[packages][on][package.decorpackages][populate][inclustions]': 'true',
    'populate[packages][on][package.decorpackages][populate][elements][populate]': 'service',
    'populate[packages][on][package.decorpackages][populate][theme]': 'true',
    'populate[packages][on][package.decorpackages][populate][budget_level]': 'true',
    'populate[packages][on][package.sheeshapackage][populate][inclusions]': 'true',
    'populate[packages][on][package.sheeshapackage][populate][elements][populate]': 'service',
    'populate[packages][on][package.bartendingpackage][populate][inclusions]': 'true',
    'populate[packages][on][package.bartendingpackage][populate][budget_level]': 'true',
    'populate[packages][on][package.cateringpackage][populate][inclusions]': 'true',
    'populate[packages][on][package.cateringpackage][populate][budget_level]': 'true',
  }
}

function getPackagePopulateParams() {
  return {
    'populate[images]': 'true',
    'populate[events][populate][0]': 'parent_event',
    'populate[reusable_addons]': 'true',
    'populate[service_categories][populate][0]': 'parent_category',
    'populate[packages][on][package.decorpackages][populate][elements][populate]': 'service',
    'populate[packages][on][package.decorpackages][populate][addons]': 'true',
    'populate[packages][on][package.decorpackages][populate][inclustions]': 'true',
    'populate[packages][on][package.decorpackages][populate][policy]': 'true',
    'populate[packages][on][package.decorpackages][populate][price_covers]': 'true',
    'populate[packages][on][package.decorpackages][populate][price_breakdown]': 'true',
    'populate[packages][on][package.decorpackages][populate][theme]': 'true',
    'populate[packages][on][package.decorpackages][populate][budget_level]': 'true',
    'populate[packages][on][package.decorpackages][populate][backdrop_images]': 'true',
    'populate[packages][on][package.sheeshapackage][populate][elements][populate]': 'service',
    'populate[packages][on][package.sheeshapackage][populate][addons]': 'true',
    'populate[packages][on][package.sheeshapackage][populate][inclusions]': 'true',
    'populate[packages][on][package.sheeshapackage][populate][policy]': 'true',
    'populate[packages][on][package.sheeshapackage][populate][price_covers]': 'true',
    'populate[packages][on][package.sheeshapackage][populate][flavor]': 'true',
    'populate[packages][on][package.bartendingpackage][populate][inclusions]': 'true',
    'populate[packages][on][package.bartendingpackage][populate][exclusions]': 'true',
    'populate[packages][on][package.bartendingpackage][populate][policy]': 'true',
    'populate[packages][on][package.bartendingpackage][populate][price_covers]': 'true',
    'populate[packages][on][package.bartendingpackage][populate][price_breakdown]': 'true',
    'populate[packages][on][package.bartendingpackage][populate][budget_level]': 'true',
    'populate[packages][on][package.bartendingpackage][populate][pricing_rules]': 'true',
    'populate[packages][on][package.cateringpackage][populate][menu_items]': 'true',
    'populate[packages][on][package.cateringpackage][populate][inclusions]': 'true',
    'populate[packages][on][package.cateringpackage][populate][exclusions]': 'true',
    'populate[packages][on][package.cateringpackage][populate][addons]': 'true',
    'populate[packages][on][package.cateringpackage][populate][policy]': 'true',
    'populate[packages][on][package.cateringpackage][populate][price_covers]': 'true',
    'populate[packages][on][package.cateringpackage][populate][price_breakdown]': 'true',
    'populate[packages][on][package.cateringpackage][populate][budget_level]': 'true',
    'populate[packages][on][package.cateringpackage][populate][pricing_rules]': 'true',
  }
}

function isNumericId(value) {
  return /^\d+$/.test(String(value ?? '').trim())
}

async function fetchPackages(params = {}) {
  const { listing = false, ...filterParams } = params
  const populateParams = listing ? getPackageListingPopulateParams() : getPackagePopulateParams()
  const baseParams = {
    ...populateParams,
    'filters[is_active][$eq]': 'true',
    'filters[visibility][$eq]': 'true',
    'pagination[page]': '1',
    'pagination[pageSize]': '100',
    sort: 'createdAt:asc',
    ...filterParams,
  }

  const firstResponse = await strapiGet('/packages', baseParams)
  const firstPageData = Array.isArray(firstResponse?.data) ? firstResponse.data : []
  const pageCount = Number(firstResponse?.meta?.pagination?.pageCount ?? 1)

  const extraPages =
    pageCount > 1
      ? await Promise.all(
          Array.from({ length: pageCount - 1 }, (_, offset) =>
            strapiGet('/packages', {
              ...baseParams,
              'pagination[page]': String(offset + 2),
            })
          )
        )
      : []

  const packages = [firstPageData, ...extraPages.map(response => response?.data ?? [])]
    .flat()
    .map((pkg, index) => normalizePackage(pkg, index, { listing }))

  if (!listing) {
    const pkg = packages[0]
    if (pkg?.images?.length) preloadImages(pkg.images.slice(0, 1))
  }

  return packages
}

export function usePackages() {
  return useQuery({
    queryKey: ['packages', 'live-v16-packages-api-fix'],
    queryFn: async () => {
      if (USE_FALLBACK) return PACKAGES_FALLBACK
      try {
        const packages = await fetchPackages({ listing: true })
        return packages.length > 0 ? packages : PACKAGES_FALLBACK
      } catch {
        return PACKAGES_FALLBACK
      }
    },
    placeholderData: PACKAGES_FALLBACK,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  })
}

export function usePackageById(packageId) {
  return useQuery({
    queryKey: ['package', packageId, 'live-v6'],
    enabled: Boolean(packageId),
    queryFn: async () => {
      if (USE_FALLBACK) {
        return (
          PACKAGES_FALLBACK.find(pkg => String(pkg.documentId ?? pkg.id) === String(packageId)) ??
          null
        )
      }

      const filters = isNumericId(packageId)
        ? { 'filters[id][$eq]': String(packageId) }
        : { 'filters[documentId][$eq]': String(packageId) }

      const items = await fetchPackages({ ...filters, listing: false })
      const pkg = items[0] ?? null
      if (pkg?.images?.length) preloadImages(pkg.images.slice(0, 1))
      return pkg
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  })
}
