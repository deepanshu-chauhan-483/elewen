import { strapiPost, strapiServerPost } from '../lib/strapi.js'

// POST /contact
// Reuses the shared planner_leads collection for contact-us enquiries so we
// can store submissions without changing the existing frontend UI.
export const createContact = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body

    if (!firstName || !lastName || !email || !phone || !message) {
      return res.status(400).json({
        error: 'Required fields missing',
        fields: {
          ...(!firstName && { firstName: 'Required' }),
          ...(!lastName && { lastName: 'Required' }),
          ...(!email && { email: 'Required' }),
          ...(!phone && { phone: 'Required' }),
          ...(!message && { message: 'Required' }),
        },
      })
    }

    const payload = {
      data: {
        lead_type: 'contact us',
        full_name: `${String(firstName).trim()} ${String(lastName).trim()}`.trim(),
        email: String(email).trim(),
        phone: String(phone).trim(),
        event_type: 'Contact Us',
        vision_notes: String(message).trim(),
        planner_lead_status: 'new',
        custom_fields: {
          source: 'contact_us_page',
          first_name: String(firstName).trim(),
          last_name: String(lastName).trim(),
          message: String(message).trim(),
        },
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

    res.status(201).json({
      ok: true,
      message: 'Your message has been sent successfully!',
    })
  } catch (err) {
    next(err)
  }
}
