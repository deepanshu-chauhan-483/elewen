import crypto from 'crypto'
import prisma from '../lib/prisma.js'
import {
  invalidateStrapiCachePattern,
  strapiPost,
  strapiServerPost,
  strapiServerUpload,
  strapiUpload,
} from '../lib/strapi.js'

function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value.map(item => toTrimmedString(item)).filter(Boolean)
  }

  const single = toTrimmedString(value)
  return single ? [single] : []
}

function toOptionalInteger(value) {
  const trimmed = toTrimmedString(value)
  if (!trimmed) return null

  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function parseBase64File(file) {
  if (!file || typeof file !== 'object') return null

  const name = toTrimmedString(file.name) || 'upload'
  const type = toTrimmedString(file.type) || 'application/octet-stream'
  const dataUrl = toTrimmedString(file.dataUrl)
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/)

  if (!matches) return null

  const [, mimeType, base64Payload] = matches

  return {
    name,
    type: mimeType || type,
    size: Number(file.size) || 0,
    buffer: Buffer.from(base64Payload, 'base64'),
  }
}

function shouldFallbackToPublicStrapi(err) {
  if (err?.status !== 401 && err?.status !== 403) return false

  const message = String(err?.message ?? '').toLowerCase()
  return (
    !message ||
    message.includes('forbidden') ||
    message.includes('missing or invalid credentials') ||
    message.includes('unauthorized')
  )
}

async function findVendorByEmailInDatabase(email) {
  const normalizedEmail = toTrimmedString(email).toLowerCase()
  if (!normalizedEmail) return null

  const [row] = await prisma.$queryRaw`
    SELECT id, email
    FROM public.vendors
    WHERE lower(email) = ${normalizedEmail}
    LIMIT 1
  `

  return row ?? null
}

async function createVendorInDatabase(payload) {
  const registrationJson = JSON.stringify(payload.registration_data ?? {})
  try {
    const [created] = await prisma.$queryRaw`
      INSERT INTO public.vendors (
        document_id,
        company_name,
        contact_person,
        email,
        phone,
        location_city,
        service_area,
        experience_years,
        team_size,
        vendor_status,
        is_available,
        registration_data,
        published_at,
        created_at,
        updated_at
      )
      VALUES (
        ${crypto.randomBytes(12).toString('hex')},
        ${payload.company_name},
        ${payload.contact_person},
        ${payload.email},
        ${payload.phone},
        ${payload.location_city},
        ${payload.service_area},
        ${payload.experience_years},
        ${payload.team_size},
        ${payload.vendor_status},
        ${false},
        ${registrationJson}::jsonb,
        NOW(),
        NOW(),
        NOW()
      )
      RETURNING id, document_id
    `
    return created ?? null
  } catch {
    const [created] = await prisma.$queryRaw`
      INSERT INTO public.vendors (
        document_id,
        company_name,
        contact_person,
        email,
        phone,
        location_city,
        service_area,
        experience_years,
        team_size,
        vendor_status,
        is_available,
        registration_data,
        created_at,
        updated_at
      )
      VALUES (
        ${crypto.randomBytes(12).toString('hex')},
        ${payload.company_name},
        ${payload.contact_person},
        ${payload.email},
        ${payload.phone},
        ${payload.location_city},
        ${payload.service_area},
        ${payload.experience_years},
        ${payload.team_size},
        ${payload.vendor_status},
        ${false},
        ${registrationJson}::jsonb,
        NOW(),
        NOW()
      )
      RETURNING id, document_id
    `
    return created ?? null
  }
}

async function uploadFileToStrapi(file) {
  const parsedFile = parseBase64File(file)
  if (!parsedFile) return null

  const formData = new FormData()
  const blob = new Blob([parsedFile.buffer], { type: parsedFile.type })
  formData.append('files', blob, parsedFile.name)

  let uploaded

  try {
    uploaded = await strapiServerUpload('/api/upload', formData)
  } catch (err) {
    if (!shouldFallbackToPublicStrapi(err)) {
      throw err
    }

    uploaded = await strapiUpload('/api/upload', formData)
  }

  return Array.isArray(uploaded) ? (uploaded[0] ?? null) : null
}

async function createVendorDocument(vendorId, documentType, uploadId) {
  if (!vendorId || !uploadId) return

  const payload = {
    data: {
      vendor: vendorId,
      document_type: documentType,
      file: uploadId,
      verified: false,
    },
  }

  try {
    await strapiServerPost('/api/vendor-documents', payload)
  } catch (err) {
    if (!shouldFallbackToPublicStrapi(err)) {
      throw err
    }

    await strapiPost('/vendor-documents', payload)
  }
}

async function createVendorPortfolio(vendorId, businessName, uploadId) {
  if (!vendorId || !uploadId) return

  const payload = {
    data: {
      vendor: vendorId,
      title: `${businessName} Work Sample`,
      description: 'Uploaded from the vendor registration form.',
      image: uploadId,
    },
  }

  try {
    await strapiServerPost('/api/vendor-portfolios', payload)
  } catch (err) {
    if (!shouldFallbackToPublicStrapi(err)) {
      throw err
    }

    await strapiPost('/vendor-portfolios', payload)
  }
}

// Creates a pending vendor entry in Strapi and links uploaded assets.
export const registerVendor = async (req, res, next) => {
  try {
    const businessName = toTrimmedString(req.body.business_name)
    const contactPersonName = toTrimmedString(req.body.contact_person_name)
    const email = toTrimmedString(req.body.email)
    const phone = toTrimmedString(req.body.phone)
    const city = toTrimmedString(req.body.city)
    const operatingLocation = toTrimmedString(req.body.operating_location)
    const websiteSocialPortfolio = toTrimmedString(req.body.website_social_portfolio)
    const establishedIn = toTrimmedString(req.body.established_in)
    const portfolioLink = toTrimmedString(req.body.portfolio_link)
    const experienceYears = toOptionalInteger(req.body.experience_years)
    const teamSize = toOptionalInteger(req.body.team_size)
    const description = toTrimmedString(req.body.description)
    const serviceCategories = toStringArray(req.body.service_category)
    const eventTypes = toStringArray(req.body.event_types)
    const workSample = req.body.work_sample ?? null
    const verificationDocument = req.body.verification_document ?? null

    const registrationData = {
      service_category: serviceCategories,
      event_types: eventTypes,
      operating_location: operatingLocation || city,
      website_social_portfolio: websiteSocialPortfolio,
      established_in: establishedIn || null,
      portfolio_link: portfolioLink || null,
      description: description || null,
      work_sample_name: workSample?.name || null,
      verification_document_name: verificationDocument?.name || null,
      submitted_at: new Date().toISOString(),
    }

    const payload = {
      data: {
        company_name: businessName,
        contact_person: contactPersonName,
        email,
        phone,
        location_city: city,
        service_area: operatingLocation || city,
        experience_years: experienceYears,
        team_size: teamSize,
        vendor_status: 'pending',
        is_available: false,
        registration_data: registrationData,
      },
    }

    let createdVendor

    try {
      // Publish immediately so Admin Vendor Management Pending Requests can list it.
      createdVendor = await strapiServerPost('/api/vendors?status=published', payload)
    } catch (err) {
      if (!shouldFallbackToPublicStrapi(err)) {
        throw err
      }

      try {
        createdVendor = await strapiPost('/vendors?status=published', payload)
      } catch (publicErr) {
        if (!shouldFallbackToPublicStrapi(publicErr)) {
          throw publicErr
        }

        const existingVendor = await findVendorByEmailInDatabase(email)
        if (existingVendor) {
          return res.status(409).json({ error: 'A vendor with this email already exists' })
        }

        const created = await createVendorInDatabase(payload.data)
        createdVendor = { data: created }
      }
    }

    await invalidateStrapiCachePattern('strapi:GET:/api/vendors*')

    const vendorId = createdVendor?.data?.id

    let assetSyncDeferred = false

    if (vendorId) {
      try {
        const [uploadedWorkSample, uploadedVerificationDocument] = await Promise.all([
          uploadFileToStrapi(workSample),
          uploadFileToStrapi(verificationDocument),
        ])

        if (uploadedWorkSample?.id) {
          await createVendorPortfolio(vendorId, businessName, uploadedWorkSample.id)
        }

        if (uploadedVerificationDocument?.id) {
          await createVendorDocument(vendorId, 'license', uploadedVerificationDocument.id)
        }
      } catch (assetError) {
        assetSyncDeferred = true
        console.error('[vendor.register] vendor created but asset sync failed', {
          vendorId,
          message: assetError?.message,
          status: assetError?.status,
        })
      }
    }

    res.status(201).json({
      ok: true,
      message: "We've received your application and will review it shortly.",
      ...(assetSyncDeferred ? { attachments_pending: true } : {}),
    })
  } catch (err) {
    if (err.status === 400 && err.strapiError?.message?.toLowerCase().includes('unique')) {
      return res.status(409).json({ error: 'A vendor with this email already exists' })
    }
    next(err)
  }
}
