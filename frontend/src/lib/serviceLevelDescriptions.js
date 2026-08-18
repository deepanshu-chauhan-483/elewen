/** Level card copy for catering / bartending flows only (not decor). */
export const CATERING_LEVEL_DESCRIPTIONS = {
  'level-1':
    'This level caters to people who want good quality food with classic dishes but dont need waiters, cutlery etc. Sea food is not included in this category of menu',
  'level-2':
    'This level caters to people who want good quality food with classic dishes and need waiters to serve. Sea food and dining cutlery not included in this category of menu',
  'level-3':
    'Trained chefs, better ingridents, add on services, better presentation style, overall enhanced experience, live stations',
}

/** Per-person starting prices shown on catering level cards (min across official catalog). */
export const CATERING_LEVEL_STARTING_PRICES = {
  'level-1': 1100,
  'level-2': 1500,
  'level-3': 1195,
}

export const BARTENDING_LEVEL_DESCRIPTIONS = {
  'level-1': 'Professional, smooth bar service for intimate gatherings and house parties.',
  'level-2': 'Elevate your event with a cocktail-focused bar experience.',
  'level-3': 'A high-end bar experience designed to impress your guests.',
}

export function applyServiceLevelDescriptions(levels, descriptionMap = {}, priceMap = {}) {
  if (!Array.isArray(levels)) return []

  return levels.map(level => {
    const slug = String(level?.slug ?? '')
      .trim()
      .toLowerCase()
    const description = descriptionMap[slug]
    const startingPrice = priceMap[slug]
    const startingPriceLabel =
      startingPrice != null
        ? `Starting from ₹${Number(startingPrice).toLocaleString('en-IN')} per person`
        : null

    const next = { ...level }
    if (description) next.description = description
    if (startingPriceLabel) next.startingPriceLabel = startingPriceLabel
    return next
  })
}
