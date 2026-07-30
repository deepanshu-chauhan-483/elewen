import { strapiGetUserById, strapiServerDelete, strapiServerGet, strapiServerPost } from '../lib/strapi.js'
import { enrichSavedPackages } from '../lib/dashboardData.js'
import { cacheDel, cacheDelContaining } from '../lib/cache.js'

const STRAPI_BASE = process.env.STRAPI_URL || 'http://localhost:1337'

function getRelationValue(value) {
  if (!value) return null
  if (Array.isArray(value?.data)) return value.data[0] ?? null
  if (value?.data) return value.data
  return value
}

function toAbsoluteUrl(value) {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `${STRAPI_BASE}${value.startsWith('/') ? '' : '/'}${value}`
}

function getRelationArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (value?.data) return [value.data]
  return [value]
}

function getFirstMediaUrl(value) {
  const item = getRelationArray(value)[0]
  if (!item) return null

  return toAbsoluteUrl(
    item?.formats?.large?.url ??
      item?.formats?.medium?.url ??
      item?.formats?.small?.url ??
      item?.formats?.thumbnail?.url ??
      item?.url ??
      null
  )
}

function normalizeServiceCategory(category) {
  if (!category) return null

  return {
    id: category?.id != null ? String(category.id) : '',
    name: category?.name ?? '',
    slug: category?.slug ?? '',
  }
}

function normalizeEvent(event) {
  if (!event) return null

  return {
    id: event?.id != null ? String(event.id) : '',
    documentId: event?.documentId ?? '',
    name: event?.name ?? '',
    slug: event?.slug ?? '',
    tagline: event?.tagline ?? '',
    iconUrl: getFirstMediaUrl(event?.icon),
  }
}

function normalizeSavedPackage(entry) {
  const pkg = getRelationValue(entry?.package)
  const serviceCategories = getRelationArray(pkg?.service_categories)
    .map(normalizeServiceCategory)
    .filter(Boolean)
  const events = getRelationArray(pkg?.events).map(normalizeEvent).filter(Boolean)
  const imageUrl = getFirstMediaUrl(pkg?.images)
  const basePrice = Number(pkg?.base_price ?? 0) || 0

  return {
    id: entry?.id ?? null,
    documentId: entry?.documentId ?? '',
    packageId: pkg?.id != null ? String(pkg.id) : '',
    packageDocumentId: pkg?.documentId ?? '',
    title: pkg?.title ?? '',
    slug: pkg?.slug ?? '',
    imageUrl,
    basePrice,
    serviceCategories,
    events,
    package: pkg
      ? {
          id: String(pkg.id),
          documentId: pkg?.documentId ?? '',
          title: pkg?.title ?? '',
          slug: pkg?.slug ?? '',
          basePrice,
          imageUrl,
          serviceCategories,
          events,
        }
      : null,
    customConfig: entry?.custom_config ?? null,
    createdAt: entry?.createdAt ?? entry?.created_at ?? null,
  }
}

async function findSavedPackage(userId, packageId) {
  const result = await strapiServerGet(
    `/api/saved-packages?filters[user][id][$eq]=${userId}&filters[package][id][$eq]=${packageId}&populate[package]=true&pagination[pageSize]=1&publicationState=preview`
  )

  return result?.data?.[0] ?? null
}

async function invalidateWishlistCache(userId) {
  await Promise.all([
    cacheDel(`dashboard:summary:${userId}`),
    cacheDelContaining('strapi:GET:*saved-packages*', `filters[user][id][$eq]=${userId}`),
  ])
}

export const getWishlist = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const result = await strapiServerGet(
      `/api/saved-packages?filters[user][id][$eq]=${userId}&populate[package][populate][0]=images&populate[package][populate][1]=service_categories&populate[package][populate][2]=events&sort=createdAt:desc&pagination[pageSize]=100&publicationState=preview`
    )

    const items = await enrichSavedPackages(
      (result?.data ?? []).map(normalizeSavedPackage).filter(item => item.packageId)
    )

    res.json({
      items,
      packageIds: items.map(item => item.packageId),
    })
  } catch (err) {
    // Local hybrid: Strapi permissions/token often missing — don't block cart/checkout.
    if (err?.status === 403 || err?.status === 401) {
      console.warn('[wishlist] Strapi forbidden — returning empty wishlist')
      return res.json({ items: [], packageIds: [] })
    }
    next(err)
  }
}

export const addWishlistItem = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const packageId = String(req.body?.packageId ?? '').trim()
    const customConfig = req.body?.customConfig ?? null

    if (!packageId) {
      return res.status(400).json({ error: 'packageId is required' })
    }

    if (!userId || Number.isNaN(Number(userId))) {
      return res.status(401).json({
        error: 'Your session is invalid. Please log out and log in again, then save to wishlist.',
        code: 'INVALID_USER_SESSION',
      })
    }

    // Strapi rejects saved-package create if the linked user row is missing.
    let strapiUser = null
    try {
      strapiUser = await strapiGetUserById(userId)
    } catch (userLookupErr) {
      if (userLookupErr?.status === 404) {
        return res.status(401).json({
          error: 'Your account was not found in Strapi. Please log out and log in again.',
          code: 'STRAPI_USER_MISSING',
        })
      }
      throw userLookupErr
    }

    if (!strapiUser?.id) {
      return res.status(401).json({
        error: 'Your account was not found in Strapi. Please log out and log in again.',
        code: 'STRAPI_USER_MISSING',
      })
    }

    const packageLookup = await strapiServerGet(
      `/api/packages?filters[id][$eq]=${packageId}&pagination[pageSize]=1&publicationState=preview`
    )
    const pkg = packageLookup?.data?.[0]

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' })
    }

    const existing = await findSavedPackage(userId, packageId)
    if (existing) {
      const [item] = await enrichSavedPackages([normalizeSavedPackage(existing)])
      return res.status(200).json({
        item,
        saved: true,
      })
    }

    const created = await strapiServerPost('/saved-packages', {
      data: {
        user: Number(strapiUser.id),
        package: Number(pkg.id ?? packageId),
        custom_config: customConfig,
      },
    })

    await invalidateWishlistCache(userId)

    const createdDocumentId =
      created?.data?.documentId ?? created?.data?.id ?? created?.documentId ?? created?.id

    const savedEntry = createdDocumentId
      ? await strapiServerGet(
          `/api/saved-packages/${createdDocumentId}?populate[package][populate][0]=images&populate[package][populate][1]=service_categories&populate[package][populate][2]=events&publicationState=preview`
        )
      : created

    const [item] = await enrichSavedPackages([
      normalizeSavedPackage(savedEntry?.data ?? created?.data ?? created),
    ])

    res.status(201).json({ item, saved: true })
  } catch (err) {
    const message = String(err?.message ?? '')
    if (
      message.includes('plugin::users-permissions.user') ||
      message.includes('associated with this entity do not exist')
    ) {
      return res.status(401).json({
        error: 'Your account was not found in Strapi. Please log out and log in again, then save to wishlist.',
        code: 'STRAPI_USER_MISSING',
        fields: err.fields ?? undefined,
      })
    }
    next(err)
  }
}

export const removeWishlistItem = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const packageId = String(req.params.packageId ?? '').trim()

    if (!packageId) {
      return res.status(400).json({ error: 'packageId is required' })
    }

    const existing = await findSavedPackage(userId, packageId)
    if (!existing) {
      return res.json({ removed: false, packageId })
    }

    const targetId = existing.documentId ?? existing.id
    await strapiServerDelete(`/api/saved-packages/${targetId}?publicationState=preview`)
    await invalidateWishlistCache(userId)

    res.json({ removed: true, packageId })
  } catch (err) {
    next(err)
  }
}
