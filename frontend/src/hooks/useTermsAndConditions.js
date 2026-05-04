import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'

function slugify(value, fallback) {
  const source = String(value ?? fallback ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return source || fallback || 'section'
}

function splitParagraphs(value) {
  if (typeof value !== 'string') return []

  return value
    .split(/\n\s*\n/)
    .map(part => part.trim())
    .filter(Boolean)
}

function normalizeTermsData(data) {
  if (!data) return null

  const sections = Array.isArray(data.sections) ? data.sections : []

  return {
    pageTitle: data.title?.trim() || 'Terms & Conditions',
    pageSubtitle: 'These terms govern your use of Elewen and our services.',
    sections: sections
      .map((section, sectionIndex) => {
        const sectionTitleText = section?.title?.trim()
        const sectionNumber =
          section?.sectionNumber != null && section?.sectionNumber !== ''
            ? `${section.sectionNumber}. `
            : ''
        const title = `${sectionNumber}${sectionTitleText || `Section ${sectionIndex + 1}`}`.trim()
        const sectionId = slugify(sectionTitleText || `section-${sectionIndex + 1}`, `section-${sectionIndex + 1}`)
        const clauses = Array.isArray(section?.clauses) ? section.clauses : []

        const directContent = clauses
          .filter(clause => !clause?.title?.trim() && !clause?.clauseNumber?.trim())
          .flatMap(clause => splitParagraphs(clause?.content))

        const children = clauses
          .filter(clause => clause?.title?.trim() || clause?.clauseNumber?.trim())
          .map((clause, clauseIndex) => {
            const clauseNumber =
              clause?.clauseNumber != null && clause?.clauseNumber !== ''
                ? String(clause.clauseNumber).trim()
                : ''
            const clauseTitleText = clause?.title?.trim() || ''
            const childTitle = [clauseNumber, clauseTitleText].filter(Boolean).join('. ')
            const content = splitParagraphs(clause?.content)
            const previewText = content[0] ?? ''

            return {
              id: slugify(
                `${sectionId}-${clauseNumber || clauseTitleText || clauseIndex + 1}`,
                `${sectionId}-clause-${clauseIndex + 1}`
              ),
              title: childTitle || `Clause ${clauseIndex + 1}`,
              content,
              clauseNumber,
              clauseTitle: clauseTitleText,
              hasTitle: Boolean(clauseTitleText),
              previewText,
            }
          })

        return {
          id: sectionId,
          title,
          content: directContent,
          children,
        }
      })
      .filter(section => section.title && (section.content.length > 0 || section.children.length > 0)),
  }
}

async function fetchTermsAndConditions() {
  const candidatePaths = ['/terms-and-condition', '/terms-and-conditions']

  for (const path of candidatePaths) {
    try {
      const response = await strapiGet(path, {
        'populate[sections][populate][clauses]': 'true',
        'populate[tldr][populate][bullets]': 'true',
      })
      const data = response?.data?.attributes ?? response?.data ?? null
      const normalized = normalizeTermsData(data)
      if (normalized) return normalized
    } catch {
      // try next possible route shape
    }
  }

  throw new Error('Failed to fetch Terms & Conditions from Strapi')
}

export function useTermsAndConditions() {
  return useQuery({
    queryKey: ['terms-and-conditions'],
    queryFn: async () => {
      if (USE_FALLBACK) return null

      try {
        return await fetchTermsAndConditions()
      } catch (error) {
        console.warn('Failed to fetch Strapi terms and conditions', error)
        return null
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  })
}
