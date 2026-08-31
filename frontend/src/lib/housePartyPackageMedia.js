/** Package images come from Strapi CMS only — no offline slug overrides. */

export function isHousePartyPackageSlug() {
  return false
}

export function getHousePartyPackageImages() {
  return null
}

export function withHousePartyPackageImages(pkg) {
  return pkg
}

export function enrichPackagesWithHousePartyImages(packages) {
  return Array.isArray(packages) ? packages : []
}
