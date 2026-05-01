import {
  strapiServerDelete,
  strapiServerGet,
  strapiServerPost,
} from '../lib/strapi.js'

function getRelationValue(value) {
  if (!value) return null
  if (Array.isArray(value?.data)) return value.data[0] ?? null
  if (value?.data) return value.data
  return value
}

function normalizeSavedPackage(entry) {
  const pkg = getRelationValue(entry?.package)

  return {
    id: entry?.id ?? null,
    documentId: entry?.documentId ?? '',
    packageId: pkg?.id != null ? String(pkg.id) : '',
    packageDocumentId: pkg?.documentId ?? '',
    title: pkg?.title ?? '',
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

export const getWishlist = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const result = await strapiServerGet(
      `/api/saved-packages?filters[user][id][$eq]=${userId}&populate[package]=true&sort=createdAt:desc&pagination[pageSize]=100&publicationState=preview`
    )

    const items = (result?.data ?? []).map(normalizeSavedPackage).filter(item => item.packageId)

    res.json({
      items,
      packageIds: items.map(item => item.packageId),
    })
  } catch (err) {
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

    const packageLookup = await strapiServerGet(
      `/api/packages?filters[id][$eq]=${packageId}&pagination[pageSize]=1&publicationState=preview`
    )
    const pkg = packageLookup?.data?.[0]

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' })
    }

    const existing = await findSavedPackage(userId, packageId)
    if (existing) {
      return res.status(200).json({
        item: normalizeSavedPackage(existing),
        saved: true,
      })
    }

    const created = await strapiServerPost('/saved-packages', {
      data: {
        user: Number(userId),
        package: Number(packageId),
        custom_config: customConfig,
      },
    })

    const createdDocumentId =
      created?.data?.documentId ?? created?.data?.id ?? created?.documentId ?? created?.id

    const savedEntry = createdDocumentId
      ? await strapiServerGet(
          `/api/saved-packages/${createdDocumentId}?populate[package]=true&publicationState=preview`
        )
      : created

    const item = normalizeSavedPackage(savedEntry?.data ?? created?.data ?? created)

    res.status(201).json({ item, saved: true })
  } catch (err) {
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

    res.json({ removed: true, packageId })
  } catch (err) {
    next(err)
  }
}
