import { CATERING_MENU_FALLBACK } from './cateringMenuFallback'

function pickHintText(item = {}) {
  return [item?.choose_hint, item?.chooseHint, item?.title, item?.details, item?.subtitle]
    .filter(Boolean)
    .join(' ')
}

export function inferCategoryKeyFromTitle(title = '') {
  const text = String(title ?? '').toLowerCase()

  if (/dessert/.test(text)) return 'dessert'
  if (/starter/.test(text)) return 'starters'
  if (/main\s*course|\bmains\b/.test(text)) return 'main_course_veg'
  if (/accompaniment|rotis|rice.*bread|bread.*rice/.test(text)) return 'rotis_and_rice'
  if (/pre[-\s]?plated/.test(text)) return 'pre_plated'
  if (/\bsoup\b/.test(text)) return 'soup'
  if (/live\s*station/.test(text)) return 'live_stations'
  if (/\bsalad\b/.test(text)) return 'salad'
  if (/raita/.test(text)) return 'raita'

  return null
}

export function inferCategoryKeyExtraFromTitle(title = '', rules = {}) {
  const text = String(title ?? '').toLowerCase()
  const maxPick = Number(rules?.maxPick ?? 0)
  const hasSplitHint = /(\d+)\s*\+\s*(\d+)/.test(text) || /2\s*\+\s*2/.test(text)

  if (/starter/.test(text) && (maxPick >= 4 || hasSplitHint || rules?.vegPick > 0)) {
    return 'starters_non_veg'
  }

  if (
    /main\s*course|\bmains\b/.test(text) &&
    (maxPick >= 4 || hasSplitHint || rules?.vegPick > 0)
  ) {
    return 'main_course_non_veg'
  }

  return null
}

function applyDefaultSplitPickRules(rules = {}, categoryKey, categoryKeyExtra) {
  const maxPick = Number(rules.maxPick ?? 0)
  if (!maxPick || rules.vegPick || rules.nonvegPick) return rules

  if (categoryKey === 'starters' && categoryKeyExtra === 'starters_non_veg' && maxPick >= 4) {
    return {
      ...rules,
      vegPick: 2,
      nonvegPick: 2,
      allVegPick: maxPick,
      allowsAllVeg: true,
    }
  }

  if (
    categoryKey === 'main_course_veg' &&
    categoryKeyExtra === 'main_course_non_veg' &&
    maxPick >= 4
  ) {
    return {
      ...rules,
      vegPick: 2,
      nonvegPick: 2,
      allVegPick: maxPick,
      allowsAllVeg: true,
    }
  }

  return rules
}

export function mergeMenuLibraryWithFallback(byKey = {}) {
  const merged = { ...CATERING_MENU_FALLBACK }

  for (const [key, dishes] of Object.entries(byKey)) {
    if (Array.isArray(dishes) && dishes.length) merged[key] = dishes
  }

  return merged
}

export function parseChooseHint(hint = '') {
  const text = String(hint ?? '').trim()
  const splitMatch = text.match(/(\d+)\s*\+\s*(\d+)/)
  const allVegMatch = text.match(/or\s*(\d+)\s*veg/i)

  const vegPick = splitMatch ? Number(splitMatch[1]) : 0
  const nonvegPick = splitMatch ? Number(splitMatch[2]) : 0
  const splitTotal = vegPick + nonvegPick
  const allVegPick = allVegMatch ? Number(allVegMatch[1]) : 0

  if (splitMatch) {
    const maxPick = allVegPick > 0 ? Math.max(splitTotal, allVegPick) : splitTotal
    return {
      minPick: maxPick,
      maxPick,
      vegPick,
      nonvegPick,
      allVegPick: allVegPick || maxPick,
      allowsAllVeg: Boolean(allVegMatch),
    }
  }

  if (allVegPick > 0) {
    return {
      minPick: allVegPick,
      maxPick: allVegPick,
      vegPick: allVegPick,
      nonvegPick: 0,
      allVegPick,
      allowsAllVeg: true,
    }
  }

  const chooseMatch = text.match(/choose\s*(\d+)/i)
  const maxPick = chooseMatch ? Number(chooseMatch[1]) : 1

  return {
    minPick: maxPick,
    maxPick,
    vegPick: 0,
    nonvegPick: 0,
    allVegPick: maxPick,
    allowsAllVeg: false,
  }
}

export function resolveMenuRowRules(item = {}) {
  const hintText = pickHintText(item)
  const fromHint = parseChooseHint(hintText)
  let maxPick = Number(item.max_pick) > 0 ? Number(item.max_pick) : fromHint.maxPick
  const vegPick = Number(item.veg_pick) > 0 ? Number(item.veg_pick) : fromHint.vegPick
  const nonvegPick = Number(item.nonveg_pick) > 0 ? Number(item.nonveg_pick) : fromHint.nonvegPick
  const splitTotal = vegPick + nonvegPick
  const allVegPick = fromHint.allVegPick || maxPick || 1

  if (vegPick > 0 && nonvegPick > 0) {
    maxPick = Math.max(maxPick, splitTotal, fromHint.allowsAllVeg ? allVegPick : splitTotal)
  }

  const resolvedMaxPick = maxPick > 0 ? maxPick : 1
  const minPick = Number(item.min_pick) > 0 ? Number(item.min_pick) : resolvedMaxPick

  return {
    minPick,
    maxPick: resolvedMaxPick,
    vegPick,
    nonvegPick,
    allVegPick,
    allowsAllVeg:
      fromHint.allowsAllVeg || (vegPick > 0 && nonvegPick > 0 && allVegPick > splitTotal),
  }
}

export function inferMenuItemMeta(item = {}) {
  const title = String(item?.title ?? '').trim()
  let rules = resolveMenuRowRules(item)

  let categoryKey = item?.category_key || item?.categoryKey || null
  let categoryKeyExtra = item?.category_key_extra || item?.categoryKeyExtra || null

  if (!categoryKey) categoryKey = inferCategoryKeyFromTitle(title)
  if (!categoryKeyExtra) categoryKeyExtra = inferCategoryKeyExtraFromTitle(title, rules)

  rules = applyDefaultSplitPickRules(rules, categoryKey, categoryKeyExtra)

  return {
    categoryKey,
    categoryKeyExtra,
    rules,
    chooseHint: item?.choose_hint || item?.chooseHint || pickHintText(item) || undefined,
  }
}

export function ensureMenuRow(row) {
  if (!row) return null

  if (row.categoryKey && Number(row.rules?.maxPick) > 0) {
    return row
  }

  const meta = inferMenuItemMeta({
    title: row.title,
    details: row.subtitle,
    choose_hint: row.chooseHint ?? row.choose_hint,
    category_key: row.categoryKey ?? row.category_key,
    category_key_extra: row.categoryKeyExtra ?? row.category_key_extra,
    row_type: row.variant === 'included' ? 'included' : (row.row_type ?? 'choose'),
    max_pick: row.rules?.maxPick ?? row.max_pick,
    veg_pick: row.rules?.vegPick ?? row.veg_pick,
    nonveg_pick: row.rules?.nonvegPick ?? row.nonveg_pick,
  })

  return {
    ...row,
    categoryKey: meta.categoryKey,
    categoryKeyExtra: meta.categoryKeyExtra,
    rules: meta.rules,
    chooseHint: meta.chooseHint ?? row.chooseHint,
  }
}

export function mapCateringMenuRow(item, index) {
  const rowType = String(item?.row_type ?? item?.variant ?? 'choose').toLowerCase()
  const { categoryKey, categoryKeyExtra, rules, chooseHint } = inferMenuItemMeta(item)

  const base = {
    title: item.title,
    subtitle: item.details || item.choose_hint || undefined,
    selectionKey: item.selectionKey ?? `menu-${index}-${item.title}`,
    categoryKey,
    categoryKeyExtra,
    chooseHint,
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
  const resolvedRow = ensureMenuRow(row) ?? row
  const keys = getCategoryKeysForRow(resolvedRow)
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

  return dishes.sort((left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0))
}

export function formatSelectionSummary(selectedNames = [], rules = {}) {
  const names = Array.isArray(selectedNames) ? selectedNames.filter(Boolean) : []
  if (!names.length) return ''

  const { vegPick, nonvegPick } = rules
  if (vegPick && nonvegPick) {
    return names.join(', ')
  }

  return names.join(', ')
}

export function buildRulesLabel(rules = {}) {
  const { vegPick, nonvegPick, allVegPick } = rules
  const maxPick = Number(rules.maxPick) > 0 ? Number(rules.maxPick) : 1

  if (vegPick && nonvegPick) {
    return `Choose ${vegPick} veg + ${nonvegPick} non-veg (or ${allVegPick || maxPick} veg)`
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

  return mergeMenuLibraryWithFallback(byKey)
}

function countVegSelections(selectedNames = [], dishMap = new Map()) {
  return selectedNames.filter(name => {
    const dietary = dishMap.get(name)?.dietary
    return dietary === 'veg' || dietary === 'both'
  }).length
}

function countNonvegSelections(selectedNames = [], dishMap = new Map()) {
  return selectedNames.filter(name => dishMap.get(name)?.dietary === 'non_veg').length
}

export function isAllVegSelectionMode(selectedNames = [], dishes = [], rules = {}) {
  const { vegPick, nonvegPick, allowsAllVeg } = rules
  if (!allowsAllVeg || !vegPick || !nonvegPick) return false

  const dishMap = new Map(dishes.map(dish => [dish.name, dish]))
  const nonvegCount = countNonvegSelections(selectedNames, dishMap)
  if (nonvegCount > 0) return false

  return countVegSelections(selectedNames, dishMap) > vegPick
}

export function canSelectMenuDish(name, selectedNames = [], dishes = [], rules = {}) {
  const dish = dishes.find(item => item.name === name)
  if (!dish) return false
  if (selectedNames.includes(name)) return true

  const { maxPick, vegPick, nonvegPick, allVegPick, allowsAllVeg } = rules
  if (selectedNames.length >= maxPick) return false

  if (!vegPick || !nonvegPick) return true

  const dishMap = new Map(dishes.map(item => [item.name, item]))
  const vegCount = countVegSelections(selectedNames, dishMap)
  const nonvegCount = countNonvegSelections(selectedNames, dishMap)
  const isVeg = dish.dietary === 'veg' || dish.dietary === 'both'
  const allVegMode = isAllVegSelectionMode(selectedNames, dishes, rules)
  const vegLimit = allVegPick || maxPick

  if (isVeg) {
    if (allVegMode) return vegCount < vegLimit
    if (nonvegCount > 0) return vegCount < vegPick
    if (vegCount < vegPick) return true
    if (allowsAllVeg) return vegCount < vegLimit
    return false
  }

  if (allVegMode) return false
  return nonvegCount < nonvegPick
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
    const vegCount = countVegSelections(selected, dishMap)
    const nonvegCount = countNonvegSelections(selected, dishMap)

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
