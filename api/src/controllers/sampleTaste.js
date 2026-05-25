import prisma from '../lib/prisma.js'
import { strapiServerGet } from '../lib/strapi.js'
import { enrichSampleTastes } from '../lib/dashboardData.js'

const normalizeSearchText = value =>
  String(value ?? '')
    .trim()
    .toLowerCase()

function sampleMatchesSearch(sample, search) {
  const normalizedSearch = normalizeSearchText(search)
  if (!normalizedSearch) return true

  const haystack = [
    sample?.id,
    sample?.package?.title,
    sample?.event?.name,
    sample?.status,
    sample?.statusLabel,
    ...(sample?.vendors ?? []).map(vendor => vendor?.vendor?.companyName),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalizedSearch)
}

const ALLOWED_TRANSITIONS = {
  new: ['assigned', 'cancelled'],
  assigned: ['delivered', 'cancelled'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
}

// POST /sample-taste
export const createSampleTaste = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { packageId, eventId, guestCount, bookingDate } = req.body

    // validate package exists if provided
    if (packageId) {
      const { data: pkgs } = await strapiServerGet(`/api/packages?filters[id][$eq]=${packageId}`)
      if (!pkgs?.length) return res.status(400).json({ error: 'Package not found' })
    }

    // set expiry to 7 days from today by default
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 7)

    const sample = await prisma.sampleTasteBooking.create({
      data: {
        userId,
        packageId: packageId ? String(packageId) : null,
        eventId: eventId ? String(eventId) : null,
        guestCount: guestCount || null,
        bookingDate: bookingDate ? new Date(bookingDate) : null,
        expiryDate,
      },
    })

    res.status(201).json({ sample })
  } catch (err) {
    next(err)
  }
}

// GET /sample-taste
export const listSampleTastes = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const search = normalizeSearchText(req.query?.search)
    const status = normalizeSearchText(req.query?.status)

    const samples = await prisma.sampleTasteBooking.findMany({
      where: { userId },
      include: { vendors: true },
      orderBy: { createdAt: 'desc' },
    })

    const enrichedSamples = await enrichSampleTastes(samples)
    const filteredSamples = enrichedSamples.filter(sample => {
      const matchesStatus = status ? String(sample?.status ?? '').toLowerCase() === status : true
      return matchesStatus && sampleMatchesSearch(sample, search)
    })

    res.json({ samples: filteredSamples })
  } catch (err) {
    next(err)
  }
}

// GET /sample-taste/:id
export const getSampleTaste = async (req, res, next) => {
  try {
    const userId = String(req.user.id)

    const sample = await prisma.sampleTasteBooking.findUnique({
      where: { id: req.params.id },
      include: { vendors: true },
    })

    if (!sample) return res.status(404).json({ error: 'Sample taste booking not found' })
    if (sample.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const [enrichedSample] = await enrichSampleTastes([sample])

    res.json({ sample: enrichedSample })
  } catch (err) {
    next(err)
  }
}

// PATCH /sample-taste/:id/status
export const updateStatus = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { status, vendorId, menuItems } = req.body

    const sample = await prisma.sampleTasteBooking.findUnique({
      where: { id: req.params.id },
    })
    if (!sample) return res.status(404).json({ error: 'Sample taste booking not found' })
    if (sample.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const allowed = ALLOWED_TRANSITIONS[sample.status] || []
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from '${sample.status}' to '${status}'`,
        allowedNext: allowed,
      })
    }

    // when transitioning to 'assigned', a vendorId is required
    if (status === 'assigned') {
      if (!vendorId)
        return res.status(400).json({ error: 'vendorId is required when assigning a vendor' })
      await prisma.sampleTasteVendor.create({
        data: {
          sampleBookingId: sample.id,
          vendorId: String(vendorId),
          menuItems: menuItems || null,
        },
      })
    }

    const updated = await prisma.sampleTasteBooking.update({
      where: { id: sample.id },
      data: { status },
      include: { vendors: true },
    })

    res.json({ sample: updated })
  } catch (err) {
    next(err)
  }
}

// POST /sample-taste/:id/decision
export const recordDecision = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { decision, decisionNotes, vendorId, rating, feedbackText, vendorRatings } = req.body

    const sample = await prisma.sampleTasteBooking.findUnique({
      where: { id: req.params.id },
      include: { vendors: true },
    })
    if (!sample) return res.status(404).json({ error: 'Sample taste booking not found' })
    if (sample.userId !== userId) return res.status(403).json({ error: 'Forbidden' })
    if (sample.status !== 'delivered') {
      return res
        .status(400)
        .json({ error: 'Decision can only be recorded for delivered sample taste bookings' })
    }

    const normalizedVendorRatings = Array.isArray(vendorRatings)
      ? vendorRatings
          .map(entry => ({
            vendorId: String(entry?.vendorId ?? '').trim(),
            rating:
              entry?.rating === null || entry?.rating === undefined ? null : Number(entry.rating),
          }))
          .filter(
            entry =>
              entry.vendorId &&
              Number.isInteger(entry.rating) &&
              entry.rating >= 1 &&
              entry.rating <= 5
          )
      : []

    const updated = await prisma.$transaction(async tx => {
      if (normalizedVendorRatings.length) {
        await Promise.all(
          normalizedVendorRatings.map(async entry => {
            const matchedVendor = sample.vendors.find(v => String(v.vendorId) === entry.vendorId)
            if (!matchedVendor) return

            await tx.sampleTasteVendor.update({
              where: { id: matchedVendor.id },
              data: { rating: entry.rating },
            })
          })
        )
      }

      if (vendorId && (rating || feedbackText)) {
        const matchedVendor = sample.vendors.find(v => String(v.vendorId) === String(vendorId))
        if (matchedVendor) {
          await tx.sampleTasteVendor.update({
            where: { id: matchedVendor.id },
            data: {
              rating: rating || undefined,
              feedbackText: feedbackText || undefined,
            },
          })
        }
      } else if (feedbackText && sample.vendors.length === 1) {
        await tx.sampleTasteVendor.update({
          where: { id: sample.vendors[0].id },
          data: { feedbackText },
        })
      }

      return tx.sampleTasteBooking.update({
        where: { id: sample.id },
        data: {
          decision,
          decisionNotes: decisionNotes || null,
          status: 'completed',
          feedbackSubmitted: Boolean(normalizedVendorRatings.length || rating || feedbackText),
        },
        include: { vendors: true },
      })
    })

    res.json({ sample: updated })
  } catch (err) {
    next(err)
  }
}
