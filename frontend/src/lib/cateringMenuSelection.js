import { CATERING_MENU_FALLBACK } from './cateringMenuFallback'

export function parseChooseHint(hint = '') {
  const text = String(hint ?? '').trim()
  const splitMatch = text.match(/(\d+)\s*\+\s*(\d+)/)
  const chooseMatch = text.match(/choose\s*(\d+)/i)
  const allVegMatch = text.match(/or\s*(\d+)\s*veg/i)

  const vegPick = splitMatch ? Number(splitMatch[1]) : 0
  const nonvegPick = splitMatch ? Number(splitMatch[2]) : 0
  const maxPick = chooseMatch ? Number(chooseMatch[1]) : vegPick + nonvegPick || 1
  const allVegPick = allVegMatch ? Number(allVegMatch[1]) : maxPick

  return {
    minPick: maxPick,
    maxPick,
    vegPick,
    nonvegPick,
    allVegPick,
    allowsAllVeg: Boolean(allVegMatch || (vegPick && !nonvegPick)),
  }
}

export function resolveMenuRowRules(item = {}) {
  const fromHint = parseChooseHint(item.choose_hint)
  const maxPick = Number(item.max_pick) > 0 ? Number(item.max_pick) : fromHint.maxPick
  const vegPick = Number(item.veg_pick) > 0 ? Number(item.veg_pick) : fromHint.vegPick
  const nonvegPick = Number(item.nonveg_pick) > 0 ? Number(item.nonveg_pick) : fromHint.nonvegPick
  const minPick = Number(item.min_pick) > 0 ? Number(item.min_pick) : maxPick

  return {
    minPick,
    maxPick,
    vegPick,
    nonvegPick,
    allVegPick: fromHint.allVegPick || maxPick,
    allowsAllVeg: vegPick > 0 && nonvegPick > 0,
  }
}

export function mapCateringMenuRow(item, index) {
  const rowType = String(item?.row_type ?? 'choose').toLowerCase()
  const rules = resolveMenuRowRules(item)
  const categoryKey = item?.category_key || null
  const categoryKeyExtra = item?.category_key_extra || null

  const base = {
    title: item.title,
    subtitle: item.details || item.choose_hint || undefined,
    selectionKey: `menu-${index}-${item.title}`,
    categoryKey,
    categoryKeyExtra,
    chooseHint: item.choose_hint || undefined,
    rules,
  }

  if (rowType === 'included' || rowType === 'info') {
    return {
      ...base,
      variant: 'included',
      actionLabel: 'Included',
    }
  }

  return {
    ...base,
    variant: 'choose',
    actionLabel: 'Choose',
  }
}

export function getCategoryKeysForRow(row = {}) {
  return [row.categoryKey, row.categoryKeyExtra].filter(Boolean)
}

export function getDishesForMenuRow(row, menuByCategory = {}) {
  const keys = getCategoryKeysForRow(row)
  if (!keys.length) return []

  const dishes = []
  const seen = new Set()

  for (const key of keys) {
    for (const dish of menuByCategory[key] ?? []) {
      const id = `${key}-${dish.name}`
      if (seen.has(id)) continue
      seen.add(id)
      dishes.push({ ...dish, categoryKey: key })
    }
  }

  return dishes.sort(
    (left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0)
  )
}

export function formatSelectionSummary(selectedNames = [], rules = {}) {
  const names = Array.isArray(selectedNames) ? selectedNames.filter(Boolean) : []
  if (!names.length) return ''

  const { maxPick, vegPick, nonvegPick } = rules
  if (vegPick && nonvegPick) {
    return names.join(', ')
  }

  return names.join(', ')
}

export function buildRulesLabel(rules = {}) {
  const { maxPick, vegPick, nonvegPick, allVegPick, allowsAllVeg } = rules

  if (vegPick && nonvegPick) {
    return `Choose ${vegPick} veg + ${nonvegPick} non-veg (or ${allVegPick} veg)`
  }

  if (maxPick === 1) return 'Choose 1 item'
  return `Choose ${maxPick} items`
}

export function parseStoredSelection(value = '') {
  const raw = String(value ?? '').trim()
  if (!raw) return []
  return raw
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
}

export function serializeSelection(names = []) {
  return names.filter(Boolean).join(', ')
}

export function normalizeCateringMenuLibrary(data) {
  const categories = Array.isArray(data?.categories) ? data.categories : []
  const byKey = {}

  for (const category of categories) {
    const key = category?.category_key
    if (!key) continue

    const dishes = (Array.isArray(category.dishes) ? category.dishes : [])
      .map((dish, index) => ({
        name: dish.name,
        description: dish.description || '',
        dietary: dish.dietary || 'veg',
        sort_order: dish.sort_order ?? index,
      }))
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))

    byKey[key] = dishes
  }

  if (!Object.keys(byKey).length) {
    return CATERING_MENU_FALLBACK
  }

  return byKey
}

export function validateMenuSelection(selectedNames = [], dishes = [], rules = {}) {
  const { maxPick, vegPick, nonvegPick } = rules
  const selected = selectedNames.filter(Boolean)

  if (selected.length < maxPick) {
    return { ok: false, message: `Please select ${maxPick} item(s).` }
  }

  if (selected.length > maxPick) {
    return { ok: false, message: `You can select at most ${maxPick} item(s).` }
  }

  if (vegPick && nonvegPick) {
    const dishMap = new Map(dishes.map(dish => [dish.name, dish]))
    const vegCount = selected.filter(name => {
      const dietary = dishMap.get(name)?.dietary
      return dietary === 'veg' || dietary === 'both'
    }).length
    const nonvegCount = selected.filter(name => dishMap.get(name)?.dietary === 'non_veg').length

    const allVegOk = selected.length === maxPick && vegCount === maxPick
    if (!allVegOk && (vegCount !== vegPick || nonvegCount !== nonvegPick)) {
      return {
        ok: false,
        message: `Select ${vegPick} vegetarian and ${nonvegPick} non-vegetarian (or ${maxPick} vegetarian).`,
      }
    }
  }

  return { ok: true, message: '' }
}
