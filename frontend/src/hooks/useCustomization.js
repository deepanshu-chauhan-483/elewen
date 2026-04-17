import { useState } from 'react'

function defaultCreateInitialData() {
  return {}
}

function defaultCloneData(data) {
  return JSON.parse(JSON.stringify(data ?? {}))
}

export default function useCustomization({
  createInitialData = defaultCreateInitialData,
  cloneData = defaultCloneData,
} = {}) {
  const [customizations, setCustomizations] = useState(() => [
    { id: 1, data: createInitialData(), isAddedToCart: false },
  ])
  const [activeIndex, setActiveIndex] = useState(0)
  const [showRepeatPrompt, setShowRepeatPrompt] = useState(false)

  const activeCustomization = customizations[activeIndex]

  const handleAddToCart = () => {
    setCustomizations(prev =>
      prev.map((c, i) => (i === activeIndex ? { ...c, isAddedToCart: true } : c))
    )
  }

  const handleIncrease = () => {
    if (!activeCustomization.isAddedToCart) return
    setShowRepeatPrompt(true)
  }

  const handleRepeat = () => {
    const sourceData = activeCustomization?.data ?? createInitialData()

    setCustomizations(prev => [
      ...prev,
      {
        id: prev.length + 1,
        data: cloneData(sourceData),
        isAddedToCart: true,
      },
    ])

    setActiveIndex(customizations.length)
    setShowRepeatPrompt(false)
  }

  const handleNew = () => {
    setCustomizations(prev => [
      ...prev,
      {
        id: prev.length + 1,
        data: createInitialData(),
        isAddedToCart: false,
      },
    ])

    setActiveIndex(customizations.length)
    setShowRepeatPrompt(false)
  }

  const handleDecrease = () => {
    if (customizations.length <= 1) return

    setCustomizations(prev => prev.slice(0, -1))
    setActiveIndex(prev => Math.max(0, prev - 1))
    setShowRepeatPrompt(false)
  }

  return {
    customizations,
    activeCustomization,
    activeIndex,
    showRepeatPrompt,
    setShowRepeatPrompt,
    handleAddToCart,
    handleIncrease,
    handleRepeat,
    handleNew,
    handleDecrease,
    setCustomizations,
  }
}
