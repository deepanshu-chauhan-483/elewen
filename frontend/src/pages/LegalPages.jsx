import { useMemo, useState } from 'react'
import { useTermsAndConditions } from '../hooks/useTermsAndConditions'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'
import CustomSelect from '../components/common/CustomSelect'

const INDEX_LABEL_CLASS = 'block line-clamp-2 leading-5 break-words'

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

const fallbackTermsData = [
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
]

export default function Terms() {
  const termsQuery = useTermsAndConditions()
  const { data: cmsTerms } = termsQuery
  const isStrapiLoading = useStrapiPageLoading(termsQuery)

  const termsData = useMemo(() => cmsTerms?.sections ?? fallbackTermsData, [cmsTerms])

  const defaultActiveId = useMemo(
    () => termsData[0]?.children?.[0]?.id ?? termsData[0]?.id ?? 'terms',
    [termsData]
  )

  const [activeId, setActiveId] = useState(defaultActiveId)

  const validIds = useMemo(
    () =>
      new Set(
        termsData.flatMap(section => [
          section.id,
          ...(section.children?.map(child => child.id) ?? []),
        ])
      ),
    [termsData]
  )

  const resolvedActiveId = validIds.has(activeId) ? activeId : defaultActiveId

  const pageTitle = cmsTerms?.pageTitle ?? 'Terms & Conditions'

  const pageSubtitle =
    cmsTerms?.pageSubtitle ?? 'These terms govern your use of Elewen and our services.'

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
      {/* HEADER */}
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
      </section>

      {/* ========================= */}
      {/* MOBILE LAYOUT */}
      {/* ========================= */}
      <section className="lg:hidden px-5 pt-3 pb-8">
        {/* MOBILE INDEX */}
        <div className="sticky top-0 z-20 bg-white pt-4 pb-4">
          <CustomSelect
            variant="legal"
            value={resolvedActiveId}
            onChange={scrollToSection}
            options={termsData.map(section => ({
              value: section.id,
              label: section.title,
            }))}
            placeholder="Select section"
            ariaLabel="Select legal section"
          />
        </div>

        {/* MOBILE CONTENT */}
        <div className="space-y-10 pt-8" data-legal-layout="mobile">
          {termsData.map(section => (
            <div key={section.id} data-legal-section={section.id} className="scroll-mt-[90px]">
              {/* MAIN TITLE */}
              <h2
                className="text-[28px] leading-[1.3] font-semibold mb-4 text-[#3a3a3a]"
                style={{ fontFamily: "'Poppins'" }}
              >
                {section.title}
              </h2>

              {/* MAIN CONTENT */}
              {section.content?.map((para, i) => (
                <p key={i} className="text-[15px] leading-[1.9] text-[#555] mb-4">
                  {para}
                </p>
              ))}

              {/* CHILD CONTENT */}
              {section.children?.map(child => (
                <div
                  key={child.id}
                  data-legal-section={child.id}
                  className="scroll-mt-[90px] mt-8 rounded-2xl bg-[#FAFAFA] p-5"
                >
                  {child.hasTitle ? (
                    <>
                      <h4 className="text-[18px] font-semibold mb-3 text-[#3a3a3a]">
                        {child.title}
                      </h4>

                      {child.content.map((para, i) => (
                        <p key={i} className="text-[15px] leading-[1.9] text-[#555] mb-3">
                          {para}
                        </p>
                      ))}
                    </>
                  ) : (
                    child.content.map((para, i) => (
                      <p key={i} className="text-[15px] leading-[1.9] text-[#555] mb-3">
                        {i === 0 && child.clauseNumber ? `${child.clauseNumber} ` : ''}
                        {para}
                      </p>
                    ))
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ========================= */}
      {/* DESKTOP LAYOUT */}
      {/* ========================= */}
      <section className="hidden lg:flex max-w-[1440px] mx-auto py-[70px] px-[clamp(80px,10vw,200px)] gap-[clamp(40px,6vw,70px)]">
        {/* LEFT CONTENT */}
        <div className="flex-1 text-[#3a3a3a] space-y-8" data-legal-layout="desktop">
          {termsData.map(section => (
            <div key={section.id} data-legal-section={section.id} className="scroll-mt-28">
              {/* MAIN TITLE */}
              <h2 className="text-[24px] font-semibold mb-3" style={{ fontFamily: "'Poppins'" }}>
                {section.title}
              </h2>

              {/* MAIN CONTENT */}
              {section.content?.map((para, i) => (
                <p key={i} className="text-[14px] leading-[1.8] mb-3">
                  {para}
                </p>
              ))}

              {/* CHILD SECTIONS */}
              {section.children?.map(child => (
                <div key={child.id} data-legal-section={child.id} className="mt-4 scroll-mt-28">
                  {child.hasTitle ? (
                    <>
                      <h4 className="text-[18px] font-medium mb-2">{child.title}</h4>

                      {child.content.map((para, i) => (
                        <p key={i} className="text-[14px] leading-[1.8] mb-2">
                          {para}
                        </p>
                      ))}
                    </>
                  ) : (
                    child.content.map((para, i) => (
                      <p key={i} className="text-[14px] leading-[1.8] mb-2">
                        {i === 0 && child.clauseNumber ? `${child.clauseNumber} ` : ''}
                        {para}
                      </p>
                    ))
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* DESKTOP SIDEBAR */}
        <div className="w-[254px] shrink-0">
          <div className="sticky top-[22px] bg-[#FAFAFA] p-5 text-[14px] rounded-xl">
            <div
              className="max-h-[calc(90vh-12px)] overflow-y-auto pr-2 hide-scrollbar"
              data-lenis-prevent
            >
              <ul className="space-y-3">
                {termsData.map(section => (
                  <li key={section.id}>
                    {/* MAIN */}
                    <div
                      className="font-medium cursor-pointer"
                      onClick={() => scrollToSection(section.id)}
                      title={section.title}
                    >
                      <span className={INDEX_LABEL_CLASS}>{getSectionIndexLabel(section)}</span>
                    </div>

                    {/* CHILD */}
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
    </div>
  )
}
