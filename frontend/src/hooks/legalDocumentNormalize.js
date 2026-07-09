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

function formatLegalDate(value) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function normalizeTldrBlock(tldr) {
  if (!tldr || typeof tldr !== 'object') return null

  const bullets = Array.isArray(tldr.bullets)
    ? tldr.bullets
        .map(bullet => ({
          icon: bullet?.icon?.trim() || '',
          text: bullet?.text?.trim() || '',
        }))
        .filter(bullet => bullet.text)
    : []

  const heading = tldr.heading?.trim() || ''
  const intro = tldr.intro?.trim() || ''

  if (!heading && !intro && bullets.length === 0) return null

  return {
    heading,
    intro,
    bullets,
    closingNote: tldr.closingNote?.trim() || '',
  }
}

export function normalizeLegalDocument(data, options = {}) {
  if (!data) return null

  const { defaultTitle = 'Legal Document', defaultSubtitle = '', introText = '' } = options

  const sections = Array.isArray(data.sections) ? data.sections : []

  return {
    pageTitle: data.title?.trim() || defaultTitle,
    pageSubtitle: defaultSubtitle,
    introText: introText.trim(),
    effectiveDate: formatLegalDate(data.effectiveDate),
    lastUpdated: formatLegalDate(data.lastUpdated),
    contactEmail: data.contactEmail?.trim() || '',
    tldr: normalizeTldrBlock(data.tldr),
    sections: sections
      .map((section, sectionIndex) => {
        const sectionTitleText = section?.title?.trim()
        const sectionNumber =
          section?.sectionNumber != null && section?.sectionNumber !== ''
            ? `${section.sectionNumber}. `
            : ''
        const title = `${sectionNumber}${sectionTitleText || `Section ${sectionIndex + 1}`}`.trim()
        const sectionId = slugify(
          sectionTitleText || `section-${sectionIndex + 1}`,
          `section-${sectionIndex + 1}`
        )
        const clauses = Array.isArray(section?.clauses) ? section.clauses : []

        const directContent = clauses
          .filter(
            clause =>
              !clause?.title?.trim() &&
              !clause?.clauseNumber?.trim() &&
              clause?.isHighlighted !== true
          )
          .flatMap(clause => splitParagraphs(clause?.content))

        const children = clauses
          .filter(
            clause =>
              clause?.title?.trim() ||
              clause?.clauseNumber?.trim() ||
              clause?.isHighlighted === true
          )
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
              id: `${sectionId}-clause-${clauseIndex + 1}`,
              title: childTitle || `Clause ${clauseIndex + 1}`,
              content,
              clauseNumber,
              clauseTitle: clauseTitleText,
              hasTitle: Boolean(clauseTitleText),
              previewText,
              isHighlighted: clause?.isHighlighted === true,
            }
          })

        return {
          id: sectionId,
          title,
          content: directContent,
          children,
        }
      })
      .filter(
        section => section.title && (section.content.length > 0 || section.children.length > 0)
      ),
  }
}
