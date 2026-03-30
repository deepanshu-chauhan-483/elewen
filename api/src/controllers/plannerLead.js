import { strapiServerPost } from '../lib/strapi.js'

// ─── POST /planner-leads ───────────────────────────────────────────────────────
export const createPlannerLead = async (req, res, next) => {
  try {
    const {
      full_name,
      email,
      phone,
      city,
      event_type,
      event_date,
      guest_count,
      venue_type,
      support_types,
      vision_notes,
    } = req.body

    if (!full_name || !email || !phone || !city || !event_type || !guest_count || !venue_type) {
      return res.status(400).json({
        error: 'Required fields missing',
        fields: {
          ...(!full_name && { full_name: 'Required' }),
          ...(!email && { email: 'Required' }),
          ...(!phone && { phone: 'Required' }),
          ...(!city && { city: 'Required' }),
          ...(!event_type && { event_type: 'Required' }),
          ...(!guest_count && { guest_count: 'Required' }),
          ...(!venue_type && { venue_type: 'Required' }),
        },
      })
    }

    // guest_count from form is a range string e.g. "50-100" — store the lower bound as integer
    const guestCountInt = parseInt(String(guest_count).split('-')[0], 10) || null

    await strapiServerPost('/api/planner-leads', {
      data: {
        lead_type: 'planner',
        full_name,
        email,
        phone,
        city,
        event_type,
        event_date: event_date || null,
        guest_count: guestCountInt,
        venue_type,
        support_types: Array.isArray(support_types) ? support_types : [],
        vision_notes: vision_notes || null,
        planner_lead_status: 'new',
      },
    })

    res.status(201).json({ ok: true })
  } catch (err) {
    next(err)
  }
}
