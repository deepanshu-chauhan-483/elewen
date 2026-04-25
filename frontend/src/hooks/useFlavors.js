import { useMemo } from 'react'
import { usePackages } from './usePackages'

// 🎯 Hardcoded fallback flavours (used when Strapi unavailable)
const FALLBACK_FLAVORS = [
  { id: 1, title: 'Double Apple', description: '' },
  { id: 2, title: 'Mint', description: '' },
  { id: 3, title: 'Blueberry', description: '' },
  { id: 4, title: 'Watermelon', description: '' },
  { id: 5, title: 'Ice Mint', description: 'Intense icy mint for extreme cooling' },
  { id: 6, title: 'Mango', description: '' },
  { id: 7, title: 'Strawberry', description: '' },
  { id: 8, title: 'Grape', description: '' },
]

function normalizeFlavor(item) {
  if (!item) return null

  const title = item.title ?? item.Name ?? item.name ?? ''
  if (!title) return null

  return {
    id: item.id ?? item.documentId ?? title,
    title,
    description: item.description ?? '',
  }
}

function collectPackageFlavors(packages) {
  const allFlavors = (Array.isArray(packages) ? packages : []).flatMap(pkg =>
    Array.isArray(pkg?.flavor_options) ? pkg.flavor_options : []
  )

  const seen = new Set()
  return allFlavors
    .map(normalizeFlavor)
    .filter(Boolean)
    .filter(flavor => {
      const key = flavor.title.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

// ✅ React Query hook
export function useFlavors() {
  const { data: packages = [] } = usePackages()

  return useMemo(() => {
    const flavors = collectPackageFlavors(packages)
    return {
      data: flavors.length ? flavors : FALLBACK_FLAVORS,
    }
  }, [packages])
}
