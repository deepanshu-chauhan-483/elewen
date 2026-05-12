import { strapiServerGet } from '../lib/strapi.js'

// ─── Helper: parse threshold strings like ">100", "50-150", "<=200" ──────────
const matchesThreshold = (value, count) => {
  if (!value || !count) return false
  const v = value.trim()
  if (v.startsWith('>=')) return count >= parseInt(v.slice(2))
  if (v.startsWith('<=')) return count <= parseInt(v.slice(2))
  if (v.startsWith('>')) return count > parseInt(v.slice(1))
  if (v.startsWith('<')) return count < parseInt(v.slice(1))
  if (v.includes('-')) {
    const [min, max] = v.split('-').map(Number)
    return count >= min && count <= max
  }
  return count === parseInt(v)
}

// ─── Helper: build Strapi filter query params from wizard answers ─────────────
// answers: { theme: "floral", budget_level: "premium", guest_count: 120 }
// steps:   the wizard_steps array from the service category
// Returns a query string fragment like:
//   &filters[themes][slug][$eq]=floral&filters[budget_level][slug][$eq]=premium
const buildFilterParams = (answers, steps) => {
  const parts = []

  for (const step of steps) {
    const answer = answers[step.id]
    if (!answer || !step.maps_to) continue

    const m = step.maps_to

    if (m.type === 'guest_range') {
      // special case: guest count clips against min_guests / max_guests
      const count = parseInt(answer, 10)
      if (!isNaN(count)) {
        parts.push(`filters[${m.min_field}][$lte]=${count}`)
        parts.push(`filters[${m.max_field}][$gte]=${count}`)
      }
      continue
    }

    // standard case: dot-notation relation path + operator
    // e.g. maps_to = { strapi_filter: "themes.slug", operator: "$eq" }
    const filterPath = m.strapi_filter
      .split('.')
      .map(seg => `[${seg}]`)
      .join('')

    const op = m.operator || '$eq'
    const encoded = encodeURIComponent(answer)
    parts.push(`filters${filterPath}[${op}]=${encoded}`)
  }

  return parts.join('&')
}

// ─── GET /packages/wizard-steps/:serviceCategoryId ────────────────────────────
// Returns the wizard_steps array for the given service category,
// with each step's source (themes / budget_levels) pre-fetched and injected
// as an `options` array so the frontend can render immediately.
export const getWizardSteps = async (req, res, next) => {
  try {
    const { serviceCategoryId } = req.params

    const { data: cats } = await strapiServerGet(
      `/api/service-categories?filters[id][$eq]=${serviceCategoryId}`
    )
    const cat = cats?.[0]
    if (!cat) return res.status(404).json({ error: 'Service category not found' })

    const steps = Array.isArray(cat.wizard_steps) ? cat.wizard_steps : []

    // Resolve each step's source into an options array
    const resolved = await Promise.all(
      steps.map(async step => {
        if (!step.source) return step

        try {
          const filter = step.source_filter ? `&${step.source_filter}` : ''
          const { data: items } = await strapiServerGet(
            `/api/${step.source}?filters[is_active][$eq]=true${filter}`
          )
          return {
            ...step,
            options: (items || []).map(item => ({
              id: item.id,
              label: item.name,
              slug: item.slug,
              preview_image: item.preview_image ?? null,
            })),
          }
        } catch {
          return { ...step, options: [] }
        }
      })
    )

    res.json({
      serviceCategoryId,
      categoryName: cat.name,
      steps: resolved,
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /packages/wizard-filter ─────────────────────────────────────────────
// Body: {
//   eventId,               — required, Strapi event ID
//   serviceCategoryId,     — required, Strapi service category ID
//   answers: {             — keyed by step id, values are slugs/strings
//     theme: "floral",
//     budget_level: "premium",
//     guest_count: 120
//   },
//   page: 1,               — optional, default 1
//   pageSize: 9            — optional, default 9
// }
// Returns: { packages[], pagination }
export const wizardFilter = async (req, res, next) => {
  try {
    const { eventId, serviceCategoryId, answers = {}, page = 1, pageSize = 9 } = req.body

    if (!eventId) return res.status(400).json({ error: 'eventId is required' })
    if (!serviceCategoryId) return res.status(400).json({ error: 'serviceCategoryId is required' })

    // Fetch service category to get wizard_steps (for maps_to config)
    const { data: cats } = await strapiServerGet(
      `/api/service-categories?filters[id][$eq]=${serviceCategoryId}`
    )
    const cat = cats?.[0]
    if (!cat) return res.status(404).json({ error: 'Service category not found' })

    const steps = Array.isArray(cat.wizard_steps) ? cat.wizard_steps : []

    // Build Strapi filter string from wizard answers
    const answerFilters = buildFilterParams(answers, steps)

    // Always filter by event and service category
    const baseFilters = [
      `filters[events][id][$eq]=${eventId}`,
      `filters[service_categories][id][$eq]=${serviceCategoryId}`,
      `filters[is_active][$eq]=true`,
      `filters[visibility][$eq]=true`,
    ].join('&')

    const populate = [
      'populate[0]=images',
      'populate[1]=budget_level',
      'populate[2]=service_categories',
      'populate[3]=elements',
      'populate[4]=addons',
      'populate[5]=pricing_rules',
    ].join('&')

    const pagination = `pagination[page]=${page}&pagination[pageSize]=${pageSize}`

    const qs = [baseFilters, answerFilters, populate, pagination].filter(Boolean).join('&')

    const result = await strapiServerGet(`/api/packages?${qs}`)

    res.json({
      packages: result.data || [],
      pagination: result.meta?.pagination || {},
      appliedAnswers: answers,
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /packages/calculate-price ───────────────────────────────────────────
// Body: { packageId, guestCount }
// Returns: { base_price, adjusted_price, breakdown[] }
export const calculatePrice = async (req, res, next) => {
  try {
    const { packageId, guestCount } = req.body

    if (!packageId) return res.status(400).json({ error: 'packageId is required' })

    const { data: pkgs } = await strapiServerGet(
      `/api/packages?filters[id][$eq]=${packageId}&populate[0]=pricing_rules&populate[1]=elements&populate[2]=addons&populate[3]=budget_level`
    )
    const pkg = pkgs?.[0]
    if (!pkg) return res.status(404).json({ error: 'Package not found' })

    const basePrice = Number(pkg.base_price)
    const count = guestCount ? parseInt(guestCount, 10) : pkg.min_guests || 0

    let adjustedPrice = basePrice
    const breakdown = []

    for (const rule of pkg.pricing_rules || []) {
      if (rule.rule_type !== 'guest_count') continue
      if (!matchesThreshold(rule.value, count)) continue

      const modifier = Number(rule.modifier_value)
      if (rule.modifier_type === 'percentage') {
        const delta = (basePrice * modifier) / 100
        adjustedPrice += delta
        breakdown.push({
          rule: rule.value,
          type: 'percentage',
          modifier,
          delta: delta.toFixed(2),
          description: `${modifier}% adjustment for ${count} guests`,
        })
      } else {
        adjustedPrice += modifier
        breakdown.push({
          rule: rule.value,
          type: 'flat_amount',
          modifier,
          delta: modifier.toFixed(2),
          description: `Flat ₹${modifier} adjustment for ${count} guests`,
        })
      }
    }

    res.json({
      packageId,
      guestCount: count,
      base_price: basePrice.toFixed(2),
      adjusted_price: Math.max(0, adjustedPrice).toFixed(2),
      breakdown,
      currency: 'INR',
    })
  } catch (err) {
    next(err)
  }
}
