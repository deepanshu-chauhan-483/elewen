import { useMemo, useState } from 'react'
import { useFaqCategories, useFaqItems } from '../hooks/useFaqItems'

const formatCategoryLabel = value =>
  String(value || '')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('')
  const [openIndex, setOpenIndex] = useState(0)
  const { data: faqs = [] } = useFaqItems()
  const { data: categories = [] } = useFaqCategories()
  const resolvedActiveCategory =
    activeCategory && categories.includes(activeCategory) ? activeCategory : (categories[0] ?? '')

  const visibleFaqs = useMemo(() => {
    if (!resolvedActiveCategory) return faqs
    return faqs.filter(item => item.category === resolvedActiveCategory)
  }, [faqs, resolvedActiveCategory])

  return (
    <div className="w-full">
      {/* HEADER */}
      <section
        className="w-full text-center py-[80px] mt-6 md:mt-10"
        style={{ backgroundColor: '#591902' }}
      >
        <h1 className="text-white text-[80px] leading-tight">Frequently Asked Questions</h1>
        <p className="text-white/70 mt-4 text-[16px]">
          Everything you need to know about planning, booking, and experiencing Elewen.
        </p>
      </section>

      {/* CONTENT */}
      <section className="max-w-[1200px] mx-auto py-[60px]  ">
        <div className="grid gap-10 lg:grid-cols-[250px_minmax(0,1fr)] ">
          {/* LEFT MENU */}
          <div className="border-b border-[#364022] lg:border-b-0 lg:border-r lg:pr-6 ">
            <aside className="self-start pb-6 lg:sticky lg:top-28 lg:pb-0 ">
              <ul className="space-y-6 text-[16px] ">
                {categories.map(category => {
                  const isActive = resolvedActiveCategory === category

                  return (
                    <li key={category}>
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
                        <span className="relative inline-block pb-[15px]">
                          {formatCategoryLabel(category)}
                          <span
                            className={`absolute bottom-0 left-0 h-px bg-[#364022] transition-all duration-300 ease-out ${
                              isActive ? 'w-full opacity-200' : 'w-0 opacity-0'
                            }`}
                          />
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </aside>
          </div>

          {/* FAQ BOX */}
          <div className="min-w-0 lg:pl-10">
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
                    className="flex w-full items-center justify-between text-left"
                  >
                    <h3 className="text-[27px] font-serif">{item.q}</h3>
                    <span className="text-[24px]">{openIndex === index ? '-' : '+'}</span>
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
