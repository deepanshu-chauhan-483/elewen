import { useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import SingleProductPageContent from '../components/package-details/SingleProductPageContent'
import { usePackages } from '../hooks/usePackages'
import pkgImg1 from '../assets/images/IMG_3903.jpg'
import pkgImg2 from '../assets/images/IMG_7768.jpg'
import pkgImg3 from '../assets/images/IMG_0749.jpg'
import pkgImg4 from '../assets/images/IMG_0658.jpg'
import pkgImg5 from '../assets/images/IMG_3148.jpg'
import pkgImg6 from '../assets/images/IMG_7025.jpg'
import pkgImg7 from '../assets/images/IMG_8625.png'
import pkgImg8 from '../assets/images/IMG_9814.jpg'
import pkgImg9 from '../assets/images/6f6af066.jpg'

const PKG_LOCAL_IMAGES = [
  [pkgImg1, pkgImg1, pkgImg1, pkgImg1, pkgImg1],
  [pkgImg2, pkgImg2, pkgImg2, pkgImg2, pkgImg2],
  [pkgImg7, pkgImg8, pkgImg9, pkgImg1, pkgImg2],
  [pkgImg2, pkgImg4, pkgImg7, pkgImg5, pkgImg9],
  [pkgImg5, pkgImg1, pkgImg8, pkgImg3, pkgImg6],
]

const DECOR_SECTION_TEMPLATE = [
  {
    type: 'option-row',
    title: 'Backdrop & styling (choose 1)',
    items: [
      { title: '1 Bow-detailed backdrop setup', selected: false },
      { title: 'Glitter backdrop', selected: false },
    ],
  },
  {
    type: 'text-row',
    title: 'Seating setup',
    items: [
      '1 Low Table',
      '8 Cushions',
      'Table Runner',
      '8 Floral Centerpieces In Vases',
      '10 Candles',
    ],
  },
  {
    type: 'text-row',
    title: 'Personal Touches',
    items: ['Personalized name tent cards'],
  },
  {
    type: 'text-row',
    title: 'Painting Experience',
    items: ['8 canvases with easel stands', 'Paints and brushes for each guest'],
  },
  {
    type: 'option-row',
    title: 'Entrance Set up (choose 1)',
    items: [
      { title: 'Florals bunches', description: '- Floral entrance', selected: false },
      { title: 'Balloons', description: '- Balloons entrance', selected: false },
    ],
  },
  {
    type: 'choice-row',
    title: 'Choose 1',
    items: [
      {
        title: 'Entry Setup',
        description: '- 1 easel and board\n- Balloon accent on easel',
        selected: false,
      },
      {
        title: 'Centerpieces',
        description: '- Bear balloon Centerpieces',
        selected: false,
      },
    ],
  },
  {
    type: 'option-row',
    title: 'Choose 1',
    items: [
      { title: 'Oh Baby backdrop', selected: false },
      { title: 'Bear backdrop', selected: false },
    ],
  },
  {
    type: 'choice-row',
    title: 'Choose 1',
    items: [
      {
        title: 'Baby corner',
        description: '- Baby Balloon Corner',
        selected: false,
      },
      {
        title: 'Baby Corner',
        description: '- Floral Balloon Corner',
        selected: false,
      },
    ],
  },
]

const DECOR_CONTENT = {
  title: 'Paint & Prosecco',
  price: '$13,600.00',
  intro:
    'An intimate, beautifully styled setup designed for slow conversations, shared laughs, and a hands-on painting experience. Think soft florals, cozy seating, and a table that invites you to sit, sip, and spill everything.',
  keyDetailsTitle: 'Key decor elements',
  keyDetails:
    'An intimate, beautifully styled setup designed for slow conversations, shared laughs, and a hands-on painting experience. Think soft florals, cozy seating, and a table that invites you to sit, sip, and spill everything.',
  accordionSections: [
    {
      title: 'The Nitty-Gritty',
      body: 'Setup timing, load-in, teardown, and venue coordination details are confirmed with you before the event date.',
    },
    {
      title: 'The price you see covers it all',
      body: 'The listed price covers the shared setup items shown here. Optional custom add-ons can be layered on later if needed.',
    },
    {
      title: 'Setup needs',
      body: 'We typically need a clear setup zone, venue access during load-in, and enough space for the low table and backdrop area.',
    },
    {
      title: 'Best placed at',
      body: 'This works best in intimate indoor celebrations, garden dinners, and hosted private gatherings with a dedicated decor corner.',
    },
    {
      title: 'Why we love it',
      body: 'It creates a warm conversation-led experience and gives guests something beautiful and interactive to gather around.',
    },
    {
      title: 'Policies',
      body: 'Custom changes, venue rules, and final guest count should be confirmed in advance so production can stay smooth.',
    },
    {
      title: 'Cancellation Policy',
      body: 'Cancellation timelines affect refund eligibility because sourcing and prep often begin before the event week.',
    },
  ],
}

function createInitialSections() {
  return DECOR_SECTION_TEMPLATE.map(section => ({
    ...section,
    items: section.items.map(item => (typeof item === 'string' ? item : { ...item })),
  }))
}

function createCustomization(id, sections = createInitialSections(), isAddedToCart = false) {
  return { id, sections, isAddedToCart }
}

function cloneSections(sections) {
  return sections.map(section => ({
    ...section,
    items: section.items.map(item => (typeof item === 'string' ? item : { ...item })),
  }))
}

function normalisePackageId(value = '') {
  return String(value).trim().toLowerCase()
}

function buildPackageId(pkg) {
  return normalisePackageId(pkg.documentId ?? pkg.id ?? pkg.title)
}

function isCustomizationComplete(sections) {
  return sections
    .filter(section => section.type === 'option-row' || section.type === 'choice-row')
    .every(section => section.items.some(item => item.selected))
}

function DecorOptionButton({ item, wide = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[6px] border px-3 py-2 text-left transition-all ${
        wide ? 'min-w-[150px] flex-1' : ''
      } ${
        item.selected
          ? 'border-[#977545] bg-[#F8F4ED] text-[#591902]'
          : 'border-[#CDB17E] bg-[#F8F4ED] text-[#CDB17E] opacity-60'
      }`}
    >
      <p className="text-[12px] font-semibold leading-[1.2] text-[#591902]">{item.title}</p>
      {item.description ? (
        <p className="mt-1 whitespace-pre-line text-[11px] leading-[1.35] text-[#591902]">
          {item.description}
        </p>
      ) : null}
    </button>
  )
}

function DecorTextRow({ section }) {
  return (
    <div>
      <p className="text-[13px] font-semibold leading-none text-[#2D2D2D]">{section.title}</p>
      <div className="mt-3 flex flex-wrap items-center gap-y-2">
        {section.items.map((item, index) => (
          <div key={`${section.title}-${item}`} className="flex items-center">
            <p className="text-[12px] leading-none text-[#591902] opacity-50">{item}</p>
            {index < section.items.length - 1 ? (
              <span className="mx-2 text-[12px] leading-none text-[#591902]">|</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function RepeatCustomizationPrompt({ onRepeat, onCreateNew }) {
  return (
    <div className="rounded-[10px] bg-[#E9D9C0] px-4 py-4">
      <p className="text-[14px] font-medium text-[#591902]">Repeat last used customization?</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRepeat}
          className="rounded-full bg-[#591902] px-5 py-2 text-[13px] font-semibold text-white"
        >
          Yes
        </button>
        <button
          type="button"
          onClick={onCreateNew}
          className="rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-[#591902]"
        >
          No, Add new customization
        </button>
      </div>
    </div>
  )
}

function DecorPackageSections({ sections, onSelect }) {
  return (
    <div>
      <p className="text-[16px] font-semibold text-[#2D2D2D]">What&apos;s included:</p>
      <div className="mt-4 space-y-6">
        {sections.map((section, index) => {
          if (section.type === 'text-row') {
            return <DecorTextRow key={`${section.title}-${index}`} section={section} />
          }

          if (section.type === 'choice-row') {
            return (
              <div key={`${section.title}-${index}`}>
                <p className="text-[13px] font-semibold leading-none text-[#2D2D2D]">
                  {section.title}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {section.items.map(item => (
                    <DecorOptionButton
                      key={`${section.title}-${item.title}-${item.description ?? ''}`}
                      item={item}
                      wide
                      onClick={() => onSelect(index, item.title)}
                    />
                  ))}
                </div>
              </div>
            )
          }

          return (
            <div key={`${section.title}-${index}`}>
              <p className="text-[13px] font-semibold leading-none text-[#2D2D2D]">
                {section.title}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {section.items.map(item => (
                  <DecorOptionButton
                    key={`${section.title}-${item.title}-${item.description ?? ''}`}
                    item={item}
                    onClick={() => onSelect(index, item.title)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DecorSinglePackagePage() {
  const [activeCustomizationIndex, setActiveCustomizationIndex] = useState(0)
  const [customizations, setCustomizations] = useState([createCustomization(1)])
  const [showRepeatPrompt, setShowRepeatPrompt] = useState(false)
  const { packageId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { data: packages = [] } = usePackages()

  const packagesData = useMemo(
    () =>
      packages.map((pkg, index) => ({
        ...pkg,
        images: pkg.images?.length
          ? pkg.images
          : (PKG_LOCAL_IMAGES[index % PKG_LOCAL_IMAGES.length] ?? []),
      })),
    [packages]
  )

  const backHref = useMemo(() => {
    const next = new URLSearchParams(searchParams)
    return `/packages/decor${next.toString() ? `?${next.toString()}` : ''}`
  }, [searchParams])

  const pkg = useMemo(
    () => packagesData.find(item => buildPackageId(item) === normalisePackageId(packageId)),
    [packageId, packagesData]
  )

  if (!pkg) {
    return <Navigate to={backHref} replace />
  }

  const activeCustomization = customizations[activeCustomizationIndex]
  const quantity = customizations.length
  const source = pkg.images?.length ? pkg.images : PKG_LOCAL_IMAGES[0]
  const sideImages = Array.from({ length: 5 }).map((_, index) => source[index % source.length])
  const relatedProducts = packagesData
    .filter(item => buildPackageId(item) !== buildPackageId(pkg))
    .slice(0, 3)
    .map(item => ({ ...item, serviceSlug: 'decor' }))
  const isAddToCartDisabled = !isCustomizationComplete(activeCustomization.sections)

  const handleSelect = (sectionIndex, itemTitle) => {
    setCustomizations(current =>
      current.map((customization, customizationIndex) => {
        if (customizationIndex !== activeCustomizationIndex) return customization

        const nextSections = customization.sections.map((section, index) => {
          if (index !== sectionIndex) return section
          if (section.type !== 'option-row' && section.type !== 'choice-row') return section

          const nextItems = section.items.map(item => {
            if (typeof item === 'string') return item

            if (section.type === 'choice-row') {
              if (item.title !== itemTitle) return item
              return { ...item, selected: !item.selected }
            }

            if (item.title !== itemTitle) {
              return { ...item, selected: false }
            }

            return { ...item, selected: true }
          })

          return { ...section, items: nextItems }
        })

        return {
          ...customization,
          sections: nextSections,
          isAddedToCart: false,
        }
      })
    )
  }

  const handleAddToCart = () => {
    if (isAddToCartDisabled) return

    setCustomizations(current =>
      current.map((customization, index) =>
        index === activeCustomizationIndex
          ? { ...customization, isAddedToCart: true }
          : customization
      )
    )
  }

  const handleIncreaseQuantity = () => {
    if (!activeCustomization.isAddedToCart) return
    setShowRepeatPrompt(true)
  }

  const handleRepeatLastCustomization = () => {
    const nextIndex = customizations.length

    setCustomizations(current => {
      const lastCustomization = current[current.length - 1]
      const nextCustomization = createCustomization(
        current.length + 1,
        cloneSections(lastCustomization.sections),
        true
      )

      return [...current, nextCustomization]
    })
    setActiveCustomizationIndex(nextIndex)
    setShowRepeatPrompt(false)
  }

  const handleAddNewCustomization = () => {
    const nextIndex = customizations.length

    setCustomizations(current => [...current, createCustomization(current.length + 1)])
    setActiveCustomizationIndex(nextIndex)
    setShowRepeatPrompt(false)
  }

  const handleDecreaseQuantity = () => {
    if (customizations.length <= 1) return

    setCustomizations(current => current.slice(0, -1))
    setActiveCustomizationIndex(current =>
      Math.max(0, Math.min(current, customizations.length - 2))
    )
    setShowRepeatPrompt(false)
  }

  return (
    <SingleProductPageContent
      backHref={backHref}
      title={DECOR_CONTENT.title}
      price={DECOR_CONTENT.price}
      intro={DECOR_CONTENT.intro}
      keyDetailsTitle={DECOR_CONTENT.keyDetailsTitle}
      keyDetails={DECOR_CONTENT.keyDetails}
      promptContent={
        showRepeatPrompt ? (
          <RepeatCustomizationPrompt
            onRepeat={handleRepeatLastCustomization}
            onCreateNew={handleAddNewCustomization}
          />
        ) : null
      }
      customContent={
        <DecorPackageSections sections={activeCustomization.sections} onSelect={handleSelect} />
      }
      accordionSections={DECOR_CONTENT.accordionSections}
      mainImage={pkg.images?.[0] ?? sideImages[0]}
      sideImages={sideImages}
      relatedProducts={relatedProducts}
      disableAddToCart={isAddToCartDisabled}
      onAddToCart={handleAddToCart}
      quantity={quantity}
      onDecrement={handleDecreaseQuantity}
      onIncrement={handleIncreaseQuantity}
    />
  )
}
