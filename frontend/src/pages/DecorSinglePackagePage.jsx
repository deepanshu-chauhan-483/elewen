import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import SingleProductPageContent from '../components/package-details/SingleProductPageContent'
import { usePackageById, usePackages } from '../hooks/usePackages'
import { useCancellationPolicy } from '../hooks/useCancellationPolicy'
import RepeatCustomizationPrompt from '../components/common/RepeatCustomizationPrompt'
import pkgImg1 from '../assets/images/IMG_3903.jpg'
import pkgImg2 from '../assets/images/IMG_7768.jpg'
import pkgImg3 from '../assets/images/IMG_0749.jpg'
import pkgImg4 from '../assets/images/IMG_0658.jpg'
import pkgImg5 from '../assets/images/IMG_3148.jpg'
import pkgImg6 from '../assets/images/IMG_7025.jpg'
import pkgImg7 from '../assets/images/IMG_8625.png'
import pkgImg8 from '../assets/images/IMG_9814.jpg'
import pkgImg9 from '../assets/images/6f6af066.jpg'
import useCustomization from '../hooks/useCustomization'
import { useCart } from '../hooks/useCart'

const PKG_LOCAL_IMAGES = [
  [pkgImg1, pkgImg1, pkgImg1, pkgImg1, pkgImg1],
  [pkgImg2, pkgImg2, pkgImg2, pkgImg2, pkgImg2],
  [pkgImg7, pkgImg8, pkgImg9, pkgImg1, pkgImg2],
  [pkgImg2, pkgImg4, pkgImg7, pkgImg5, pkgImg9],
  [pkgImg5, pkgImg1, pkgImg8, pkgImg3, pkgImg6],
]

const DECOR_CONTENT = {
  title: 'Paint & Prosecco',
  price: 'Rs13,600.00',
  intro:
    'An intimate, beautifully styled setup designed for slow conversations, shared laughs, and a hands-on painting experience. Think soft florals, cozy seating, and a table that invites you to sit, sip, and spill everything.',
  keyDecorElements:
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

function uniqueValues(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))]
}

function normaliseMediaArray(media) {
  if (!media) return []
  if (Array.isArray(media)) return media
  if (Array.isArray(media?.data)) return media.data
  return []
}

function toAbsoluteStrapiUrl(url) {
  if (!url || typeof url !== 'string') return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const base = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

function cleanText(value = '') {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCaseLabel(value = '') {
  const text = cleanText(value)
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatPrice(value) {
  if (value == null || value === '') return ''

  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) return ''

  return `Rs${numericValue.toLocaleString('en-IN')}`
}

function normalisePackageId(value = '') {
  return String(value).trim().toLowerCase()
}

function buildPackageId(pkg) {
  return normalisePackageId(pkg.documentId ?? pkg.id ?? pkg.title)
}

function getDecorDetailSections(pkg) {
  return (Array.isArray(pkg?.detail_sections) ? pkg.detail_sections : []).filter(
    section =>
      section?.__component === 'package.decorpackages' ||
      Array.isArray(section?.inclustions) ||
      Array.isArray(section?.backdrop_images) ||
      Array.isArray(section?.elements) ||
      section?.theme_name ||
      section?.setup_needs
  )
}

function hasDecorPackageData(pkg) {
  return getDecorDetailSections(pkg).length > 0
}

function buildDecorAccordionSections(pkg) {
  return Array.isArray(pkg?.detail_accordion_sections) && pkg.detail_accordion_sections.length
    ? pkg.detail_accordion_sections
    : DECOR_CONTENT.accordionSections
}

function mergeAccordionSections(baseSections, cancellationPolicy, fallbackCancellationSection) {
  const sections = Array.isArray(baseSections) ? [...baseSections] : []
  const fallbackCancellation =
    sections.find(section => section?.title === 'Cancellation Policy') ??
    fallbackCancellationSection ??
    null
  const withoutCancellation = sections.filter(section => section?.title !== 'Cancellation Policy')

  if (cancellationPolicy?.body) {
    withoutCancellation.push(cancellationPolicy)
  } else if (fallbackCancellation) {
    withoutCancellation.push(fallbackCancellation)
  }

  return withoutCancellation
}

function buildDecorIntro(pkg) {
  if (pkg?.description) return pkg.description

  const blocks = getDecorDetailSections(pkg)
  const blockIntro = blocks
    .flatMap(section => [section?.purpose, section?.key_decor_elements, section?.notes])
    .map(cleanText)
    .find(Boolean)

  return blockIntro || DECOR_CONTENT.intro
}

function buildKeyDecorText(pkg) {
  const blocks = getDecorDetailSections(pkg)
  const keyDecorText = blocks
    .flatMap(section => [section?.key_decor_elements, section?.purpose, section?.notes])
    .map(cleanText)
    .find(Boolean)

  return keyDecorText || DECOR_CONTENT.keyDecorElements
}

function buildDecorMediaGallery(pkg) {
  const backdropImages = getDecorDetailSections(pkg)
    .flatMap(section => normaliseMediaArray(section?.backdrop_images))
    .map(image => {
      if (typeof image === 'string') return toAbsoluteStrapiUrl(image)
      return toAbsoluteStrapiUrl(image?.url)
    })
    .filter(Boolean)

  return uniqueValues([...backdropImages, ...(Array.isArray(pkg?.images) ? pkg.images : [])])
}

function groupItemsByTitle(items = []) {
  const groups = []

  items.forEach(item => {
    const groupTitle = cleanText(item?.group_title)
    const existingGroup = groups.find(group => group.title === groupTitle)

    if (existingGroup) {
      existingGroup.items.push(item)
      return
    }

    groups.push({
      title: groupTitle,
      items: [item],
    })
  })

  return groups
}

function buildChoiceSectionTitle(groupTitle, fallbackTitle) {
  return titleCaseLabel(groupTitle) || fallbackTitle
}

function buildTextSectionTitle(groupTitle, fallbackTitle) {
  return titleCaseLabel(groupTitle) || fallbackTitle
}

function parseChoiceGroupTitle(title = '') {
  const normalizedTitle = cleanText(title)
  if (!normalizedTitle) {
    return {
      key: '',
      label: '',
      isGenericChoose: false,
    }
  }

  const [displayTitle, groupKey] = normalizedTitle.split('::').map(cleanText)

  return {
    key: groupKey || normalizedTitle,
    label: displayTitle || normalizedTitle,
    isGenericChoose: /^choose\s*\d+$/i.test(displayTitle || normalizedTitle),
  }
}

function resolveChoiceGroupMeta(item = {}) {
  const explicitLabel = cleanText(item?.choice_group_label)
  const explicitKey = cleanText(item?.choice_group_key)

  if (explicitLabel || explicitKey) {
    return {
      key: explicitKey || explicitLabel,
      label: explicitLabel || explicitKey,
      isGenericChoose: /^choose\s*\d+$/i.test(explicitLabel || explicitKey),
    }
  }

  return parseChoiceGroupTitle(item?.group_title)
}

function createChoiceItem({ inclusion, element, fallbackTitle }) {
  const inclusionText = cleanText(inclusion?.text)
  const elementTitle = cleanText(element?.title)
  const serviceName = cleanText(element?.service?.name)
  const price = formatPrice(element?.base_price)
  const title =
    inclusionText ||
    (elementTitle && !/^option\s+\d+$/i.test(elementTitle) ? elementTitle : '') ||
    serviceName ||
    fallbackTitle

  const descriptionParts = []

  if (elementTitle && !/^option\s+\d+$/i.test(elementTitle) && elementTitle !== title) {
    descriptionParts.push(elementTitle)
  }

  if (cleanText(element?.description)) {
    descriptionParts.push(cleanText(element.description))
  }

  return {
    title,
    description: descriptionParts.join('\n'),
    price,
    selected: false,
  }
}

function buildChoiceSectionsFromElements(elements = []) {
  return groupItemsByTitle(
    elements.map(element => ({
      ...element,
      group_title: cleanText(element?.service?.name),
    }))
  )
    .map((group, index) => ({
      type: 'choice-row',
      title: group.title ? `${titleCaseLabel(group.title)} (choose 1)` : `Choose ${index + 1}`,
      items: group.items
        .map((element, itemIndex) =>
          createChoiceItem({
            element,
            fallbackTitle: `Option ${itemIndex + 1}`,
          })
        )
        .filter(item => item.title),
      required: true,
    }))
    .filter(section => section.items.length)
}

function buildDecorCustomizationSections(pkg) {
  return getDecorDetailSections(pkg).flatMap(section => {
    const inclusions = Array.isArray(section?.inclustions) ? section.inclustions : []
    const elements = Array.isArray(section?.elements)
      ? section.elements.filter(element => element?.visibility !== false)
      : []
    const choiceItems = inclusions
      .filter(item => item?.is_choice_group)
      .map(item => {
        const parsedGroupTitle = resolveChoiceGroupMeta(item)
        return {
          ...item,
          group_title: parsedGroupTitle.key,
          _display_group_title: parsedGroupTitle.label,
          _is_generic_choose_title: parsedGroupTitle.isGenericChoose,
        }
      })
    const rawChoiceGroups = groupItemsByTitle(choiceItems).map(group => ({
      ...group,
      displayTitle: group.items[0]?._display_group_title || group.title,
      isGenericChoose: Boolean(group.items[0]?._is_generic_choose_title),
    }))
    const textGroups = groupItemsByTitle(inclusions.filter(item => !item?.is_choice_group))
    const choiceGroups = rawChoiceGroups.map(group => ({
      ...group,
      title: group.displayTitle,
    }))

    let elementCursor = 0
    const builtSections = []

    choiceGroups.forEach((group, groupIndex) => {
      const items = group.items
        .map((item, itemIndex) => {
          const element = elements[elementCursor] ?? null

          if (element) {
            elementCursor += 1
          }

          return createChoiceItem({
            inclusion: item,
            element,
            fallbackTitle: `Option ${itemIndex + 1}`,
          })
        })
        .filter(item => item.title)

      if (!items.length) return

      builtSections.push({
        type: 'choice-row',
        title: buildChoiceSectionTitle(group.title, `Choose ${groupIndex + 1}`),
        items,
        required: true,
      })
    })

    if (!choiceGroups.length && elements.length) {
      builtSections.push(...buildChoiceSectionsFromElements(elements))
      elementCursor = elements.length
    }

    textGroups.forEach(group => {
      const items = group.items.map(item => cleanText(item?.text)).filter(Boolean)

      if (!items.length) return

      builtSections.push({
        type: 'text-row',
        title: buildTextSectionTitle(group.title, 'Included details'),
        items,
      })
    })

    const remainingElementRows = elements
      .slice(elementCursor)
      .map(element => cleanText(element?.description) || cleanText(element?.title))
      .filter(Boolean)

    if (remainingElementRows.length) {
      builtSections.push({
        type: 'text-row',
        title: 'Included setup',
        items: remainingElementRows,
      })
    }

    return builtSections
  })
}

function cloneSections(templateSections = []) {
  return templateSections.map(section => ({
    ...section,
    items: (Array.isArray(section.items) ? section.items : []).map(item =>
      typeof item === 'string' ? item : { ...item }
    ),
  }))
}

function serializeSections(sections = []) {
  return JSON.stringify(
    (Array.isArray(sections) ? sections : []).map(section => ({
      type: section.type,
      title: section.title,
      required: section.required !== false,
      items: (Array.isArray(section.items) ? section.items : []).map(item =>
        typeof item === 'string'
          ? item
          : {
              title: item.title,
              description: item.description,
              price: item.price,
              selected: Boolean(item.selected),
            }
      ),
    }))
  )
}

function mergeTemplateSections(templateSections = [], existingSections = []) {
  const existingSectionMap = new Map(
    (Array.isArray(existingSections) ? existingSections : []).map(section => [
      `${section.type}:${section.title}`,
      section,
    ])
  )

  return cloneSections(templateSections).map(section => {
    if (section.type !== 'choice-row') return section

    const existingSection = existingSectionMap.get(`${section.type}:${section.title}`)
    if (!existingSection) return section

    return {
      ...section,
      items: section.items.map(item => {
        if (typeof item === 'string') return item

        const existingItem = (
          Array.isArray(existingSection.items) ? existingSection.items : []
        ).find(candidate => typeof candidate !== 'string' && candidate.title === item.title)

        return {
          ...item,
          selected: Boolean(existingItem?.selected),
        }
      }),
    }
  })
}

function isCustomizationComplete(sections = []) {
  const requiredSections = (Array.isArray(sections) ? sections : []).filter(
    section =>
      section.type === 'choice-row' &&
      section.required !== false &&
      Array.isArray(section.items) &&
      section.items.length
  )

  return (
    requiredSections.length > 0 &&
    requiredSections.every(section =>
      section.items.some(item => typeof item !== 'string' && item.selected)
    )
  )
}

function DecorOptionButton({ item, wide = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[6px] border px-3 py-2 text-left transition-all ${
        wide ? 'min-w-[160px] flex-1' : 'min-w-[92px]'
      } ${
        item.selected
          ? 'border-[#7A3516] bg-[#FBF6ED] text-[#591902]'
          : 'border-[#D8C19A] bg-white text-[#D4A24C]'
      }`}
    >
      <p
        className={`text-[12px] leading-[1.3] ${item.selected ? 'text-[#591902]' : 'text-[#D4A24C]'}`}
        style={{ fontWeight: 600 }}
      >
        {item.title}
      </p>
    </button>
  )
}

function DecorTextRow({ section }) {
  return (
    <div>
      <p
        className="text-[13px] font-semibold leading-none text-[#2D2D2D]"
        style={{ fontWeight: 600 }}
      >
        {section.title}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-y-2">
        {section.items.map((item, index) => (
          <div key={`${section.title}-${item}`} className="flex items-center">
            <p className="text-[12px] leading-none text-[#8A5A2D]">{item}</p>
            {index < section.items.length - 1 ? (
              <span className="mx-2 text-[12px] leading-none text-[#C7A16B]">|</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function DecorMessageField({ value, onChange }) {
  return (
    <div>
      <p
        className="text-[13px] font-semibold leading-none text-[#2D2D2D]"
        style={{ fontWeight: 600 }}
      >
        Please add your text here
      </p>
      <div className="mt-3 rounded-[6px] border border-[#E6D6BF] bg-white px-4 py-3">
        <textarea
          value={value}
          onChange={event => onChange(event.target.value)}
          rows={2}
          placeholder="Write Message"
          className="w-full resize-none border-0 bg-transparent p-0 text-[12px] leading-[1.5] text-[#591902] outline-none placeholder:text-[#9F8F7E]"
        />
      </div>
    </div>
  )
}

function DecorPackageSections({ keyDecorText, sections, message, onMessageChange, onSelect }) {
  return (
    <div>
      {keyDecorText ? (
        <div className="border-b border-[#36402280] pb-4">
          <p className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>
            Key decor elements
          </p>
          <p className="mt-3 text-[13px] leading-[1.7] text-[#8A5A2D]">{keyDecorText}</p>
        </div>
      ) : null}

      <p className={`text-[16px] font-semibold text-[#2D2D2D] ${keyDecorText ? 'pt-5' : ''}`}>
        What&apos;s included:
      </p>

      <div className="mt-4 space-y-6">
        {sections.length ? (
          sections.map((section, index) => {
            if (section.type === 'text-row') {
              return <DecorTextRow key={`${section.title}-${index}`} section={section} />
            }

            const useWideCards = section.items.some(
              item => typeof item !== 'string' && item.description
            )

            return (
              <div key={`${section.title}-${index}`}>
                <p
                  className="text-[13px] font-semibold leading-none text-[#2D2D2D]"
                  style={{ fontWeight: 600 }}
                >
                  {section.title}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {section.items.map(item => (
                    <DecorOptionButton
                      key={`${section.title}-${item.title}-${item.description ?? ''}`}
                      item={item}
                      wide={useWideCards}
                      onClick={() => onSelect(index, item.title)}
                    />
                  ))}
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-[12px] leading-[1.6] text-[#8A5A2D]">
            Customization options will appear here once they are added in Strapi.
          </p>
        )}

        <DecorMessageField value={message} onChange={onMessageChange} />
      </div>
    </div>
  )
}

export default function DecorSinglePackagePage() {
  const navigate = useNavigate()
  const { packageId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { data: packages = [] } = usePackages()
  const { data: packageDetails, isLoading: isPackageLoading } = usePackageById(packageId)
  const { data: cancellationPolicy } = useCancellationPolicy()
  const { addPackage } = useCart()
  const {
    customizations,
    activeCustomization,
    activeIndex,
    showRepeatPrompt,
    handleAddToCart,
    handleIncrease,
    handleRepeat,
    handleNew,
    handleDecrease,
    setCustomizations,
  } = useCustomization({
    createInitialData: () => ({
      sections: [],
      message: '',
    }),
  })
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [addToCartMessage, setAddToCartMessage] = useState('')

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
    () =>
      packageDetails
        ? {
            ...packageDetails,
            images: packageDetails.images?.length
              ? packageDetails.images
              : (PKG_LOCAL_IMAGES[packageDetails._index % PKG_LOCAL_IMAGES.length] ??
                PKG_LOCAL_IMAGES[0]),
          }
        : packagesData.find(item => buildPackageId(item) === normalisePackageId(packageId)),
    [packageDetails, packageId, packagesData]
  )

  const sectionTemplate = useMemo(() => buildDecorCustomizationSections(pkg), [pkg])
  const sectionTemplateSignature = useMemo(
    () => serializeSections(sectionTemplate),
    [sectionTemplate]
  )

  useEffect(() => {
    if (!pkg) return

    setCustomizations(prev => {
      let hasChanges = false

      const nextCustomizations = prev.map(customization => {
        const currentSections = customization?.data?.sections ?? []
        const nextSections = mergeTemplateSections(sectionTemplate, currentSections)

        if (serializeSections(nextSections) === serializeSections(currentSections)) {
          return customization
        }

        hasChanges = true

        return {
          ...customization,
          data: {
            ...customization.data,
            sections: nextSections,
          },
        }
      })

      return hasChanges ? nextCustomizations : prev
    })
  }, [pkg, sectionTemplate, sectionTemplateSignature, setCustomizations])

  if (isPackageLoading) {
    return null
  }

  if (!pkg) {
    return <Navigate to={backHref} replace />
  }

  const galleryImages = buildDecorMediaGallery(pkg)
  const sourceImages = galleryImages.length
    ? galleryImages
    : pkg.images?.length
      ? pkg.images
      : PKG_LOCAL_IMAGES[0]
  const sideImages = Array.from({ length: 5 }).map(
    (_, index) => sourceImages[index % sourceImages.length]
  )
  const relatedProducts = packagesData
    .filter(item => hasDecorPackageData(item) && buildPackageId(item) !== buildPackageId(pkg))
    .slice(0, 3)
    .map(item => ({ ...item, serviceSlug: 'decor' }))
  const sections = activeCustomization?.data?.sections ?? []
  const quantity = customizations.length
  const message = activeCustomization?.data?.message ?? ''

  const handleSelect = (sectionIndex, itemTitle) => {
    setAddToCartMessage('')

    setCustomizations(prev =>
      prev.map((customization, customizationIndex) => {
        if (customizationIndex !== activeIndex) return customization

        const nextSections = (customization?.data?.sections ?? []).map((section, index) => {
          if (index !== sectionIndex || section.type !== 'choice-row') return section

          return {
            ...section,
            items: section.items.map(item =>
              typeof item === 'string' ? item : { ...item, selected: item.title === itemTitle }
            ),
          }
        })

        return {
          ...customization,
          data: {
            ...customization.data,
            sections: nextSections,
          },
          isAddedToCart: false,
        }
      })
    )
  }

  const handleMessageChange = value => {
    setCustomizations(prev =>
      prev.map((customization, customizationIndex) =>
        customizationIndex === activeIndex
          ? {
              ...customization,
              data: {
                ...customization.data,
                message: value,
              },
            }
          : customization
      )
    )
  }

  const handlePackageAddToCart = async () => {
    setAddToCartMessage('')

    if (!pkg?.id) {
      setAddToCartMessage('This package is missing its cart ID. Please refresh and try again.')
      return
    }

    setIsAddingToCart(true)

    try {
      await addPackage({ packageId: Number(pkg.id), quantity: 1 })
      handleAddToCart()
      setAddToCartMessage('Added to cart.')
    } catch (err) {
      if (err.code === 'AUTH_REQUIRED' || err.message === 'AUTH_REQUIRED') {
        navigate('/login')
        return
      }

      console.error('[cart-click] decor add failed', err)
      setAddToCartMessage('Could not add this package to cart. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const isDisabled = !isCustomizationComplete(sections) || isAddingToCart
  const packageTitle =
    pkg.title || getDecorDetailSections(pkg)[0]?.theme_name || DECOR_CONTENT.title
  const packagePrice = pkg.price || DECOR_CONTENT.price
  const packageIntro = buildDecorIntro(pkg)
  const keyDecorText = buildKeyDecorText(pkg)
  const accordionSections = mergeAccordionSections(
    buildDecorAccordionSections(pkg),
    cancellationPolicy,
    DECOR_CONTENT.accordionSections.find(section => section.title === 'Cancellation Policy')
  )

  return (
    <SingleProductPageContent
      title={packageTitle}
      price={packagePrice}
      intro={packageIntro}
      promptContent={
        showRepeatPrompt && (
          <RepeatCustomizationPrompt onRepeat={handleRepeat} onCreateNew={handleNew} />
        )
      }
      customContent={
        <DecorPackageSections
          keyDecorText={keyDecorText}
          sections={sections}
          message={message}
          onMessageChange={handleMessageChange}
          onSelect={handleSelect}
        />
      }
      accordionSections={accordionSections}
      mainImage={sourceImages[0] ?? sideImages[0]}
      sideImages={sideImages}
      relatedProducts={relatedProducts}
      addToCartLabel={isAddingToCart ? 'Adding...' : 'Add to cart'}
      addToCartMessage={addToCartMessage}
      disableAddToCart={isDisabled}
      onAddToCart={handlePackageAddToCart}
      quantity={quantity}
      onDecrement={handleDecrease}
      onIncrement={handleIncrease}
    />
  )
}
