import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import { PACKAGES_FALLBACK } from '../data/packages'
import { normalizeServiceSlug } from '../lib/packageFilters'

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

function getNestedPackageThemes(pkg) {
  return getNestedPackageSections(pkg).flatMap(section =>
    [section?.theme, section?.theme_name].filter(Boolean)
  )
}

function getNestedPackageBudgetLevels(pkg) {
  return getNestedPackageSections(pkg)
    .map(section => section?.budget_level)
    .filter(Boolean)
}

function inferServiceSlugsFromSections(pkg) {
  const componentTypes = uniqueValues(
    getNestedPackageSections(pkg).map(section => String(section?.__component ?? '').trim())
  )

  return componentTypes.flatMap(componentType => {
    if (componentType === 'package.sheeshapackage') return ['sheesha']
    if (componentType === 'package.decorpackages') return ['decor']
    if (componentType === 'package.bartendingpackage') return ['bartending']
    return []
  })
}

function getPackageTags(pkg) {
  const elementTags = getNestedPackageElements(pkg).flatMap(element => [
    element?.service?.name,
    element?.title,
  ])
  const inclusionTags = getNestedPackageInclusions(pkg).map(inclusion => inclusion?.text)

  return uniqueValues([...elementTags, ...inclusionTags]).slice(0, 5)
}

function buildPriceCoverText(section) {
  return (Array.isArray(section?.price_covers) ? section.price_covers : [])
    .map(item => item?.text ?? item?.title ?? item?.label ?? '')
    .filter(Boolean)
    .join(', ')
}

function buildPolicyText(policy) {
  if (!policy) return ''
  if (typeof policy?.summary_text === 'string' && policy.summary_text.trim())
    return policy.summary_text
  if (typeof policy?.content === 'string' && policy.content.trim()) return policy.content
  return ''
}

function buildAccordionSections(pkg) {
  const sections = getNestedPackageSections(pkg)
  const policies = getNestedPackagePolicies(pkg)
  const firstPolicy = policies[0]

  return sections
    .flatMap(section => [
      section?.nitty_gritty ? { title: 'The Nitty-Gritty', body: section.nitty_gritty } : null,
      buildPriceCoverText(section)
        ? { title: 'The price you see covers it all', body: buildPriceCoverText(section) }
        : null,
      section?.setup_needs ? { title: 'Setup needs', body: section.setup_needs } : null,
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
      unit: String(item?.unit ?? '').trim(),
      max_quantity: Number(item?.max_quantity ?? 1),
      visibility: item?.visibility !== false,
    }))
    .filter(item => {
      if (!item.name) return false
      const key = `${item.id}::${item.name.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function normalizePackage(pkg, index = 0) {
  const serviceCategories = normaliseRelationArray(pkg.service_categories)
  const packageThemes = getNestedPackageThemes(pkg)
  const budgetLevels = getNestedPackageBudgetLevels(pkg)
  const primaryBudgetLevel = budgetLevels[0] ?? null
  const serviceSlugs = uniqueValues(
    serviceCategories
      .flatMap(service => [
        service?.slug,
        normalizeServiceSlug(service?.slug),
        service?.parent_category?.slug,
        normalizeServiceSlug(service?.parent_category?.slug),
        service?.name,
        normalizeServiceSlug(service?.name),
      ])
      .concat(inferServiceSlugsFromSections(pkg))
  )
  const serviceIds = uniqueValues(
    serviceCategories.flatMap(service => [service?.id, service?.parent_category?.id]).map(String)
  )

  return {
    id: pkg.id,
    documentId: pkg.documentId,
    title: pkg.title,
    category: pkg.category ?? '',
    description: blocksToText(pkg.description),
    price: pkg.base_price ? `₹${Number(pkg.base_price).toLocaleString('en-IN')}` : '',
    base_price: pkg.base_price ?? 0,
    tags: getPackageTags(pkg).concat('More'),
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
    theme_slugs: uniqueValues(
      packageThemes.flatMap(theme =>
        typeof theme === 'string' ? [theme] : [theme?.slug, theme?.name]
      )
    ).filter(Boolean),
    level_slug: getBudgetLevelSlug(primaryBudgetLevel),
    level_id: primaryBudgetLevel?.id != null ? String(primaryBudgetLevel.id) : '',
    images: normaliseMediaArray(pkg.images)
      .map(image => {
        if (typeof image === 'string') return toAbsoluteStrapiUrl(image)
        return toAbsoluteStrapiUrl(image?.url)
      })
      .filter(Boolean),
    detail_sections: getNestedPackageSections(pkg),
    detail_inclusions: buildDetailHighlights(pkg),
    detail_addons: buildAddonList(getNestedPackageAddons(pkg)),
    detail_exclusions: buildTextList(getNestedPackageExclusions(pkg)),
    detail_price_breakdown: getNestedPackagePriceBreakdowns(pkg),
    detail_accordion_sections: buildAccordionSections(pkg),
    flavor_options: buildFlavorOptions(pkg),
    _index: index,
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
    'populate[packages][on][package.bartendingpackage][populate][addons]': 'true',
    'populate[packages][on][package.bartendingpackage][populate][inclusions]': 'true',
    'populate[packages][on][package.bartendingpackage][populate][exclusions]': 'true',
    'populate[packages][on][package.bartendingpackage][populate][policy]': 'true',
    'populate[packages][on][package.bartendingpackage][populate][price_covers]': 'true',
    'populate[packages][on][package.bartendingpackage][populate][price_breakdown]': 'true',
    'populate[packages][on][package.bartendingpackage][populate][budget_level]': 'true',
  }
}

function isNumericId(value) {
  return /^\d+$/.test(String(value ?? '').trim())
}

async function fetchPackages(params = {}) {
  const { data } = await strapiGet('/packages', {
    ...getPackagePopulateParams(),
    'filters[is_active][$eq]': 'true',
    'filters[visibility][$eq]': 'true',
    sort: 'createdAt:asc',
    ...params,
  })

  return data.map((pkg, index) => normalizePackage(pkg, index))
}

export function usePackages() {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      if (USE_FALLBACK) return PACKAGES_FALLBACK

      try {
        return await fetchPackages()
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
    queryKey: ['package', packageId],
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

      const items = await fetchPackages(filters)
      return items[0] ?? null
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  })
}
