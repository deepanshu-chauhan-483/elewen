/** Offline reference images for House Party decor packages (until CMS media is uploaded). */
const HOUSE_PARTY_MEDIA_BASE = '/offline-media/house-party'

const PACKAGE_IMAGES_BY_SLUG = {
  'hp-phool-proof-1': [
    `${HOUSE_PARTY_MEDIA_BASE}/phool-proof.png`,
    `${HOUSE_PARTY_MEDIA_BASE}/house-party-packages.png`,
  ],
  'hp-phool-proof-2': [
    `${HOUSE_PARTY_MEDIA_BASE}/phool-proof.png`,
    `${HOUSE_PARTY_MEDIA_BASE}/house-party-packages.png`,
  ],
  'soft-glow-szn-1': [
    `${HOUSE_PARTY_MEDIA_BASE}/soft-glow-szn.png`,
    `${HOUSE_PARTY_MEDIA_BASE}/house-party-theme.png`,
  ],
  'soft-glow-szn-2': [
    `${HOUSE_PARTY_MEDIA_BASE}/soft-glow-szn.png`,
    `${HOUSE_PARTY_MEDIA_BASE}/house-party-theme.png`,
  ],
  'soft-glow-szn-3': [
    `${HOUSE_PARTY_MEDIA_BASE}/soft-glow-szn.png`,
    `${HOUSE_PARTY_MEDIA_BASE}/house-party-packages.png`,
  ],
  'hosting-hero-essentials': [
    `${HOUSE_PARTY_MEDIA_BASE}/hosting-hero.png`,
    `${HOUSE_PARTY_MEDIA_BASE}/house-party-packages.png`,
  ],
  'entertainment-kit': [
    `${HOUSE_PARTY_MEDIA_BASE}/entertainment-kit.png`,
    `${HOUSE_PARTY_MEDIA_BASE}/house-party-theme.png`,
  ],
}

export const HOUSE_PARTY_THEME_PREVIEW = `${HOUSE_PARTY_MEDIA_BASE}/house-party-theme.png`

export const HOUSE_PARTY_PACKAGE_SLUGS = new Set(Object.keys(PACKAGE_IMAGES_BY_SLUG))

export function isHousePartyPackageSlug(slug = '') {
  return HOUSE_PARTY_PACKAGE_SLUGS.has(String(slug ?? '').trim().toLowerCase())
}

export function getHousePartyPackageImages(slug = '') {
  const key = String(slug ?? '').trim().toLowerCase()
  return PACKAGE_IMAGES_BY_SLUG[key] ?? null
}

export function withHousePartyPackageImages(pkg) {
  if (!pkg || (Array.isArray(pkg.images) && pkg.images.length)) return pkg

  const offlineImages = getHousePartyPackageImages(pkg.slug)
  if (!offlineImages?.length) return pkg

  return { ...pkg, images: offlineImages }
}

export function enrichPackagesWithHousePartyImages(packages) {
  return (Array.isArray(packages) ? packages : []).map(withHousePartyPackageImages)
}
