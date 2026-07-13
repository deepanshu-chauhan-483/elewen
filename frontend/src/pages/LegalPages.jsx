import { useMemo, useState } from 'react'
import { useTermsAndConditions } from '../hooks/useTermsAndConditions'
import { usePrivacyPolicy } from '../hooks/usePrivacyPolicy'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'
import CustomSelect from '../components/common/CustomSelect'

const INDEX_LABEL_CLASS = 'block line-clamp-2 leading-5 break-words'

const DOCUMENT_CONFIG = {
  terms: {
    useHook: useTermsAndConditions,
    defaultTitle: 'Terms & Conditions',
    defaultSubtitle: 'These terms govern your use of Elewen and our services.',
    showDates: false,
    showTldr: false,
    fallbackSections: [
      {
        id: 'terms',
        title: '1. What are Terms and Conditions',
        content: [
          ' Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio quisquam, laborum nam aliquid assumenda facere dicta sequi neque, quas, nesciunt ratione. Pariatur numquam dolorem alias facilis provident laboriosam. Sint, repellendus.',
          'Cras sagittis nunc lectus, in condimentum ligula ornare at...',
        ],
        children: [
          {
            id: 'personal-data',
            title: 'A. Personal Data that we collect about you.',
            content: ['Etiam rhoncus quis eros eget fringilla...'],
          },
          {
            id: 'auto-data',
            title: 'B. Information that we collect automatically on our Sites.',
            content: ['Proin efficitur vestibulum molestie...'],
          },
        ],
      },
      {
        id: 'privacy',
        title: '2. Privacy and copyright protection',
        content: ['Proin commodo aliquam elit eu dignissim...'],
      },
      {
        id: 'content',
        title: '3. Your content in our services',
        content: ['Integer vel dictum felis, vitae gravida sem...'],
      },
    ],
  },
  privacy: {
    useHook: usePrivacyPolicy,
    defaultTitle: 'Privacy Policy',
    defaultSubtitle:
      'At Elewen, your trust means everything. We’re committed to protecting your personal information while making your event planning journey simple, safe, and stress-free.',
    showDates: true,
    showTldr: true,
    fallbackSections: [
      {
        id: 'information-we-collect',
        title: '1. Information We Collect',
        content: ['When you use Elewen, we may collect the following information:'],
        children: [
          {
            id: 'from-customers',
            title: 'From Customers:',
            content: [
              '• Name, email, and phone number',
              '• Event details (type, date, requirements, budget range)',
            ],
            hasTitle: true,
          },
        ],
      },
      {
        id: 'how-we-use-your-data',
        title: '2. How We Use Your Data',
        content: ['We use your information strictly for bookings, payments, and platform safety.'],
      },
      {
        id: 'contact-us',
        title: '10. Contact Us',
        content: [
          'If you have any questions about this Privacy Policy, write to us at: Elewen.events@gmail.com',
        ],
      },
    ],
  },
}

function truncateForIndex(text, maxLength = 72) {
  const normalized = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized

  const cut = normalized.slice(0, maxLength).trimEnd()
  const lastSpace = cut.lastIndexOf(' ')
  const snippet = lastSpace > 32 ? cut.slice(0, lastSpace) : cut
  return `${snippet}…`
}

function ClauseContent({ child, textClassName }) {
  const highlightClass = child.isHighlighted
    ? 'rounded-2xl bg-[#FFF8E8] border border-[#F0E4C8] p-4 md:p-5'
    : ''

  if (child.hasTitle) {
    return (
      <div className={highlightClass}>
        <h4 className="text-[18px] font-semibold mb-3 text-[#3a3a3a] md:text-[18px] md:font-medium md:mb-2">
          {child.title}
        </h4>

        {child.content.map((para, i) => (
          <p key={i} className={textClassName}>
            {para}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className={highlightClass}>
      {child.content.map((para, i) => (
        <p key={i} className={textClassName}>
          {i === 0 && child.clauseNumber ? `${child.clauseNumber} ` : ''}
          {para}
        </p>
      ))}
    </div>
  )
}

function TldrSummary({ tldr }) {
  if (!tldr) return null

  return (
    <section className="w-full px-5 pb-12 md:px-[clamp(80px,10vw,200px)] md:pb-16">
      <div className="mx-auto max-w-[900px] rounded-2xl border border-[#E8E2D8] bg-[#FFFBF4] p-6 md:p-8">
        {tldr.heading ? (
          <h2
            className="text-[22px] font-semibold text-[#3a3a3a] md:text-[24px]"
            style={{ fontFamily: "'Poppins'" }}
          >
            {tldr.heading}
          </h2>
        ) : null}

        {tldr.intro ? (
          <p className="mt-3 text-[15px] leading-[1.8] text-[#555] md:text-[14px]">{tldr.intro}</p>
        ) : null}

        {tldr.bullets?.length > 0 ? (
          <ul className="mt-4 space-y-2 text-[15px] leading-[1.8] text-[#555] md:text-[14px]">
            {tldr.bullets.map((bullet, index) => (
              <li key={`${bullet.text}-${index}`} className="flex gap-2">
                <span className="shrink-0">•</span>
                <span>
                  {bullet.icon ? `${bullet.icon} ` : ''}
                  {bullet.text}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {tldr.closingNote ? (
          <p className="mt-4 text-[14px] leading-[1.7] text-[#666]">{tldr.closingNote}</p>
        ) : null}
      </div>
    </section>
  )
}

export default function LegalPages({ documentType = 'terms' }) {
  const config = DOCUMENT_CONFIG[documentType] ?? DOCUMENT_CONFIG.terms
  const documentQuery = config.useHook()
  const { data: cmsDocument } = documentQuery
  const isStrapiLoading = useStrapiPageLoading(documentQuery)

  const sectionsData = useMemo(
    () => cmsDocument?.sections ?? config.fallbackSections,
    [cmsDocument, config.fallbackSections]
  )

  const defaultActiveId = useMemo(
    () => sectionsData[0]?.children?.[0]?.id ?? sectionsData[0]?.id ?? 'terms',
    [sectionsData]
  )

  const [activeId, setActiveId] = useState(defaultActiveId)

  const validIds = useMemo(
    () =>
      new Set(
        sectionsData.flatMap(section => [
          section.id,
          ...(section.children?.map(child => child.id) ?? []),
        ])
      ),
    [sectionsData]
  )

  const resolvedActiveId = validIds.has(activeId) ? activeId : defaultActiveId

  const pageTitle = cmsDocument?.pageTitle ?? config.defaultTitle

  const pageSubtitle = cmsDocument?.pageSubtitle ?? config.defaultSubtitle

  const getSectionIndexLabel = section => truncateForIndex(section.title, 80)

  const getChildIndexLabel = child => {
    if (child.hasTitle) return truncateForIndex(child.title, 80)

    const preview = truncateForIndex(child.previewText, 48)

    if (child.clauseNumber && preview) {
      return `${child.clauseNumber} ${preview}`
    }

    return child.clauseNumber || truncateForIndex(child.title, 80)
  }

  const scrollToSection = id => {
    setActiveId(id)

    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    const layout = isDesktop ? 'desktop' : 'mobile'
    const escapedId =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(id)
        : String(id).replace(/"/g, '\\"')

    const target = document.querySelector(
      `[data-legal-layout="${layout}"] [data-legal-section="${escapedId}"]`
    )

    target?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  if (isStrapiLoading) {
    return <CmsPageLoader />
  }

  return (
    <div className="w-full">
      <section
        className="w-full text-center px-5 md:px-0 py-[60px] md:py-[80px] mt-6 md:mt-10"
        style={{ backgroundColor: '#591902' }}
      >
        <h1 className="text-white text-[36px] md:text-[60px] lg:text-[80px] leading-tight">
          {pageTitle}
        </h1>

        <p className="text-white/70 mt-3 text-[15px] md:text-[16px] max-w-[700px] mx-auto">
          {pageSubtitle}
        </p>

        {documentType === 'terms' ? (
          <p className="text-white/70 mt-2 text-[14px] md:text-[15px] max-w-[700px] mx-auto">
            A unit of Mevo Events and Planners LLP
          </p>
        ) : null}

        {config.showDates && (cmsDocument?.effectiveDate || cmsDocument?.lastUpdated) ? (
          <div className="mt-4 flex flex-col gap-1 text-[13px] text-white/60 md:flex-row md:justify-center md:gap-6">
            {cmsDocument?.effectiveDate ? (
              <span>Effective Date: {cmsDocument.effectiveDate}</span>
            ) : null}
            {cmsDocument?.lastUpdated ? <span>Last Updated: {cmsDocument.lastUpdated}</span> : null}
          </div>
        ) : null}
      </section>

      <section className="lg:hidden px-5 pt-3 pb-8">
        <div className="sticky top-0 z-20 bg-white pt-4 pb-4">
          <CustomSelect
            variant="legal"
            value={resolvedActiveId}
            onChange={scrollToSection}
            options={sectionsData.map(section => ({
              value: section.id,
              label: section.title,
            }))}
            placeholder="Select section"
            ariaLabel="Select legal section"
          />
        </div>

        <div className="space-y-10 pt-8" data-legal-layout="mobile">
          {sectionsData.map(section => (
            <div key={section.id} data-legal-section={section.id} className="scroll-mt-[90px]">
              <h2
                className="text-[28px] leading-[1.3] font-semibold mb-4 text-[#3a3a3a]"
                style={{ fontFamily: "'Poppins'" }}
              >
                {section.title}
              </h2>

              {section.content?.map((para, i) => (
                <p key={i} className="text-[15px] leading-[1.9] text-[#555] mb-4">
                  {para}
                </p>
              ))}

              {section.children?.map(child => (
                <div
                  key={child.id}
                  data-legal-section={child.id}
                  className={`scroll-mt-[90px] mt-8 ${child.isHighlighted ? '' : 'rounded-2xl bg-[#FAFAFA] p-5'}`}
                >
                  <ClauseContent
                    child={child}
                    textClassName="text-[15px] leading-[1.9] text-[#555] mb-3 last:mb-0"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="hidden lg:flex max-w-[1440px] mx-auto py-[70px] px-[clamp(80px,10vw,200px)] gap-[clamp(40px,6vw,70px)]">
        <div className="flex-1 text-[#3a3a3a] space-y-8" data-legal-layout="desktop">
          {sectionsData.map(section => (
            <div key={section.id} data-legal-section={section.id} className="scroll-mt-28">
              <h2 className="text-[24px] font-semibold mb-3" style={{ fontFamily: "'Poppins'" }}>
                {section.title}
              </h2>

              {section.content?.map((para, i) => (
                <p key={i} className="text-[14px] leading-[1.8] mb-3">
                  {para}
                </p>
              ))}

              {section.children?.map(child => (
                <div key={child.id} data-legal-section={child.id} className="mt-4 scroll-mt-28">
                  <ClauseContent
                    child={child}
                    textClassName="text-[14px] leading-[1.8] mb-2 last:mb-0"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="w-[254px] shrink-0">
          <div className="sticky top-[22px] bg-[#FAFAFA] p-5 text-[14px] rounded-xl">
            <div
              className="max-h-[calc(90vh-12px)] overflow-y-auto pr-2 hide-scrollbar"
              data-lenis-prevent
            >
              <ul className="space-y-3">
                {sectionsData.map(section => (
                  <li key={section.id}>
                    <div
                      className="font-medium cursor-pointer"
                      onClick={() => scrollToSection(section.id)}
                      title={section.title}
                    >
                      <span className={INDEX_LABEL_CLASS}>{getSectionIndexLabel(section)}</span>
                    </div>

                    {section.children?.map(child => {
                      const indexLabel = getChildIndexLabel(child)
                      const indexTitle = child.hasTitle
                        ? child.title
                        : [child.clauseNumber, child.previewText].filter(Boolean).join(' ')

                      return (
                        <div
                          key={child.id}
                          onClick={() => scrollToSection(child.id)}
                          title={indexTitle}
                          className={`cursor-pointer pl-3 mt-2 ${
                            resolvedActiveId === child.id
                              ? 'text-[#6a8f4e] font-medium'
                              : 'text-gray-600'
                          }`}
                        >
                          <span className={INDEX_LABEL_CLASS}>{indexLabel}</span>
                        </div>
                      )
                    })}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {config.showTldr ? <TldrSummary tldr={cmsDocument?.tldr} /> : null}
    </div>
  )
}
