import { useEffect, useMemo, useState } from 'react'
import { useTermsAndConditions } from '../hooks/useTermsAndConditions'

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
  const { data: cmsTerms } = useTermsAndConditions()
  const indexPreviewStyle = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  const termsData = useMemo(() => cmsTerms?.sections ?? fallbackTermsData, [cmsTerms])
  const defaultActiveId = useMemo(
    () => termsData[0]?.children?.[0]?.id ?? termsData[0]?.id ?? 'terms',
    [termsData]
  )
  const [activeId, setActiveId] = useState(defaultActiveId)

  useEffect(() => {
    const validIds = new Set(
      termsData.flatMap(section => [
        section.id,
        ...(section.children?.map(child => child.id) ?? []),
      ])
    )

    if (!validIds.has(activeId)) {
      setActiveId(defaultActiveId)
    }
  }, [activeId, defaultActiveId, termsData])

  const pageTitle = cmsTerms?.pageTitle ?? 'Terms & Conditions'
  const pageSubtitle =
    cmsTerms?.pageSubtitle ?? 'These terms govern your use of Elewen and our services.'

  const getChildIndexLabel = child => {
    if (child.hasTitle) return child.title

    const preview = String(child.previewText ?? '').trim()
    if (child.clauseNumber && preview) return `${child.clauseNumber} ${preview}`
    return child.clauseNumber || child.title
  }

  return (
    <div className="w-full">
      {/* HEADER */}
      <section
        className="w-full text-center py-[80px] mt-6 md:mt-10"
        style={{ backgroundColor: '#591902' }}
      >
        <h1 className="text-white text-[80px] font-serif">{pageTitle}</h1>
        <p className="text-white/70 mt-3 text-[16px]">{pageSubtitle}</p>
      </section>

      {/* CONTENT */}
      <section className="max-w-[1440px] mx-auto flex py-[70px] px-[clamp(80px,10vw,200px)] gap-[clamp(40px,6vw,70px)]">
        {/* LEFT CONTENT */}
        <div className="flex-2 text-[#3a3a3a] space-y-6">
          {termsData.map(section => (
            <div key={section.id} id={section.id}>
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
                <div key={child.id} id={child.id} className="mt-4">
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

        {/* RIGHT SIDEBAR */}
        <div className="w-[254px]  shrink-0" >
          <div className="sticky top-[22px] bg-[#FAFAFA] p-5 text-[14px]">
            <div className="max-h-[calc(90vh-12px)] overflow-y-auto pr-2 hide-scrollbar" data-lenis-prevent>
              <ul className="space-y-3">
                {termsData.map(section => (
                  <li key={section.id}>
                    {/* MAIN */}
                    <div
                      className="font-medium cursor-pointer"
                      onClick={() =>
                        document.getElementById(section.id)?.scrollIntoView({
                          behavior: 'smooth',
                        })
                      }
                      title={section.title}
                    >
                      <span className="block break-words leading-5" style={indexPreviewStyle}>
                        {section.title}
                      </span>
                    </div>

                    {/* CHILD */}
                    {section.children?.map(child => (
                      <div
                        key={child.id}
                        onClick={() => {
                          setActiveId(child.id)
                          document.getElementById(child.id)?.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className={`cursor-pointer pl-3 ${
                          activeId === child.id ? 'text-[#6a8f4e] font-medium' : 'text-gray-600'
                        }`}
                        title={getChildIndexLabel(child)}
                      >
                        <span className="block break-words leading-5" style={indexPreviewStyle}>
                          {getChildIndexLabel(child)}
                        </span>
                      </div>
                    ))}
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
