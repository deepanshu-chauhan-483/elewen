import { strapiServerPost } from '../lib/strapi.js'

// ─── POST /vendor/register ─────────────────────────────────────────────────────
// Creates a pending vendor entry in Strapi.
// Strapi vendor schema: company_name, contact_person, email, phone,
//   location_city, experience_years, vendor_status(enum), registration_data(JSON)
export const registerVendor = async (req, res, next) => {
  try {
    const {
      business_name,
      contact_person_name,
      email,
      phone,
      city,
      service_category,
      experience_years,
      description,
    } = req.body

    // Required field validation
    const missing = []
    if (!business_name) missing.push('business_name')
    if (!contact_person_name) missing.push('contact_person_name')
    if (!email) missing.push('email')
    if (!phone) missing.push('phone')
    if (!city) missing.push('city')
    if (!service_category) missing.push('service_category')

    if (missing.length) {
      return res.status(400).json({
        error: 'Required fields missing',
        fields: Object.fromEntries(missing.map(f => [f, 'Required'])),
      })
    }

    // Store extra fields in registration_data JSON — keeps vendor schema clean
    const registration_data = {
      service_category,
      description: description ?? null,
      submitted_at: new Date().toISOString(),
    }

    await strapiServerPost('/api/vendors', {
      data: {
        company_name: business_name,
        contact_person: contact_person_name,
        email,
        phone,
        location_city: city,
        experience_years: experience_years ? parseInt(experience_years, 10) : null,
        vendor_status: 'pending',
        registration_data,
      },
    })

    res.status(201).json({
      ok: true,
      message: "We've received your application and will review it shortly.",
    })
  } catch (err) {
    // Duplicate email — Strapi returns 400 with unique constraint error
    if (err.status === 400 && err.strapiError?.message?.toLowerCase().includes('unique')) {
      return res.status(409).json({ error: 'A vendor with this email already exists' })
    }
    next(err)
  }
}
