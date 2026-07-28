/** Level card copy for catering / bartending flows only (not decor). */
export const CATERING_LEVEL_DESCRIPTIONS = {
  'level-1':
    'This level caters to people who want good quality food with classic dishes but dont need waiters, cutlery etc. | Sea food is not included in this category of menu',
  'level-2':
    'This level caters to people who want good quality food with classic dishes and need waiters to service. Sea food & cutlery is not included in this category of menu',
  'level-3':
    'Trained chefs, better ingridents, add on services, better presentation style, overall enhanced experience, live stations',
}

export const BARTENDING_LEVEL_DESCRIPTIONS = {
  'level-1': 'Professional, smooth bar service for intimate gatherings and house parties.',
  'level-2': 'Elevate your event with a cocktail-focused bar experience.',
  'level-3': 'A high-end bar experience designed to impress your guests.',
}

export function applyServiceLevelDescriptions(levels, descriptionMap = {}) {
  if (!Array.isArray(levels)) return []

  return levels.map(level => {
    const slug = String(level?.slug ?? '')
      .trim()
      .toLowerCase()
    const description = descriptionMap[slug]
    if (!description) return level
    return { ...level, description }
  })
}
