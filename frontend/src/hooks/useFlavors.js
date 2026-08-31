import { useMemo } from 'react'
import { usePackages } from './usePackages'

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
    return { data: flavors }
  }, [packages])
}
