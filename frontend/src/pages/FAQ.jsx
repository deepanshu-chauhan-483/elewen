import { useMemo, useState } from 'react'
import { useFaqCategories, useFaqItems } from '../hooks/useFaqItems'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'

const formatCategoryLabel = value =>
  String(value || '')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('')
  const [openIndex, setOpenIndex] = useState(0)
  const faqItemsQuery = useFaqItems()
  const faqCategoriesQuery = useFaqCategories()
  const { data: faqs = [] } = faqItemsQuery
  const { data: categories = [] } = faqCategoriesQuery
  const isStrapiLoading = useStrapiPageLoading(faqItemsQuery, faqCategoriesQuery)

  const resolvedActiveCategory =
    activeCategory && categories.includes(activeCategory) ? activeCategory : (categories[0] ?? '')

  const visibleFaqs = useMemo(() => {
    if (!resolvedActiveCategory) return faqs
    return faqs.filter(item => item.category === resolvedActiveCategory)
  }, [faqs, resolvedActiveCategory])

  if (isStrapiLoading) {
    return <CmsPageLoader />
  }

  return (
    <div className="w-full">
      {/* HEADER */}
      <section
        className="w-full text-center px-[10px] md:px-0 py-[80px] mt-6  md:mt-10"
        style={{ backgroundColor: '#591902' }}
      >
        <h1 className="text-white text-[40px] md:text-[60px] lg:text-[80px] leading-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-white/70 mt-4 text-[16px]">
          Everything you need to know about planning, booking, and experiencing Elewen.
        </p>
      </section>

      {/* CONTENT */}
      <section>
        <div className="mx-auto grid max-w-[1200px] gap-10 px-[10px] py-[60px] md:relative md:grid-cols-[250px_minmax(0,1fr)] md:px-6 lg:px-0">
          <div className="absolute bottom-0 left-[282px] top-0 hidden w-px bg-[#A7AE98] md:block" />

          {/* LEFT MENU */}
          <div className="border-b border-[#364022] px-[10px] md:border-b-0 md:px-0 md:pr-6">
            <aside className="self-start pb-6 md:sticky md:top-28 md:pb-0">
              <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-[12px] md:block md:space-y-6 md:text-[16px]">
                {categories.map(category => {
                  const isActive = resolvedActiveCategory === category
                  const categoryIndex = categories.indexOf(category)

                  return (
                    <li key={category} className="flex items-center md:block">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory(category)
                          setOpenIndex(0)
                        }}
                        className={`cursor-pointer text-left text-[16px] transition-colors ${
                          isActive ? 'font-medium text-[#364022]' : 'text-[#737373]'
                        }`}
                      >
                        <span className="relative inline-block md:pb-[8px]">
                          {formatCategoryLabel(category)}
                          <span
                            className={`absolute bottom-0 left-0 h-px bg-[#364022] transition-all duration-300 ease-out ${
                              isActive ? 'w-full opacity-200' : 'w-0 opacity-0'
                            }`}
                          />
                        </span>
                      </button>

                      {categoryIndex < categories.length - 1 ? (
                        <span className="ml-4 text-[#364022] md:hidden">|</span>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </aside>
          </div>

          {/* FAQ BOX */}
          <div className="min-w-0 md:pl-10">
            <div className="bg-[#f7f7f7] p-8">
              {visibleFaqs.map((item, index) => (
                <div
                  key={item.id ?? index}
                  className={`py-5 ${index > 0 ? 'border-t border-gray-300' : ''} ${
                    index === visibleFaqs.length - 1 ? '' : 'border-b border-gray-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="flex w-full items-start justify-between gap-6 text-left"
                  >
                    <h3 className="text-[27px] font-serif">{item.q}</h3>
                    <span
                      className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center text-[#1C1C1C] transition-transform duration-300 ease-out"
                      style={{
                        transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        {openIndex === index ? (
                          <path d="M6 12h12" strokeLinecap="round" />
                        ) : (
                          <>
                            <path d="M6 12h12" strokeLinecap="round" />
                            <path d="M12 6v12" strokeLinecap="round" />
                          </>
                        )}
                      </svg>
                    </span>
                  </button>

                  <div
                    className="grid transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.32,0,0.15,1)]"
                    style={{
                      gridTemplateRows: openIndex === index && item.a ? '1fr' : '0fr',
                      opacity: openIndex === index && item.a ? 1 : 0,
                      marginTop: openIndex === index && item.a ? '0.75rem' : '0rem',
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-[700px] text-[16px] text-gray-600">{item.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
