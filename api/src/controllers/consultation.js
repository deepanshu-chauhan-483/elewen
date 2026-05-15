import { strapiPost, strapiServerPost } from '../lib/strapi.js'

// ─── POST /consultations ───────────────────────────────────────────────────────
// Stores a "Book a Consultation" enquiry in the shared planner_leads Strapi
// collection using lead_type = 'consultation'.
export const createConsultation = async (req, res, next) => {
  try {
    const {
      full_name,
      email,
      phone,
      event_type,
      event_date,
      guest_count,
      city,
      budget_range,
      vision_notes,
    } = req.body

    const guestCountInt = guest_count
      ? parseInt(String(guest_count).split('-')[0], 10) || null
      : null

    const payload = {
      data: {
        lead_type: 'consultation',
        full_name,
        email,
        phone,
        event_type: event_type || null,
        event_date: event_date || null,
        guest_count: guestCountInt,
        city: city || null,
        budget_range: budget_range || null,
        vision_notes: vision_notes || null,
        planner_lead_status: 'new',
      },
    }

    try {
      await strapiServerPost('/api/planner-leads', payload)
    } catch (err) {
      const isCredentialError =
        (err?.status === 401 || err?.status === 403) &&
        /missing or invalid credentials/i.test(String(err?.message ?? ''))

      if (!isCredentialError) {
        throw err
      }

      await strapiPost('/planner-leads', payload)
    }

    res.status(201).json({ ok: true })
  } catch (err) {
    next(err)
  }
}
