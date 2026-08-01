import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/common/useToast'
import SingleProductPageContent from '../components/package-details/SingleProductPageContent'
import InclusionImageToast from '../components/package-details/InclusionImageToast'
import { usePackageById, usePackages } from '../hooks/usePackages'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'
import { useCancellationPolicy } from '../hooks/useCancellationPolicy'
import { useCartToastMessage } from '../hooks/useMessagingContent'
import { usePackageReviews } from '../hooks/usePackageReviews'
import { getRelatedPackages, normalizeServiceSlug } from '../lib/packageFilters'
import { isCorporateCategory } from '../lib/serviceFlow'
import { withHousePartyPackageImages } from '../lib/housePartyPackageMedia'
import { resolveChooseOneDisplayPrice, shouldShowChoicePrices } from '../lib/chooseOnePricing'
import pkgImg1 from '../assets/images/IMG_3903.jpg'
import pkgImg2 from '../assets/images/IMG_7768.jpg'
import pkgImg3 from '../assets/images/IMG_0749.jpg'
import pkgImg4 from '../assets/images/IMG_0658.jpg'
import pkgImg5 from '../assets/images/IMG_3148.jpg'
import pkgImg6 from '../assets/images/IMG_7025.jpg'
import pkgImg7 from '../assets/images/IMG_8625.png'
import pkgImg8 from '../assets/images/IMG_9814.jpg'
import pkgImg9 from '../assets/images/6f6af066.jpg'
import useCustomization from '../hooks/useCustomization'
import { useCart } from '../hooks/useCart'

const PKG_LOCAL_IMAGES = [
  [pkgImg1, pkgImg1, pkgImg1, pkgImg1, pkgImg1],
  [pkgImg2, pkgImg2, pkgImg2, pkgImg2, pkgImg2],
  [pkgImg7, pkgImg8, pkgImg9, pkgImg1, pkgImg2],
  [pkgImg2, pkgImg4, pkgImg7, pkgImg5, pkgImg9],
  [pkgImg5, pkgImg1, pkgImg8, pkgImg3, pkgImg6],
]

const DECOR_CONTENT = {
  title: 'Paint & Prosecco',
  price: 'Rs13,600.00',
  intro:
    'An intimate, beautifully styled setup designed for slow conversations, shared laughs, and a hands-on painting experience. Think soft florals, cozy seating, and a table that invites you to sit, sip, and spill everything.',
  keyDecorElements:
    'An intimate, beautifully styled setup designed for slow conversations, shared laughs, and a hands-on painting experience. Think soft florals, cozy seating, and a table that invites you to sit, sip, and spill everything.',
  accordionSections: [
    {
      title: 'The Nitty-Gritty',
      body: 'Setup timing, load-in, teardown, and venue coordination details are confirmed with you before the event date.',
    },
    {
      title: 'The price you see covers it all',
      body: 'The listed price covers the shared setup items shown here. Optional custom add-ons can be layered on later if needed.',
    },
    {
      title: 'Setup needs',
      body: 'We typically need a clear setup zone, venue access during load-in, and enough space for the low table and backdrop area.',
    },
    {
      title: 'Best placed at',
      body: 'This works best in intimate indoor celebrations, garden dinners, and hosted private gatherings with a dedicated decor corner.',
    },
    {
      title: 'Why we love it',
      body: 'It creates a warm conversation-led experience and gives guests something beautiful and interactive to gather around.',
    },
    {
      title: 'Policies',
      body: 'Custom changes, venue rules, and final guest count should be confirmed in advance so production can stay smooth.',
    },
    {
      title: 'Cancellation Policy',
      body: 'Cancellation timelines affect refund eligibility because sourcing and prep often begin before the event week.',
    },
  ],
}

const DECOR_ADDITIONAL_INFO_KEY = '__additional_info__'

function uniqueValues(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))]
}

function normaliseMediaArray(media) {
  if (!media) return []
  if (Array.isArray(media)) return media
  if (Array.isArray(media?.data)) return media.data
  return []
}

function toAbsoluteStrapiUrl(url) {
  if (!url || typeof url !== 'string') return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const base = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

function cleanText(value = '') {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCaseLabel(value = '') {
  const text = cleanText(value)
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatPrice(value) {
  if (value == null || value === '') return ''

  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) return ''

  return `₹${numericValue.toLocaleString('en-IN')}`
}

function normalisePackageId(value = '') {
  return String(value).trim().toLowerCase()
}

function buildPackageId(pkg) {
  return normalisePackageId(pkg.documentId ?? pkg.id ?? pkg.title)
}

function getDecorDetailSections(pkg) {
  return (Array.isArray(pkg?.detail_sections) ? pkg.detail_sections : []).filter(
    section =>
      section?.__component === 'package.decorpackages' ||
      Array.isArray(section?.inclustions) ||
      Array.isArray(section?.backdrop_images) ||
      Array.isArray(section?.elements) ||
      section?.theme_name ||
      section?.setup_needs
  )
}

function buildDecorAccordionSections(pkg) {
  return Array.isArray(pkg?.detail_accordion_sections) && pkg.detail_accordion_sections.length
    ? pkg.detail_accordion_sections
    : DECOR_CONTENT.accordionSections
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

function buildDecorIntro(pkg) {
  if (pkg?.description) return pkg.description

  const blocks = getDecorDetailSections(pkg)
  const blockIntro = blocks
    .flatMap(section => [section?.purpose, section?.key_decor_elements, section?.notes])
    .map(cleanText)
    .find(Boolean)

  return blockIntro || DECOR_CONTENT.intro
}

function buildKeyDecorText(pkg) {
  const blocks = getDecorDetailSections(pkg)
  if (!blocks.length) return DECOR_CONTENT.keyDecorElements

  const keyDecorText = blocks
    .flatMap(section => [section?.key_decor_elements])
    .map(cleanText)
    .find(Boolean)

  return keyDecorText || ''
}

function normalizeGalleryImageUrl(image) {
  if (!image) return ''
  if (typeof image === 'string') return toAbsoluteStrapiUrl(image)
  return toAbsoluteStrapiUrl(image?.url)
}

function buildDecorMediaGallery(pkg) {
  const inclusionImages = getDecorDetailSections(pkg)
    .flatMap(section =>
      (Array.isArray(section?.inclustions) ? section.inclustions : []).flatMap(getInclusionImages)
    )
    .filter(Boolean)
  const backdropImages = getDecorDetailSections(pkg)
    .flatMap(section => normaliseMediaArray(section?.backdrop_images))
    .map(image => normalizeGalleryImageUrl(image))
    .filter(Boolean)
  const elementImages = getDecorDetailSections(pkg)
    .flatMap(section => (Array.isArray(section?.elements) ? section.elements : []))
    .flatMap(element => normaliseMediaArray(element?.images))
    .map(image => normalizeGalleryImageUrl(image))
    .filter(Boolean)

  return uniqueValues([
    ...(Array.isArray(pkg?.images) ? pkg.images : [])
      .map(image => normalizeGalleryImageUrl(image))
      .filter(Boolean),
    ...inclusionImages,
    ...backdropImages,
    ...elementImages,
  ])
}

function collectSectionGalleryImages(sections = []) {
  return uniqueValues(
    (Array.isArray(sections) ? sections : []).flatMap(section => {
      const items = Array.isArray(section?.items) ? section.items : []

      return items.flatMap(item => {
        if (typeof item === 'string') return []
        return (Array.isArray(item?.images) ? item.images : [])
          .map(image => normalizeGalleryImageUrl(image))
          .filter(Boolean)
      })
    })
  )
}

function buildDecorSideImages(sourceImages = []) {
  const normalized = uniqueValues(
    (Array.isArray(sourceImages) ? sourceImages : [])
      .map(image => normalizeGalleryImageUrl(image) || image)
      .filter(Boolean)
  )

  if (!normalized.length) return PKG_LOCAL_IMAGES[0]

  return normalized
}

function getInclusionImages(inclusion) {
  return normaliseMediaArray(inclusion?.images)
    .map(image => {
      if (typeof image === 'string') return toAbsoluteStrapiUrl(image)
      return toAbsoluteStrapiUrl(image?.url)
    })
    .filter(Boolean)
}

function getPackageFallbackImages(pkg) {
  return uniqueValues(
    (Array.isArray(pkg?.images) ? pkg.images : [])
      .map(image => normalizeGalleryImageUrl(image))
      .filter(Boolean)
  )
}

function getPackageImageAssets(pkg) {
  const assets = Array.isArray(pkg?.image_assets) ? pkg.image_assets : []
  const byUrl = new Map()

  assets.forEach(asset => {
    const url = normalizeGalleryImageUrl(asset?.url || asset)
    if (!url) return
    byUrl.set(url, {
      url,
      label: cleanText(asset?.label || asset?.name || asset?.alternativeText || asset?.caption),
    })
  })

  // Include any gallery URLs missing from image_assets (section media, etc.).
  getPackageFallbackImages(pkg).forEach(url => {
    if (byUrl.has(url)) return
    byUrl.set(url, {
      url,
      label: cleanText(
        String(url)
          .split('?')[0]
          .split('/')
          .pop()
          ?.replace(/\.[a-z0-9]+$/i, '')
          .replace(/[_-]+/g, ' ') ?? ''
      ),
    })
  })

  if (byUrl.size) return [...byUrl.values()]

  return []
}

function slugifyMatchKey(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function expandMatchLabels(...labels) {
  const expanded = new Set()

  labels
    .map(label => cleanText(label))
    .filter(Boolean)
    .forEach(label => {
      expanded.add(label)

      const withoutChoose = label.replace(/\(\s*choose\s*\d+\s*\)/gi, '').trim()
      if (withoutChoose) expanded.add(withoutChoose)

      const withoutPrefix = withoutChoose
        .replace(/^(basic|premium|fancy|customized|custom)\s+/i, '')
        .trim()
      if (withoutPrefix) expanded.add(withoutPrefix)

      // Common decor aliases used in media filenames / alt text.
      if (/entr(y|ance)/i.test(label)) {
        expanded.add('Entrance Setup')
        expanded.add('Entry setup')
        expanded.add('Entry Setup')
        expanded.add('Entrance')
        expanded.add('Entry')
      }
      if (/cent(?:re|er)\s*pieces?/i.test(label) || /centrepiece|centerpiece/i.test(label)) {
        expanded.add('Centrepieces')
        expanded.add('Centrepiece')
        expanded.add('Centerpieces')
        expanded.add('Centerpiece')
      }
      if (/\bbar\b/i.test(label)) {
        expanded.add('Bar Setup')
        expanded.add('Basic Bar Setup')
        expanded.add('Premium Bar Setup')
        expanded.add('Bar')
      }
      if (/photo[\s-]?op|backdrop/i.test(label)) {
        expanded.add('Photo-op')
        expanded.add('Photo Op')
        expanded.add('Backdrop')
        expanded.add('Fancy backdrop')
      }
      if (/furniture|chair|table/i.test(label)) {
        expanded.add('Premium Furniture')
        expanded.add('Furniture')
      }
      if (/floral|flower/i.test(label)) {
        expanded.add('Florals')
        expanded.add('Floral')
      }
      if (/balloon/i.test(label)) {
        expanded.add('Balloons')
        expanded.add('Balloon')
      }
      if (/printable/i.test(label)) {
        expanded.add('Printables')
      }
    })

  return [...expanded]
}

function scoreImageLabelMatch(targetLabel, imageLabel) {
  const target = slugifyMatchKey(targetLabel)
  const candidate = slugifyMatchKey(imageLabel)
  if (!target || !candidate) return 0
  if (target === candidate) return 100

  const targetParts = target.split('-').filter(Boolean)
  const candidateParts = candidate.split('-').filter(Boolean)
  const candidateSet = new Set(candidateParts)

  // Prefer full phrase containment for multi-word section titles (Entrance Setup, Bar Setup).
  if (targetParts.length >= 2 && candidate.includes(target)) return 92
  if (candidateParts.length >= 2 && target.includes(candidate)) return 90

  // Single-word targets (Florals / Balloons) must be a primary label, not a mention inside
  // a longer unrelated filename like "entrance-setup-with-florals".
  if (targetParts.length === 1) {
    const token = targetParts[0]
    if (!candidateSet.has(token)) {
      // Allow floral ↔ florals style near-matches on short labels.
      const stem = token.replace(/s$/, '')
      const stemmedHit = [...candidateSet].some(
        part => part === stem || part.replace(/s$/, '') === stem
      )
      if (!stemmedHit) return 0
    }

    if (candidateParts.length === 1) return 95
    if (candidateParts.length === 2) return 80
    // Longer filenames like "signs-stems-centrepiece" still count as a real hit.
    return 70
  }

  const significant = targetParts.filter(token => token.length > 2)
  if (!significant.length) return 0

  const overlap = significant.filter(token => candidateSet.has(token)).length
  const ratio = overlap / significant.length
  if (ratio >= 1) return 88
  if (ratio >= 0.66) return 72
  return 0
}

function findBestMatchingImage(assets, labels, usedUrls) {
  const candidates = (Array.isArray(assets) ? assets : []).filter(
    asset => asset?.url && !usedUrls.has(asset.url)
  )
  if (!candidates.length) return ''

  const searchLabels = expandMatchLabels(...(Array.isArray(labels) ? labels : [labels]))
  let best = null
  let bestScore = 0

  candidates.forEach(asset => {
    searchLabels.forEach(label => {
      const score = scoreImageLabelMatch(label, asset.label)
      if (score > bestScore) {
        bestScore = score
        best = asset
      }
    })
  })

  // Require a meaningful name match so we don't pick an unrelated gallery photo.
  if (!best || bestScore < 50) return ''

  usedUrls.add(best.url)
  return best.url
}

function takeNextUnusedImage(assets, usedUrls) {
  const next = (Array.isArray(assets) ? assets : []).find(
    asset => asset?.url && !usedUrls.has(asset.url)
  )
  if (!next?.url) return ''
  usedUrls.add(next.url)
  return next.url
}

/**
 * When inclusion.images is missing (common on General Pack), map package gallery
 * images onto text/choice sections by media name/alt first, then unused gallery
 * order — so clicks sync the correct named photo without reseeding CMS media.
 */
function buildDecorGalleryFallbackSupport(pkg) {
  if (!pkg) {
    return {
      textImageBySectionItem: {},
      choiceImagesByGroupOption: new Map(),
      metaByUrl: {},
    }
  }

  const assets = getPackageImageAssets(pkg)
  const usedUrls = new Set()
  const textEntries = []
  const choiceImagesByGroupOption = new Map()
  const metaEntries = []
  const pendingTextGroups = []
  const pendingChoiceItems = []

  getDecorDetailSections(pkg).forEach(section => {
    const inclusions = Array.isArray(section?.inclustions) ? section.inclustions : []
    const orderedGroups = collectOrderedInclusionGroups(inclusions)

    orderedGroups.forEach(group => {
      if (group.type === 'choice') {
        const sectionTitle = buildChoiceSectionTitle(group.displayTitle, 'Choose 1')

        group.items.forEach(item => {
          const optionTitle =
            cleanText(parseLegacyChoiceTitle(item?.text).title) || cleanText(item?.text)
          if (!optionTitle) return

          const ownImages = getInclusionImages(item)
          if (ownImages[0]) {
            choiceImagesByGroupOption.set(`${group.key}::${optionTitle}`, ownImages[0])
            metaEntries.push([
              ownImages[0],
              { heading: optionTitle || sectionTitle, text: optionTitle },
            ])
            return
          }

          const namedImage = findBestMatchingImage(
            assets,
            [optionTitle, group.displayTitle, sectionTitle],
            usedUrls
          )

          if (namedImage) {
            choiceImagesByGroupOption.set(`${group.key}::${optionTitle}`, namedImage)
            metaEntries.push([
              namedImage,
              { heading: optionTitle || sectionTitle, text: optionTitle },
            ])
            return
          }

          pendingChoiceItems.push({
            mapKey: `${group.key}::${optionTitle}`,
            sectionTitle,
            optionTitle,
          })
        })
        return
      }

      const sectionTitle = buildTextSectionTitle(group.title, 'Included details')
      const items = group.items.filter(item => cleanText(item?.text))
      if (!items.length) return

      const groupHasOwnImages = items.some(item => getInclusionImages(item).length > 0)
      if (groupHasOwnImages) {
        // Image may be on only one row in the group — share it so title/first-item
        // clicks still resolve (Signs & Stems Centrepieces pattern).
        const sharedOwnImage =
          items.map(item => getInclusionImages(item)[0]).find(Boolean) || ''
        if (sharedOwnImage) usedUrls.add(sharedOwnImage)

        items.forEach(item => {
          const text = cleanText(item?.text)
          if (!text) return
          const ownImages = getInclusionImages(item)
          const image = ownImages[0] || sharedOwnImage
          if (!image) return
          if (ownImages[0]) usedUrls.add(ownImages[0])
          textEntries.push([`${sectionTitle}::${text}`, image])
          metaEntries.push([image, { heading: sectionTitle, text }])
        })
        return
      }

      const namedImage = findBestMatchingImage(assets, [sectionTitle, group.title], usedUrls)
      if (namedImage) {
        items.forEach(item => {
          const text = cleanText(item?.text)
          if (!text) return
          textEntries.push([`${sectionTitle}::${text}`, namedImage])
          metaEntries.push([namedImage, { heading: sectionTitle, text }])
        })
        return
      }

      pendingTextGroups.push({ sectionTitle, items })
    })
  })

  // Second pass: only unmatched sections take leftover gallery photos.
  pendingTextGroups.forEach(group => {
    const fallbackImage = takeNextUnusedImage(assets, usedUrls)
    if (!fallbackImage) return

    group.items.forEach(item => {
      const text = cleanText(item?.text)
      if (!text) return
      textEntries.push([`${group.sectionTitle}::${text}`, fallbackImage])
      metaEntries.push([fallbackImage, { heading: group.sectionTitle, text }])
    })
  })

  pendingChoiceItems.forEach(item => {
    const fallbackImage = takeNextUnusedImage(assets, usedUrls)
    if (!fallbackImage) return

    choiceImagesByGroupOption.set(item.mapKey, fallbackImage)
    metaEntries.push([
      fallbackImage,
      { heading: item.optionTitle || item.sectionTitle, text: item.optionTitle },
    ])
  })

  assets.forEach(asset => {
    if (!asset?.url || metaEntries.some(([url]) => url === asset.url)) return
    if (!asset.label) return
    metaEntries.push([asset.url, { heading: asset.label, text: asset.label }])
  })

  return {
    textImageBySectionItem: Object.fromEntries(textEntries),
    choiceImagesByGroupOption,
    metaByUrl: Object.fromEntries(metaEntries),
  }
}

function displayInclusionHeading(value = '') {
  const normalized = cleanText(value)
  if (!normalized) return ''

  const whenMatch = normalized.match(/^when:([^:]+):(.+)$/)
  if (whenMatch) return cleanText(whenMatch[2])

  return normalized
}

function buildDecorImageMetaMap(pkg, fallbackMetaByUrl = {}) {
  const entries = []
  const packageTitle = cleanText(pkg?.title)

  getDecorDetailSections(pkg).forEach(section => {
    const inclusions = Array.isArray(section?.inclustions) ? section.inclustions : []

    inclusions.forEach(inclusion => {
      const images = getInclusionImages(inclusion)
      const heading =
        displayInclusionHeading(inclusion?.choice_group_label) ||
        displayInclusionHeading(inclusion?.group_title) ||
        displayInclusionHeading(inclusion?.choice_group_key) ||
        cleanText(inclusion?.text) ||
        packageTitle
      const text = cleanText(inclusion?.text)

      images.forEach(image => {
        entries.push([image, { heading, text }])
      })
    })

    const elements = Array.isArray(section?.elements) ? section.elements : []
    elements.forEach(element => {
      const elementTitle = cleanText(element?.title || element?.name)
      normaliseMediaArray(element?.images).forEach(image => {
        const url = normalizeGalleryImageUrl(image)
        if (!url) return
        entries.push([
          url,
          {
            heading: elementTitle || packageTitle,
            text: elementTitle,
          },
        ])
      })
    })

    normaliseMediaArray(section?.backdrop_images).forEach(image => {
      const url = normalizeGalleryImageUrl(image)
      if (!url) return
      entries.push([
        url,
        {
          heading: cleanText(section?.theme_name) || packageTitle,
          text: 'Backdrop',
        },
      ])
    })
  })
  ;(Array.isArray(pkg?.images) ? pkg.images : []).forEach(image => {
    const url = normalizeGalleryImageUrl(image)
    if (!url || entries.some(([existing]) => existing === url)) return
    const fallbackMeta = fallbackMetaByUrl?.[url]
    const assetLabel = cleanText(
      (Array.isArray(pkg?.image_assets) ? pkg.image_assets : []).find(
        asset => normalizeGalleryImageUrl(asset?.url || asset) === url
      )?.label
    )
    entries.push([
      url,
      fallbackMeta ??
        (assetLabel ? { heading: assetLabel, text: assetLabel } : { heading: packageTitle, text: packageTitle }),
    ])
  })

  Object.entries(fallbackMetaByUrl ?? {}).forEach(([url, meta]) => {
    if (!url || entries.some(([existing]) => existing === url)) return
    entries.push([url, meta])
  })

  return Object.fromEntries(entries)
}

function buildDecorTextImageMap(pkg, fallbackTextImageBySectionItem = {}) {
  const entries = []

  getDecorDetailSections(pkg).forEach(section => {
    const inclusions = Array.isArray(section?.inclustions) ? section.inclustions : []
    const orderedGroups = collectOrderedInclusionGroups(inclusions).filter(
      group => group.type === 'text'
    )

    orderedGroups.forEach(group => {
      const sectionTitle = buildTextSectionTitle(group.title, 'Included details')
      const sharedOwnImage =
        group.items.map(item => getInclusionImages(item)[0]).find(Boolean) || ''

      group.items.forEach(item => {
        const text = cleanText(item?.text)
        const images = getInclusionImages(item)
        const key = `${sectionTitle}::${text}`
        const image =
          images[0] || sharedOwnImage || fallbackTextImageBySectionItem[key]

        if (!text || !image) return

        entries.push([key, image])
      })
    })
  })

  Object.entries(fallbackTextImageBySectionItem ?? {}).forEach(([key, image]) => {
    if (!key || !image || entries.some(([existing]) => existing === key)) return
    entries.push([key, image])
  })

  return Object.fromEntries(entries)
}

function groupItemsByTitle(items = []) {
  const groups = []

  items.forEach(item => {
    const groupTitle = cleanText(item?.group_title)
    const existingGroup = groups.find(group => group.title === groupTitle)

    if (existingGroup) {
      existingGroup.items.push(item)
      return
    }

    groups.push({
      title: groupTitle,
      items: [item],
    })
  })

  return groups
}

function buildChoiceSectionTitle(groupTitle, fallbackTitle) {
  const label = titleCaseLabel(groupTitle) || fallbackTitle
  if (!label) return fallbackTitle
  if (/\(choose\s*\d+\)/i.test(label) || /^choose\s*\d+$/i.test(label)) return label
  return `${label} (choose 1)`
}

function buildTextSectionTitle(groupTitle, fallbackTitle) {
  return titleCaseLabel(groupTitle) || fallbackTitle
}

function parseChoiceGroupTitle(title = '') {
  const normalizedTitle = cleanText(title)
  if (!normalizedTitle) {
    return {
      key: '',
      label: '',
      isGenericChoose: false,
    }
  }

  const [displayTitle, groupKey] = normalizedTitle.split('::').map(cleanText)

  return {
    key: groupKey || normalizedTitle,
    label: displayTitle || normalizedTitle,
    isGenericChoose: /^choose\s*\d+$/i.test(displayTitle || normalizedTitle),
  }
}

function parseConditionalChoiceKey(rawKey = '') {
  const normalizedKey = cleanText(rawKey)
  const match = normalizedKey.match(/^when:([^:]+):([^>]+)>>(.+)$/)

  if (!match) {
    return {
      key: normalizedKey,
      visibleWhen: null,
    }
  }

  return {
    key: cleanText(match[3]),
    visibleWhen: {
      parentKey: cleanText(match[1]),
      parentValue: cleanText(match[2]),
    },
  }
}

function parseLegacyChoiceTitle(rawText = '') {
  const normalizedText = cleanText(rawText)
  const legacyMatch = normalizedText.match(/^option\s*\d+\s*:\s*(.+)$/i)

  if (!legacyMatch) {
    return {
      title: normalizedText,
      trailingDetails: '',
    }
  }

  const remainder = cleanText(legacyMatch[1])
  const splitMatch = remainder.match(/^(.+?)\s*[—–-]\s*(.+)$/)

  if (!splitMatch) {
    return {
      title: remainder,
      trailingDetails: '',
    }
  }

  return {
    title: cleanText(splitMatch[1]),
    trailingDetails: cleanText(splitMatch[2]),
  }
}

function splitInclusionDetailText(text = '') {
  return cleanText(text)
    .split(/\s*;\s*|\s*,\s+(?=\d)/)
    .map(part => cleanText(part))
    .filter(Boolean)
}

function indexWhenInclusions(inclusions = []) {
  const whenBullets = new Map()

  ;(Array.isArray(inclusions) ? inclusions : []).forEach(item => {
    const groupTitle = cleanText(item?.group_title)
    const whenMatch = groupTitle.match(/^when:([^:]+):(.+)$/)

    if (!whenMatch) return

    const mapKey = `${cleanText(whenMatch[1])}::${cleanText(whenMatch[2])}`
    const bullets = whenBullets.get(mapKey) ?? []

    bullets.push(cleanText(item?.text))
    whenBullets.set(mapKey, bullets.filter(Boolean))
  })

  return whenBullets
}

function resolveChoiceGroupMeta(item = {}) {
  const explicitLabel = cleanText(item?.choice_group_label)
  const explicitKey = cleanText(item?.choice_group_key)
  const conditionalMeta = parseConditionalChoiceKey(explicitKey)

  if (explicitLabel || explicitKey) {
    return {
      key: conditionalMeta.key || explicitKey || explicitLabel,
      label: explicitLabel || conditionalMeta.key || explicitKey,
      isGenericChoose: /^choose\s*\d+$/i.test(explicitLabel || explicitKey),
      visibleWhen: conditionalMeta.visibleWhen,
    }
  }

  const parsedTitle = parseChoiceGroupTitle(item?.group_title)

  return {
    ...parsedTitle,
    visibleWhen: null,
  }
}

function createChoiceItem({
  inclusion,
  element,
  fallbackTitle,
  whenBullets = new Map(),
  fallbackImage = '',
}) {
  const parsedLegacyTitle = parseLegacyChoiceTitle(inclusion?.text)
  const inclusionText = parsedLegacyTitle.title
  const elementTitle = cleanText(element?.title)
  const serviceName = cleanText(element?.service?.name)
  const price = formatPrice(element?.base_price)
  const priceAmount = Number(element?.base_price)
  const groupKey = cleanText(inclusion?._choice_group_key)
  const bulletKey = groupKey && inclusionText ? `${groupKey}::${inclusionText}` : ''
  const scopedBullets = bulletKey ? (whenBullets.get(bulletKey) ?? []) : []
  const legacyBullets = parsedLegacyTitle.trailingDetails
    ? splitInclusionDetailText(parsedLegacyTitle.trailingDetails)
    : []
  const bullets = scopedBullets.length ? scopedBullets : legacyBullets
  const title =
    inclusionText ||
    (elementTitle && !/^option\s+\d+$/i.test(elementTitle) ? elementTitle : '') ||
    serviceName ||
    fallbackTitle

  const descriptionParts = []

  if (elementTitle && !/^option\s+\d+$/i.test(elementTitle) && elementTitle !== title) {
    descriptionParts.push(elementTitle)
  }

  if (cleanText(element?.description)) {
    descriptionParts.push(cleanText(element.description))
  }

  const ownImages = getInclusionImages(inclusion)
  const images = ownImages.length ? ownImages : fallbackImage ? [fallbackImage] : []

  return {
    title,
    bullets,
    description: bullets.length ? bullets.join('\n') : descriptionParts.join('\n'),
    price,
    priceAmount: Number.isFinite(priceAmount) && priceAmount > 0 ? priceAmount : null,
    images,
    selected: false,
  }
}

function buildChoiceSectionsFromElements(elements = []) {
  return groupItemsByTitle(
    elements.map(element => ({
      ...element,
      group_title: cleanText(element?.service?.name),
    }))
  )
    .map((group, index) => ({
      type: 'choice-row',
      title: group.title ? `${titleCaseLabel(group.title)} (choose 1)` : `Choose ${index + 1}`,
      items: group.items
        .map((element, itemIndex) =>
          createChoiceItem({
            element,
            fallbackTitle: `Option ${itemIndex + 1}`,
          })
        )
        .filter(item => item.title),
      required: true,
    }))
    .filter(section => section.items.length)
}

function collectOrderedInclusionGroups(inclusions = []) {
  const groups = []
  const choiceGroupMap = new Map()
  const textGroupMap = new Map()

  for (const item of inclusions) {
    if (item?.is_choice_group) {
      const parsedGroupTitle = resolveChoiceGroupMeta(item)
      const normalizedItem = {
        ...item,
        group_title: parsedGroupTitle.key,
        _choice_group_key: parsedGroupTitle.key,
        _display_group_title: parsedGroupTitle.label,
        _is_generic_choose_title: parsedGroupTitle.isGenericChoose,
        _visible_when: parsedGroupTitle.visibleWhen,
      }
      const mapKey = parsedGroupTitle.key

      if (!choiceGroupMap.has(mapKey)) {
        const nextGroup = {
          type: 'choice',
          key: mapKey,
          displayTitle: parsedGroupTitle.label,
          visibleWhen: parsedGroupTitle.visibleWhen,
          items: [],
        }
        choiceGroupMap.set(mapKey, nextGroup)
        groups.push(nextGroup)
      }

      choiceGroupMap.get(mapKey).items.push(normalizedItem)
      continue
    }

    if (/^when:/i.test(cleanText(item?.group_title))) continue

    const title = cleanText(item?.group_title)
    const mapKey = title || '__included_details__'

    if (!textGroupMap.has(mapKey)) {
      const nextGroup = {
        type: 'text',
        title,
        items: [],
      }
      textGroupMap.set(mapKey, nextGroup)
      groups.push(nextGroup)
    }

    textGroupMap.get(mapKey).items.push(item)
  }

  return groups
}

function buildDecorCustomizationSections(pkg, choiceImagesByGroupOption = new Map()) {
  if (!pkg) return []

  return getDecorDetailSections(pkg).flatMap(section => {
    const inclusions = Array.isArray(section?.inclustions) ? section.inclustions : []
    const whenBullets = indexWhenInclusions(inclusions)
    const elements = Array.isArray(section?.elements)
      ? section.elements.filter(element => element?.visibility !== false)
      : []
    const orderedGroups = collectOrderedInclusionGroups(inclusions)

    let elementCursor = 0
    let choiceIndex = 0
    const builtSections = []

    orderedGroups.forEach(group => {
      if (group.type === 'choice') {
        const items = group.items
          .map((item, itemIndex) => {
            const element = elements[elementCursor] ?? null

            if (element) {
              elementCursor += 1
            }

            const optionTitle =
              cleanText(parseLegacyChoiceTitle(item?.text).title) || cleanText(item?.text)
            const fallbackImage =
              choiceImagesByGroupOption.get(`${group.key}::${optionTitle}`) || ''

            return createChoiceItem({
              inclusion: item,
              element,
              fallbackTitle: `Option ${itemIndex + 1}`,
              whenBullets,
              fallbackImage,
            })
          })
          .filter(item => item.title)

        if (!items.length) return

        builtSections.push({
          type: 'choice-row',
          title: buildChoiceSectionTitle(group.displayTitle, `Choose ${choiceIndex + 1}`),
          groupKey: group.key,
          visibleWhen: group.visibleWhen,
          items,
          required: true,
        })
        choiceIndex += 1
        return
      }

      const items = group.items.map(item => cleanText(item?.text)).filter(Boolean)

      if (!items.length) return

      builtSections.push({
        type: 'text-row',
        title: buildTextSectionTitle(group.title, 'Included details'),
        items,
      })
    })

    if (!orderedGroups.some(group => group.type === 'choice') && elements.length) {
      builtSections.push(...buildChoiceSectionsFromElements(elements))
      elementCursor = elements.length
    }

    const remainingElementRows = elements
      .slice(elementCursor)
      .map(element => cleanText(element?.description) || cleanText(element?.title))
      .filter(Boolean)

    if (remainingElementRows.length) {
      builtSections.push({
        type: 'text-row',
        title: 'Included setup',
        items: remainingElementRows,
      })
    }

    return builtSections
  })
}

function getSelectedChoiceTitleByGroupKey(sections = [], groupKey = '') {
  const normalizedGroupKey = cleanText(groupKey)
  if (!normalizedGroupKey) return ''

  const matchingSection = (Array.isArray(sections) ? sections : []).find(
    section =>
      section?.type === 'choice-row' &&
      !section?.visibleWhen &&
      cleanText(section?.groupKey) === normalizedGroupKey
  )

  if (!matchingSection) return ''

  const selectedItem = (Array.isArray(matchingSection.items) ? matchingSection.items : []).find(
    item => typeof item !== 'string' && item.selected
  )

  return cleanText(selectedItem?.title)
}

function filterVisibleDecorSections(sections = []) {
  return (Array.isArray(sections) ? sections : []).filter(section => {
    const visibleWhen = section?.visibleWhen
    if (!visibleWhen) return true

    const selectedParentTitle = getSelectedChoiceTitleByGroupKey(sections, visibleWhen.parentKey)

    return selectedParentTitle === cleanText(visibleWhen.parentValue)
  })
}

function clearDependentChoiceSelections(sections = [], changedGroupKey = '') {
  const normalizedChangedGroupKey = cleanText(changedGroupKey)
  if (!normalizedChangedGroupKey) return sections

  return (Array.isArray(sections) ? sections : []).map(section => {
    if (section?.type !== 'choice-row') return section
    if (cleanText(section?.visibleWhen?.parentKey) !== normalizedChangedGroupKey) return section

    return {
      ...section,
      items: (section.items ?? []).map(item =>
        typeof item === 'string' ? item : { ...item, selected: false }
      ),
    }
  })
}

function cloneSections(templateSections = []) {
  return templateSections.map(section => ({
    ...section,
    items: (Array.isArray(section.items) ? section.items : []).map(item =>
      typeof item === 'string' ? item : { ...item }
    ),
  }))
}

function serializeSections(sections = []) {
  return JSON.stringify(
    (Array.isArray(sections) ? sections : []).map(section => ({
      type: section.type,
      title: section.title,
      groupKey: section.groupKey ?? '',
      visibleWhen: section.visibleWhen ?? null,
      required: section.required !== false,
      items: (Array.isArray(section.items) ? section.items : []).map(item =>
        typeof item === 'string'
          ? item
          : {
              title: item.title,
              bullets: Array.isArray(item.bullets) ? item.bullets : [],
              description: item.description,
              images: Array.isArray(item.images) ? item.images : [],
              price: item.price,
              priceAmount: item.priceAmount ?? null,
              selected: Boolean(item.selected),
            }
      ),
    }))
  )
}

function getSelectedChoiceImages(sections = []) {
  return uniqueValues(
    (Array.isArray(sections) ? sections : []).flatMap(section => {
      if (section?.type !== 'choice-row') return []

      const selectedItem = (Array.isArray(section.items) ? section.items : []).find(
        item => typeof item !== 'string' && item.selected
      )

      return Array.isArray(selectedItem?.images) ? selectedItem.images : []
    })
  )
}

function mergeTemplateSections(templateSections = [], existingSections = []) {
  const existingSectionCounts = new Map()
  const existingSectionMap = new Map()

  ;(Array.isArray(existingSections) ? existingSections : []).forEach(section => {
    const baseKey = `${section.type}:${section.groupKey ?? section.title}`
    const nextCount = existingSectionCounts.get(baseKey) ?? 0
    existingSectionCounts.set(baseKey, nextCount + 1)
    existingSectionMap.set(`${baseKey}:${nextCount}`, section)
  })

  const templateSectionCounts = new Map()

  return cloneSections(templateSections).map(section => {
    if (section.type !== 'choice-row') return section

    const baseKey = `${section.type}:${section.groupKey ?? section.title}`
    const nextCount = templateSectionCounts.get(baseKey) ?? 0
    templateSectionCounts.set(baseKey, nextCount + 1)

    const existingSection = existingSectionMap.get(`${baseKey}:${nextCount}`)
    if (!existingSection) return section

    return {
      ...section,
      items: section.items.map(item => {
        if (typeof item === 'string') return item

        const existingItem = (
          Array.isArray(existingSection.items) ? existingSection.items : []
        ).find(candidate => typeof candidate !== 'string' && candidate.title === item.title)

        return {
          ...item,
          selected: Boolean(existingItem?.selected),
        }
      }),
    }
  })
}

// function isCustomizationComplete(sections = []) {
//   const requiredSections = (Array.isArray(sections) ? sections : []).filter(
//     section =>
//       section.type === 'choice-row' &&
//       section.required !== false &&
//       Array.isArray(section.items) &&
//       section.items.length
//   )

//   // No selectable options means the package is already complete
//   if (requiredSections.length === 0) return true

//   return requiredSections.every(section =>
//     section.items.some(item => typeof item !== 'string' && item.selected)
//   )
// }

function normalizeSelectedOptions(selectedOptions = {}) {
  return Object.fromEntries(
    Object.entries(selectedOptions)
      .map(([key, value]) => [String(key ?? '').trim(), String(value ?? '').trim()])
      .filter(([key, value]) => key && value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
  )
}

function getDecorAdditionalInfo(selectedOptions = {}) {
  const value =
    selectedOptions?.[DECOR_ADDITIONAL_INFO_KEY] ??
    selectedOptions?.[DECOR_ADDITIONAL_INFO_KEY.toUpperCase()]

  return String(value ?? '').trim()
}

function buildDecorSelectedOptions(customization, { useFirstChoiceFallback = false } = {}) {
  const selectedSections = filterVisibleDecorSections(customization?.data?.sections ?? []).filter(
    section => section?.type === 'choice-row'
  )

  const result = normalizeSelectedOptions(
    Object.fromEntries(
      selectedSections
        .map((section, idx) => {
          const selectedItem = (section.items ?? []).find(
            item => typeof item !== 'string' && item.selected
          )
          const fallbackItem = useFirstChoiceFallback
            ? (section.items ?? []).find(item => typeof item !== 'string')
            : null
          const resolvedItem = selectedItem ?? fallbackItem

          const key = `${section.title}_${idx}`
          return [key, resolvedItem?.title ?? '']
        })
        .filter(([, value]) => Boolean(value))
    )
  )

  return result
}

function applySelectedOptionsToSections(sections = [], selectedOptions = {}) {
  let choiceIndex = -1

  return (Array.isArray(sections) ? sections : []).map(section => {
    if (section?.type !== 'choice-row') return section

    choiceIndex += 1

    const selectedTitle =
      selectedOptions?.[`${section.title}_${choiceIndex}`] ?? selectedOptions?.[section.title]
    if (!selectedTitle) return section

    return {
      ...section,
      items: (section.items ?? []).map(item =>
        typeof item === 'string' ? item : { ...item, selected: item.title === selectedTitle }
      ),
    }
  })
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

function DecorOptionButton({ item, wide = false, showPrice = false, onClick }) {
  const bullets = Array.isArray(item.bullets)
    ? item.bullets.filter(Boolean)
    : splitInclusionDetailText(item.description)

  const selected = Boolean(item.selected)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-[8px] border px-3.5 py-2.5 transition-all ${
        wide || bullets.length ? 'min-w-[220px] flex-1 basis-[220px]' : 'min-w-[120px]'
      } ${
        selected
          ? 'border-[#591902] bg-[#F4E7DE] text-[#591902] shadow-[0_0_0_1px_#591902]'
          : 'border-[#D9D0C5] bg-white text-[#591902]'
      }`}
    >
      {item.title && !bullets.length ? (
        <p className="text-[12px] font-semibold leading-[1.35] text-[#591902]">{item.title}</p>
      ) : null}
      {item.title && bullets.length ? (
        <p className="text-[12px] font-semibold leading-[1.35] text-[#591902]">{item.title}</p>
      ) : null}
      {showPrice && item.price ? (
        <p className="mt-1 text-[11px] font-medium text-[#591902]">{item.price}</p>
      ) : null}
      {bullets.length ? (
        <ul className={`${item.title ? 'mt-2' : ''} space-y-1`}>
          {bullets.map(bullet => (
            <li key={bullet} className="text-[11px] leading-[1.45] text-[#591902]">
              • {bullet}
            </li>
          ))}
        </ul>
      ) : null}
    </button>
  )
}

function DecorTextRow({ section, onItemClick }) {
  const firstItem = Array.isArray(section.items) ? section.items[0] : ''
  const isSingleItem = section.items.length === 1

  return (
    <div className="text-left">
      <button
        type="button"
        onClick={() => {
          if (!onItemClick || !firstItem) return
          onItemClick(section.title, firstItem)
        }}
        className={`text-left text-[13px] font-semibold leading-none text-[#591902] ${
          onItemClick && firstItem ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        {section.title}
      </button>
      <div
        className={
          isSingleItem
            ? 'mt-3 w-full text-left'
            : 'mt-3 flex w-full flex-wrap items-start justify-start gap-y-2'
        }
      >
        {section.items.map((item, index) => (
          <div
            key={`${section.title}-${item}`}
            className={isSingleItem ? 'w-full text-left' : 'flex items-center'}
          >
            <button
              type="button"
              onClick={() => onItemClick?.(section.title, item)}
              className={`text-left text-[#591902] opacity-50 ${
                isSingleItem
                  ? 'block w-full text-[12px] leading-[1.55]'
                  : 'text-[12px] leading-none'
              } ${onItemClick ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {item}
            </button>
            {!isSingleItem && index < section.items.length - 1 ? (
              <span className="mx-2 text-[12px] leading-none text-[#591902] opacity-50">|</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function DecorMessageField({ value, onChange }) {
  return (
    <div>
      <p
        className="text-[13px] font-semibold leading-none text-[#2D2D2D]"
        style={{ fontWeight: 600 }}
      >
        Please add your text here
      </p>
      <div className="mt-3 rounded-[6px] border border-[#E6D6BF] bg-white px-4 py-3">
        <textarea
          value={value}
          onChange={event => onChange(event.target.value)}
          rows={2}
          maxLength={250}
          placeholder="Write Message"
          className="w-full resize-none border-0 bg-transparent p-0 text-[12px] leading-[1.5] text-[#591902] outline-none placeholder:text-[#9F8F7E]"
        />
      </div>
    </div>
  )
}

function DecorPackageSections({
  keyDecorText,
  sections,
  message,
  onMessageChange,
  onSelect,
  onTextItemClick,
  hidePrices = false,
}) {
  const visibleSections = useMemo(() => filterVisibleDecorSections(sections), [sections])
  const hasInclusionSections = visibleSections.length > 0

  return (
    <div className="text-left">
      {keyDecorText ? (
        <div className="border-b border-[#E5E0D8] pb-5">
          <p className="text-[13px] font-semibold text-[#2D2D2D]">Key Decor Elements</p>
          <p className="mt-3 text-[13px] leading-[1.7] text-[#591902] opacity-70">{keyDecorText}</p>
        </div>
      ) : null}

      {hasInclusionSections ? (
        <p
          className={`text-left text-[16px] font-semibold text-[#2D2D2D] ${keyDecorText ? 'pt-5' : ''}`}
        >
          What&apos;s included:
        </p>
      ) : null}

      <div className={`space-y-6 text-left ${hasInclusionSections ? 'mt-5' : keyDecorText ? 'pt-5' : ''}`}>
        {visibleSections.map((section, index) => {
          if (section.type === 'text-row') {
            return (
              <div
                key={`${section.title}-${index}`}
                className={index > 0 ? 'border-t border-[#E5E0D8] pt-5' : ''}
              >
                <DecorTextRow section={section} onItemClick={onTextItemClick} />
              </div>
            )
          }

          if (section.type !== 'choice-row') return null

          const useWideCards = section.items.some(item => {
            if (typeof item === 'string') return false
            return Boolean(item.title) && (item.bullets?.length || item.description)
          })
          const sectionKey = section.groupKey ?? section.title

          return (
            <div
              key={`${sectionKey}-${index}`}
              className={index > 0 ? 'border-t border-[#E5E0D8] pt-5' : ''}
            >
              <p className="text-left text-[13px] font-semibold leading-none text-[#591902]">
                {section.title}
              </p>
              <div className="mt-3 flex flex-wrap justify-start gap-2">
                {section.items.map(item => (
                  <DecorOptionButton
                    key={`${sectionKey}-${item.title}-${(item.bullets ?? []).join('|')}`}
                    item={item}
                    wide={useWideCards}
                    showPrice={!hidePrices && shouldShowChoicePrices(section)}
                    onClick={() => onSelect(sectionKey, item.title)}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {!hasInclusionSections ? (
          <p className="text-[12px] leading-[1.6] text-[#8A5A2D]">
            Customization options will appear here once they are added in Strapi.
          </p>
        ) : null}

        <div className={hasInclusionSections ? 'border-t border-[#E5E0D8] pt-5' : ''}>
          <DecorMessageField value={message} onChange={onMessageChange} />
        </div>
      </div>
    </div>
  )
}

export default function DecorSinglePackagePage() {
  // const navigate = useNavigate()
  const { packageId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const packagesQuery = usePackages()
  const packageQuery = usePackageById(packageId)
  const cancellationQuery = useCancellationPolicy()
  const isStrapiLoading = useStrapiPageLoading(packagesQuery, packageQuery, cancellationQuery)

  const { data: packages = [] } = packagesQuery
  const { data: packageDetails } = packageQuery
  const { data: cancellationPolicy } = cancellationQuery
  const { cart, addPackage, updateCartItemDetails } = useCart()
  const { showToast } = useToast()
  const { data: cartToastMessage = 'Package added to cart successfully.' } = useCartToastMessage()
  const cartItemId = searchParams.get('cartItemId') ?? ''
  const consultationOnly = isCorporateCategory(searchParams.get('category') ?? '')
  const { activeCustomization, activeIndex, setCustomizations } = useCustomization({
    createInitialData: () => ({
      sections: [],
      message: '',
    }),
  })
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [addToCartMessage, setAddToCartMessage] = useState('')
  const [selectedTextImage, setSelectedTextImage] = useState('')
  const [toastImage, setToastImage] = useState(null)

  const packagesData = useMemo(
    () =>
      packages.map((pkg, index) => {
        const withOffline = withHousePartyPackageImages(pkg)
        return {
          ...withOffline,
          images: withOffline.images?.length
            ? withOffline.images
            : (PKG_LOCAL_IMAGES[index % PKG_LOCAL_IMAGES.length] ?? []),
        }
      }),
    [packages]
  )

  const pkg = useMemo(
    () => {
      const resolved =
        packageDetails
          ? {
              ...withHousePartyPackageImages(packageDetails),
              images: packageDetails.images?.length
                ? packageDetails.images
                : (PKG_LOCAL_IMAGES[packageDetails._index % PKG_LOCAL_IMAGES.length] ??
                  PKG_LOCAL_IMAGES[0]),
            }
          : packagesData.find(item => buildPackageId(item) === normalisePackageId(packageId))

      if (!resolved) return resolved

      const withOffline = withHousePartyPackageImages(resolved)
      if (withOffline.images?.length) {
        return { ...withOffline, images: withOffline.images }
      }

      return resolved
    },
    [packageDetails, packageId, packagesData]
  )

  const packageServiceSlug = useMemo(() => {
    const fromQuery = normalizeServiceSlug(searchParams.get('service'))
    if (fromQuery === 'rental-furniture') return 'rental-furniture'

    const fromPkg = (Array.isArray(pkg?.service_slugs) ? pkg.service_slugs : []).map(
      normalizeServiceSlug
    )
    if (fromPkg.includes('rental-furniture')) return 'rental-furniture'

    return 'decor'
  }, [pkg?.service_slugs, searchParams])

  const backHref = useMemo(() => {
    const next = new URLSearchParams(searchParams)
    const listingPath =
      packageServiceSlug === 'rental-furniture' ? '/packages/rental-furniture' : '/packages/decor'
    return `${listingPath}${next.toString() ? `?${next.toString()}` : ''}`
  }, [packageServiceSlug, searchParams])

  const relatedProducts = useMemo(
    () =>
      pkg
        ? getRelatedPackages(packagesData, pkg, {
            serviceSlug: packageServiceSlug,
            matchesPackage: candidate => {
              if (packageServiceSlug !== 'rental-furniture') return true
              return (Array.isArray(candidate?.service_slugs) ? candidate.service_slugs : []).some(
                slug => normalizeServiceSlug(slug) === 'rental-furniture'
              )
            },
          })
        : [],
    [packageServiceSlug, packagesData, pkg]
  )

  const { data: packageReviews = [] } = usePackageReviews({
    id: pkg?.id,
    documentId: pkg?.documentId,
    title: pkg?.title,
  })

  const galleryFallbackSupport = useMemo(() => buildDecorGalleryFallbackSupport(pkg), [pkg])
  const sectionTemplate = useMemo(
    () => buildDecorCustomizationSections(pkg, galleryFallbackSupport.choiceImagesByGroupOption),
    [pkg, galleryFallbackSupport]
  )
  const sectionTemplateSignature = useMemo(
    () => serializeSections(sectionTemplate),
    [sectionTemplate]
  )
  const imageMetaByUrl = useMemo(
    () => buildDecorImageMetaMap(pkg, galleryFallbackSupport.metaByUrl),
    [pkg, galleryFallbackSupport]
  )
  const textImageBySectionItem = useMemo(
    () => buildDecorTextImageMap(pkg, galleryFallbackSupport.textImageBySectionItem),
    [pkg, galleryFallbackSupport]
  )

  useEffect(() => {
    if (!pkg) return

    const selectedOptionsFromSearch = getSelectedOptionsFromSearchParams(searchParams)
    const additionalInfoFromSearch = getDecorAdditionalInfo(selectedOptionsFromSearch)

    setCustomizations(prev => {
      let hasChanges = false

      const nextCustomizations = prev.map(customization => {
        const currentSections = customization?.data?.sections ?? []
        const currentMessage = String(customization?.data?.message ?? '')
        const mergedSections = mergeTemplateSections(sectionTemplate, currentSections)
        const nextSections =
          currentSections.length === 0
            ? applySelectedOptionsToSections(mergedSections, selectedOptionsFromSearch)
            : mergedSections

        const isMessageUnchanged = currentMessage === additionalInfoFromSearch

        if (
          serializeSections(nextSections) === serializeSections(currentSections) &&
          isMessageUnchanged
        ) {
          return customization
        }

        hasChanges = true

        return {
          ...customization,
          data: {
            ...customization.data,
            sections: nextSections,
            message: additionalInfoFromSearch,
          },
        }
      })

      return hasChanges ? nextCustomizations : prev
    })
  }, [pkg, searchParams, sectionTemplate, sectionTemplateSignature, setCustomizations])

  useEffect(() => {
    if (!cartItemId) return

    const cartItem = (cart?.items ?? []).find(item => String(item.id) === String(cartItemId))
    if (!cartItem) return

    setQuantity(Math.max(1, Number(cartItem.quantity ?? 1)))
  }, [cart?.items, cartItemId])

  if (isStrapiLoading) {
    return <CmsPageLoader />
  }

  if (!pkg) {
    return <Navigate to={backHref} replace />
  }

  const sections = activeCustomization?.data?.sections ?? []
  const galleryImages = uniqueValues([
    ...buildDecorMediaGallery(pkg),
    ...collectSectionGalleryImages(sectionTemplate),
    ...collectSectionGalleryImages(sections),
  ])
  const selectedChoiceImages = getSelectedChoiceImages(sections)
  const fallbackImages = pkg.images?.length
    ? pkg.images
    : (PKG_LOCAL_IMAGES[pkg._index % PKG_LOCAL_IMAGES.length] ?? PKG_LOCAL_IMAGES[0])
  const mergedSource = galleryImages.length ? galleryImages : fallbackImages
  const activeMainImage = selectedChoiceImages[0] ?? mergedSource[0]
  const mainImageCandidate = selectedTextImage || activeMainImage || mergedSource[0]
  const sourceImages = uniqueValues(
    [...mergedSource, mainImageCandidate, ...selectedChoiceImages].filter(Boolean)
  )
  const sideImages = buildDecorSideImages(sourceImages)
  const message = activeCustomization?.data?.message ?? ''

  const handleSelect = (sectionKey, itemTitle) => {
    setAddToCartMessage('')
    setSelectedTextImage('')

    const currentSections = activeCustomization?.data?.sections ?? []
    const selectedChoiceItem = currentSections
      .find(section => (section.groupKey ?? section.title) === sectionKey)
      ?.items?.find(item => typeof item !== 'string' && item.title === itemTitle)

    const choiceImage = selectedChoiceItem?.images?.[0] || ''
    if (choiceImage) {
      setSelectedTextImage(choiceImage)
      setToastImage(choiceImage)
    }

    setCustomizations(prev =>
      prev.map((customization, customizationIndex) => {
        if (customizationIndex !== activeIndex) return customization

        let nextSections = (customization?.data?.sections ?? []).map(section => {
          if (section.type !== 'choice-row') return section
          if ((section.groupKey ?? section.title) !== sectionKey) return section

          return {
            ...section,
            items: section.items.map(item =>
              typeof item === 'string' ? item : { ...item, selected: item.title === itemTitle }
            ),
          }
        })

        nextSections = clearDependentChoiceSelections(nextSections, sectionKey)

        return {
          ...customization,
          data: {
            ...customization.data,
            sections: nextSections,
          },
          isAddedToCart: false,
        }
      })
    )
  }

  const handleMessageChange = value => {
    const nextValue = String(value ?? '').slice(0, 250)

    setCustomizations(prev =>
      prev.map((customization, customizationIndex) =>
        customizationIndex === activeIndex
          ? {
              ...customization,
              data: {
                ...customization.data,
                message: nextValue,
              },
            }
          : customization
      )
    )
  }

  const handleTextItemClick = (sectionTitle, itemText) => {
    const directKey = `${sectionTitle}::${itemText}`
    let nextImage = textImageBySectionItem[directKey]

    // Title click uses the first bullet; image may only be mapped on another row.
    if (!nextImage) {
      const prefix = `${sectionTitle}::`
      nextImage = Object.entries(textImageBySectionItem).find(([key]) => key.startsWith(prefix))?.[1]
    }

    if (!nextImage) return

    setSelectedTextImage(nextImage)
    setToastImage(nextImage)
  }

  const handlePackageAddToCart = async () => {
    if (isAddingToCart) return

    setAddToCartMessage('')

    if (!pkg?.id) {
      setAddToCartMessage('This package is missing its cart ID. Please refresh and try again.')
      return
    }

    setIsAddingToCart(true)

    const baseSelectedOpts = buildDecorSelectedOptions(activeCustomization, {
      useFirstChoiceFallback: true,
    })
    const trimmedMessage = String(message ?? '')
      .trim()
      .slice(0, 250)
    const selectedOpts = trimmedMessage
      ? {
          ...baseSelectedOpts,
          [DECOR_ADDITIONAL_INFO_KEY]: trimmedMessage,
        }
      : baseSelectedOpts

    try {
      if (cartItemId) {
        await updateCartItemDetails({
          itemId: cartItemId,
          quantity,
          selectedOptions: selectedOpts,
        })
        showToast({ message: cartToastMessage })
      } else {
        await addPackage({
          packageId: Number(pkg.id),
          quantity,
          selectedOptions: selectedOpts,
        })
        showToast({ message: cartToastMessage })
      }
    } catch (err) {
      console.error('[cart-click] decor add failed', err)
      setAddToCartMessage('Could not add this package to cart. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const isDisabled = isAddingToCart
  const packageTitle =
    pkg.title || getDecorDetailSections(pkg)[0]?.theme_name || DECOR_CONTENT.title
  const packagePrice = resolveChooseOneDisplayPrice(
    filterVisibleDecorSections(sections),
    pkg.base_price ?? 0,
    pkg.price || DECOR_CONTENT.price
  )
  const packageOriginalPrice = pkg.compare_at_price || ''
  const packageDiscountBadge = pkg.discount_badge || ''
  const packageIntro = buildDecorIntro(pkg)
  const keyDecorText = buildKeyDecorText(pkg)
  const accordionSections = mergeAccordionSections(
    buildDecorAccordionSections(pkg),
    cancellationPolicy,
    DECOR_CONTENT.accordionSections.find(section => section.title === 'Cancellation Policy')
  )

  return (
    <>
      <SingleProductPageContent
        title={packageTitle}
        price={packagePrice}
        originalPrice={packageOriginalPrice}
        discountBadge={packageDiscountBadge}
        intro={packageIntro}
        customContent={
          <DecorPackageSections
            keyDecorText={keyDecorText}
            sections={sections}
            message={message}
            onMessageChange={handleMessageChange}
            onSelect={handleSelect}
            onTextItemClick={handleTextItemClick}
            hidePrices={consultationOnly}
          />
        }
        accordionSections={accordionSections}
        mainImage={selectedTextImage || activeMainImage || sideImages[0]}
        sideImages={sideImages}
        imageMetaByUrl={imageMetaByUrl}
        relatedProducts={relatedProducts}
        addToCartLabel={isAddingToCart ? 'Adding...' : 'Add to cart'}
        addToCartMessage={addToCartMessage}
        disableAddToCart={isDisabled}
        onAddToCart={handlePackageAddToCart}
        quantity={quantity}
        onDecrement={() => {
          setAddToCartMessage('')
          setQuantity(current => Math.max(1, current - 1))
        }}
        onIncrement={() => {
          setAddToCartMessage('')
          setQuantity(current => current + 1)
        }}
        testimonials={packageReviews}
        consultationOnly={consultationOnly}
        consultationPackage={
          consultationOnly
            ? {
                id: pkg.id,
                title: packageTitle,
                slug: pkg.slug,
                source: 'corporate-decor',
              }
            : null
        }
        ctaButtonText="Book a consultation"
      />
      <InclusionImageToast image={toastImage} onClose={() => setToastImage(null)} />
    </>
  )
}
